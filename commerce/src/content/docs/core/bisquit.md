---
title: Bisquit Protocol
description: Data provenance and security tracing for trustworthy AI systems.
---

In production AI systems, you need to answer critical questions: *Where did this information come from? How was it processed? Who authorized access?* The Bisquit Protocol provides these answers by wrapping every piece of data in a traceable envelope.

## Why Provenance Matters

Consider a RAG system that tells a user "The company's revenue was $50M last quarter." Without provenance, you can't answer:

- Which document contained this information?
- Was it the Q3 or Q4 report?
- When was this data retrieved?
- Did any transformation alter the original text?

Bisquit solves this by tracking every step of the data journey.

## The BisquitEnvelope API

Every piece of data in ContextRouter is wrapped in a `BisquitEnvelope` - a comprehensive data container that tracks provenance, security, and processing history.

### Core Fields

```python
from pydantic import BaseModel
from typing import Any

class BisquitEnvelope(BaseModel):
    # Identity & Content
    id: str | None = None                    # Unique identifier (auto-generated UUID)
    content: Any = None                      # The actual payload (text, dict, object)

    # Provenance & Tracing
    provenance: list[str] = []               # Ordered trace of processing stages
    metadata: dict[str, Any] = {}           # Enriched attributes (timestamps, scores, etc.)

    # Security & Authorization
    token_id: str | None = None             # Security token for authorization

    # Backward Compatibility
    data: Any = None                        # Legacy content field
    citations: list[Any] = []               # Citation data for RAG responses
```

### Field Details

**`id`**: Auto-generated UUID for tracking. Set automatically when envelope is created, or manually for external data.

**`content`**: The actual data payload. Can be any JSON-serializable type:
- Text strings
- Dictionaries (API responses, metadata)
- Lists (search results, entity lists)
- Binary data (base64 encoded)

**`provenance`**: Ordered list of processing stages. Each stage adds its identifier:
```python
["connector:web", "transformer:ner", "provider:postgres:write"]
```

**`metadata`**: Extensible dictionary for additional information:
```python
{
    "fetched_at": "2024-01-15T10:30:00Z",
    "confidence_score": 0.95,
    "processing_time_ms": 150,
    "model_version": "gemini-2.0-flash"
}
```

**`token_id`**: Reference to security token for access control and authorization.

### Envelope Methods & Utilities

#### Core Methods

**`add_trace(stage: str)`** - Add processing stage to provenance:
```python
envelope.add_trace("transformer:ner")  # Adds to provenance list
```

**`sign(token_id: str)`** - Attach security token:
```python
envelope.sign("token_abc123")  # Sets token_id field
```

#### Utility Functions

**`coerce_struct_data(value: Any) -> StructDataValue`** - Convert to JSON-serializable format:
```python
from contextrouter.core.types import coerce_struct_data

# Convert complex objects to JSON-safe format
complex_data = {"date": datetime.now(), "custom": CustomClass()}
safe_data = coerce_struct_data(complex_data)
# Result: {"date": "2024-01-15T10:30:00", "custom": "<CustomClass object>"}
```

#### Creating Envelopes

##### Basic Creation

```python
from contextrouter.core.bisquit import BisquitEnvelope

# Simple text content
envelope = BisquitEnvelope(
    content="The weather is sunny today",
    provenance=["user:input"]
)

# Structured data
envelope = BisquitEnvelope(
    content={
        "title": "Weather Report",
        "temperature": 72,
        "conditions": "sunny"
    },
    provenance=["api:weather"],
    metadata={
        "source": "openweathermap.org",
        "fetched_at": "2024-01-15T10:30:00Z"
    }
)
```

##### With Custom ID

```python
# For external data with known identifiers
envelope = BisquitEnvelope(
    id="external_doc_12345",
    content=document_content,
    provenance=["external:import"],
    metadata={"external_id": "EXT-12345"}
)
```

##### Factory Patterns

