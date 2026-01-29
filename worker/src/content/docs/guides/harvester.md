---
title: Harvester Guide
description: Configure data harvesting workflows with Temporal
---

# Harvester Guide

The Harvester module automates data collection from external sources, transforming raw data into normalized records via Temporal workflows.

## Architecture

Worker provides the **infrastructure** for harvesting. Business logic (transformers, source configs) lives in your **domain package** (e.g., ContextCommerce).

```
┌─────────────────────────────────────────────────────────────────┐
│                       Your Domain Package                        │
│                                                                 │
│  sources/         transformers/        models/                  │
│    supplier.toml    supplier.py          Product                │
│                                                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ registers activities
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ContextWorker                              │
│                                                                 │
│  harvester/                                                     │
│    workflow.py     ← HarvestWorkflow orchestration              │
│    activities.py   ← download_feed, parse_products, store       │
│                                                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │   Temporal   │
                         └──────────────┘
```

## Pipeline Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Fetch     │────►│  Transform  │────►│   Load      │────►│  Enrich     │
│  (Activity) │     │  (Activity) │     │  (Activity) │     │  (Optional) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. **Fetch** — Download data from source (HTTP, API, file)
2. **Transform** — Parse and normalize into standard format
3. **Load** — Insert/update records in database
4. **Enrich** — Trigger enrichment workflow (optional)

## HarvestWorkflow

```python
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class HarvestWorkflow:
    @workflow.run
    async def run(self, source_id: str, tenant_id: str) -> HarvestResult:
        # Step 1: Download data
        raw_data = await workflow.execute_activity(
            download_feed,
            source_id,
            start_to_close_timeout=timedelta(minutes=5),
        )
        
        # Step 2: Parse and transform
        records = await workflow.execute_activity(
            parse_records,
            raw_data,
            source_id,
            start_to_close_timeout=timedelta(minutes=10),
        )
        
        # Step 3: Store in database
        result = await workflow.execute_activity(
            store_records,
            records,
            tenant_id,
            start_to_close_timeout=timedelta(minutes=5),
        )
        
        # Step 4: Trigger enrichment (optional)
        if result.new_records > 0:
            await workflow.start_child_workflow(
                EnrichmentWorkflow.run,
                result.record_ids,
            )
        
        return result
```

## Activities

Activities contain the actual business logic:

```python
from temporalio import activity

@activity.defn
async def download_feed(source_id: str) -> bytes:
    """Download data from configured source."""
    source = await get_source_config(source_id)
    async with httpx.AsyncClient() as client:
        response = await client.get(source.url)
        return response.content

@activity.defn
async def parse_records(raw_data: bytes, source_id: str) -> list[dict]:
    """Parse using source-specific transformer."""
    transformer = get_transformer(source_id)
    return transformer.parse(raw_data)

@activity.defn
async def store_records(records: list[dict], tenant_id: str) -> StoreResult:
    """Upsert records into database."""
    created, updated, errors = 0, 0, 0
    
    for record in records:
        try:
            _, was_created = await upsert_record(tenant_id, record)
            if was_created:
                created += 1
            else:
                updated += 1
        except Exception as e:
            errors += 1
            activity.logger.error(f"Failed: {e}")
    
    return StoreResult(created=created, updated=updated, errors=errors)
```

## Running Harvester

### Via CLI

```bash
# Run worker with harvester agent
python -m contextworker --agents harvester

# Trigger specific source via Temporal CLI
temporal workflow start \
  --type HarvestWorkflow \
  --task-queue harvest-tasks \
  --input '["source-id", "tenant-id"]'
```

### Via Schedule

```bash
# Create harvest schedule
python -m contextworker.schedules create --tenant-id myproject

# Trigger immediately
python -m contextworker.schedules trigger harvest-source-myproject
```

## Configuration

### Source Config (TOML)

```toml
# config/sources/mysource.toml

[source]
id = "mysource"
name = "My Data Source"
format = "xlsx"  # or csv, json, api

[connection]
url = "https://example.com/data.xlsx"
# auth_type = "basic"  # optional
# username = "${MYSOURCE_USERNAME}"

[columns]
id = "ID"
name = "Name"
value = "Value"
```

### Environment Variables

```bash
# Temporal
TEMPORAL_HOST=localhost:7233

# Source credentials (from secrets manager)
MYSOURCE_USERNAME=...
MYSOURCE_PASSWORD=...

# General
HARVESTER_RETENTION_DAYS=30
```

## Adding a New Source

### Step 1: Create Config

```toml
# config/sources/newsource.toml
[source]
id = "newsource"
name = "New Source"
format = "xlsx"

[connection]
url = "https://newsource.com/data.xlsx"
```

### Step 2: Create Transformer (if needed)

```python
# your_package/transformers/newsource.py

from .base import BaseTransformer

class NewSourceTransformer(BaseTransformer):
    def transform(self, data: bytes) -> list[dict]:
        df = pd.read_excel(io.BytesIO(data))
        records = []
        for _, row in df.iterrows():
            records.append(self.normalize_row(row))
        return records
```

### Step 3: Register Transformer

```python
# your_package/registry.py

TRANSFORMERS = {
    "newsource": "your_package.transformers.newsource.NewSourceTransformer",
}
```

## Scheduling

### Temporal Native Schedules

```bash
# Create schedule for source
python -m contextworker.schedules create-harvest \
  --source-id newsource \
  --cron "0 6 * * *" \
  --tenant-id myproject
```

### Default Schedule Config

```python
ScheduleConfig(
    schedule_id="harvest-{source_id}-{tenant_id}",
    workflow_name="HarvestWorkflow",
    task_queue="harvest-tasks",
    cron="0 6 * * *",  # 6 AM daily
)
```

## Monitoring

### Temporal UI

Access at `http://localhost:8080` to:
- View running workflows
- Check execution history
- Retry failed activities

### Logs

```bash
# Worker logs
journalctl -u contextworker -f

# Specific workflow (via Temporal CLI)
temporal workflow show --workflow-id harvest-mysource-myproject
```

## Troubleshooting

### Fetch Failures
1. Check source URL accessibility
2. Verify authentication credentials
3. Check network/firewall settings

### Transform Errors
1. Verify column mappings
2. Check data format matches config
3. Review transformer logic

### Workflow Stuck
1. Check Temporal UI for errors
2. Review activity timeouts
3. Check retry policy configuration

## Next Steps

- [Agents Guide](/guides/agents/) — Background polling agents
- [Schedules Guide](/guides/schedules/) — Manage recurring jobs
