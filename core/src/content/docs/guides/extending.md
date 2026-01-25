---
title: Extending ContextRouter
description: How to extend ContextRouter with custom components, plugins, and integrations.
---

ContextRouter is designed to be highly extensible. This guide shows you how to add custom components, create plugins, integrate with new data sources, and extend the framework's capabilities.

## Architecture Overview

ContextRouter's extensibility comes from its modular architecture:

- **Registry System**: Dynamic component registration and discovery
- **Plugin Architecture**: Hot-swappable components
- **Interface-Based Design**: Standard contracts for all components
- **Bisquit Protocol**: Consistent data handling across components

## Creating Custom Transformers

Transformers are the most common extension point. They process data flowing through the system.

### Basic Transformer

```python
from contextrouter.core.registry import register_transformer
from contextrouter.core.interfaces import BaseTransformer
from contextrouter.core.bisquit import BisquitEnvelope

@register_transformer("sentiment_analysis")
class SentimentAnalysisTransformer(BaseTransformer):
    """Analyze sentiment in text content."""

    def __init__(self, config=None):
        self.config = config or {}
        self.model_name = self.config.get("model", "cardiffnlp/twitter-roberta-base-sentiment")

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Add sentiment analysis to envelope."""
        content = envelope.content

        if isinstance(content, dict) and "text" in content:
            text = content["text"]

            # Perform sentiment analysis
            sentiment_result = self._analyze_sentiment(text)

            # Add to content
            content["sentiment"] = sentiment_result

            # Add metadata
            envelope.metadata["sentiment_score"] = sentiment_result["score"]
            envelope.metadata["sentiment_label"] = sentiment_result["label"]

            # Add processing trace
            envelope.add_trace("transformer:sentiment_analysis")

        return envelope

    def _analyze_sentiment(self, text: str) -> dict:
        """Perform sentiment analysis using a model."""
        # This is a simplified implementation
        # In practice, you'd use a proper sentiment analysis library

        # Mock sentiment analysis
        if "great" in text.lower() or "excellent" in text.lower():
            return {"label": "POSITIVE", "score": 0.9}
        elif "bad" in text.lower() or "terrible" in text.lower():
            return {"label": "NEGATIVE", "score": 0.8}
        else:
            return {"label": "NEUTRAL", "score": 0.6}
```

### Advanced Transformer with Dependencies

```python
from transformers import pipeline
import torch
from typing import Optional

@register_transformer("advanced_sentiment")
class AdvancedSentimentTransformer(BaseTransformer):
    """Advanced sentiment analysis using HuggingFace transformers."""

    def __init__(self, config=None):
        self.config = config or {}
        self.device = self.config.get("device", "cpu")
        self.model_name = self.config.get("model", "cardiffnlp/twitter-roberta-base-sentiment")

        # Initialize model (lazy loading)
        self._model: Optional[pipeline] = None

    @property
    def model(self):
        """Lazy load the sentiment analysis model."""
        if self._model is None:
            self._model = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=self.device,
                return_all_scores=True
            )
        return self._model

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Advanced sentiment analysis."""
        content = envelope.content

        if isinstance(content, dict) and "text" in content:
            text = content["text"]

            try:
                # Run sentiment analysis
                results = self.model(text)

                # Process results
                if results and len(results) > 0:
                    # Take the highest confidence result
                    best_result = max(results[0], key=lambda x: x['score'])

                    sentiment_data = {
                        "label": best_result["label"],
                        "score": round(best_result["score"], 3),
                        "all_scores": results[0] if len(results) > 0 else []
                    }

                    content["sentiment"] = sentiment_data
                    envelope.metadata.update({
                        "sentiment_label": sentiment_data["label"],
                        "sentiment_score": sentiment_data["score"],
                        "sentiment_model": self.model_name
                    })

                envelope.add_trace("transformer:advanced_sentiment")

            except Exception as e:
                # Handle errors gracefully
                envelope.metadata["sentiment_error"] = str(e)
                envelope.add_trace("transformer:advanced_sentiment:failed")

        return envelope

    def cleanup(self):
        """Clean up resources."""
        if self._model is not None:
            # Clear GPU memory if using CUDA
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            self._model = None
```

