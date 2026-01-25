---
title: RAG Pipeline
description: Advanced Retrieval-Augmented Generation with multi-source search, reranking, and citations.
---

ContextRouter's RAG implementation goes far beyond simple vector search. It's a sophisticated, multi-stage pipeline designed for accuracy, diversity, and full provenance tracking.

## Pipeline Overview

When a user asks a question, the RAG pipeline:

```
Query
  │
  ▼
┌────────────────────────────────────────────────────────────┐
│                    Intent Detection                         │
│  • Classify query type (RAG, web, direct)                  │
│  • Generate optimized search queries                       │
│  • Extract taxonomy concepts                               │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                   Parallel Retrieval                        │
│                                                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│   │Providers │  │Connectors│  │  Graph   │               │
│   │(Postgres)│  │  (Web)   │  │  Facts   │               │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│        │             │             │                      │
│        └─────────────┴─────────────┘                      │
│                      │                                     │
└──────────────────────┼─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│                   Deduplication                             │
│  • SHA256 hash of URL + snippet + content                  │
│  • Prevents duplicate citations                            │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                     Reranking                               │
│  • Vertex AI Ranking (neural)                              │
│  • MMR for diversity                                       │
│  • Hybrid fusion (vector + keyword)                        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                   Citation Building                         │
│  • Per-source type limits                                  │
│  • Deduplication by source                                 │
│  • Provenance attachment                                   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
                   Generation
```

## Key Features

### Multi-Source Retrieval

Fetch context from multiple sources simultaneously:

- **Vector stores**: Postgres + pgvector, Vertex AI Search
- **Knowledge graphs**: Cognee integration, Postgres KG
- **Live connectors**: Web search, RSS feeds

All sources are queried in parallel for minimum latency.

### Hybrid Search

Combine semantic and keyword search for better recall:

```toml
[rag]
hybrid_fusion = "rrf"      # or "weighted"
enable_fts = true          # Enable full-text search
rrf_k = 60                 # RRF constant
hybrid_vector_weight = 0.7
hybrid_text_weight = 0.3
```

### Intelligent Reranking

Improve precision with a second-pass ranking:

- **Vertex AI Ranking**: Neural cross-encoder reranking
- **MMR**: Balance relevance with diversity
- **Configurable limits**: Control results per source type

### Full Provenance

Every retrieved document carries its complete history:

```python
citation = {
    "text": "RAG combines retrieval with generation...",
    "source": {"type": "book", "title": "AI Patterns", "page": 42},
    "provenance": [
        "provider:postgres",
        "reranker:vertex",
        "formatter:citations"
    ],
    "confidence": 0.94
}
```

## Quick Configuration

```toml
# settings.toml
[rag]
provider = "postgres"
reranking_enabled = true
citations_enabled = true

# Result limits
general_retrieval_final_count = 10
max_books = 5
max_videos = 3
max_qa = 5
max_web = 3

# Citation limits
citations_books = 3
citations_videos = 2
citations_qa = 3
```

## Basic Usage

### With ChatRunner

```python
from contextrouter.cortex.runners import ChatRunner

runner = ChatRunner(config)

citations = []
async for event in runner.stream("What is machine learning?"):
    if hasattr(event, 'content'):
        print(event.content, end="")
    if hasattr(event, 'citations'):
        citations = event.citations

# Display sources
for c in citations:
    print(f"Source: {c['source']['title']}")
```

### Standalone Pipeline

Use the RAG pipeline directly for custom workflows:

```python
from contextrouter.modules.retrieval.rag import RagPipeline
from contextrouter.modules.retrieval.rag.settings import RagRetrievalSettings

settings = RagRetrievalSettings(
    reranking_enabled=True,
    general_retrieval_final_count=10,
)

pipeline = RagPipeline(config, settings=settings)

result = await pipeline.retrieve(
    user_query="machine learning basics",
    retrieval_queries=["ML fundamentals", "intro to machine learning"],
    taxonomy_concepts=["AI", "Machine Learning"],
)

for doc in result.documents:
    print(f"{doc.source_type}: {doc.snippet[:100]}...")
```

## Runtime Overrides

Customize behavior per-request:

```python
runtime_settings = {
    # Enable/disable features
    "web_search_enabled": True,
    "reranking_enabled": False,
    
    # Change limits
    "max_results": 5,
    
    # Switch providers
    "provider": "vertex",
}

async for event in runner.stream(query, runtime_settings=runtime_settings):
    process(event)
```

## Learn More

- **[Retrieval](/rag/retrieval/)** — How search works in detail
- **[Reranking](/rag/reranking/)** — Ranking strategies and configuration
- **[Ingestion](/ingestion/)** — How to populate your knowledge base
