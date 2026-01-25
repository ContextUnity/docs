---
title: Getting Started
description: Quick introduction to ContextBrain and how to get up and running.
---

Welcome to ContextBrain! This guide will help you understand what ContextBrain is and get you up and running quickly.

## What is ContextBrain?

ContextBrain is the **SmartMemory and Intelligence layer** of the ContextUnity ecosystem. It provides:

- **Vector storage** — PostgreSQL + pgvector, LanceDB, or Vertex AI Search
- **RAG pipelines** — Hybrid search with reranking and knowledge graph integration
- **Knowledge Graph** — Entity relationships and semantic connections
- **Multi-tenant isolation** — Security scopes via ContextUnit protocol

## Key Features

### 🧠 SmartMemory
Production-grade vector storage with:
- **Hybrid search** combining semantic vectors with full-text indexing
- **Multi-tenant isolation** via ContextUnit security scopes
- **Sub-second retrieval** optimized for production workloads

### 🔍 Advanced RAG
Go beyond simple vector search:
- **Intelligent reranking** with Vertex AI or MMR
- **Knowledge graph** integration for relationship-aware retrieval
- **Automatic citations** with full provenance tracking

### 🛡️ ContextUnit Protocol
Native integration with ContextCore:
- **ContextToken** authorization for capability-based access control
- **Security scopes** for read/write restrictions
- **Full audit trails** via ContextUnit provenance

### 📊 Centralized Logging
Enterprise-grade logging with ContextCore:
- **Automatic trace_id propagation** from ContextUnit
- **Structured JSON logging** for observability
- **Secret redaction** for sensitive data
- **Safe previews** of large data structures

### 🌐 Multiple Storage Backends
Choose your vector store:
- **PostgreSQL + pgvector** — Production-ready with ACID guarantees
- **LanceDB** — High-performance embedded vector database
- **Vertex AI Search** — Managed Google Cloud service

## How It Works

```
Your App → ContextBrain gRPC API → Storage Backend → Response
              (ContextUnit)         (Postgres/LanceDB)
```

1. **Your application** sends a ContextUnit query to ContextBrain
2. **ContextBrain** validates ContextToken and security scopes
3. **Storage backend** performs hybrid search (vector + full-text)
4. **Reranking** improves result quality
5. **Response** returns ContextUnits with full provenance

## Quick Example

Here's a minimal example:

```python
from contextcore import ContextUnit, ContextToken, SecurityScopes
from contextcore import setup_logging, get_context_unit_logger, SharedConfig, LogLevel
from contextbrain import BrainClient

# Setup logging at application startup
config = SharedConfig(log_level=LogLevel.INFO)
setup_logging(config=config, service_name="contextbrain")

# Get logger with ContextUnit support
logger = get_context_unit_logger(__name__)

# Create a client
client = BrainClient(host="localhost:50051")

# Create a query ContextUnit
query = ContextUnit(
    payload={"query": "What is RAG?"},
    security=SecurityScopes(read=["knowledge:read"])
)

# Log with ContextUnit (trace_id automatically included)
logger.info("Querying memory", unit=query)

# Create a token
token = ContextToken(
    token_id="token_123",
    permissions=("knowledge:read",)
)

# Query memory
async for result in client.query_memory(query, token=token):
    logger.debug("Retrieved result", unit=result)
    print(result.payload.get("content"))
```

## Next Steps

Ready to dive in? Here's your path:

1. **[Installation](/getting-started/installation/)** — Get ContextBrain installed
2. **[Quick Start](/getting-started/quickstart/)** — Build your first RAG query
3. **[RAG Pipeline](/rag/)** — Understand retrieval and reranking
4. **[Logging](/core/guides/logging/)** — Set up centralized logging
5. **[Storage](/storage/postgres/)** — Configure your vector database

## Requirements

- **Python 3.11+**
- **PostgreSQL 14+** with pgvector extension (or LanceDB/Vertex AI)
- **ContextCore** package installed
