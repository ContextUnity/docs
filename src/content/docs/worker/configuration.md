---
title: Worker Configuration
description: Environment variables and settings for ContextWorker.
---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKER_PORT` | `50053` | gRPC server port |
| `TEMPORAL_HOST` | `localhost:7233` | Temporal server address |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `TEMPORAL_TASK_QUEUE` | `contextworker` | Temporal task queue name |
| `BRAIN_HOST` | `localhost:50051` | ContextBrain gRPC address |
| `ROUTER_HOST` | `localhost:50052` | ContextRouter gRPC address |

## Running

```bash
# Mode 1: gRPC service (receives workflow triggers)
uv run python -m contextworker

# Mode 2: Temporal worker (executes workflows)
uv run python -m contextworker --temporal

# Mode 2 with specific modules
uv run python -m contextworker --temporal --modules harvest gardener
```

## Prerequisites

- [Temporal Server](https://temporal.io/) running locally or in the cloud
- PostgreSQL (for Brain integration)
- ContextBrain service (for step recording)

### Quick Temporal Setup

```bash
# Start Temporal dev server
temporal server start-dev

# Temporal UI available at http://localhost:8233
```
