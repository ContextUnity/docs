---
title: Nodes & Steps
description: Understanding the building blocks of ContextRouter's LangGraph workflows.
---

The Cortex is built from two types of components: **Nodes** (graph wrappers) and **Steps** (pure business logic). Understanding this separation is key to extending ContextRouter effectively.

## The Node/Step Pattern

```
┌─────────────────────────────────────────────────────────┐
│                         NODE                             │
│           (Registered in graph, handles state)           │
│                                                          │
│    ┌─────────────────────────────────────────────────┐  │
│    │                      STEP                        │  │
│    │       (Pure function, business logic only)       │  │
│    │                                                  │  │
│    │  • No state access                              │  │
│    │  • Receives parameters, returns results         │  │
│    │  • Easy to test in isolation                    │  │
│    └─────────────────────────────────────────────────┘  │
│                                                          │
│  Node responsibilities:                                  │
│  • Extract needed data from state                       │
│  • Call the step function                               │
│  • Return partial state update                          │
└─────────────────────────────────────────────────────────┘
```

**Why this pattern?**
- **Steps are testable** — Pure functions with clear inputs/outputs
- **Nodes handle plumbing** — State access, error handling, tracing
- **Reusable logic** — Same step can be used in different nodes/graphs

## RAG Retrieval Nodes

The standard RAG workflow includes these nodes:

### extract_query

Extracts and normalizes the search query from user input.

**Input**: Raw messages from user
**Output**: Normalized query string

```python
# What it does internally
def extract_query_step(messages: list[BaseMessage]) -> str:
    # Get the last user message
    last_message = messages[-1]
    # Clean and normalize
    query = normalize_text(last_message.content)
    return query
```

### detect_intent

Uses an LLM to classify what the user wants and extract search queries.

**Input**: Messages, taxonomy (for concept extraction)
**Output**: Intent classification, retrieval queries, taxonomy concepts

```python
# Possible intents
class Intent(Enum):
    RAG_SEARCH = "rag_search"      # Needs knowledge base
    WEB_SEARCH = "web_search"      # Needs live web data
    TRANSLATION = "translation"    # Language translation
    IDENTITY = "identity"          # About the assistant
    DIRECT = "direct"              # Can answer directly
```

The node also extracts:
- **retrieval_queries**: Optimized queries for search (up to 3)
- **taxonomy_concepts**: Categories for filtering/graph lookup

### should_retrieve

A conditional router that examines the detected intent.

**Logic**:
```python
def should_retrieve(state: AgentState) -> str:
    intent = state["intent"]
    
    if intent in [Intent.RAG_SEARCH, Intent.WEB_SEARCH]:
        return "retrieve"  # Go to retrieve node
    else:
        return "generate"  # Skip to generation
```

### retrieve

Orchestrates parallel search across all data sources.

**What it does**:
1. Queries **Providers** (Postgres, Vertex AI Search)
2. Queries **Connectors** (Web search, RSS) if enabled
3. Fetches **Graph Facts** from knowledge graph
4. Deduplicates results using SHA256 hashing
5. Reranks using configured strategy
6. Selects top results per source type

**Output**: `RetrievalResult` with documents and graph facts

### generate

Produces the final response using retrieved context.

**Input**: Messages, retrieved documents, system prompts
**Output**: Generated response text

The node:
1. Builds a prompt with context from retrieval
2. Includes system instructions (identity, style)
3. Streams the response from the LLM
4. Formats citations

### suggest

Generates follow-up question suggestions.

**Input**: Conversation, retrieved documents
**Output**: List of suggested questions (typically 3)

## Steps (Pure Functions)

Steps live in `contextrouter/cortex/steps/` and contain the actual business logic:

```python
# contextrouter/cortex/steps/rag_retrieval/intent.py

async def detect_intent_step(
    messages: list[BaseMessage],
    llm: BaseLLM,
    taxonomy: dict[str, Any],
    language: str = "en",
) -> IntentResult:
    """
    Pure function to detect user intent.
    
    No state access — receives everything as parameters.
    Returns a clean result object.
    """
    # Build the intent detection prompt
    prompt = build_intent_prompt(messages, taxonomy, language)
    
    # Call the LLM
    response = await llm.generate(prompt)
    
    # Parse the response
    result = parse_intent_response(response)
    
    return IntentResult(
        intent=result.intent,
        retrieval_queries=result.queries,
        taxonomy_concepts=result.concepts,
        confidence=result.confidence,
    )
```

