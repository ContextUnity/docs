---
title: Temporal Workflows
description: Understanding Temporal workflow execution in ContextWorker
---

# Temporal Workflows

ContextWorker uses [Temporal](https://temporal.io/) for durable, fault-tolerant workflow execution. This guide explains how workflows work and why they're powerful.

## Why Temporal?

### The Problem with Background Jobs

Traditional background jobs (Celery, RQ, cron) have critical weaknesses:

- **State loss** — server restart = lost job state
- **No guaranteed execution** — network blip = silent failure  
- **Complex retry logic** — each job needs custom error handling
- **No visibility** — "is the job running?" requires custom dashboards

### Temporal's Solution

Temporal treats workflows as **durable functions**:

```python
@workflow.defn
class HarvestWorkflow:
    @workflow.run
    async def run(self, source_id: str) -> Result:
        # This function survives server restarts!
        # Each step is automatically persisted
        
        data = await workflow.execute_activity(download_data, source_id)
        records = await workflow.execute_activity(parse_data, data)
        result = await workflow.execute_activity(store_records, records)
        
        return result
```

If worker crashes at step 2, Temporal **resumes from step 2** — not from the beginning.

## Core Concepts

### Workflows

Workflows are the **orchestration layer**. They:
- Define the sequence of steps
- Handle branching logic
- Coordinate multiple activities
- **Must be deterministic** (no random, no datetime.now())

```python
@workflow.defn
class OrderWorkflow:
    @workflow.run
    async def run(self, order_id: str) -> OrderResult:
        # Step 1: Validate
        order = await workflow.execute_activity(validate_order, order_id)
        
        # Step 2: Process payment
        payment = await workflow.execute_activity(charge_payment, order)
        
        # Step 3: Notify (parallel)
        await asyncio.gather(
            workflow.execute_activity(send_email, order),
            workflow.execute_activity(send_sms, order),
        )
        
        return OrderResult(success=True)
```

### Activities

Activities are **side-effect functions**. They:
- Make HTTP requests
- Access databases
- Call external APIs
- **Can be retried automatically**

```python
@activity.defn
async def download_data(source_id: str) -> bytes:
    """Activity with side effects — HTTP call."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.example.com/{source_id}")
        return response.content

@activity.defn
async def store_records(records: list[dict]) -> int:
    """Activity with side effects — database write."""
    created = 0
    for record in records:
        await Record.objects.create(**record)
        created += 1
    return created
```

### Task Queues

Workers listen to **task queues** for work:

```python
# Worker listens to specific queue
worker = Worker(
    client,
    task_queue="harvest-tasks",  # ← Queue name
    workflows=[HarvestWorkflow],
    activities=[download_data, parse_data, store_records],
)
```

Different queues for different workloads:
- `harvest-tasks` — data import jobs
- `enrichment-tasks` — AI processing
- `sync-tasks` — external sync

## Workflow Patterns

### Sequential Execution

```python
@workflow.run
async def run(self):
    step1 = await workflow.execute_activity(activity1)
    step2 = await workflow.execute_activity(activity2, step1)
    step3 = await workflow.execute_activity(activity3, step2)
    return step3
```

### Parallel Execution

```python
@workflow.run
async def run(self):
    results = await asyncio.gather(
        workflow.execute_activity(activity1),
        workflow.execute_activity(activity2),
        workflow.execute_activity(activity3),
    )
    return results
```

### Child Workflows

```python
@workflow.run
async def run(self, item_ids: list[str]):
    # Process each item in separate workflow
    for item_id in item_ids:
        await workflow.start_child_workflow(
            ProcessItemWorkflow.run,
            item_id,
        )
```

### Error Handling & Retries

```python
@workflow.run
async def run(self):
    try:
        result = await workflow.execute_activity(
            risky_activity,
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=workflow.RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(seconds=1),
                backoff_coefficient=2.0,  # Exponential backoff
            ),
        )
    except ActivityError as e:
        # Handle failure after all retries exhausted
        await workflow.execute_activity(notify_failure, str(e))
        raise
```

## Timeouts

Always set appropriate timeouts:

```python
await workflow.execute_activity(
    my_activity,
    # Maximum time for activity to complete (including retries)
    schedule_to_close_timeout=timedelta(hours=1),
    # Maximum time for single attempt
    start_to_close_timeout=timedelta(minutes=5),
)
```

## Workflow State

Workflows can have state and signals:

```python
@workflow.defn
class LongRunningWorkflow:
    def __init__(self):
        self.status = "pending"
        self.progress = 0
    
    @workflow.run
    async def run(self):
        self.status = "running"
        for i in range(100):
            await workflow.execute_activity(process_batch, i)
            self.progress = i + 1
        self.status = "completed"
    
    @workflow.query
    def get_status(self) -> dict:
        return {"status": self.status, "progress": self.progress}
    
    @workflow.signal
    async def cancel(self):
        self.status = "cancelled"
        raise workflow.CancelledError()
```

## Testing Workflows

```python
from temporalio.testing import WorkflowEnvironment

async def test_harvest_workflow():
    # Time-skipping environment (fast tests!)
    async with WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue="test",
            workflows=[HarvestWorkflow],
            activities=[download_data, parse_data, store_records],
        ):
            result = await env.client.execute_workflow(
                HarvestWorkflow.run,
                "test-source",
                task_queue="test",
            )
            
            assert result.records_created > 0
```

## Determinism Rules

Workflows MUST be deterministic. Avoid:

```python
# ❌ FORBIDDEN in workflows
import random
random.choice([1, 2, 3])  # Non-deterministic!

from datetime import datetime
datetime.now()  # Non-deterministic!

import uuid
uuid.uuid4()  # Non-deterministic!
```

Use Temporal's deterministic alternatives:

```python
# ✅ CORRECT
workflow.random().choice([1, 2, 3])
workflow.now()
workflow.uuid4()
```

## Temporal UI

Monitor workflows at `http://localhost:8080`:

- View running/completed workflows
- Inspect execution history
- Retry failed activities
- Cancel stuck workflows

## Next Steps

- [Schedules Guide](/guides/schedules/) — Recurring workflows
- [CLI Reference](/reference/cli/) — Command-line usage
- [Temporal Docs](https://docs.temporal.io/) — Official documentation
