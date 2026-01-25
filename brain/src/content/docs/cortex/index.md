---
title: The Cortex
description: LangGraph-powered orchestration layer for intelligent agent workflows.
---

The Cortex is the "brain" of ContextRouter — a LangGraph-powered orchestration layer that defines how your agent makes decisions. It doesn't know *how* to search a database or call an LLM; it knows *when* to do these things and in what order.

## Architecture Overview

The Cortex is built on **LangGraph** - a powerful framework for creating agent workflows with complex state management and conditional routing. Unlike simple sequential processing, the Cortex uses a graph-based approach where execution can branch, loop, and run in parallel.

### Core Concepts

#### StateGraph
A StateGraph defines the workflow as a directed graph of nodes and edges. Each node represents a processing step, and edges define the flow of execution based on conditions.

#### Agent State
The state is a TypedDict that maintains all information throughout the workflow execution. It's immutable - nodes return partial updates that get merged into the state.

#### Nodes vs Steps
Understanding the distinction between nodes and steps is crucial:

- **Nodes**: Classes that orchestrate the workflow. They decide what to do and when to call steps.
- **Steps**: Pure functions that contain business logic. They perform actual work (LLM calls, data processing, etc.).

### How It Works

The Cortex uses a **StateGraph** from LangGraph to route requests through a series of decision nodes:

```
START
  │
  ▼
┌─────────────────┐
│  extract_query  │  ← Node: Orchestrates query extraction
│                 │     Calls: extract_query_step()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  detect_intent  │  ← Node: Handles intent classification
│                 │     Calls: detect_intent_step()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ should_retrieve │  ← Node: Makes routing decision
│                 │     Calls: should_retrieve_step()
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│retrieve│ │  skip  │  ← Conditional routing
│        │ │        │
│ Node   │ │ Node   │
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│    generate     │  ← Node: Response generation
│                 │     Calls: generate_step()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    suggest      │  ← Node: Follow-up suggestions
│                 │     Calls: suggest_step()
└────────┬────────┘
         │
         ▼
        END
```

### Node vs Step Pattern

#### Why This Separation?

1. **Separation of Concerns**: Nodes handle orchestration, steps handle logic
2. **Testability**: Steps are pure functions, easy to unit test
3. **Reusability**: Steps can be reused across different nodes
4. **Registry Integration**: Steps are registered and can be swapped

#### Example Implementation

```python
# Step: Pure business logic (registered function)
@register_rag_retrieval_step("extract_query")
async def extract_query_step(state: AgentState) -> dict[str, Any]:
    """Extract and normalize query from messages."""
    messages = state["messages"]
    query = messages[-1].content if messages else ""

    # Normalize query (pure function)
    normalized = query.strip().lower()

    return {
        "query": normalized,
        "original_query": query
    }

# Node: Orchestration layer (class)
class ExtractQueryNode:
    """Node that orchestrates query extraction."""

    def __init__(self, config: Config):
        self.config = config

    async def __call__(self, state: AgentState) -> dict[str, Any]:
        """Node execution - decides what step to call."""
        # Get the registered step
        step = rag_retrieval_step_registry.get("extract_query")

        # Call the step with current state
        updates = await step(state)

        # Add node-specific metadata
        updates["node_execution_time"] = time.time()

        return updates
```

This graph-based approach provides:

- **Predictable execution** — Every request follows a defined path
- **Conditional routing** — Skip unnecessary steps based on intent
- **Parallel execution** — Fetch from multiple sources simultaneously
- **State immutability** — Easy debugging and reproducibility
- **Step reusability** — Business logic can be shared across workflows

## Built-in Graphs

ContextRouter ships with pre-built graphs for common use cases:

### rag_retrieval
The standard RAG workflow. Handles intent detection, retrieval from multiple sources, reranking, generation, and follow-up suggestions.

```python
from contextrouter.cortex.graphs import rag_retrieval

graph = rag_retrieval.compile_graph()
```

### rag_ingestion
Document processing pipeline. Handles preprocessing, taxonomy building, graph generation, and deployment to search indexes.