### Batch Processing Transformer

```python
from typing import List
import asyncio

@register_transformer("batch_summarizer")
class BatchSummarizationTransformer(BaseTransformer):
    """Summarize multiple documents in batches."""

    def __init__(self, config=None):
        self.config = config or {}
        self.batch_size = self.config.get("batch_size", 10)
        self.max_length = self.config.get("max_length", 150)

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Batch process multiple envelopes."""
        content = envelope.content

        if isinstance(content, dict) and "documents" in content:
            documents = content["documents"]

            # Process in batches
            summaries = []
            for i in range(0, len(documents), self.batch_size):
                batch = documents[i:i + self.batch_size]
                batch_summaries = self._process_batch(batch)
                summaries.extend(batch_summaries)

            content["summaries"] = summaries
            envelope.add_trace("transformer:batch_summarizer")

        return envelope

    def _process_batch(self, documents: List[dict]) -> List[str]:
        """Process a batch of documents."""
        # This would use a real summarization model
        # For now, return mock summaries
        return [
            f"Summary of document about {doc.get('topic', 'unknown topic')}"
            for doc in documents
        ]
```

## Creating Custom Connectors

Connectors fetch data from external sources and convert it to BisquitEnvelopes.

### Web API Connector

```python
import aiohttp
from typing import AsyncIterator
from contextrouter.core.registry import register_connector
from contextrouter.core.interfaces import BaseConnector

@register_connector("github_issues")
class GitHubIssuesConnector(BaseConnector):
    """Fetch GitHub issues for a repository."""

    def __init__(self, config=None):
        self.config = config or {}
        self.token = self.config.get("token")
        self.base_url = "https://api.github.com"

    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        """Fetch GitHub issues matching the query."""
        # Parse query as "owner/repo"
        if "/" not in query:
            return

        owner, repo = query.split("/", 1)

        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"token {self.token}"} if self.token else {}

            # Fetch issues
            url = f"{self.base_url}/repos/{owner}/{repo}/issues"
            params = {"state": "open", "per_page": 50}

            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    issues = await response.json()

                    for issue in issues:
                        yield BisquitEnvelope(
                            content={
                                "title": issue["title"],
                                "body": issue["body"],
                                "number": issue["number"],
                                "state": issue["state"],
                                "url": issue["html_url"],
                                "labels": [label["name"] for label in issue.get("labels", [])]
                            },
                            provenance=["connector:github_issues"],
                            metadata={
                                "source": "github",
                                "repo": f"{owner}/{repo}",
                                "issue_number": issue["number"],
                                "created_at": issue["created_at"],
                                "updated_at": issue["updated_at"],
                                "fetched_at": datetime.now().isoformat()
                            }
                        )
                else:
                    # Handle API errors
                    error_data = await response.json()
                    raise Exception(f"GitHub API error: {error_data.get('message', 'Unknown error')}")
```

### Database Connector

```python
import asyncpg
from typing import AsyncIterator

@register_connector("postgres_query")
class PostgresQueryConnector(BaseConnector):
    """Execute SQL queries against PostgreSQL."""

    def __init__(self, config=None):
        self.config = config or {}
        self.connection_string = self._build_connection_string()

    def _build_connection_string(self) -> str:
        """Build PostgreSQL connection string."""
        host = self.config.get("host", "localhost")
        port = self.config.get("port", 5432)
        database = self.config.get("database", "postgres")
        user = self.config.get("user", "postgres")
        password = self.config.get("password")

        return f"postgresql://{user}:{password}@{host}:{port}/{database}"

    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        """Execute SQL query and yield results."""
        connection = await asyncpg.connect(self.connection_string)

        try:
            # Execute query
            rows = await connection.fetch(query)

            for row in rows:
                yield BisquitEnvelope(
                    content=dict(row),
                    provenance=["connector:postgres_query"],
                    metadata={
                        "query": query,
                        "table": self._extract_table_name(query),
                        "fetched_at": datetime.now().isoformat(),
                        "row_count": len(rows)
                    }
                )

        finally:
            await connection.close()

    def _extract_table_name(self, query: str) -> str:
        """Extract table name from SQL query (simplified)."""
        import re
        match = re.search(r'from\s+(\w+)', query, re.IGNORECASE)
        return match.group(1) if match else "unknown"
```

