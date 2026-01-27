---
title: Gardener Integration
description: Running the Gardener product enrichment workflow
---

# Gardener Integration

Gardener is a product enrichment workflow that runs on Worker infrastructure. The actual module lives in **ContextCommerce**.

> For module implementation details, see [Commerce Gardener Module](/commerce/modules/gardener/).

## Overview

Worker discovers and runs the Gardener module from Commerce:

```
Worker (infrastructure)          Commerce (modules)
       │                              │
       │  discovers                   │
       └──────────────────────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  Gardener    │
            │  Workflow    │
            └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  Temporal    │
            │  Task Queue  │
            └──────────────┘
```

## Running

### Start Worker

```bash
# All modules
python -m contextworker

# Gardener only
python -m contextworker --modules gardener
```

### Schedules

```bash
# Create schedules
python -m contextworker.schedules create --tenant-id myproject

# List schedules
python -m contextworker.schedules list

# Pause/unpause
python -m contextworker.schedules pause gardener-every-5min-myproject
python -m contextworker.schedules unpause gardener-every-5min-myproject

# Delete
python -m contextworker.schedules delete gardener-every-5min-myproject
```

### Manual Trigger

```bash
# Via Temporal CLI
temporal workflow start \
  --type GardenerWorkflow \
  --task-queue gardener-tasks \
  --input '["myproject", 50]'
```

## Temporal Web UI

Monitor workflows at:

```
http://localhost:8233
```

## Configuration

| Variable | Description |
|----------|-------------|
| `TEMPORAL_HOST` | Temporal server (default: localhost:7233) |
| `DATABASE_URL` | PostgreSQL connection |
| `TENANT_ID` | Default tenant ID |

## Troubleshooting

### Module Not Found

```
No modules discovered!
```

Check that Commerce is installed:

```bash
pip list | grep contextcommerce
```

### Workflow Stuck

Check Temporal UI for workflow status and errors.

## Next Steps

- [Harvester Guide](/guides/harvester/) - Vendor data import
- [Schedules Guide](/guides/schedules/) - Manage all schedules