```python
# Envelope factory for consistent creation
def create_search_result(result: SearchResult) -> BisquitEnvelope:
    return BisquitEnvelope(
        content={
            "title": result.title,
            "snippet": result.snippet,
            "url": result.url
        },
        provenance=["connector:web"],
        metadata={
            "rank": result.rank,
            "score": result.score,
            "fetched_at": datetime.now().isoformat()
        }
    )

# Batch creation
results = [create_search_result(r) for r in search_results]
```

#### From Connectors

Connectors automatically create envelopes with appropriate provenance:

```python
class WebConnector(BaseConnector):
    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        results = await self.search_web(query)

        for result in results:
            yield BisquitEnvelope(
                content={
                    "title": result.title,
                    "snippet": result.snippet,
                    "url": result.url,
                    "rank": result.rank
                },
                provenance=["connector:web"],
                metadata={
                    "query": query,
                    "search_engine": "google",
                    "fetched_at": datetime.now().isoformat(),
                    "relevance_score": result.score
                }
            )
```

### Adding Traces

Each processing stage adds its trace to maintain full provenance:

```python
# Original envelope from web search
envelope = BisquitEnvelope(
    content={"text": "OpenAI released GPT-5..."},
    provenance=["connector:web"]
)

# After NER processing
def process_ner(envelope: BisquitEnvelope) -> BisquitEnvelope:
    entities = extract_entities(envelope.content["text"])
    envelope.content["entities"] = entities
    envelope.add_trace("transformer:ner")
    envelope.metadata["ner_model"] = "spacy/en_core_web_lg"
    envelope.metadata["entity_count"] = len(entities)
    return envelope

# After taxonomy classification
def process_taxonomy(envelope: BisquitEnvelope) -> BisquitEnvelope:
    categories = classify_content(envelope.content["text"])
    envelope.content["categories"] = categories
    envelope.add_trace("transformer:taxonomy")
    envelope.metadata["taxonomy_confidence"] = 0.87
    return envelope

# After summarization
def process_summary(envelope: BisquitEnvelope) -> BisquitEnvelope:
    summary = summarize_text(envelope.content["text"])
    envelope.content["summary"] = summary
    envelope.add_trace("transformer:summarization")
    envelope.metadata["summary_model"] = "vertex/gemini-2.0-flash"
    return envelope

# Result: Complete processing history
# provenance = ["connector:web", "transformer:ner", "transformer:taxonomy", "transformer:summarization"]
```

### Security Integration

#### Token Management

```python
from contextrouter.core.tokens import create_token, TokenPermissions

# Create a token with specific permissions
token = create_token(
    user_id="user_123",
    permissions=[
        TokenPermissions.RAG_READ,
        TokenPermissions.RAG_WRITE,
    ],
    expires_in_hours=24
)

# Attach token to envelope for authorization
envelope = BisquitEnvelope(
    content=sensitive_data,
    provenance=["provider:postgres"],
    token_id=token.id
)

# Later, verify access before returning data
def check_access(envelope: BisquitEnvelope, required_permission: str) -> bool:
    if not envelope.token_id:
        return False

    token = get_token(envelope.token_id)
    if not token or token.is_expired():
        return False

    return required_permission in token.permissions
```

#### Access Control Patterns

```python
# Check read access
if check_access(envelope, "RAG_READ"):
    return envelope.content
else:
    raise PermissionError("Access denied")

# Filter results by permissions
def filter_by_access(envelopes: list[BisquitEnvelope], user_token: str) -> list[BisquitEnvelope]:
    accessible = []
    for envelope in envelopes:
        if not envelope.token_id or envelope.token_id == user_token:
            accessible.append(envelope)
    return accessible
```

## Creating Envelopes

When you fetch data from any source, wrap it in an envelope:

```python
from contextrouter.core.bisquit import BisquitEnvelope

# Web search result
envelope = BisquitEnvelope(
    content={
        "title": "Introduction to RAG",
        "snippet": "RAG combines retrieval with generation...",
        "url": "https://example.com/rag-intro"
    },
    provenance=["connector:web"],
    metadata={
        "fetched_at": "2024-01-15T10:30:00Z",
        "search_rank": 1,
        "relevance_score": 0.95
    }
)
```

## Adding Traces

As data moves through the pipeline, each processing stage adds its trace:

