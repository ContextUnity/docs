---
title: Quick Start
description: Build your first RAG query with ContextBrain.
---

This guide will help you build your first RAG (Retrieval-Augmented Generation) query with ContextBrain.

## Prerequisites

- ContextBrain installed (see [Installation](/getting-started/installation/))
- PostgreSQL with pgvector (or LanceDB/Vertex AI)
- ContextCore package

## Step 1: Set Up Storage

### PostgreSQL + pgvector

```python
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Create database
conn = psycopg2.connect("postgresql://user:password@localhost/postgres")
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cursor = conn.cursor()
cursor.execute("CREATE DATABASE contextbrain")
cursor.close()
conn.close()

# Enable pgvector
conn = psycopg2.connect("postgresql://user:password@localhost/contextbrain")
cursor = conn.cursor()
cursor.execute("CREATE EXTENSION vector")
cursor.close()
conn.close()
```

## Step 2: Ingest Documents

```python
from contextbrain import BrainClient
from contextcore import ContextUnit, ContextToken

client = BrainClient(host="localhost:50051")

# Create ingestion unit
ingestion_unit = ContextUnit(
    payload={
        "content": "RAG (Retrieval-Augmented Generation) combines vector search with LLM generation.",
        "metadata": {"source": "documentation", "title": "RAG Overview"}
    },
    security=SecurityScopes(write=["knowledge:write"])
)

token = ContextToken(permissions=("knowledge:write",))

# Ingest document
await client.upsert_taxonomy(ingestion_unit, token=token)
```

## Step 3: Query Knowledge Base

```python
# Create query unit
query_unit = ContextUnit(
    payload={"query": "What is RAG?"},
    security=SecurityScopes(read=["knowledge:read"])
)

query_token = ContextToken(permissions=("knowledge:read",))

# Query memory
async for result in client.query_memory(query_unit, token=query_token):
    print(result.payload.get("content"))
    print(f"Source: {result.payload.get('metadata', {}).get('source')}")
```

## Complete Example

```python
import asyncio
from contextbrain import BrainClient
from contextcore import ContextUnit, ContextToken, SecurityScopes
from uuid import uuid4

async def main():
    client = BrainClient(host="localhost:50051")
    
    # Ingest
    doc = ContextUnit(
        unit_id=uuid4(),
        trace_id=uuid4(),
        payload={
            "content": "ContextBrain provides RAG capabilities with hybrid search.",
            "metadata": {"source": "docs", "title": "ContextBrain"}
        },
        security=SecurityScopes(write=["knowledge:write"])
    )
    
    token = ContextToken(permissions=("knowledge:write",))
    await client.upsert_taxonomy(doc, token=token)
    
    # Query
    query = ContextUnit(
        unit_id=uuid4(),
        trace_id=uuid4(),
        payload={"query": "What is ContextBrain?"},
        security=SecurityScopes(read=["knowledge:read"])
    )
    
    query_token = ContextToken(permissions=("knowledge:read",))
    
    print("Results:")
    async for result in client.query_memory(query, token=query_token):
        print(f"- {result.payload.get('content')}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Next Steps

- **[RAG Pipeline](/rag/)** — Understand retrieval and reranking
- **[Storage](/storage/postgres/)** — Configure your vector database
- **[Ingestion](/ingestion/)** — Learn about document ingestion pipelines
