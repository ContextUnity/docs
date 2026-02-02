---
title: Gardener Integration
description: Running the Gardener AI enrichment workflow
---

# Gardener Integration

Gardener is an AI-powered enrichment workflow that classifies and enriches records using ContextRouter's agent graphs.

> **Note:** Gardener is an example integration pattern. Your domain package (e.g., Commerce) defines the actual enrichment logic.

## Overview

Worker provides infrastructure for running enrichment workflows:

```
┌─────────────────────────────────────────────────────────────────┐
│                       ContextRouter                             │
│                   (AI Agent Orchestration)                      │
│                                                                 │
│  cortex/graphs/                                                 │
│    enrichment/    ← AI classification graphs                    │
│                                                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ called by
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ContextWorker                             │
│                                                                 │
│  agents/                                                        │
│    gardener.py    ← Polling agent (polls for pending items)     │
│                                                                 │
│  workflows/                                                     │
│    enrichment.py  ← Temporal workflow (batch processing)        │
│                                                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ reads/writes
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Your Domain Package                          │
│                                                                 │
│  models/                                                        │
│    Record          ← Records to enrich                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Running

### Start Worker with Gardener Agent

```bash
# All agents
python -m contextworker

# Gardener only
python -m contextworker --agents gardener
```

### Schedules

```bash
# Create enrichment schedule
python -m contextworker.schedules create --tenant-id myproject

# List schedules
python -m contextworker.schedules list

# Pause/unpause
python -m contextworker.schedules pause gardener-every-5min-myproject
python -m contextworker.schedules unpause gardener-every-5min-myproject

# Trigger immediately
python -m contextworker.schedules trigger gardener-every-5min-myproject
```

### Manual Trigger (Temporal CLI)

```bash
temporal workflow start \
  --type EnrichmentWorkflow \
  --task-queue enrichment-tasks \
  --input '["tenant-id", 50]'
```

## Enrichment Workflow

```python
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class EnrichmentWorkflow:
    @workflow.run
    async def run(self, tenant_id: str, batch_size: int = 50) -> EnrichmentResult:
        # Step 1: Get pending records
        record_ids = await workflow.execute_activity(
            get_pending_records,
            tenant_id,
            batch_size,
            start_to_close_timeout=timedelta(minutes=2),
        )
        
        if not record_ids:
            return EnrichmentResult(processed=0, failed=0)
        
        # Step 2: Enrich via Router
        result = await workflow.execute_activity(
            enrich_records,
            record_ids,
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=workflow.RetryPolicy(maximum_attempts=3),
        )
        
        return result
```

## Gardener Polling Agent

```python
@register("gardener")
class GardenerAgent(BaseAgent):
    name = "gardener"
    
    async def run(self):
        while self._running:
            try:
                # Check for pending records
                pending = await self.count_pending()
                
                if pending > 0:
                    logger.info(f"Found {pending} pending records")
                    await self.trigger_enrichment()
                
                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                logger.error(f"Gardener error: {e}")
                await asyncio.sleep(300)
    
    async def trigger_enrichment(self):
        """Start enrichment workflow via Temporal."""
        client = await get_temporal_client()
        await client.start_workflow(
            EnrichmentWorkflow.run,
            args=[self.config.get("tenant_id", "default"), 50],
            task_queue="enrichment-tasks",
            id=f"gardener-{datetime.now().isoformat()}",
        )
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `TEMPORAL_HOST` | Temporal server | `localhost:7233` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `TENANT_ID` | Default tenant ID | `default` |
| `GARDENER_BATCH_SIZE` | Records per batch | `50` |
| `GARDENER_POLL_INTERVAL` | Seconds between polls | `300` |

## Temporal UI

Monitor workflows at:

```
http://localhost:8080
```

- View running enrichment workflows
- Check processing statistics
- Retry failed activities

## Troubleshooting

### No Records Found

```
Found 0 pending records
```

- Verify database connection
- Check `enrichment_status` field in your records
- Ensure tenant ID is correct

### Router Errors

```
Failed to call Router graph: Connection refused
```

- Verify ContextRouter is running
- Check Router gRPC endpoint configuration
- Review Router logs for errors

### Workflow Stuck

1. Check Temporal UI for workflow status
2. Review activity execution history
3. Check for timeout issues

## Next Steps

- [Harvester Guide](/guides/harvester/) — Data import workflows
- [Schedules Guide](/guides/schedules/) — Manage recurring jobs
- [Agents Guide](/guides/agents/) — Create custom agents
