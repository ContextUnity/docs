---
title: Getting Started
description: Install and configure ContextWorker
---

# Getting Started with ContextWorker

ContextWorker is the job runner and automation layer for the ContextUnity ecosystem. It provides reliable background job processing using Temporal workflows.

## Prerequisites

- Python 3.12+
- PostgreSQL database
- Temporal server (local or cloud)
- Optional: Redis for caching

## Installation

### Using uv (recommended)

```bash
# Clone the repository
git clone https://github.com/ContextUnity/contextworker.git
cd contextworker

# Install dependencies
uv sync

# Copy environment template
cp .env.example .env
```

### Using pip

```bash
pip install contextworker
```

## Configuration

Edit `.env` with your settings:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/harvester

# Temporal
TEMPORAL_HOST=localhost:7233
TEMPORAL_NAMESPACE=contextworker

# Router Integration
ROUTER_URL=http://localhost:8000
ROUTER_API_KEY=your-api-key

# Notifications (optional)
MAILGUN_API_KEY=your-key
MAILGUN_DOMAIN=your-domain
```

## Running the Worker

### Start Temporal Worker

```bash
# Start the worker process
python -m contextworker worker

# Or using mise
mise run worker
```

### Run Harvester Jobs

```bash
# Run all suppliers
mise run harvest_all

# Run specific supplier
mise run harvest_vysota

# Trigger via CLI
python -m contextworker harvest --supplier vysota
```

### Run Gardener Enrichment

```bash
# Process pending products
mise run gardener

# Or via CLI
python -m contextworker gardener --batch-size 10
```

## Directory Structure

```
contextworker/
├── src/contextworker/
│   ├── __init__.py
│   ├── __main__.py          # CLI entry point
│   ├── worker.py             # Temporal worker
│   ├── workflows.py          # Workflow definitions
│   ├── activities.py         # Activity implementations
│   ├── config.py             # Configuration
│   ├── agents/               # Agent integrations
│   │   ├── harvester.py
│   │   └── lexicon.py
│   └── harvester/            # Harvester module
│       ├── orchestrator.py
│       ├── scheduler.py
│       └── suppliers/
├── .env.example
├── .mise.toml                # Task runner
└── pyproject.toml
```

## Next Steps

- [Configure Harvester](/guides/harvester/) - Set up data collection
- [Build Workflows](/guides/workflows/) - Create custom Temporal workflows
- [Gardener Agent](/guides/gardener/) - Product enrichment with AI