## Creating Custom Providers

Providers handle storage and retrieval of processed data.

### Redis Provider

```python
import redis.asyncio as redis
from typing import List
from contextrouter.core.registry import register_provider
from contextrouter.core.interfaces import IRead, IWrite

@register_provider("redis_cache")
class RedisProvider(IRead, IWrite):
    """Redis-based caching provider."""

    def __init__(self, config=None):
        self.config = config or {}
        self.host = self.config.get("host", "localhost")
        self.port = self.config.get("port", 6379)
        self.db = self.config.get("db", 0)
        self.password = self.config.get("password")

        # Initialize client
        self.client = redis.Redis(
            host=self.host,
            port=self.port,
            db=self.db,
            password=self.password,
            decode_responses=True
        )

    async def read(self, query: str, filters=None, limit=None) -> List[BisquitEnvelope]:
        """Read from Redis cache."""
        # Simple key-based lookup
        key = f"cache:{query}"

        cached_data = await self.client.get(key)
        if cached_data:
            import json
            envelope_data = json.loads(cached_data)
            return [BisquitEnvelope(**envelope_data)]

        return []

    async def write(self, envelope: BisquitEnvelope) -> None:
        """Write to Redis cache."""
        # Use content hash as key for deduplication
        import hashlib
        content_str = str(envelope.content)
        key = f"cache:{hashlib.md5(content_str.encode()).hexdigest()}"

        # Serialize envelope
        envelope_data = envelope.model_dump()
        import json
        cached_data = json.dumps(envelope_data)

        # Store with expiration
        ttl = self.config.get("ttl_seconds", 3600)
        await self.client.set(key, cached_data, ex=ttl)

        # Also store by query if applicable
        if "query" in envelope.metadata:
            query_key = f"cache:{envelope.metadata['query']}"
            await self.client.set(query_key, cached_data, ex=ttl)
```

### File System Provider

```python
import json
import os
from pathlib import Path
from typing import List

@register_provider("filesystem")
class FileSystemProvider(IRead, IWrite):
    """File system-based storage provider."""

    def __init__(self, config=None):
        self.config = config or {}
        self.base_path = Path(self.config.get("base_path", "./data"))
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def read(self, query: str, filters=None, limit=None) -> List[BisquitEnvelope]:
        """Read envelopes from files."""
        results = []

        # Simple file-based search (can be enhanced with indexing)
        for file_path in self.base_path.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    envelope_data = json.load(f)
                    envelope = BisquitEnvelope(**envelope_data)

                    # Simple text matching
                    if query.lower() in str(envelope.content).lower():
                        results.append(envelope)

                        if limit and len(results) >= limit:
                            break

            except (json.JSONDecodeError, FileNotFoundError):
                continue

        return results

    async def write(self, envelope: BisquitEnvelope) -> None:
        """Write envelope to file."""
        # Use ID or generate filename
        filename = f"{envelope.id or str(hash(str(envelope.content)))}.json"
        file_path = self.base_path / filename

        with open(file_path, 'w') as f:
            json.dump(envelope.model_dump(), f, indent=2, default=str)
```

## Creating Custom Agents

Agents implement custom logic in the Cortex workflow.

### Custom Intent Detection Agent