## Node Wrapper Contract

All nodes must follow this contract:

```python
from contextrouter.cortex.nodes.utils import BaseAgent

class BaseAgent:
    async def process(self, state: AgentState) -> dict[str, Any]:
        """
        Process the current state and return updates.
        
        MUST return a dict (partial state update).
        MUST await async operations (not return coroutines).
        SHOULD not mutate state directly.
        """
        raise NotImplementedError
```

**Critical rules**:
1. **Return type**: Always return `dict[str, Any]`
2. **Async steps**: Always `await` async operations
3. **State updates**: Return partial updates, don't mutate

```python
# ✅ Correct
async def process(self, state):
    result = await some_async_step(state["messages"])
    return {"my_result": result}

# ❌ Wrong - returning coroutine
async def process(self, state):
    return {"my_result": some_async_step(state["messages"])}  # Missing await!

# ❌ Wrong - mutating state
async def process(self, state):
    state["my_result"] = await some_async_step()
    return state
```

## Creating Custom Nodes

Register a custom node to add new capabilities:

```python
from contextrouter.core.registry import register_agent
from contextrouter.cortex.nodes.utils import BaseAgent
from contextrouter.cortex.state import AgentState

@register_agent("sentiment_analysis")
class SentimentAnalysisNode(BaseAgent):
    """Analyze sentiment of user messages."""
    
    async def process(self, state: AgentState) -> dict[str, Any]:
        messages = state["messages"]
        config = state["config"]
        
        # Get LLM from registry
        llm = model_registry.create_llm(config.models.default_llm, config=config)
        
        # Call our pure step function
        sentiment = await analyze_sentiment_step(
            messages=messages,
            llm=llm,
        )
        
        # Return partial state update
        return {
            "sentiment": sentiment,
            "sentiment_score": sentiment.score,
        }

# The pure step function (testable in isolation)
async def analyze_sentiment_step(
    messages: list[BaseMessage],
    llm: BaseLLM,
) -> SentimentResult:
    """Pure function for sentiment analysis."""
    prompt = build_sentiment_prompt(messages)
    response = await llm.generate(prompt)
    return parse_sentiment_response(response)
```

## Using Custom Nodes in a Graph

Add your custom node to a workflow:

```python
from langgraph.graph import StateGraph, START, END
from contextrouter.core.registry import register_graph, agent_registry

@register_graph("sentiment_aware_chat")
def build_sentiment_graph():
    workflow = StateGraph(AgentState)
    
    # Get node classes from registry
    sentiment_node = agent_registry.get("sentiment_analysis")
    generate_node = agent_registry.get("generate")
    
    # Add nodes
    workflow.add_node("analyze_sentiment", sentiment_node)
    workflow.add_node("generate", generate_node)
    
    # Define flow
    workflow.add_edge(START, "analyze_sentiment")
    workflow.add_edge("analyze_sentiment", "generate")
    workflow.add_edge("generate", END)
    
    return workflow
```

## Testing Nodes and Steps

The separation makes testing easy:

```python
# Test the step (pure function) in isolation
async def test_detect_intent_step():
    messages = [HumanMessage(content="What is RAG?")]
    mock_llm = MockLLM(response='{"intent": "rag_search"}')
    
    result = await detect_intent_step(
        messages=messages,
        llm=mock_llm,
        taxonomy={"AI": {"RAG": {}}},
    )
    
    assert result.intent == Intent.RAG_SEARCH

# Test the node with mocked state
async def test_intent_node():
    node = IntentDetectionNode()
    state = {
        "messages": [HumanMessage(content="What is RAG?")],
        "config": mock_config,
    }
    
    result = await node.process(state)
    
    assert "intent" in result
    assert result["intent"] == Intent.RAG_SEARCH
```
