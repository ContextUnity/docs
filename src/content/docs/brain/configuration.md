---
title: Brain Configuration
description: Environment variables and settings for ContextBrain.
---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BRAIN_DATABASE_URL` | — | PostgreSQL connection string (required) |
| `BRAIN_PORT` | `50051` | gRPC server port |
| `BRAIN_SCHEMA` | `brain` | PostgreSQL schema name |
| `BRAIN_TENANTS` | — | Comma-separated list of allowed tenants |
| `BRAIN_NEWS_ENGINE` | `false` | Enable news engine tables |
| `EMBEDDER_TYPE` | auto | `openai` or `local` (auto-selects based on API key) |
| `PGVECTOR_DIM` | `1536` | Vector dimensions (must match embedder) |
| `OPENAI_API_KEY` | — | Required for OpenAI embeddings |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |

## Database Setup

```bash
# Create database
createdb brain

# Enable required extensions
psql brain -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql brain -c "CREATE EXTENSION IF NOT EXISTS ltree;"

# Initialize schema
uv run python scripts/init_db.py
```

:::caution[Dimension Mismatch]
Database schema must match embedding dimensions:
- OpenAI `text-embedding-3-small` → 1536 dims
- OpenAI `text-embedding-3-large` → 3072 dims
- Local SentenceTransformers → 768 dims

After changing embedder, run `uv run alembic upgrade head`.
:::

## Running

```bash
# Start gRPC server
uv run python -m contextbrain
```

## Database Roles

| Role | RLS | Purpose |
|------|-----|---------|
| `brain_app` | Enforced | Used by ContextBrain service |
| `brain_admin` | Bypassed | Used by ContextView dashboard |

The `brain_app` role has Row-Level Security enforced. Wildcard `'*'` tenant is available for admin access via ContextView.