```python
from contextrouter.core.registry import register_agent
from contextrouter.core.interfaces import BaseAgent
from contextrouter.cortex.state import AgentState
from langchain_core.messages import BaseMessage
from typing import List

@register_agent("advanced_intent_detector")
class AdvancedIntentDetector(BaseAgent):
    """Advanced intent detection with ML-based classification."""

    def __init__(self, config=None):
        self.config = config or {}
        self.model_name = self.config.get("model", "vertex/gemini-2.0-flash")

    async def process(self, messages: List[BaseMessage]) -> dict:
        """Detect user intent from conversation."""
        if not messages:
            return {"intent": "unknown"}

        # Get the latest user message
        latest_message = messages[-1]
        if hasattr(latest_message, 'content'):
            text = latest_message.content
        else:
            text = str(latest_message)

        # Use LLM for intent classification
        intent = await self._classify_intent(text)

        return {
            "intent": intent,
            "confidence": 0.85,  # Mock confidence score
            "intent_metadata": {
                "model_used": self.model_name,
                "classification_method": "llm_based"
            }
        }

    async def _classify_intent(self, text: str) -> str:
        """Classify the intent of the input text."""
        # This would use a real classification model
        text_lower = text.lower()

        if any(word in text_lower for word in ["what", "how", "explain", "tell me"]):
            return "question"
        elif any(word in text_lower for word in ["search", "find", "look for"]):
            return "search"
        elif any(word in text_lower for word in ["summarize", "summary"]):
            return "summarize"
        elif any(word in text_lower for word in ["compare", "difference"]):
            return "compare"
        else:
            return "general_chat"
```

### Custom Generation Agent

```python
@register_agent("creative_writer")
class CreativeWriterAgent(BaseAgent):
    """Agent that generates creative content."""

    async def process(self, messages: List[BaseMessage]) -> dict:
        """Generate creative response."""
        if not messages:
            return {"generated_response": "Hello! How can I help you?"}

        latest_message = messages[-1]
        text = latest_message.content if hasattr(latest_message, 'content') else str(latest_message)

        # Generate creative response
        creative_response = await self._generate_creative_response(text)

        return {
            "generated_response": creative_response,
            "response_type": "creative",
            "creativity_level": "high",
            "model_used": "vertex/gemini-2.0-flash"
        }

    async def _generate_creative_response(self, prompt: str) -> str:
        """Generate a creative response to the prompt."""
        # This would use a real LLM call
        # For now, return a mock creative response
        return f"What a fascinating question about '{prompt}'! Let me craft a creative response that explores this topic from an unexpected angle..."
```

## Creating Custom Graphs

Graphs define complete workflows by orchestrating nodes and steps.

### Custom RAG Graph

```python
from langgraph.graph import StateGraph, START, END
from contextrouter.core.registry import register_graph
from contextrouter.cortex.state import AgentState, InputState, OutputState
from contextrouter.cortex.nodes import (
    ExtractQueryNode,
    DetectIntentNode,
    RetrieveNode,
    GenerateNode,
    SuggestNode
)

@register_graph("creative_rag")
def build_creative_rag_graph():
    """Custom RAG graph with creative generation."""

    workflow = StateGraph(AgentState, input=InputState, output=OutputState)

    # Add nodes with custom agents
    workflow.add_node("extract_query", ExtractQueryNode)
    workflow.add_node("detect_intent", DetectIntentNode)
    workflow.add_node("retrieve", RetrieveNode)
    workflow.add_node("creative_generate", CreativeGenerateNode)
    workflow.add_node("suggest", SuggestNode)

    # Define flow
    workflow.add_edge(START, "extract_query")
    workflow.add_edge("extract_query", "detect_intent")
    workflow.add_edge("detect_intent", "retrieve")
    workflow.add_edge("retrieve", "creative_generate")
    workflow.add_edge("creative_generate", "suggest")
    workflow.add_edge("suggest", END)

    return workflow

class CreativeGenerateNode:
    """Node that uses creative writer agent."""

    def __init__(self, config):
        from contextrouter.core.registry import select_agent
        self.agent = select_agent("creative_writer")

    async def __call__(self, state: AgentState) -> dict:
        """Generate creative response."""
        messages = state.get("messages", [])
        result = await self.agent.process(messages)

        return {
            "generated_response": result.get("generated_response", ""),
            "response_metadata": result
        }
```