```python
from contextrouter.cortex.graphs import rag_ingestion

graph = rag_ingestion.compile_graph()
```

## Using a Graph Directly

For advanced use cases, you can run graphs directly:

```python
from contextrouter.cortex.graphs import rag_retrieval
from contextrouter.cortex.state import InputState
from contextrouter.core import get_core_config

# Compile the graph
graph = rag_retrieval.compile_graph()

# Prepare input state
input_state = {
    "messages": [
        {"role": "user", "content": "What is retrieval-augmented generation?"}
    ],
    "config": get_core_config(),
}

# Stream execution
async for event in graph.astream(input_state):
    # Each event contains updates from a node
    print(f"Node: {event.get('node')}")
    print(f"Updates: {event.get('updates')}")
```

## Runners: High-Level Interface

For most use cases, use Runners instead of graphs directly. Runners provide a cleaner API:

```python
from contextrouter.cortex.runners import ChatRunner

runner = ChatRunner(config)

# Simple streaming
async for event in runner.stream("Hello!"):
    process(event)

# With runtime settings
async for event in runner.stream(
    "What's the weather?",
    runtime_settings={"web_search_enabled": True}
):
    process(event)
```

### Available Runners

| Runner | Purpose |
|--------|---------|
| `ChatRunner` | Standard RAG chat interactions |
| `IngestionRunner` | Document processing and indexing |

## Custom Graphs & Workflows

ContextRouter provides multiple levels of customization, from simple runtime settings to completely custom graphs.

### Level 1: Runtime Settings

Modify behavior without changing the graph structure:

```python
from contextrouter.cortex.runners import ChatRunner

runner = ChatRunner(config)

# Runtime customization
async for event in runner.stream(
    "What's the latest in AI?",
    runtime_settings={
        # Enable/disable features
        "web_search_enabled": True,
        "reranking_enabled": True,

        # Modify limits
        "max_results": 10,
        "citations_max_books": 5,
        "citations_max_web": 3,

        # Change providers
        "provider": "vertex",
        "llm_model": "vertex/gemini-2.0-flash",

        # Custom prompts
        "rag_system_prompt_override": "You are a helpful AI assistant...",
        "style_prompt": "Be concise and technical.",

        # Advanced options
        "hybrid_fusion": "rrf",
        "mmr_diversity_bias": 0.5,
        "enable_suggestions": False
    }
):
    process(event)
```

### Level 2: Custom Nodes & Steps

Extend existing graphs by registering custom nodes and steps:

```python
from contextrouter.core.registry import register_rag_retrieval_node, register_rag_retrieval_step
from contextrouter.cortex.state import AgentState

# Register a custom step
@register_rag_retrieval_step("custom_analysis")
async def custom_analysis_step(state: AgentState) -> dict[str, Any]:
    """Custom analysis step."""
    query = state.get("query", "")
    analysis = await analyze_query_complexity(query)

    return {
        "query_complexity": analysis["complexity"],
        "requires_deep_search": analysis["complexity"] > 0.7,
        "analysis_metadata": analysis
    }

# Register a custom node
@register_rag_retrieval_node("enhanced_retrieve")
class EnhancedRetrieveNode:
    """Enhanced retrieval with custom logic."""

    def __init__(self, config):
        self.config = config

    async def __call__(self, state: AgentState) -> dict[str, Any]:
        # Get custom analysis from state
        complexity = state.get("query_complexity", 0)
        deep_search = state.get("requires_deep_search", False)

        # Adjust retrieval strategy based on complexity
        if deep_search:
            # Use broader search for complex queries
            results = await self.deep_retrieval(state)
        else:
            # Use standard retrieval
            results = await self.standard_retrieval(state)

        return {
            "retrieval_result": results,
            "retrieval_strategy": "deep" if deep_search else "standard"
        }
```

### Level 3: Custom Graphs

Create completely custom workflows for specialized use cases:

```python
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import BaseMessage
from contextrouter.core.registry import register_graph
from contextrouter.cortex.state import AgentState, InputState, OutputState
from typing import TypedDict

# Define custom state for specialized workflow
class CodeReviewState(TypedDict):
    messages: list[BaseMessage]
    config: Config
    code_files: list[str]
    review_comments: list[dict]
    summary: str

@register_graph("code_review_workflow")
def build_code_review_graph():
    """Custom graph for automated code review."""

    def extract_code_files(state: CodeReviewState) -> dict:
        """Extract code files from conversation."""
        messages = state["messages"]
        code_files = []

        for msg in messages:
            # Extract file paths mentioned in messages
            import re
            files = re.findall(r'`([^`]+\.(py|js|ts|java|cpp))`', msg.content)
            code_files.extend([f[0] for f in files])

        return {"code_files": list(set(code_files))}

    def analyze_code(state: CodeReviewState) -> dict:
        """Analyze code using registered transformers."""
        from contextrouter.core.registry import select_transformer

        code_analyzer = select_transformer("code_analyzer")
        comments = []

        for file_path in state["code_files"]:
            # Read and analyze each file
            with open(file_path) as f:
                content = f.read()

            # Create envelope for analysis
            envelope = BisquitEnvelope(
                content={"text": content, "filename": file_path},
                provenance=["code_review"]
            )

            # Apply analysis transformer
            analyzed = code_analyzer.transform(envelope)
            comments.extend(analyzed.content.get("issues", []))

        return {"review_comments": comments}

    def generate_summary(state: CodeReviewState) -> dict:
        """Generate summary of code review."""
        comments = state["review_comments"]
        severity_counts = {
            "error": len([c for c in comments if c["severity"] == "error"]),
            "warning": len([c for c in comments if c["severity"] == "warning"]),
            "info": len([c for c in comments if c["severity"] == "info"])
        }

        summary = f"Code review complete: {severity_counts['error']} errors, {severity_counts['warning']} warnings, {severity_counts['info']} suggestions."

        return {"summary": summary}

    # Build the graph
    workflow = StateGraph(
        CodeReviewState,
        input=InputState,
        output=OutputState
    )

    # Add nodes
    workflow.add_node("extract_files", extract_code_files)
    workflow.add_node("analyze_code", analyze_code)
    workflow.add_node("generate_summary", generate_summary)

    # Define flow
    workflow.add_edge(START, "extract_files")
    workflow.add_edge("extract_files", "analyze_code")
    workflow.add_edge("analyze_code", "generate_summary")
    workflow.add_edge("generate_summary", END)

    return workflow

# Use the custom graph
from contextrouter.cortex.graphs import compile_graph

graph = compile_graph()  # Will use "code_review_workflow" if configured
```

### Level 4: Advanced Graph Patterns

#### Conditional Routing

```python
@register_graph("conditional_workflow")
def build_conditional_graph():
    workflow = StateGraph(AgentState)

    def route_based_on_complexity(state: AgentState) -> str:
        """Route to different nodes based on query complexity."""
        complexity = state.get("query_complexity", 0)
        if complexity > 0.8:
            return "deep_analysis"
        elif complexity > 0.5:
            return "standard_analysis"
        else:
            return "quick_response"

    # Add nodes
    workflow.add_node("analyze_complexity", analyze_complexity_node)
    workflow.add_node("deep_analysis", deep_analysis_node)
    workflow.add_node("standard_analysis", standard_analysis_node)
    workflow.add_node("quick_response", quick_response_node)

    # Conditional routing
    workflow.add_edge(START, "analyze_complexity")
    workflow.add_conditional_edges(
        "analyze_complexity",
        route_based_on_complexity,
        {
            "deep_analysis": "deep_analysis",
            "standard_analysis": "standard_analysis",
            "quick_response": "quick_response"
        }
    )

    # All paths lead to end
    workflow.add_edge("deep_analysis", END)
    workflow.add_edge("standard_analysis", END)
    workflow.add_edge("quick_response", END)

    return workflow
```

#### Parallel Execution

```python
@register_graph("parallel_processing")
def build_parallel_graph():
    workflow = StateGraph(AgentState)

    # Add parallel processing nodes
    workflow.add_node("web_search", web_search_node)
    workflow.add_node("database_search", database_search_node)
    workflow.add_node("knowledge_graph", knowledge_graph_node)
    workflow.add_node("merge_results", merge_results_node)

    # Start all searches in parallel
    workflow.add_edge(START, "web_search")
    workflow.add_edge(START, "database_search")
    workflow.add_edge(START, "knowledge_graph")

    # Merge results when all complete
    workflow.add_edge("web_search", "merge_results")
    workflow.add_edge("database_search", "merge_results")
    workflow.add_edge("knowledge_graph", "merge_results")

    workflow.add_edge("merge_results", END)

    return workflow
```

### Configuration

Select your custom graph in settings:

```toml
[router]
graph = "my_custom_workflow"

# Or for specific use cases
[ingestion]
graph = "code_review_workflow"
```

### Testing Custom Graphs

Always test your custom graphs thoroughly:

```python
import asyncio
from contextrouter.core import get_core_config
from contextrouter.cortex.graphs import compile_graph

async def test_custom_graph():
    config = get_core_config()
    graph = compile_graph()

    # Test with sample input
    test_state = {
        "messages": [{"role": "user", "content": "Hello"}],
        "config": config
    }

    # Run the graph
    result = await graph.ainvoke(test_state)
    print(f"Graph execution result: {result}")

    # Test streaming
    async for event in graph.astream(test_state):
        print(f"Event: {event}")

asyncio.run(test_custom_graph())
```

## State Management

The Cortex uses immutable state management - a key principle that makes workflows predictable, debuggable, and reliable.

### AgentState Structure

The state is a TypedDict that maintains all information throughout workflow execution:

```python
from typing import TypedDict, NotRequired
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # Core conversation data
    messages: list[BaseMessage]              # Conversation history
    config: Config                           # System configuration

    # Query processing
    query: NotRequired[str]                  # Normalized user query
    intent: NotRequired[str]                 # Detected intent (rag, web, direct)

    # Retrieval results
    retrieval_result: NotRequired[RetrievalResult]
    citations: NotRequired[list[Citation]]
    retrieved_docs: NotRequired[list[RetrievedDoc]]

    # Generation
    generated_response: NotRequired[str]
    suggestions: NotRequired[list[str]]

    # Workflow control
    should_retrieve: NotRequired[bool]       # Routing decision
    routing_decision: NotRequired[str]       # Which path to take

    # Error handling
    errors: NotRequired[list[str]]
    retry_count: NotRequired[int]

    # Metadata
    start_time: NotRequired[float]
    node_execution_times: NotRequired[dict[str, float]]
    step_execution_times: NotRequired[dict[str, float]]
```

### State Immutability Principle

**Key principle**: State is immutable. Nodes return partial updates that get merged by LangGraph.

```python
# ✅ GOOD: Return partial updates
def my_node(state: AgentState) -> dict[str, Any]:
    """Process state and return updates."""
    result = do_something(state["messages"])

    return {
        "my_output": result,
        "node_execution_times": {
            **state.get("node_execution_times", {}),
            "my_node": time.time() - state.get("start_time", time.time())
        }
    }

# ❌ BAD: Mutate state directly
def my_node(state: AgentState) -> dict[str, Any]:
    """Never mutate state directly!"""
    state["my_output"] = do_something()  # This breaks LangGraph
    return state
```

### State Updates & Merging

LangGraph automatically merges partial updates into the state:

```python
# Node returns partial update
def process_query_node(state: AgentState) -> dict[str, Any]:
    return {
        "query": "What is AI?",
        "intent": "rag",
        "query_metadata": {"word_count": 3, "has_question": True}
    }

# LangGraph merges this into existing state
# Before: {"messages": [...], "config": {...}}
# After:  {"messages": [...], "config": {...}, "query": "What is AI?", "intent": "rag", ...}
```

### Accessing State Safely

Always handle missing fields gracefully:

```python
def safe_node(state: AgentState) -> dict[str, Any]:
    """Access state fields safely."""
    messages = state.get("messages", [])
    config = state["config"]  # Required field
    query = state.get("query")  # Optional field

    # Safe access with defaults
    intent = state.get("intent", "unknown")
    citations = state.get("citations", [])

    # Build response
    return {
        "processed_message_count": len(messages),
        "has_query": query is not None,
        "intent_confirmed": intent != "unknown"
    }
```

### State Validation

Add runtime validation for critical state fields:

```python
from pydantic import ValidationError

def validate_state(state: AgentState) -> None:
    """Validate state integrity."""
    if not state.get("messages"):
        raise ValueError("Messages are required")

    if "config" not in state:
        raise ValueError("Config is required")

    # Custom validation
    query = state.get("query", "")
    if len(query) > 10000:
        raise ValueError("Query too long")

def validated_node(state: AgentState) -> dict[str, Any]:
    """Node with state validation."""
    validate_state(state)

    # Process with validated state
    return {"validation_passed": True}
```

### Debugging State Changes

Track state evolution for debugging:

```python
def debug_node(state: AgentState) -> dict[str, Any]:
    """Node that logs state changes."""
    import logging

    # Log current state (be careful with large states)
    logging.debug(f"Node input state keys: {list(state.keys())}")

    # Process
    result = {"processed": True}

    # Log what we're returning
    logging.debug(f"Node output updates: {list(result.keys())}")

    return result

# In configuration, enable debug logging
# [logging]
# level = "DEBUG"
```

## Troubleshooting Common Issues

### Graph Execution Problems

**Issue**: Graph fails with "InvalidUpdateError"
```
Cause: Async steps returning coroutines instead of awaiting them
Solution: Always await async steps in nodes

# ❌ Wrong
def my_node(state):
    result = some_async_step(state)  # Returns coroutine
    return {"result": result}

# ✅ Correct
async def my_node(state):
    result = await some_async_step(state)  # Await the coroutine
    return {"result": result}
```

**Issue**: State mutations cause unexpected behavior
```
Cause: Direct state mutation instead of returning updates
Solution: Return partial updates, never mutate state

# ❌ Wrong
def my_node(state):
    state["new_field"] = "value"  # Direct mutation
    return state

# ✅ Correct
def my_node(state):
    return {"new_field": "value"}  # Partial update
```

**Issue**: Node not executing in expected order
```
Cause: Missing or incorrect edge definitions
Solution: Verify graph structure and edge conditions

# Debug: Print graph structure
graph = build_graph()
print("Nodes:", list(graph.nodes.keys()))
print("Edges:", list(graph.edges))
```

### State Management Issues

**Issue**: Missing state fields cause KeyError
```
Cause: Accessing state fields without checking existence
Solution: Use .get() with defaults

# ❌ Wrong
def my_node(state):
    value = state["missing_field"]  # KeyError

# ✅ Correct
def my_node(state):
    value = state.get("missing_field", "default")
```

**Issue**: State becomes too large
```
Cause: Accumulating too much data in state
Solution: Clean up unnecessary data and use selective updates

def cleanup_node(state):
    # Remove large intermediate results
    return {
        "keep_this": state.get("keep_this"),
        # Don't include large fields
    }
```

### Performance Issues

**Issue**: Graph execution is slow
```
Solutions:
1. Profile node execution times
2. Use parallel execution where possible
3. Cache expensive operations
4. Optimize state size

# Add timing to nodes
async def timed_node(state):
    start = time.time()
    result = await do_work(state)
    result["execution_time"] = time.time() - start
    return result
```

**Issue**: Memory usage grows during execution
```
Cause: Large objects accumulating in state
Solutions:
1. Use streaming for large results
2. Clean up intermediate data
3. Process data in batches

# Streaming approach
async def streaming_node(state):
    async for batch in process_large_dataset():
        yield {"batch": batch}
```

### Debugging Techniques

#### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# LangGraph debug logging
from langgraph.utils import add_logging
add_logging()
```

#### Inspect Graph Execution

```python
# Log state at each step
async def debug_graph_execution():
    graph = compile_graph()

    async for event in graph.astream(initial_state):
        print(f"Node: {event.get('node')}")
        print(f"State keys: {list(event.get('state', {}).keys())}")
        print(f"Updates: {event.get('updates')}")

# Manual step-through
def debug_step_by_step():
    graph = build_graph()  # Uncompiled graph

    current_state = initial_state
    for node_name in ["node1", "node2", "node3"]:
        node = graph.nodes[node_name]
        updates = await node(current_state)
        current_state = {**current_state, **updates}
        print(f"After {node_name}: {current_state}")
```

#### Visualize Graph Structure

```python
from langgraph.graph import draw_graph

graph = build_graph()
# Save visualization
draw_graph(graph).save("graph.png")

# Or get graph structure as dict
graph_dict = {
    "nodes": list(graph.nodes.keys()),
    "edges": [(edge[0], edge[1]) for edge in graph.edges]
}
print(graph_dict)
```

## Best Practices

### Graph Design

1. **Keep nodes focused** — Each node should have a single responsibility
2. **Use meaningful names** — Node and step names should be descriptive
3. **Handle errors gracefully** — Add error handling in nodes
4. **Document complex logic** — Comment conditional routing decisions

### State Management

1. **Validate state early** — Check required fields at graph start
2. **Use TypeDict consistently** — Define clear state schemas
3. **Avoid large objects** — Stream or reference large data
4. **Clean up when done** — Remove unnecessary state fields

### Performance

1. **Profile regularly** — Monitor node execution times
2. **Use parallel execution** — When operations are independent
3. **Cache expensive results** — For repeated computations
4. **Batch operations** — Process multiple items together

### Testing

1. **Unit test steps** — Pure functions are easy to test
2. **Integration test nodes** — Test node orchestration
3. **End-to-end test graphs** — Test complete workflows
4. **Mock external dependencies** — For reliable testing

### Monitoring

1. **Track execution metrics** — Node times, success rates
2. **Log errors with context** — Include relevant state information
3. **Monitor state size** — Alert on unusual memory usage
4. **Profile performance** — Identify bottlenecks

## Advanced Topics

### Custom State Classes

For complex workflows, create custom state classes:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class CustomAgentState(BaseModel):
    """Typed state with validation."""

    messages: List[BaseMessage] = Field(default_factory=list)
    config: Config
    custom_field: Optional[str] = None

    # Custom validation
    def validate_complexity(self) -> bool:
        return len(self.messages) < 100  # Example validation

# Use with Pydantic integration
@register_graph("validated_workflow")
def build_validated_graph():
    workflow = StateGraph(CustomAgentState)

    def validate_node(state: CustomAgentState) -> dict:
        if not state.validate_complexity():
            raise ValueError("State validation failed")
        return {}

    workflow.add_node("validate", validate_node)
    # ... rest of graph

    return workflow
```

### Dynamic Graph Building

Build graphs based on configuration:

```python
def build_dynamic_graph(config: dict) -> StateGraph:
    """Build graph based on configuration."""

    workflow = StateGraph(AgentState)

    # Add nodes conditionally
    if config.get("enable_web_search"):
        workflow.add_node("web_search", web_search_node)

    if config.get("enable_database"):
        workflow.add_node("db_search", database_search_node)

    # Dynamic edges based on config
    nodes = []
    if config.get("enable_web_search"):
        nodes.append("web_search")
    if config.get("enable_database"):
        nodes.append("db_search")

    # Connect nodes in sequence
    for i in range(len(nodes) - 1):
        workflow.add_edge(nodes[i], nodes[i + 1])

    return workflow
```

## Learn More

- **[Nodes & Steps](/cortex/nodes/)** — Detailed guide to graph building blocks
- **[Registry System](/core/registry/)** — How to register custom graphs
- **[RAG Pipeline](/rag/)** — How retrieval integrates with the Cortex
- **[State Management](/cortex/state/)** — Advanced state patterns
