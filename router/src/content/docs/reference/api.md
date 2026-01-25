---
title: API Reference
description: Complete reference for ContextRouter classes, functions, and interfaces.
---

This page provides a comprehensive reference for all public APIs in ContextRouter. For implementation examples, see the [Core Concepts](/core/) and [Guides](/getting-started/) sections.

## Table of Contents

- [Core Classes](#core-classes)
- [Cortex (Orchestration)](#cortex-orchestration)
- [Modules](#modules)
- [Utilities](#utilities)
- [Exceptions](#exceptions)

## Core Classes

### BisquitEnvelope

The fundamental data container used throughout ContextRouter for data provenance and security.

```python
from contextrouter.core.bisquit import BisquitEnvelope

class BisquitEnvelope(BaseModel):
    """Envelope for data passing through the pipeline."""

    # Identity & Content
    id: str | None = None                    # Unique identifier (UUID)
    content: Any = None                      # The actual payload

    # Provenance & Tracing
    provenance: list[str] = []               # Ordered trace of processing stages
    metadata: dict[str, Any] = {}           # Enriched attributes

    # Security & Authorization
    token_id: str | None = None             # Security token reference

    # Methods
    def add_trace(self, stage: str) -> "BisquitEnvelope":
        """Add processing stage to provenance."""

    def sign(self, token_id: str) -> "BisquitEnvelope":
        """Attach security token."""
```

**Common Usage:**
```python
# Create envelope
envelope = BisquitEnvelope(
    content={"text": "Sample content"},
    provenance=["connector:web"],
    metadata={"fetched_at": datetime.now().isoformat()}
)

# Add processing trace
envelope.add_trace("transformer:ner")

# Attach security
envelope.sign("token_123")
```

### Config

Central configuration management class.

```python
from contextrouter.core.config import Config

class Config(BaseModel):
    """Main configuration container."""

    # Core settings
    env_path: str = ".env"
    toml_path: str = "settings.toml"

    # Sub-configurations
    models: ModelsConfig
    providers: ProvidersConfig
    rag: RagConfig
    ingestion: IngestionConfig
    security: SecurityConfig

    # Methods
    @classmethod
    def load(cls, env_path: str | None = None,
             toml_path: str | None = None) -> "Config":
        """Load configuration from files and environment."""
```

**Usage:**
```python
from contextrouter.core import get_core_config

config = get_core_config()  # Automatic loading
custom_config = get_core_config(env_path="./custom.env")
```

## Cortex (Orchestration)

### AgentState

The state object that flows through LangGraph workflows.

```python
from typing import TypedDict, NotRequired
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """State maintained throughout agent execution."""

    # Core conversation data
    messages: list[BaseMessage]              # Conversation history
    config: Config                           # System configuration

    # Query processing
    query: NotRequired[str]                  # Normalized user query
    intent: NotRequired[str]                 # Detected intent

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

### ChatRunner

High-level interface for RAG chat interactions.

```python
from contextrouter.cortex.runners import ChatRunner
from typing import AsyncIterator, Sequence
from langchain_core.messages import BaseMessage

class ChatRunner:
    """Streaming RAG chat interface."""

    def __init__(self, config: Config):
        """Initialize with configuration."""

    async def stream(
        self,
        query: str | BaseMessage | Sequence[BaseMessage],
        *,
        user_ctx: dict | None = None,
        citations_allowed_types: list[str] | None = None,
        style_prompt: str = "",
        no_results_prompt: str = "",
        rag_system_prompt_override: str = "",
        search_suggestions_prompt_override: str = "",
        rag_filter: str = "",
        enable_suggestions: bool = True,
        suggestions_model: str = "",
        enable_web_search: bool = True,
        web_allowed_domains: list[str] | None = None,
        max_web_results: int = 10,
        runtime_settings: dict | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        """Stream RAG response with full control over behavior."""
```

**Usage:**
```python
runner = ChatRunner(config)

async for event in runner.stream("What is AI?"):
    if event.get("event") == "text_delta":
        print(event["delta"], end="")
    elif event.get("event") == "citations":
        citations = event["citations"]
```

### IngestionRunner

High-level interface for document ingestion pipelines.

```python
from contextrouter.cortex.runners import IngestionRunner

class IngestionRunner:
    """Document ingestion orchestration."""

    def __init__(self, config: Config):
        """Initialize with configuration."""

    async def run_ingestion(
        self,
        ingestion_config_path: str,
        only_types: list[str] | None = None,
        overwrite: bool = False,
        skip_stages: list[str] | None = None,
    ) -> dict[str, Any]:
        """Run complete ingestion pipeline."""
```

### Graph Builders

Functions for creating LangGraph workflows.

```python
from contextrouter.cortex.graphs import rag_retrieval, rag_ingestion

# Build graphs
retrieval_graph = rag_retrieval.build_graph()
ingestion_graph = rag_ingestion.build_graph()

# Compile for execution
compiled_graph = retrieval_graph.compile()
```

## Modules

### Model Registry

Unified interface for LLM and embedding models.

```python
from contextrouter.modules.models import model_registry
from contextrouter.modules.models.types import ModelRequest, TextPart, ImagePart

class ModelRegistry:
    """Registry for model providers."""

    def create_llm(self, key: str, config: Config) -> BaseLLM:
        """Create LLM instance."""

    def create_embeddings(self, key: str, config: Config) -> BaseEmbeddings:
        """Create embeddings instance."""

    def get_llm_with_fallback(
        self,
        key: str,
        fallback_keys: list[str] | None = None,
        strategy: str = "fallback"
    ) -> BaseLLM:
        """Get LLM with automatic fallback."""
```

**Model Key Formats:**
```
# Commercial APIs
vertex/gemini-2.0-flash
openai/gpt-4o
anthropic/claude-sonnet-4
groq/llama-3.3-70b
openrouter/deepseek/deepseek-r1

# Local models
local/llama3.2              # Ollama
local-vllm/meta-llama/Llama-3.1-8B  # vLLM
hf/distilgpt2               # HuggingFace
```

**Usage:**
```python
# Create models
llm = model_registry.create_llm("vertex/gemini-2.0-flash", config)
embeddings = model_registry.create_embeddings("vertex/text-embedding-004", config)

# With fallback
robust_llm = model_registry.get_llm_with_fallback(
    key="vertex/gemini-2.0-flash",
    fallback_keys=["openai/gpt-4o", "local/llama3.2"],
    strategy="cost-priority"
)
```

### Retrieval Pipeline

RAG orchestration and search.

```python
from contextrouter.modules.retrieval.rag import RagPipeline
from contextrouter.modules.retrieval.rag.settings import RagRetrievalSettings

class RagPipeline:
    """Complete RAG pipeline orchestration."""

    def __init__(self, config: Config, settings: RagRetrievalSettings | None = None):
        """Initialize pipeline."""

    async def retrieve(
        self,
        user_query: str,
        retrieval_queries: list[str] | None = None,
        taxonomy_concepts: list[str] | None = None,
        filters: dict[str, Any] | None = None,
    ) -> RetrievalResult:
        """Execute retrieval pipeline."""
```

**RetrievalResult Structure:**
```python
class RetrievalResult:
    """Results from retrieval pipeline."""

    documents: list[RetrievedDoc]           # Retrieved documents
    citations: list[Citation]               # Citation objects
    metadata: dict[str, Any]               # Pipeline metadata
    execution_time: float                  # Total execution time
    reranked: bool                         # Whether reranking was applied
```

### Provider Interfaces

Storage backend abstractions.

```python
from contextrouter.core.interfaces import IRead, IWrite

class IRead(Protocol):
    """Reading interface for data providers."""

    async def read(
        self,
        query: str | Query,
        filters: dict[str, Any] | None = None,
        limit: int | None = None,
    ) -> list[BisquitEnvelope]:
        """Read data matching query."""

class IWrite(Protocol):
    """Writing interface for data providers."""

    async def write(
        self,
        envelope: BisquitEnvelope,
        **kwargs
    ) -> None:
        """Write envelope to storage."""
```

### Connector Interfaces

Data source abstractions.

```python
from contextrouter.core.interfaces import BaseConnector
from typing import AsyncIterator

class BaseConnector(ABC):
    """Base class for data connectors."""

    @abstractmethod
    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        """Connect to data source and yield envelopes."""
```

### Transformer Interfaces

Data processing abstractions.

```python
from contextrouter.core.interfaces import BaseTransformer

class BaseTransformer(ABC):
    """Base class for data transformers."""

    @abstractmethod
    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Transform envelope content."""
```

## Built-in Components

### Providers

#### PostgresProvider

PostgreSQL provider with pgvector and hybrid search.

```python
from contextrouter.modules.providers.storage.postgres import PostgresProvider

provider = PostgresProvider(config)

# Read with hybrid search
results = await provider.read(
    query="machine learning",
    filters={"source_type": "book"},
    limit=10
)

# Write document
await provider.write(envelope)
```

**Features:**
- pgvector for semantic search
- tsvector for full-text search
- Hybrid search with RRF fusion
- Connection pooling
- SSL support

#### VertexProvider

Google Vertex AI Search provider.

```python
from contextrouter.modules.providers.storage.vertex import VertexProvider

provider = VertexProvider(config)

# Search with filters
results = await provider.read(
    query="AI applications",
    filters={
        "source_type": ["book", "article"],
        "date_range": ["2023-01-01", "2024-12-31"]
    }
)
```

**Features:**
- Enterprise-scale search
- Advanced filtering
- Metadata-based search
- Citation support

### Connectors

#### WebConnector

Google Custom Search integration.

```python
from contextrouter.modules.connectors.web import WebConnector

connector = WebConnector(config)

async for envelope in connector.connect("latest AI research"):
    print(f"Title: {envelope.content['title']}")
    print(f"URL: {envelope.content['url']}")
```

#### FileConnector

Local file system ingestion.

```python
from contextrouter.modules.connectors.file import FileConnector

# Single file
connector = FileConnector(path="./document.pdf")

# Directory (recursive)
connector = FileConnector(path="./documents/", recursive=True)

async for envelope in connector.connect():
    print(f"Processing: {envelope.metadata['filename']}")
```

**Supported Formats:**
- PDF (text extraction)
- Markdown (.md)
- Plain text (.txt)
- JSON (.json, .jsonl)

#### RSSConnector

RSS/Atom feed monitoring.

```python
from contextrouter.modules.connectors.rss import RSSConnector

connector = RSSConnector(config)

# Connect returns all configured feeds
async for envelope in connector.connect():
    print(f"Article: {envelope.content['title']}")
    print(f"Published: {envelope.metadata['published']}")
```

### Transformers

#### NERTransformer

Named entity recognition.

```python
from contextrouter.modules.transformers.ner import NERTransformer

transformer = NERTransformer(config)

envelope = BisquitEnvelope(content={"text": "John works at Google"})
transformed = transformer.transform(envelope)

print(transformed.content["entities"])
# [{"text": "John", "type": "PERSON", "confidence": 0.95}, ...]
```

#### TaxonomyTransformer

Content categorization.

```python
from contextrouter.modules.transformers.taxonomy import TaxonomyTransformer

transformer = TaxonomyTransformer(config)

envelope = BisquitEnvelope(content={"text": "Machine learning algorithms..."})
transformed = transformer.transform(envelope)

print(transformed.content["categories"])
# ["Artificial Intelligence", "Machine Learning", "Computer Science"]
```

#### ShadowRecordTransformer

Search optimization metadata.

```python
from contextrouter.modules.transformers.shadow import ShadowRecordTransformer

transformer = ShadowRecordTransformer(config)

envelope = BisquitEnvelope(content={"text": "Content to optimize"})
transformed = transformer.transform(envelope)

# Envelope now has enriched metadata for search
print(transformed.metadata["keywords"])
print(transformed.metadata["summary"])
```

## Utilities

### Registry Functions

```python
from contextrouter.core.registry import (
    select_connector,
    select_provider,
    select_transformer,
    register_connector,
    register_provider,
    register_transformer
)

# Selection functions
connector = select_connector("web")
provider = select_provider("postgres")
transformer = select_transformer("ner")

# Registration decorators
@register_connector("custom_source")
class CustomConnector(BaseConnector):
    async def connect(self, query: str):
        # Implementation
        yield envelope

@register_transformer("custom_processor")
class CustomTransformer(BaseTransformer):
    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        # Implementation
        return envelope
```

### Configuration Helpers

```python
from contextrouter.core import get_core_config
from contextrouter.core.config import Config

# Load configuration
config = get_core_config()

# Access sub-configurations
models_config = config.models
rag_config = config.rag
providers_config = config.providers

# Create custom config
custom_config = Config.load(
    env_path="./custom.env",
    toml_path="./custom.toml"
)
```

### Data Utilities

```python
from contextrouter.core.types import coerce_struct_data
from contextrouter.core.bisquit import BisquitEnvelope

# Convert arbitrary data to JSON-safe format
complex_data = {
    "date": datetime.now(),
    "custom_object": CustomClass(),
    "nested": {"key": "value"}
}

safe_data = coerce_struct_data(complex_data)
# Result: {"date": "2024-01-15T10:30:00", "custom_object": "<CustomClass object>", ...}

# Create envelope from data
envelope = BisquitEnvelope(
    content=safe_data,
    provenance=["data:import"]
)
```

## Exceptions

ContextRouter defines specific exception types for different error conditions.

### Core Exceptions

```python
class ContextRouterError(Exception):
    """Base exception for ContextRouter errors."""
    pass

class ConfigurationError(ContextRouterError):
    """Configuration-related errors."""
    pass

class ProviderError(ContextRouterError):
    """Provider operation errors."""
    pass

class ModelError(ContextRouterError):
    """Model operation errors."""
    pass

class ValidationError(ContextRouterError):
    """Data validation errors."""
    pass
```

### Usage Examples

```python
from contextrouter.core.exceptions import ConfigurationError, ProviderError

try:
    config = get_core_config()
    if not config.models.default_llm:
        raise ConfigurationError("No default LLM configured")
except ConfigurationError as e:
    print(f"Configuration error: {e}")

try:
    results = await provider.read("query")
except ProviderError as e:
    print(f"Provider error: {e}")
    # Implement fallback logic
```

### Error Hierarchy

```
ContextRouterError
├── ConfigurationError
├── ProviderError
│   ├── PostgresError
│   └── VertexError
├── ModelError
│   ├── OpenAIError
│   ├── VertexModelError
│   └── LocalModelError
├── ValidationError
├── TransformerError
└── PipelineError
```

## Type Definitions

### Core Types

```python
from contextrouter.core.types import (
    StructData,           # JSON-serializable data
    StructDataPrimitive,  # Basic JSON types
    SourceType,          # Content source identifier
)

# StructData example
data: StructData = {
    "title": "Document Title",
    "content": "Document content...",
    "metadata": {
        "author": "John Doe",
        "date": "2024-01-15",
        "tags": ["tag1", "tag2"]
    }
}
```

### Model Types

```python
from contextrouter.modules.models.types import (
    ModelRequest,        # Request to model
    ModelResponse,       # Response from model
    TextPart,           # Text content part
    ImagePart,          # Image content part
    AudioPart,          # Audio content part
)

# Multimodal request
request = ModelRequest(
    parts=[
        TextPart(text="What's in this image?"),
        ImagePart(
            mime="image/jpeg",
            data_b64="base64_encoded_image_data"
        )
    ],
    temperature=0.7,
    max_output_tokens=1024
)
```

### Retrieval Types

```python
from contextrouter.modules.retrieval.rag.types import (
    RetrievedDoc,        # Retrieved document
    Citation,           # Citation information
    RetrievalResult,    # Complete retrieval result
)

# Citation structure
citation = Citation(
    text="Retrieved text snippet...",
    source={"type": "book", "title": "AI Guide", "page": 42},
    confidence=0.92,
    metadata={"relevance_score": 0.95}
)
```

## Constants and Enums

### Provider Types

```python
class ProviderType(str, Enum):
    POSTGRES = "postgres"
    VERTEX = "vertex"
    GCS = "gcs"
    REDIS = "redis"
```

### Model Providers

```python
class ModelProvider(str, Enum):
    VERTEX = "vertex"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GROQ = "groq"
    LOCAL = "local"
    HUGGINGFACE = "hf"
```

### Content Types

```python
class ContentType(str, Enum):
    BOOK = "book"
    VIDEO = "video"
    QA = "qa"
    WEB = "web"
    KNOWLEDGE = "knowledge"
```

This API reference provides the foundation for building with ContextRouter. For practical examples and integration guides, see the [Getting Started](/getting-started/) and [Guides](/guides/) sections.