### Multi-Stage Analysis Graph

```python
@register_graph("deep_analysis")
def build_deep_analysis_graph():
    """Graph for deep document analysis."""

    workflow = StateGraph(AgentState)

    # Add analysis nodes
    workflow.add_node("extract_query", ExtractQueryNode)
    workflow.add_node("sentiment_analysis", SentimentAnalysisNode)
    workflow.add_node("topic_modeling", TopicModelingNode)
    workflow.add_node("relationship_extraction", RelationshipExtractionNode)
    workflow.add_node("generate_insights", GenerateInsightsNode)

    # Parallel analysis
    workflow.add_edge(START, "extract_query")
    workflow.add_edge("extract_query", "sentiment_analysis")
    workflow.add_edge("extract_query", "topic_modeling")
    workflow.add_edge("extract_query", "relationship_extraction")

    # Merge results and generate insights
    workflow.add_edge("sentiment_analysis", "generate_insights")
    workflow.add_edge("topic_modeling", "generate_insights")
    workflow.add_edge("relationship_extraction", "generate_insights")

    workflow.add_edge("generate_insights", END)

    return workflow
```

## Plugin Development

### Creating Plugin Packages

```python
# my_company_plugins/__init__.py
"""Custom plugins for company-specific use cases."""

# my_company_plugins/connectors/__init__.py
from .jira_connector import JiraConnector
from .slack_connector import SlackConnector

# my_company_plugins/connectors/jira_connector.py
from contextrouter.core.registry import register_connector
from contextrouter.core.interfaces import BaseConnector

@register_connector("jira_issues")
class JiraConnector(BaseConnector):
    """Fetch Jira issues."""

    def __init__(self, config=None):
        self.config = config or {}
        self.base_url = self.config.get("base_url")
        self.username = self.config.get("username")
        self.api_token = self.config.get("api_token")

    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        """Fetch Jira issues matching query."""
        # Implementation here
        yield BisquitEnvelope(
            content={"title": "Sample Issue", "description": "Issue content"},
            provenance=["connector:jira_issues"]
        )

# my_company_plugins/transformers/__init__.py
from .company_analyzer import CompanyAnalyzer

# my_company_plugins/transformers/company_analyzer.py
from contextrouter.core.registry import register_transformer

@register_transformer("company_analyzer")
class CompanyAnalyzer(BaseTransformer):
    """Analyze company-specific content."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Apply company-specific analysis."""
        # Implementation here
        return envelope
```

### Plugin Configuration

```toml
# settings.toml
[plugins]
paths = ["./plugins", "~/company-plugins"]
auto_discover = true

# Plugin-specific configuration
[plugins.my_company_plugins.connectors.jira]
base_url = "https://company.atlassian.net"
username = "api-user@company.com"
api_token = "${JIRA_API_TOKEN}"
```

### Plugin Testing

```python
# tests/test_plugins.py
import pytest
from contextrouter.core.registry import select_connector, select_transformer

def test_jira_connector():
    """Test Jira connector."""
    connector = select_connector("jira_issues")

    # Test connection
    envelopes = []
    async for envelope in connector.connect("project = PROJ"):
        envelopes.append(envelope)

    assert len(envelopes) > 0
    assert envelopes[0].provenance == ["connector:jira_issues"]

def test_company_analyzer():
    """Test company analyzer transformer."""
    transformer = select_transformer("company_analyzer")
    envelope = BisquitEnvelope(content={"text": "Company content"})

    result = transformer.transform(envelope)

    assert "company_analysis" in result.content
    assert "transformer:company_analyzer" in result.provenance
```

