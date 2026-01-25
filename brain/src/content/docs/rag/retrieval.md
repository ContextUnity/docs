---
title: Retrieval
description: How ContextRouter's multi-stage retrieval pipeline works.
---

The retrieval pipeline is responsible for finding the most relevant context for a user's query. It goes through several stages to ensure both high recall (finding relevant documents) and high precision (filtering out noise).

## Pipeline Stages

### Stage 1: Query Normalization

The pipeline starts by processing the raw user query:

1. **Extract core intent** — What is the user really asking?
2. **Generate search queries** — Up to 3 optimized queries for different search aspects
3. **Identify taxonomy concepts** — Categories for filtering and graph lookup

```python
# Input
user_query = "What books talk about machine learning for beginners?"

# After intent detection
retrieval_queries = [
    "machine learning beginner books",
    "ML introductory textbooks", 
    "learn machine learning basics"
]
taxonomy_concepts = ["AI", "Machine Learning", "Education"]
```

### Stage 2: Parallel Retrieval

ContextRouter fetches from multiple sources **simultaneously** for minimum latency:

```
                         User Query
                              │
                              ▼
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Providers│   │Connectors│   │  Graph   │
        │          │   │          │   │  Facts   │
        │• Postgres│   │• Web     │   │          │
        │• Vertex  │   │• RSS     │   │• Entities│
        │          │   │          │   │• Relations│
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┴──────────────┘
                            │
                            ▼
                      All Results
```

Each source returns `BisquitEnvelope` objects with full provenance.

### Stage 3: Deduplication

Results from multiple queries often overlap. Deduplication prevents showing the same content twice:

```python
# SHA256-based deduplication
def get_document_hash(doc):
    content = f"{doc.url}|{doc.snippet}|{doc.content}"
    return hashlib.sha256(content.encode()).hexdigest()

# Only keep unique documents
seen_hashes = set()
unique_docs = []
for doc in all_docs:
    doc_hash = get_document_hash(doc)
    if doc_hash not in seen_hashes:
        seen_hashes.add(doc_hash)
        unique_docs.append(doc)
```

This is memory-efficient compared to storing full content strings.

### Stage 4: Selection

After deduplication, select the top results based on configuration:

**General Mode** (default):
```toml
[rag]
general_retrieval_enabled = true
general_retrieval_final_count = 10  # Total documents
```

**Per-Source Mode** (for diverse results):
```toml
[rag]
general_retrieval_enabled = false
max_books = 5
max_videos = 3
max_qa = 5
max_web = 3
```

## Hybrid Search (PostgreSQL)

When using PostgreSQL, combine vector and keyword search for better results.

### Why Hybrid?

| Search Type | Strengths | Weaknesses |
|-------------|-----------|------------|
| **Vector** | Semantic similarity, synonyms | Misses exact terms, rare words |
| **Keyword** | Exact matches, names, codes | Misses paraphrases, concepts |
| **Hybrid** | Best of both | Requires tuning |

### Fusion Methods

#### Reciprocal Rank Fusion (RRF)

Combines rankings without needing normalized scores:

```
score = Σ 1/(k + rank_i)
```

Where `k` is a constant (default 60) and `rank_i` is the document's rank in each list.

```toml
[rag]
hybrid_fusion = "rrf"
rrf_k = 60
```

**Pros**: Robust, works well out of the box
**Cons**: Less tunable

#### Weighted Fusion

Linear combination of normalized scores:

```
score = w_vec × vector_score + w_text × text_score
```

```toml
[rag]
hybrid_fusion = "weighted"
hybrid_vector_weight = 0.7
hybrid_text_weight = 0.3
```

**Pros**: Fine-grained control
**Cons**: Requires score normalization, more tuning

### Keyword-Aware Vector Search

ContextRouter stores a separate `keywords_vector` containing NER entities and key phrases. This is searched alongside the main content vector:

```sql
-- Simplified query
SELECT content, 
       (embedding <=> query_vec) * 0.5 + 
       (keywords_vector <=> query_vec) * 0.5 AS combined_score
FROM documents
ORDER BY combined_score
LIMIT 10;
```

## Graph Facts

Alongside document retrieval, the pipeline fetches **knowledge graph relationships**:

```python
# Query: "Who founded OpenAI?"

# Graph facts returned:
facts = [
    ("OpenAI", "founded_by", "Sam Altman"),
    ("OpenAI", "founded_by", "Greg Brockman"),
    ("OpenAI", "type", "AI Research Laboratory"),
    ("OpenAI", "founded", "2015"),
]
```

Graph facts:
- Provide structured context for reasoning
- Are separate from citations (don't appear in UI)
- Come from the knowledge graph built during ingestion

## Configuration

```toml
[rag]
# Provider selection
provider = "postgres"  # or "vertex"

# Hybrid search (Postgres only)
hybrid_fusion = "rrf"
enable_fts = true
rrf_k = 60

# Result limits
general_retrieval_final_count = 10
max_retrieval_queries = 3

# Graph facts
graph_facts_enabled = true
max_graph_facts = 50

# Caching
cache_enabled = true
cache_ttl_seconds = 3600
```

## Performance Tips

### Batch Queries
Limit the number of parallel queries:
```toml
max_retrieval_queries = 3
```

### Index Tuning
For PostgreSQL with many documents:
```sql
-- Adjust lists based on row count
-- Rule of thumb: lists = sqrt(row_count)
CREATE INDEX idx_embedding ON documents 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### Caching
Enable caching for repeated queries:
```toml
[rag]
cache_enabled = true
cache_ttl_seconds = 3600  # 1 hour
```
