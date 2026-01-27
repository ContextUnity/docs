---
title: Getting Started
description: Install and configure ContextWorker
---

# Getting Started with ContextWorker

ContextWorker is the job runner and automation layer for the ContextUnity ecosystem. It provides reliable background job processing using Temporal workflows.

## Prerequisites

- Python 3.12+
- PostgreSQL database (shared with Commerce)
- Redis (shared queue with Router)
- Optional: Temporal server (for advanced workflows)

## Installation

### Using uv (recommended)

```bash
# Clone the repository
git clone https://github.com/ContextUnity/contextworker.git
cd contextworker

# Install dependencies (includes contextrouter as package)
uv sync

# Copy environment template
cp .env.example .env
```

### Using pip

```bash
pip install contextworker
```

This automatically installs `contextrouter` as a dependency.

## Configuration

Edit `.env` with your settings:

```bash
# Database (shared with Commerce)
DATABASE_URL=postgresql://user:pass@localhost/commerce

# Redis (shared queue with Router)
REDIS_URL=redis://localhost:6379

# Tenant
TENANT_ID=default

# Gardener settings
GARDENER_BATCH_SIZE=10
GARDENER_POLL_INTERVAL=60

# Prompts directory (commerce-specific)
PROMPTS_DIR=/path/to/commerce/prompts

# Optional: Temporal (for advanced workflows)
TEMPORAL_HOST=localhost:7233
TEMPORAL_NAMESPACE=contextworker
```

## Understanding the Architecture

ContextWorker imports ContextRouter as a **Python package**:

```python
# Worker imports Router directly
from contextrouter.cortex.graphs.commerce import build_commerce_graph
from contextrouter.cortex.queue import get_enrichment_queue
```

There is **no HTTP API** between Worker and Router. They share:
- **Redis queue** for product IDs to process
- **PostgreSQL database** for product data

```
┌────────────────────────────────────────────────────┐
│                    ContextWorker                    │
│                                                    │
│   from contextrouter.cortex.graphs.commerce        │
│   import build_commerce_graph                       │
│                                                    │
│   graph = build_commerce_graph()                    │
│   result = await graph.ainvoke({...})              │
│                                                    │
└────────────────────────────────────────────────────┘
           │                    │
           │ enqueue           │ ainvoke
           ▼                    ▼
     ┌──────────┐        ┌──────────────────┐
     │  Redis   │        │ CommerceGraph    │
     │  Queue   │        │  └── gardener    │
     └──────────┘        │  └── lexicon     │
                         │  └── matcher     │
                         └──────────────────┘
```

## Running the Worker

### Start Harvester Scheduler

```bash
# Start the scheduler (enqueues products periodically)
python -m contextworker scheduler

# Or using mise
mise run scheduler
```

### Run Gardener Manually

```bash
# Process pending products
mise run gardener

# With custom batch size
python -m contextworker gardener --batch-size 20
```

### Run Harvester Jobs

```bash
# Run all suppliers
mise run harvest_all

# Run specific supplier
mise run harvest_vysota
```

## Directory Structure

```
contextworker/
├── src/contextworker/
│   ├── __init__.py
│   ├── __main__.py           # CLI entry point
│   ├── config.py             # Configuration
│   ├── worker.py             # Temporal worker (optional)
│   ├── workflows.py          # Workflow definitions
│   ├── activities.py         # Activity implementations
│   ├── agents/               # Agent wrappers
│   │   ├── harvester.py      # Harvester agent
│   │   └── lexicon.py        # Lexicon agent
│   └── harvester/            # Harvester module
│       ├── orchestrator.py
│       ├── scheduler.py      # Enqueues to Redis
│       └── suppliers/
├── .env.example
├── .mise.toml                # Task runner
└── pyproject.toml
```

## Next Steps

- [Configure Harvester](/guides/harvester/) - Set up data collection
- [Gardener Agent](/guides/gardener/) - Product enrichment
- [Build Workflows](/guides/workflows/) - Custom Temporal workflows