## Integration Patterns

### Webhook Integration

```python
from fastapi import FastAPI, Request
from contextrouter.cortex.runners import ChatRunner

app = FastAPI()
runner = ChatRunner(config)

@app.post("/webhook/rag")
async def rag_webhook(request: Request):
    """Handle RAG requests via webhook."""
    data = await request.json()
    query = data.get("query", "")
    user_id = data.get("user_id")

    # Create messages
    messages = [{"role": "user", "content": query}]

    # Process with ContextRouter
    response_text = ""
    async for event in runner.stream(messages, user_ctx={"user_id": user_id}):
        if event.get("event") == "text_delta":
            response_text += event["delta"]
        elif event.get("event") == "citations":
            citations = event["citations"]

    return {
        "response": response_text,
        "citations": citations,
        "user_id": user_id
    }
```

### Streaming API Integration

```python
from fastapi import FastAPI
from sse_starlette.sse import EventSourceResponse
import json

@app.get("/stream/rag")
async def stream_rag(query: str, user_id: str = None):
    """Streaming RAG responses via Server-Sent Events."""

    async def event_generator():
        async for event in runner.stream(
            [{"role": "user", "content": query}],
            user_ctx={"user_id": user_id}
        ):
            yield {
                "event": "message",
                "data": json.dumps(event)
            }

    return EventSourceResponse(event_generator())
```

### Database Integration

```python
import asyncpg

class ContextRouterDB:
    """Database integration with ContextRouter."""

    def __init__(self, config):
        self.config = config
        self.runner = ChatRunner(config)

    async def init_db(self):
        """Initialize database with ContextRouter integration."""
        self.pool = await asyncpg.create_pool(self.config.database_url)

        # Create tables
        await self.pool.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                query TEXT NOT NULL,
                response TEXT NOT NULL,
                citations JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)

    async def process_query(self, user_id: str, query: str) -> dict:
        """Process query and store in database."""
        # Get RAG response
        response_text = ""
        citations = []

        async for event in self.runner.stream(
            [{"role": "user", "content": query}],
            user_ctx={"user_id": user_id}
        ):
            if event.get("event") == "text_delta":
                response_text += event["delta"]
            elif event.get("event") == "citations":
                citations = event["citations"]

        # Store in database
        await self.pool.execute("""
            INSERT INTO conversations (user_id, query, response, citations)
            VALUES ($1, $2, $3, $4)
        """, user_id, query, response_text, json.dumps(citations))

        return {
            "response": response_text,
            "citations": citations
        }
```

## Best Practices for Extensions

### Component Design

1. **Single Responsibility**: Each component should do one thing well
2. **Error Handling**: Implement proper error handling and logging
3. **Configuration**: Make components configurable
4. **Documentation**: Document component purpose and usage
5. **Testing**: Write comprehensive tests

### Performance Considerations

1. **Async First**: Use async methods for I/O operations
2. **Resource Management**: Properly manage connections and memory
3. **Caching**: Implement caching where appropriate
4. **Batch Processing**: Handle large datasets efficiently
5. **Monitoring**: Add metrics and logging for performance tracking

### Security Practices

1. **Input Validation**: Validate all inputs thoroughly
2. **Authentication**: Implement proper authentication for APIs
3. **Authorization**: Check permissions before operations
4. **Data Sanitization**: Clean and validate data
5. **Audit Logging**: Log all security-relevant operations

### Maintenance

1. **Versioning**: Use semantic versioning for components
2. **Backward Compatibility**: Maintain compatibility when possible
3. **Deprecation**: Properly deprecate old APIs
4. **Updates**: Keep dependencies updated
5. **Monitoring**: Monitor component health and usage

This guide provides the foundation for extending ContextRouter. The modular architecture makes it easy to add new capabilities while maintaining compatibility with the existing ecosystem.