---
title: Reranking
description: Improve retrieval precision with neural and algorithmic reranking.
---

Reranking is a second-pass scoring that improves retrieval precision. While initial retrieval (vector search) optimizes for recall, reranking optimizes for relevance to the specific query.

## Why Rerank?

Consider this example:

| Query | "How to train a neural network" |
|-------|--------------------------------|
| **Vector search returns** | Documents about training, neural networks, networks in general |
| **After reranking** | Documents specifically about *training neural networks* |

Initial retrieval casts a wide net. Reranking picks the best fish.

## Available Strategies

### Vertex AI Ranking

Google's neural cross-encoder reranking service.

```toml
[rag]
reranking_enabled = true
reranker = "vertex"
```

**How it works**:
1. Takes query + document as input
2. Jointly encodes them (cross-attention)
3. Outputs a relevance score

**Advantages**:
- State-of-the-art accuracy
- Handles long documents well
- No local compute needed

**Requirements**:
- Google Cloud project
- Vertex AI enabled

### MMR (Maximal Marginal Relevance)

Balances relevance with diversity.

```toml
[rag]
reranking_enabled = true
reranker = "mmr"
mmr_lambda = 0.5  # 0 = max diversity, 1 = max relevance
```

**How it works**:
```
MMR = λ × Relevance(doc, query) - (1-λ) × max(Similarity(doc, selected_docs))
```

Iteratively selects documents that are:
- Relevant to the query
- Different from already-selected documents

**When to use**:
- Results are too similar
- Need diverse perspectives
- Exploratory queries

### None (Disabled)

Use initial retrieval scores only.

```toml
[rag]
reranking_enabled = false
```

**When to use**:
- Latency-critical applications
- Already high-quality initial retrieval
- Testing/development

## Configuration

### Basic Setup

```toml
[rag]
reranking_enabled = true
reranker = "vertex"  # "vertex", "mmr", or "none"
```

### Reranking Limits

Control how many documents go through reranking:

```toml
[rag]
# Initial retrieval fetches more documents
initial_retrieval_count = 50

# Rerank top N
rerank_top_n = 50

# Return top K after reranking
general_retrieval_final_count = 10
```

### Per-Source Limits

After reranking, apply per-source limits:

```toml
[rag]
max_books = 5      # Max book citations
max_videos = 3     # Max video citations
max_qa = 5         # Max Q&A citations
max_web = 3        # Max web citations
```

## How Vertex AI Ranking Works

Vertex AI Ranking uses a **cross-encoder** architecture:

```
┌─────────────────────────────────────────┐
│           Cross-Encoder                  │
│                                         │
│   Query: "train neural network"         │
│   Document: "This guide covers..."      │
│                                         │
│          ┌─────────────┐                │
│          │ Transformer │                │
│          │   Layers    │                │
│          └──────┬──────┘                │
│                 │                        │
│                 ▼                        │
│          Relevance Score: 0.94          │
└─────────────────────────────────────────┘
```

Unlike **bi-encoders** (used in vector search) which encode query and document separately, cross-encoders process them together, enabling richer interaction modeling.

## Reranking Without Google Cloud

For deployments without Vertex AI access:

### Option 1: Hybrid Fusion Only

Rely on well-tuned hybrid search:

```toml
[rag]
reranking_enabled = false
hybrid_fusion = "rrf"
enable_fts = true
```

### Option 2: MMR

Use MMR for diversity-aware selection:

```toml
[rag]
reranking_enabled = true
reranker = "mmr"
mmr_lambda = 0.7
```

### Option 3: Local Cross-Encoder (Future)

Coming soon: local reranking with models like FlashRank or sentence-transformers cross-encoders.

## Best Practices

### Always Rerank for User-Facing Queries

The latency cost (100-200ms) is worth the quality improvement for interactive use.

### Skip for Batch Processing

When processing many queries in batch:

```python
runtime_settings = {"reranking_enabled": False}
```

### Tune MMR Lambda

| Lambda | Behavior |
|--------|----------|
| 0.0 | Maximum diversity (different topics) |
| 0.5 | Balanced (default) |
| 1.0 | Maximum relevance (may be repetitive) |

Start with 0.5 and adjust based on user feedback.

### Monitor Reranking Impact

Compare results with and without reranking:

```python
# With reranking
result_reranked = await pipeline.retrieve(query, reranking_enabled=True)

# Without reranking
result_raw = await pipeline.retrieve(query, reranking_enabled=False)

# Compare overlap, order, and user satisfaction
```
