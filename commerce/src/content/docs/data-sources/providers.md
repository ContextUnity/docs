---
title: Storage Providers
description: Configure databases and storage backends for your knowledge base.
---

Providers manage **indexed knowledge** — persisted data that's been preprocessed and optimized for fast retrieval. Unlike Connectors (which fetch live data), Providers query your own knowledge base.

## PostgreSQL Provider

The recommended provider for most deployments. Combines three powerful search capabilities:

- **pgvector** for semantic similarity search
- **tsvector** for full-text keyword search
- **ltree** for taxonomy-based filtering

### Setup

1. Install PostgreSQL with pgvector extension:

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
# Install pgvector: https://github.com/pgvector/pgvector

# macOS with Homebrew
brew install postgresql pgvector
```

2. Create database:

```bash
createdb contextrouter
psql contextrouter -c "CREATE EXTENSION vector;"
psql contextrouter -c "CREATE EXTENSION ltree;"
```

3. Configure:

```toml
[postgres]
host = "localhost"
port = 5432
database = "contextrouter"
user = "postgres"
password = "${POSTGRES_PASSWORD}"
pool_size = 10
```

### Schema

ContextRouter creates and manages these tables:

```sql
-- Main documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(768),           -- Semantic search
    keywords_vector vector(768),     -- Keyword-aware search
    metadata JSONB,                  -- Flexible attributes
    source_type VARCHAR(50),         -- book, video, qa, etc.
    taxonomy ltree,                  -- Category path
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX idx_documents_embedding 
    ON documents USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_documents_fts 
    ON documents USING GIN (to_tsvector('english', content));

CREATE INDEX idx_documents_taxonomy 
    ON documents USING GIST (taxonomy);
```

### Hybrid Search

PostgreSQL provider supports combining vector and keyword search:

```toml
[rag]
provider = "postgres"
hybrid_fusion = "rrf"           # "rrf" or "weighted"
enable_fts = true               # Enable full-text search
rrf_k = 60                      # RRF constant
hybrid_vector_weight = 0.7      # Vector score weight
hybrid_text_weight = 0.3        # Text score weight
```

**Fusion Methods:**

| Method | Formula | Best For |
|--------|---------|----------|
| RRF (Reciprocal Rank Fusion) | `Σ 1/(k + rank_i)` | General use |
| Weighted | `w₁·score₁ + w₂·score₂` | Tuned systems |

### Usage

```python
from contextrouter.modules.providers import PostgresProvider

provider = PostgresProvider(config)

# Read (search)
results = await provider.read(
    query="machine learning fundamentals",
    limit=10,
    source_types=["book", "qa"],  # Filter by type
    taxonomy_filter="AI.ML",       # Filter by category
)

for doc in results:
    print(f"Score: {doc.score}")
    print(f"Content: {doc.content[:100]}...")
    print(f"Source: {doc.metadata['source']}")

# Write (index)
await provider.write(envelope)
```

---

## Vertex AI Search Provider

Google's enterprise search service for large-scale, managed deployments.

### Setup

1. Create a Vertex AI Search datastore in [Google Cloud Console](https://console.cloud.google.com)
2. Configure:

```toml
[vertex]
project_id = "your-project"
location = "us-central1"
datastore_id = "your-datastore-id"
```

### Features

- **Automatic ranking** — Google's search quality
- **Managed infrastructure** — No database administration
- **Grounding** — Native integration with Gemini models
- **Enterprise SLA** — 99.9% uptime guarantee

### Usage

```python
from contextrouter.modules.providers import VertexProvider

provider = VertexProvider(config)

results = await provider.read(
    query="product documentation",
    limit=10
)
```

---

## Google Cloud Storage Provider

For storing raw assets (PDFs, images, documents) alongside your indexed knowledge.

### Setup

```toml
[gcs]
bucket = "my-contextrouter-assets"
project_id = "your-project"
```

### Usage

```python
from contextrouter.modules.providers import GCSProvider

provider = GCSProvider(config)

# Write a file
url = await provider.write(
    envelope,
    path="documents/report.pdf"
)
print(f"Stored at: {url}")

# Read a file
envelope = await provider.read(path="documents/report.pdf")
```

---

## Switching Providers

### Via Configuration

```toml
[rag]
provider = "postgres"  # Default provider
```

### Via Environment Variable

```bash
export RAG_PROVIDER=vertex
# or
export RAG_BACKEND=postgres
```

### Via Runtime Settings

Override per-request:

```python
runtime_settings = {
    "provider": "vertex",  # Use Vertex for this query
}

async for event in runner.stream(query, runtime_settings=runtime_settings):
    process(event)
```

---

## Blue/Green Deployments

Support zero-downtime updates by maintaining two datastores:

```toml
[rag]
# Production datastore
data_store_id_blue = "prod-datastore-v1"

# Staging datastore (new data being ingested)
data_store_id_green = "prod-datastore-v2"

# Currently active
active_store = "blue"
```

### Deployment Workflow

1. Ingest new data to **green**
2. Test and validate **green**
3. Switch `active_store` to `"green"`
4. **Green** becomes the new **blue**
5. Old **blue** becomes available for next update

### Runtime Override

```python
# Test against staging
runtime_settings = {"rag_dataset": "green"}
```

---

## Creating Custom Providers

Build providers for other databases:

```python
from contextrouter.core.registry import register_provider
from contextrouter.core.interfaces import BaseProvider, IRead, IWrite

@register_provider("redis")
class RedisProvider(BaseProvider, IRead, IWrite):
    """Redis-based caching provider."""
    
    def __init__(self, config):
        self.client = redis.Redis(
            host=config.redis_host,
            port=config.redis_port
        )
    
    async def read(self, query: str, limit: int = 10) -> list[BisquitEnvelope]:
        # Search implementation
        keys = await self.client.keys(f"doc:*:{query}*")
        results = []
        for key in keys[:limit]:
            data = await self.client.get(key)
            results.append(BisquitEnvelope.model_validate_json(data))
        return results
    
    async def write(self, envelope: BisquitEnvelope) -> str:
        key = f"doc:{envelope.id}"
        await self.client.set(key, envelope.model_dump_json())
        return key
```
