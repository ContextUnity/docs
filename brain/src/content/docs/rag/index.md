---
title: RAG Pipeline
description: Advanced Retrieval-Augmented Generation with hybrid search, reranking, and knowledge graph integration.
---

ContextBrain's RAG implementation provides high-performance retrieval with hybrid search, intelligent reranking, and knowledge graph integration.

## Pipeline Overview

When a query arrives, the RAG pipeline:

```
Query ContextUnit
  │
  ▼
┌────────────────────────────────────────────────────────────┐
│              Hybrid Search                                │
│  • Vector search (semantic similarity)                   │
│  • Full-text search (keyword matching)                  │
│  • Knowledge graph traversal (entity relationships)      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              Deduplication                                │
│  • SHA256 hash of content + metadata                     │
│  • Prevents duplicate citations                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              Reranking                                    │
│  • Vertex AI Ranking (neural reranking)                   │
│  • MMR for diversity                                       │
│  • Hybrid fusion (vector + keyword scores)                │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              Context Assembly                             │
│  • Combine top-k results                                  │
│  • Add citations with provenance                          │
│  • Format for LLM consumption                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
              Response ContextUnit
```

## Hybrid Search

Combines multiple search strategies:

### Vector Search

Semantic similarity using embeddings:

```python
# Vector search finds semantically similar content
results = await storage.vector_search(
    query_embedding=embedding,
    top_k=50
)
```

### Full-Text Search

Keyword matching using PostgreSQL full-text search:

```python
# Full-text search finds keyword matches
results = await storage.fulltext_search(
    query="RAG retrieval",
    top_k=50
)
```

### Knowledge Graph

Entity relationship traversal:

```python
# Graph search finds related entities
results = await graph.traverse(
    entity="RAG",
    relationship="RELATED_TO",
    depth=2
)
```

## Reranking

Improves result quality using neural reranking:

```python
from contextbrain.rag import Reranker

reranker = Reranker(model="vertex/reranker-001")

# Rerank top-k results
reranked = await reranker.rerank(
    query="What is RAG?",
    candidates=top_50_results,
    top_k=20
)
```

### Reranking Models

- **Vertex AI Reranker** — Neural reranking model
- **MMR (Maximal Marginal Relevance)** — Diversity-focused reranking
- **Hybrid Fusion** — Combines vector and keyword scores

## Knowledge Graph Integration

Graph-aware retrieval for complex queries:

```python
from contextbrain.graph import KnowledgeGraph

graph = KnowledgeGraph()

# Find entities related to query
entities = await graph.extract_entities(query)

# Traverse relationships
related = await graph.traverse(
    entity=entities[0],
    relationship="RELATED_TO",
    depth=2
)

# Combine with vector search
results = await hybrid_search(query, graph_context=related)
```

## Performance Targets

- **Vector Retrieval**: <1s
- **Reranking**: <500ms
- **Total Pipeline**: <1.5s

## Multi-Tenant Isolation

All queries are isolated by security scopes:

```python
unit = ContextUnit(
    payload={"query": "..."},
    security=SecurityScopes(
        read=["tenant:123:read"]  # Only tenant 123 can read
    )
)

token = ContextToken(
    permissions=("tenant:123:read",)
)

# Results are automatically filtered by tenant
results = await client.query_memory(unit, token=token)
```

## Citations

Every result includes full provenance:

```python
for result in results:
    print(result.payload["content"])
    print("Sources:")
    for citation in result.citations:
        print(f"  - {citation.source}: {citation.snippet}")
```

## Next Steps

- **[Retrieval](/rag/retrieval/)** — Deep dive into retrieval strategies
- **[Reranking](/rag/reranking/)** — Reranking models and configuration
- **[Knowledge Graph](/rag/knowledge-graph/)** — Graph-aware retrieval
