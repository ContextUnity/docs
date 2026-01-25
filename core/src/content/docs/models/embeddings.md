---
title: Embeddings
description: Configure embedding models for semantic search and RAG.
---

Embedding models convert text into dense vectors, enabling semantic search and similarity matching. Choosing the right embedding model is crucial for RAG quality.

## Available Providers

| Provider | Model | Dimensions | Best For |
|----------|-------|------------|----------|
| **Vertex AI** | text-embedding-004 | 768 | Production, multilingual |
| **OpenAI** | text-embedding-3-small | 1536 | Quality, ecosystem |
| **HuggingFace** | all-mpnet-base-v2 | 768 | Local, privacy, cost |
| **HuggingFace** | all-MiniLM-L6-v2 | 384 | Speed, lower memory |

## Configuration

Set your default embedding model:

```toml
# settings.toml
[models]
default_embeddings = "vertex/text-embedding-004"
```

Or via environment variable:

```bash
export RAG_EMBEDDINGS_MODEL=vertex/text-embedding-004
```

## Using Embeddings

### Basic Usage

```python
from contextrouter.modules.models import model_registry
from contextrouter.core import get_core_config

config = get_core_config()

# Get embedding model
embeddings = model_registry.create_embeddings(
    "vertex/text-embedding-004",
    config=config
)

# Embed a single query
query_vector = await embeddings.embed_query("What is machine learning?")
print(f"Vector dimensions: {len(query_vector)}")
# Output: Vector dimensions: 768

# Embed multiple documents
doc_vectors = await embeddings.embed_documents([
    "Machine learning is a subset of AI...",
    "Deep learning uses neural networks...",
    "Natural language processing enables...",
])
print(f"Embedded {len(doc_vectors)} documents")
```

### Batch Processing

For large-scale ingestion, use batching:

```python
from contextrouter.modules.models.embeddings import batch_embed

documents = load_documents()  # Your documents

# Process in batches
vectors = await batch_embed(
    embeddings=embeddings,
    texts=documents,
    batch_size=100,  # Adjust based on API limits
    show_progress=True
)
```

## Vertex AI Embeddings

Google's production-grade embedding service.

### Setup

Requires GCP project with Vertex AI enabled:

```toml
[vertex]
project_id = "your-project"
location = "us-central1"
```

### Features

- **High quality** for English and multilingual text
- **768 dimensions** — good balance of quality and storage
- **Batch processing** support
- **Enterprise SLA**

```python
embeddings = model_registry.create_embeddings(
    "vertex/text-embedding-004",
    config=config
)
```

## HuggingFace Embeddings (Local)

Run embeddings locally without API calls.

### Setup

```bash
pip install contextrouter[hf-transformers]
```

### Usage

```python
# Default: all-mpnet-base-v2 (768 dimensions, high quality)
embeddings = model_registry.create_embeddings(
    "hf/sentence-transformers",
    config=config
)

# Faster, smaller model (384 dimensions)
embeddings = model_registry.create_embeddings(
    "hf/sentence-transformers",
    config=config,
    model_name="all-MiniLM-L6-v2"
)

# Custom model
embeddings = model_registry.create_embeddings(
    "hf/sentence-transformers",
    config=config,
    model_name="BAAI/bge-large-en-v1.5"  # Any sentence-transformers model
)
```

### When to Use Local Embeddings

- **Air-gapped environments** — No external API calls
- **Cost-sensitive applications** — No per-token charges
- **Custom fine-tuned models** — Load your own models
- **Privacy requirements** — Data never leaves your infrastructure

## OpenAI Embeddings

```python
embeddings = model_registry.create_embeddings(
    "openai/text-embedding-3-small",
    config=config
)
```

### Features

- **1536 dimensions** — higher dimensional representation
- **Good quality** across diverse content
- **Simple setup** — just needs API key

## Dimension Considerations

Your vector database must match the embedding dimensions:

```sql
-- PostgreSQL with pgvector
-- For 768-dimensional embeddings (Vertex, mpnet)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(768)
);

-- For 384-dimensional embeddings (MiniLM)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(384)
);

-- For 1536-dimensional embeddings (OpenAI)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)
);
```

**Important**: Changing embedding models requires re-embedding all your documents. Plan your embedding strategy before large-scale ingestion.

## Choosing an Embedding Model

### For Production RAG

| Requirement | Recommended Model |
|-------------|-------------------|
| Best quality + GCP | `vertex/text-embedding-004` |
| Best quality + OpenAI | `openai/text-embedding-3-small` |
| Privacy/local | `hf/sentence-transformers` (mpnet) |
| Speed/memory constrained | `hf/sentence-transformers` (MiniLM) |

### Quality vs Performance Trade-offs

```
Quality:  text-embedding-004 > mpnet > MiniLM
Speed:    MiniLM > mpnet > text-embedding-004
Memory:   MiniLM < mpnet < text-embedding-004
Cost:     Local (free) < Vertex < OpenAI
```

### Multilingual Support

- **Vertex AI** — Good multilingual support built-in
- **HuggingFace** — Use `sentence-transformers/paraphrase-multilingual-mpnet-base-v2`

## Best Practices

1. **Choose once, stick with it** — Changing models requires full re-embedding
2. **Match dimensions** — Ensure database schema matches model output
3. **Batch large workloads** — Use batch processing for efficiency
4. **Test retrieval quality** — Evaluate with your actual queries before committing
5. **Consider latency** — Local models have no network round-trip
