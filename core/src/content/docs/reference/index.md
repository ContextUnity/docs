---
title: Reference
description: Configuration reference, CLI commands, and API documentation.
---

This section provides comprehensive reference documentation for ContextRouter configuration, commands, and APIs.

## Quick Links

| Reference | Description |
|-----------|-------------|
| [Configuration](/reference/configuration/) | All settings, environment variables, and TOML options |
| [CLI Commands](/reference/cli/) | Command-line interface for ingestion and RAG |
| [Roadmap](/reference/roadmap/) | Development status and planned features |

## Configuration Overview

ContextRouter uses a layered configuration system:

```
┌─────────────────────────────────────────────┐
│           Runtime Settings                   │  ← Highest priority
│      (passed to functions)                   │
├─────────────────────────────────────────────┤
│           Environment Variables              │
│        (VERTEX_PROJECT_ID, etc.)            │
├─────────────────────────────────────────────┤
│             settings.toml                    │
│         (project configuration)              │
├─────────────────────────────────────────────┤
│              Default Values                  │  ← Lowest priority
│          (built into package)                │
└─────────────────────────────────────────────┘
```

Each layer overrides the one below it.

## Configuration File Structure

A typical `settings.toml`:

```toml
# Model configuration
[models]
default_llm = "vertex/gemini-2.0-flash"
default_embeddings = "vertex/text-embedding-004"
temperature = 0.7
max_output_tokens = 4096

# Provider credentials
[vertex]
project_id = "my-gcp-project"
location = "us-central1"

[postgres]
host = "localhost"
database = "contextrouter"

# RAG behavior
[rag]
provider = "postgres"
reranking_enabled = true
hybrid_fusion = "rrf"

# Ingestion pipeline
[ingestion.rag]
enabled = true
output_dir = "./ingestion_output"
```

## Environment Variables

Key environment variables:

| Variable | Purpose |
|----------|---------|
| `VERTEX_PROJECT_ID` | Google Cloud project ID |
| `VERTEX_LOCATION` | GCP region (e.g., us-central1) |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `POSTGRES_PASSWORD` | Database password |
| `RAG_PROVIDER` | Default retrieval backend |

## API Modules

### Core

```python
from contextrouter.core import get_core_config
from contextrouter.core.registry import register_connector, register_provider
from contextrouter.core.bisquit import BisquitEnvelope
```

### Cortex (Orchestration)

```python
from contextrouter.cortex.runners import ChatRunner, IngestionRunner
from contextrouter.cortex.graphs import rag_retrieval, rag_ingestion
from contextrouter.cortex.state import AgentState
```

### Models

```python
from contextrouter.modules.models import model_registry
from contextrouter.modules.models.types import ModelRequest, TextPart
```

### Data Sources

```python
from contextrouter.modules.connectors import WebConnector, FileConnector
from contextrouter.modules.providers import PostgresProvider, VertexProvider
```

### RAG

```python
from contextrouter.modules.retrieval.rag import RagPipeline
from contextrouter.modules.retrieval.rag.settings import RagRetrievalSettings
```

## Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/ContextRouter/contextrouter/issues)
- **Discussions**: [Ask questions](https://github.com/ContextRouter/contextrouter/discussions)
- **Discord**: Join our community (link in GitHub)
