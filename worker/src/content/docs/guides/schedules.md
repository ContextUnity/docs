---
title: Schedule Management
description: Managing Temporal schedules in ContextWorker
---

ContextWorker uses Temporal's native scheduling for recurring workflows. This guide covers creating, managing, and monitoring schedules.

## Quick Start

```bash
# Create default schedules for a tenant
python -m contextworker.schedules create --tenant-id myproject

# List all schedules
python -m contextworker.schedules list

# Trigger a schedule immediately
python -m contextworker.schedules trigger harvest-camping-trade
```

## CLI Commands

### Create Schedules

```bash
# Create default schedules for tenant
python -m contextworker.schedules create --tenant-id myproject

# Creates:
# - harvester-daily-myproject (6 AM)
# - gardener-every-5min-myproject
```

### List Schedules

```bash
python -m contextworker.schedules list
```

Output:
```
Schedule ID                          State     Next Run
─────────────────────────────────────────────────────────
harvester-daily-myproject            running   2026-01-30 06:00:00
gardener-every-5min-myproject        running   2026-01-29 15:35:00
sync-horoshop-myproject              paused    -
```

### Pause/Unpause

```bash
# Pause a schedule
python -m contextworker.schedules pause gardener-every-5min-myproject

# Unpause
python -m contextworker.schedules unpause gardener-every-5min-myproject
```

### Trigger Immediately

```bash
python -m contextworker.schedules trigger harvest-camping-trade
```

### Delete Schedule

```bash
python -m contextworker.schedules delete my-old-schedule
```

## Default Schedules

```python
DEFAULT_SCHEDULES = [
    ScheduleConfig(
        schedule_id="harvester-daily",
        workflow_name="HarvestWorkflow",
        task_queue="harvest-tasks",
        cron="0 6 * * *",  # 6 AM daily
        description="Daily harvest of all suppliers",
    ),
    ScheduleConfig(
        schedule_id="gardener-every-5min",
        workflow_name="GardenerWorkflow",
        task_queue="gardener-tasks",
        cron="*/5 * * * *",  # Every 5 minutes
        description="Enrich pending products",
    ),
]
```

## Cron Syntax

Standard cron format: `minute hour day month weekday`

| Pattern | Description |
|---------|-------------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 6 * * *` | 6 AM daily |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 0` | Midnight Sunday |
| `0 6 * * 1-5` | 6 AM weekdays |

## Programmatic API

### Create Schedule

```python
from contextworker.schedules import create_schedule, ScheduleConfig
from temporalio.client import Client

client = await Client.connect("localhost:7233")

config = ScheduleConfig(
    schedule_id="my-custom-schedule",
    workflow_name="MyWorkflow",
    workflow_class=MyWorkflow,
    task_queue="my-tasks",
    cron="0 */6 * * *",  # Every 6 hours
    args=["arg1", "arg2"],
    description="My custom scheduled workflow",
)

await create_schedule(client, config, tenant_id="myproject")
```

### List Schedules

```python
from contextworker.schedules import list_schedules

schedules = await list_schedules(client)
for s in schedules:
    print(f"{s.id}: {s.info.next_action_time}")
```

### Pause/Unpause

```python
from contextworker.schedules import pause_schedule, unpause_schedule

await pause_schedule("my-schedule", client)
await unpause_schedule("my-schedule", client)
```

### Delete Schedule

```python
from contextworker.schedules import delete_schedule

await delete_schedule("my-schedule", client)
```

## Adding a New Default Schedule

### Step 1: Define in schedules.py

```python
DEFAULT_SCHEDULES = [
    # ... existing ...
    ScheduleConfig(
        schedule_id="my-new-schedule",
        workflow_name="MyWorkflow",
        workflow_class=None,  # Set at runtime
        task_queue="my-tasks",
        cron="*/30 * * * *",  # Every 30 minutes
        args=[],
        description="Run MyWorkflow every 30 minutes",
    ),
]
```

### Step 2: Link Workflow Class

In `create_schedule()`, add workflow class mapping:

```python
if config.workflow_name == "MyWorkflow":
    from .workflows.myworkflow import MyWorkflow
    config.workflow_class = MyWorkflow
```

### Step 3: Create Schedules

```bash
python -m contextworker.schedules create --tenant-id myproject
```

## Temporal UI

Temporal provides a web UI for monitoring schedules:

```bash
# Start Temporal with UI
docker run -d -p 7233:7233 -p 8080:8080 temporalio/auto-setup:latest
```

Access at http://localhost:8080 → Schedules tab.

## Best Practices

1. **Use descriptive schedule IDs** — include tenant, workflow type
2. **Set appropriate intervals** — balance freshness vs. resource usage
3. **Monitor in Temporal UI** — check for failures, delays
4. **Test with trigger** — verify workflow works before scheduling
5. **Pause during maintenance** — prevent jobs during updates
