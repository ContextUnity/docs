---
title: CLI Reference
description: ContextWorker command-line interface
---

# CLI Reference

ContextWorker provides a powerful CLI for running workers, managing schedules, and controlling workflows.

## Main Entry Point

```bash
python -m contextworker [OPTIONS]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--agents` | Specific agents to run | All registered |
| `--temporal-host` | Temporal server address | `localhost:7233` |
| `--task-queue` | Task queue name | `default` |
| `--max-concurrent` | Max parallel activities | `10` |
| `--log-level` | Logging level | `INFO` |

### Examples

```bash
# Run all registered agents
python -m contextworker

# Run specific agents
python -m contextworker --agents gardener harvester

# Custom Temporal host
python -m contextworker --temporal-host temporal.mycompany.com:7233

# Debug logging
python -m contextworker --log-level DEBUG

# Production with limits
python -m contextworker --max-concurrent 20 --task-queue production
```

## Schedule Management

```bash
python -m contextworker.schedules [COMMAND] [OPTIONS]
```

### Commands

#### `create`

Create default schedules for a tenant:

```bash
python -m contextworker.schedules create --tenant-id myproject

# Output:
# Created schedule: harvester-daily-myproject
# Created schedule: gardener-every-5min-myproject
```

#### `list`

List all schedules:

```bash
python -m contextworker.schedules list

# Output:
# Schedule ID                          State     Cron            Next Run
# ─────────────────────────────────────────────────────────────────────────
# harvester-daily-myproject            running   0 6 * * *       2026-01-30 06:00
# gardener-every-5min-myproject        running   */5 * * * *     2026-01-29 15:40
# sync-hourly-myproject                paused    0 * * * *       -
```

#### `pause`

Pause a schedule:

```bash
python -m contextworker.schedules pause gardener-every-5min-myproject

# Output:
# Paused schedule: gardener-every-5min-myproject
```

#### `unpause`

Resume a paused schedule:

```bash
python -m contextworker.schedules unpause gardener-every-5min-myproject

# Output:
# Unpaused schedule: gardener-every-5min-myproject
```

#### `trigger`

Trigger a schedule immediately (outside of cron):

```bash
python -m contextworker.schedules trigger harvester-daily-myproject

# Output:
# Triggered schedule: harvester-daily-myproject
# Workflow ID: harvester-daily-myproject-2026-01-29T15:35:00
```

#### `delete`

Delete a schedule:

```bash
python -m contextworker.schedules delete old-schedule-id

# Output:
# Deleted schedule: old-schedule-id
```

### Schedule Options

| Flag | Description | Default |
|------|-------------|---------|
| `--temporal-host` | Temporal server | `TEMPORAL_HOST` env |
| `--tenant-id` | Tenant identifier | `TENANT_ID` env |

## gRPC Service

```bash
python -m contextworker.service [OPTIONS]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--port` | gRPC service port | `50052` |
| `--host` | Bind address | `0.0.0.0` |
| `--temporal-host` | Temporal server | `localhost:7233` |

### Examples

```bash
# Start gRPC service
python -m contextworker.service

# Custom port
python -m contextworker.service --port 9090

# Production
python -m contextworker.service --port 50052 --temporal-host temporal:7233
```

## Temporal CLI Integration

ContextWorker integrates with Temporal's native CLI:

### Start Workflow Manually

```bash
temporal workflow start \
  --type HarvestWorkflow \
  --task-queue harvest-tasks \
  --input '["source-id", "tenant-id"]'
```

### Check Workflow Status

```bash
temporal workflow show \
  --workflow-id harvester-mysource-myproject
```

### List Running Workflows

```bash
temporal workflow list --query 'ExecutionStatus="Running"'
```

### Cancel Workflow

```bash
temporal workflow cancel --workflow-id stuck-workflow-id
```

### Terminate Workflow (Force)

```bash
temporal workflow terminate --workflow-id broken-workflow-id
```

## Environment Variables

All CLI commands respect these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `TEMPORAL_HOST` | Temporal server | `localhost:7233` |
| `DATABASE_URL` | PostgreSQL connection | `postgres://...` |
| `TENANT_ID` | Default tenant | `myproject` |
| `WORKER_TASK_QUEUE` | Default queue | `default` |
| `WORKER_MAX_CONCURRENT` | Parallel limit | `10` |
| `LOG_LEVEL` | Logging | `INFO` |

### Using with Docker

```bash
docker run -e TEMPORAL_HOST=temporal:7233 \
           -e DATABASE_URL=postgres://... \
           -e TENANT_ID=myproject \
           contextworker:latest
```

### Using with mise

```toml
# .mise.toml

[env]
TEMPORAL_HOST = "localhost:7233"
TENANT_ID = "myproject"

[tasks.worker]
run = "python -m contextworker"

[tasks.schedules-list]
run = "python -m contextworker.schedules list"

[tasks.schedules-create]
run = "python -m contextworker.schedules create --tenant-id $TENANT_ID"
```

```bash
mise run worker
mise run schedules-list
mise run schedules-create
```

## Common Patterns

### Development Workflow

```bash
# Terminal 1: Start Temporal
docker-compose up temporal

# Terminal 2: Start Worker
python -m contextworker --log-level DEBUG

# Terminal 3: Trigger workflows
python -m contextworker.schedules trigger my-schedule
```

### Production Deployment

```bash
# Create schedules once
python -m contextworker.schedules create --tenant-id production

# Run multiple workers (scale)
python -m contextworker --task-queue production &
python -m contextworker --task-queue production &
python -m contextworker --task-queue production &
```

### Debugging

```bash
# Check agent registration
python -c "from contextworker.registry import list_agents; print(list_agents())"

# Check Temporal connection
temporal operator namespace describe default

# View workflow history
temporal workflow show --workflow-id my-workflow-id
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Configuration error |
| `3` | Connection error (Temporal/DB) |

## Next Steps

- [Workflows Guide](/guides/workflows/) — Understanding Temporal workflows
- [Schedules Guide](/guides/schedules/) — Schedule configuration
- [gRPC Guide](/guides/grpc/) — Service integration
