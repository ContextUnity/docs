---
title: Quick Start
description: Install ContextUnity services and run your first agent.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

## Prerequisites

- Python **3.13+**
- PostgreSQL **16+** with `vector` and `ltree` extensions
- [uv](https://docs.astral.sh/uv/) package manager
- [Temporal Server](https://temporal.io/) (for ContextWorker)

## 1. Install ContextCore

ContextCore is the shared kernel — install it first.

```bash
pip install contextcore
```

Or add as a dependency in your project:

```bash
uv add contextcore
```

## 2. Set Up ContextBrain

ContextBrain provides the knowledge store.

```bash
# Clone and install
git clone https://github.com/ContextUnity/contextbrain.git
cd contextbrain
uv sync

# Create database
createdb brain
psql brain -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql brain -c "CREATE EXTENSION IF NOT EXISTS ltree;"

# Configure
export BRAIN_DATABASE_URL="postgres://user:pass@localhost:5432/brain"
export BRAIN_PORT=50051
export EMBEDDER_TYPE="openai"       # or "local" for SentenceTransformers
export OPENAI_API_KEY="sk-..."      # required for OpenAI embeddings
export PGVECTOR_DIM=1536            # 1536 for OpenAI, 768 for local

# Initialize schema and start
uv run python scripts/init_db.py
uv run python -m contextbrain
```

## 3. Set Up ContextRouter

ContextRouter is the agent gateway.

```bash
git clone https://github.com/ContextUnity/contextrouter.git
cd contextrouter
uv sync

# Configure
export ROUTER_PORT=50052
export BRAIN_HOST="localhost:50051"
export OPENAI_API_KEY="sk-..."

# Start
uv run python -m contextrouter
```

## 4. Your First Query

Once Brain and Router are running, connect from any Python script:

```python
from contextcore import ContextUnit, create_channel_sync
from contextcore import router_pb2, router_pb2_grpc

# Connect to Router
channel = create_channel_sync("localhost:50052")
stub = router_pb2_grpc.RouterServiceStub(channel)

# Send a query
unit = ContextUnit(
    payload={"query": "What is retrieval-augmented generation?"},
    provenance=["client:quickstart"],
)

response = stub.Route(unit.to_protobuf(router_pb2))
print(response)
```

## 5. Add ContextWorker (Optional)

For background jobs and scheduled tasks:

```bash
# Install and start Temporal (if not running)
temporal server start-dev

# Clone and install Worker
git clone https://github.com/ContextUnity/contextworker.git
cd contextworker
uv sync

# Configure
export WORKER_PORT=50053
export TEMPORAL_HOST="localhost:7233"

# Start
uv run python -m contextworker
```

## What's Next?

- [Architecture](/architecture/) — understand how services communicate
- [ContextUnit Protocol](/concepts/contextunit/) — the universal data envelope
- [ContextToken Security](/concepts/contexttoken/) — capability-based authorization
- [ContextRouter Agents](/router/agents/) — build multi-step reasoning agents
- [ContextBrain RAG](/brain/rag/) — configure retrieval-augmented generation
