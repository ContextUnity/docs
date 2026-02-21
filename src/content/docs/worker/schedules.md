---
title: Schedules
description: Cron-based scheduled tasks management in ContextWorker.
---

ContextWorker manages recurring jobs via Temporal schedules in `schedules.py`.

## Schedule Management

```python
from contextworker.schedules import ScheduleManager

manager = ScheduleManager(client)

# Create a schedule
await manager.create_schedule(
    schedule_id="harvest-daily",
    workflow_type="harvest",
    cron="0 6 * * *",  # Daily at 6 AM
    payload={"supplier_code": "camping-trade"},
)

# List active schedules
schedules = await manager.list_schedules()

# Pause/resume
await manager.pause_schedule("harvest-daily")
await manager.resume_schedule("harvest-daily")

# Delete
await manager.delete_schedule("harvest-daily")
```

## Common Schedule Patterns

| Schedule | Cron | Purpose |
|----------|------|---------|
| Harvest | `0 6 * * *` | Daily supplier data import |
| Enrichment | `0 */4 * * *` | Every 4 hours product enrichment |
| Brain Sync | `0 2 * * *` | Nightly product → Brain sync |
| Retention | `0 0 * * 0` | Weekly data cleanup |