```python
# Original envelope from web search
envelope = BisquitEnvelope(
    content={"text": "OpenAI released GPT-5..."},
    provenance=["connector:web"]
)

# After NER processing
entities = extract_entities(envelope.content["text"])
envelope.content["entities"] = entities
envelope.add_trace("transformer:ner")

# After taxonomy classification
categories = classify_taxonomy(envelope.content["text"])
envelope.content["categories"] = categories
envelope.add_trace("transformer:taxonomy")

# After summarization
summary = summarize(envelope.content["text"])
envelope.content["summary"] = summary
envelope.add_trace("transformer:summarization")

# Final provenance shows the complete journey
print(envelope.provenance)
# ["connector:web", "transformer:ner", "transformer:taxonomy", "transformer:summarization"]
```

## Provenance in RAG Responses

When generating a response, citations carry their full provenance:

```python
# Each citation in a RAG response includes provenance
citation = {
    "text": "RAG combines retrieval mechanisms with generative models...",
    "source": {
        "type": "book",
        "title": "Building LLM Applications",
        "page": 42
    },
    "provenance": [
        "provider:postgres",      # Retrieved from Postgres
        "reranker:vertex",        # Reranked by Vertex AI
        "formatter:citations"     # Formatted for display
    ],
    "confidence": 0.92
}
```

This allows your UI to show users exactly where information came from and how it was processed.

## Security Integration

Bisquit integrates with ContextRouter's security system through tokens:

```python
from contextrouter.core.tokens import create_token, TokenPermissions

# Create a token with specific permissions
token = create_token(
    user_id="user_123",
    permissions=[
        TokenPermissions.RAG_READ,
        TokenPermissions.RAG_WRITE,
    ],
    expires_in_hours=24
)

# Attach token to envelope for authorization
envelope = BisquitEnvelope(
    content=sensitive_data,
    provenance=["provider:postgres"],
    token_id=token.id
)

# Later, verify access before returning data
def check_access(envelope: BisquitEnvelope, required_permission: str) -> bool:
    if not envelope.token_id:
        return False
    token = get_token(envelope.token_id)
    return required_permission in token.permissions
```

## Module Integration

All ContextRouter modules work seamlessly with BisquitEnvelope:

### Connectors Yield Envelopes

```python
class WebConnector(BaseConnector):
    async def connect(self, query: str):
        results = await self.search(query)
        for result in results:
            yield BisquitEnvelope(
                content=result,
                provenance=["connector:web"],
                metadata={"query": query, "fetched_at": datetime.now().isoformat()}
            )
```

### Transformers Transform Envelopes

```python
class NERTransformer(BaseTransformer):
    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        entities = self.extract_entities(envelope.content)
        envelope.content["entities"] = entities
        envelope.add_trace("transformer:ner")
        return envelope
```

### Providers Read/Write Envelopes

```python
class PostgresProvider(BaseProvider):
    async def write(self, envelope: BisquitEnvelope):
        envelope.add_trace("provider:postgres:write")
        await self.db.insert(envelope.model_dump())
    
    async def read(self, query: str) -> list[BisquitEnvelope]:
        results = await self.db.search(query)
        return [
            BisquitEnvelope(
                content=r["content"],
                provenance=r["provenance"] + ["provider:postgres:read"],
                metadata=r["metadata"]
            )
            for r in results
        ]
```

## Serialization & Persistence

### JSON Serialization

BisquitEnvelope automatically handles JSON serialization for storage and transmission:

```python
import json

# Serialize for storage
envelope_json = envelope.model_dump_json()
with open('envelope.json', 'w') as f:
    f.write(envelope_json)

# Deserialize from storage
with open('envelope.json', 'r') as f:
    data = json.load(f)
    restored_envelope = BisquitEnvelope(**data)
```

### Database Storage

Envelopes integrate seamlessly with providers for persistent storage:

```python
# Postgres storage
from contextrouter.modules.providers import PostgresProvider

provider = PostgresProvider(config)

# Store envelope
await provider.write(envelope)

# Retrieve with provenance intact
results = await provider.read(query="machine learning")
for envelope in results:
    print(f"Provenance: {envelope.provenance}")
    print(f"Content: {envelope.content}")
```

