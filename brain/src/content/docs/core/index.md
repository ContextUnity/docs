---
title: Core Concepts
description: Fundamental architecture and design principles of ContextBrain.
---

Understanding ContextBrain's core concepts will help you build better RAG systems and integrate with the ContextUnity ecosystem effectively.

## The Big Picture

ContextBrain is the **SmartMemory** layer that provides vector storage, RAG retrieval, and knowledge graph capabilities. It's built on the ContextUnit protocol for seamless integration across ContextUnity services.

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR APPLICATION                         │
│                    (ContextRouter, ContextCommerce)             │
└─────────────────────────────┬───────────────────────────────────┘
                              │ ContextUnit + ContextToken
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CONTEXTBRAIN                             │
│                    SmartMemory Layer                             │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│   │   RAG        │ → │   Storage    │ → │  Knowledge   │      │
│   │  Pipeline    │   │   Backend    │   │    Graph     │      │
│   │              │   │              │   │              │      │
│   │ • Hybrid     │   │ • Postgres   │   │ • Entities   │      │
│   │ • Reranking  │   │ • LanceDB    │   │ • Relations  │      │
│   │ • Citations  │   │ • Vertex AI  │   │ • Semantic   │      │
│   └──────────────┘   └──────────────┘   └──────────────┘      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ ContextUnit Results
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RESPONSE                                 │
│              ContextUnits with Provenance                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### RAG Pipeline

The RAG (Retrieval-Augmented Generation) pipeline provides intelligent knowledge retrieval:

1. **Hybrid Search** — Combines semantic vector search with full-text indexing
2. **Reranking** — Improves result quality using Vertex AI or MMR
3. **Knowledge Graph** — Entity relationships for graph-aware retrieval
4. **Citations** — Automatic source attribution with provenance

→ [Learn more about RAG](/rag/)

### Storage Backends

ContextBrain supports multiple vector storage backends:

- **PostgreSQL + pgvector** — Production-ready with ACID guarantees
- **LanceDB** — High-performance embedded vector database
- **Vertex AI Search** — Managed Google Cloud service

Each backend implements the same `IRead`/`IWrite` interface via ContextUnit.

→ [Explore Storage](/storage/postgres/)

### ContextUnit Protocol

All data exchange uses the ContextUnit protocol:

- **ContextUnit** — Atomic unit of data with payload, provenance, and security
- **ContextToken** — Authorization token for capability-based access control
- **Security Scopes** — Read/write restrictions per tenant

This ensures seamless integration across ContextUnity services.

→ [Understand ContextUnit](/core/contextunit/)

### Knowledge Graph

Entity extraction and relationship mapping:

- **NER (Named Entity Recognition)** — Extracts entities from documents
- **Taxonomy** — Hierarchical categorization
- **Ontology** — Semantic relationships between entities
- **GraphRAG** — Graph-aware retrieval for complex queries

→ [Knowledge Graph Guide](/rag/knowledge-graph/)

## Design Principles

ContextBrain follows these core principles:

### 1. ContextUnit First
All operations use ContextUnit protocol. No custom data structures.

### 2. Multi-tenant Isolation
Security scopes ensure data separation. Each tenant's data is isolated.

### 3. Performance Targets
- **Vector Retrieval**: <1s
- **Reranking**: <500ms
- **Multi-tenant Isolation**: Mandatory

### 4. Storage Agnostic
Same interface for all backends. Switch between Postgres, LanceDB, or Vertex AI without code changes.

### 5. Provenance Tracking
Every result includes full provenance. You can always trace where information came from.

## What's Next?

Now that you understand the architecture, dive deeper into specific areas:

- **[ContextUnit Protocol](/core/contextunit/)** — Data exchange format
- **[ContextToken](/core/token/)** — Authorization and security
- **[RAG Pipeline](/rag/)** — Retrieval and reranking
- **[Storage](/storage/postgres/)** — Vector database configuration
