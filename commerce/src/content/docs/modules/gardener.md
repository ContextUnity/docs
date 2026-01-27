---
title: Gardener Module
description: Product enrichment via AI classification
---

# Gardener Module

Gardener is a Temporal workflow that enriches products with taxonomy classification, NER, and knowledge graph data. It runs on **ContextWorker** infrastructure.

## Architecture

```
modules/gardener/
    workflow.py     → Temporal workflow
    activities.py   → Django ORM + graph calls
         │
         │ calls
         ▼
graphs/commerce/
    gardener/       → LangGraph subgraph (AI classification)
         │
         │ uses
         ▼
harvester/models.py → Django ORM (DealerProduct)
```

## Workflow

### GardenerWorkflow

```python
@workflow.defn
class GardenerWorkflow:
    @workflow.run
    async def run(self, tenant_id: str, batch_size: int = 50):
        while True:
            # 1. Poll pending products
            pending = await poll_pending_products(tenant_id, batch_size)
            
            if not pending["product_ids"]:
                break
            
            # 2. Call Commerce graph
            enrichment = await call_gardener_graph(
                pending["product_ids"], 
                tenant_id
            )
            
            # 3. Update products
            for product_id in pending["product_ids"]:
                await update_product_enrichment(
                    product_id, 
                    tenant_id,
                    enrichment.get(str(product_id), {})
                )
```

### Activities

| Activity | Description | Uses |
|----------|-------------|------|
| `poll_pending_products` | Find products with status='raw' | Django ORM |
| `call_gardener_graph` | Invoke Commerce graph | LangGraph |
| `update_product_enrichment` | Write results to DB | Django ORM |

## Django ORM

Activities use Django ORM for database access:

```python
@activity.defn
async def poll_pending_products(tenant_id: str, batch_size: int):
    from harvester.models import DealerProduct
    from asgiref.sync import sync_to_async
    
    @sync_to_async
    def get_pending():
        return list(
            DealerProduct.objects
            .filter(status__in=['raw', 'enriching'])
            .order_by('created_at')
            .values_list('id', flat=True)[:batch_size]
        )
    
    product_ids = await get_pending()
    return {"product_ids": product_ids, "count": len(product_ids)}
```

## Graph Integration

Direct import of Commerce graphs:

```python
@activity.defn
async def call_gardener_graph(product_ids: List[int], tenant_id: str):
    from graphs.commerce import build_commerce_graph
    
    graph = build_commerce_graph()
    result = await graph.ainvoke({
        "intent": "enrich",
        "tenant_id": tenant_id,
        "product_ids": product_ids,
    })
    
    return {
        "results": result.get("enrichment_results", {}),
        "errors": result.get("errors", {}),
    }
```

## Registration

```python
# modules/gardener/__init__.py

from .workflow import GardenerWorkflow
from .activities import (
    poll_pending_products,
    call_gardener_graph,
    update_product_enrichment,
)

TASK_QUEUE = "gardener-tasks"

def register(registry):
    """Register Gardener module with Worker."""
    registry.register(
        name="gardener",
        queue=TASK_QUEUE,
        workflows=[GardenerWorkflow],
        activities=[
            poll_pending_products,
            call_gardener_graph,
            update_product_enrichment,
        ],
    )
```

## Running

```bash
# Start Worker (discovers Gardener automatically)
python -m contextworker

# Or only Gardener
python -m contextworker --modules gardener
```

## Schedules

```bash
# Create (runs every 5 minutes)
python -m contextworker.schedules create --tenant-id myproject

# List
python -m contextworker.schedules list

# Pause
python -m contextworker.schedules pause gardener-every-5min-myproject
```

## Configuration

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (Django) |
| `TEMPORAL_HOST` | Temporal server |
| `TENANT_ID` | Default tenant ID |

## Enrichment Results

Products are updated with enrichment data:

```json
{
  "taxonomy": {
    "status": "complete",
    "category_id": 123,
    "category_path": ["Outdoor", "Camping", "Tents"],
    "confidence": 0.92
  },
  "ner": {
    "status": "complete",
    "brand": "MSR",
    "materials": ["nylon", "aluminum"],
    "features": ["waterproof", "lightweight"]
  }
}
```

## Next Steps

- [Harvester Module](/modules/harvester/) - Vendor data import
- [Sync Module](/modules/sync/) - Channel synchronization