### Export/Import

```python
# Export envelopes to JSONL
def export_envelopes(envelopes: list[BisquitEnvelope], filename: str):
    with open(filename, 'w') as f:
        for envelope in envelopes:
            f.write(envelope.model_dump_json() + '\n')

# Import envelopes from JSONL
def import_envelopes(filename: str) -> list[BisquitEnvelope]:
    envelopes = []
    with open(filename, 'r') as f:
        for line in f:
            data = json.loads(line.strip())
            envelopes.append(BisquitEnvelope(**data))
    return envelopes
```

## Advanced Usage Patterns

### Envelope Chaining

Create processing pipelines where each step transforms envelopes:

```python
from typing import Callable

def create_pipeline(*transformers: Callable[[BisquitEnvelope], BisquitEnvelope]):
    """Create a processing pipeline."""
    def process(envelope: BisquitEnvelope) -> BisquitEnvelope:
        for transformer in transformers:
            envelope = transformer(envelope)
        return envelope
    return process

# Define transformers
def add_ner(envelope: BisquitEnvelope) -> BisquitEnvelope:
    envelope.content["entities"] = extract_entities(envelope.content["text"])
    envelope.add_trace("transformer:ner")
    return envelope

def add_taxonomy(envelope: BisquitEnvelope) -> BisquitEnvelope:
    envelope.content["categories"] = classify_taxonomy(envelope.content["text"])
    envelope.add_trace("transformer:taxonomy")
    return envelope

# Create and use pipeline
pipeline = create_pipeline(add_ner, add_taxonomy)
processed_envelope = pipeline(original_envelope)
```

### Envelope Merging

Combine information from multiple sources while preserving provenance:

```python
def merge_envelopes(primary: BisquitEnvelope, secondary: BisquitEnvelope) -> BisquitEnvelope:
    """Merge secondary envelope into primary."""
    # Combine content
    if isinstance(primary.content, dict) and isinstance(secondary.content, dict):
        primary.content.update(secondary.content)

    # Merge provenance (keep order)
    primary.provenance.extend(secondary.provenance)

    # Merge metadata
    primary.metadata.update(secondary.metadata)

    # Add merge trace
    primary.add_trace("operation:merge")

    return primary

# Usage
web_data = BisquitEnvelope(content={"title": "AI News"}, provenance=["web"])
api_data = BisquitEnvelope(content={"summary": "Latest AI developments"}, provenance=["api"])
merged = merge_envelopes(web_data, api_data)
```

### Conditional Processing

Apply transformations based on envelope content or metadata:

```python
def conditional_transform(envelope: BisquitEnvelope) -> BisquitEnvelope:
    """Apply transformations based on content type."""
    content_type = envelope.metadata.get("content_type", "unknown")

    if content_type == "article":
        # Apply article-specific processing
        envelope.content["word_count"] = len(envelope.content["text"].split())
        envelope.add_trace("transformer:article_stats")

    elif content_type == "video_transcript":
        # Apply video-specific processing
        envelope.content["duration"] = parse_duration(envelope.content["text"])
        envelope.add_trace("transformer:video_stats")

    return envelope
```

## Best Practices

### Provenance Management
1. **Always add traces** when transforming data — even small changes
2. **Use descriptive trace names** — `"transformer:ner"` not `"step1"`
3. **Preserve provenance order** when merging or splitting envelopes
4. **Include processing metadata** (model versions, confidence scores, timestamps)

### Security Practices
1. **Attach tokens** for any security-sensitive operations
2. **Validate token permissions** before processing sensitive envelopes
3. **Log access attempts** for audit trails in production
4. **Use token expiration** to limit access duration

### Performance Considerations
1. **Batch envelope operations** when possible
2. **Use streaming** for large envelope collections
3. **Minimize metadata size** for frequently accessed envelopes
4. **Consider compression** for envelope storage in databases

### Error Handling
1. **Validate envelope structure** before processing
2. **Handle missing fields gracefully** with defaults
3. **Log envelope processing errors** with full context
4. **Implement retry logic** for transient failures
