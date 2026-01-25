---
title: Roadmap
description: Development status and planned features for ContextRouter.
---

This roadmap outlines the current state of ContextRouter and planned enhancements. We use `NotImplementedError` stubs throughout the codebase to mark areas ready for contribution.

## Current Status (v0.10.x)

### Stable Features ✅

| Feature | Status | Notes |
|---------|--------|-------|
| LangGraph orchestration | ✅ Stable | Cortex with customizable graphs |
| Multi-provider LLMs | ✅ Stable | Vertex, OpenAI, Anthropic, Groq, Local |
| PostgreSQL + pgvector | ✅ Stable | Hybrid search with FTS |
| Staged ingestion pipeline | ✅ Stable | Preprocess → Structure → Index → Deploy |
| CLI tools | ✅ Stable | Full pipeline management |
| Bisquit provenance | ✅ Stable | Data tracking throughout |

### Beta Features 🔶

| Feature | Status | Notes |
|---------|--------|-------|
| Knowledge Graph (Cognee) | 🔶 Beta | Entity extraction, graph building |
| Vertex AI Ranking | 🔶 Beta | Neural reranking |
| AG-UI protocol | 🔶 Beta | Streaming to frontends |
| OpenRouter support | 🔶 Beta | Hundreds of models |

### Alpha Features 🔷

| Feature | Status | Notes |
|---------|--------|-------|
| HuggingFace local | 🔷 Alpha | In-process inference |
| Plugin auto-discovery | 🔷 Alpha | Automatic loading |
| A2A protocol | 🔷 Alpha | Multi-agent communication |

## Near-Term Priorities

### Storage & Retrieval

- **Postgres hybrid search improvements** — Better ltree taxonomy filtering
- **Local cross-encoder reranking** — FlashRank or sentence-transformers
- **Query expansion** — Automatic query reformulation
- **Incremental indexing** — Update without full re-ingestion

### Model Support

- **Streaming improvements** — Better handling of partial tokens
- **Multimodal embeddings** — Image + text embeddings
- **Cost tracking** — Per-request cost estimation

### New Connectors

- **Notion** — Pull from Notion workspaces
- **Slack** — Search Slack history
- **GitHub** — Index repository content
- **Confluence** — Enterprise wiki integration

## Mid-Term Goals

### Developer Experience

- **Playground UI** — Web-based testing interface
- **VS Code extension** — Inline documentation and snippets
- **Better error messages** — Actionable suggestions
- **Type stubs** — Full type coverage for IDE support

### RAG Improvements

- **Multi-hop reasoning** — Follow-up queries for complex questions
- **Confidence scoring** — Indicate certainty of answers
- **Source highlighting** — Show exactly which text was used
- **Answer comparison** — Multiple candidate responses

### Ingestion Enhancements

- **Parallel processing** — Multi-threaded chunk processing
- **Duplicate detection** — Cross-document deduplication
- **Change detection** — Only re-process modified sections
- **Format expansion** — DOCX, PPTX, HTML support

## Long-Term Vision

### Enterprise Features

| Feature | Description |
|---------|-------------|
| Multi-tenancy | Isolated knowledge bases per tenant |
| RBAC | Role-based access control |
| Audit logging | Full operation history |
| SSO integration | SAML, OIDC support |
| Data residency | Region-specific storage |

### Advanced Capabilities

| Feature | Description |
|---------|-------------|
| Multi-agent orchestration | Coordinated specialist agents |
| Autonomous planning | Break down complex tasks |
| Tool use | Function calling, API integrations |
| Memory systems | Long-term conversation memory |
| Self-improvement | Learn from feedback |

## Contributing

We welcome contributions! Areas marked with `NotImplementedError` are excellent starting points.

### High-Impact Areas

```
modules/connectors/      → New data sources
modules/providers/       → New storage backends  
modules/transformers/    → New data enrichment
cortex/nodes/           → New graph capabilities
```

### Getting Started

1. Fork the repository
2. Find a `NotImplementedError` stub
3. Implement the feature
4. Add tests
5. Submit a PR

See [CONTRIBUTING.md](https://github.com/ContextRouter/contextrouter/blob/main/CONTRIBUTING.md) for detailed guidelines.

## Release Cycle

| Type | Frequency | Examples |
|------|-----------|----------|
| **Patch** (0.10.x) | Weekly | Bug fixes, docs |
| **Minor** (0.x.0) | Monthly | New features |
| **Major** (x.0.0) | As needed | Breaking changes |

## Feedback

- **Feature requests** — [GitHub Issues](https://github.com/ContextRouter/contextrouter/issues)
- **Discussions** — [GitHub Discussions](https://github.com/ContextRouter/contextrouter/discussions)
- **Security issues** — security@contextrouter.dev
