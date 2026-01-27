---
title: Gardener Agent
description: Running the Gardener taxonomy classification agent
---

# Gardener Agent

Gardener is an AI agent that lives in **ContextRouter** and performs product taxonomy classification. ContextWorker imports Router as a Python package and invokes the graph directly.

## Architecture

> **Important**: Router is a **Python package**, not an API service.
> Worker imports `contextrouter` and calls graphs directly via Python.

```
ContextWorker                         ContextRouter (package)
     │                                      │
     │ from contextrouter.cortex            │
     │ .graphs.commerce import graph        │
     ▼                                      ▼
┌──────────────────┐               ┌──────────────────┐
│ HarvesterScheduler│──import────►│ CommerceGraph    │
│                  │               │   └── gardener   │  (subgraph)
│ queue.enqueue()  │               │   └── lexicon    │  (subgraph)
└──────────────────┘               │   └── matcher    │  (subgraph)
     │                             └──────────────────┘
     │ enqueue to Redis                    │
     ▼                                     │
┌──────────────────┐                      │
│   Redis Queue    │◄─────consumes────────│
│   (shared)       │                      │
└──────────────────┘                      │
                                          │
                                          ▼
                                    ContextBrain
                                    (taxonomy, KG)
```

## Graph Structure

Gardener is a **subgraph** of the Commerce graph:

```
cortex/graphs/
└── commerce/
    ├── graph.py              # Main CommerceGraph (entry point)
    ├── state.py              # CommerceState
    │
    ├── gardener/
    │   ├── graph.py          # create_gardener_subgraph()
    │   ├── nodes.py          # classify_node, extract_ner_node
    │   └── state.py          # GardenerState
    │
    ├── lexicon/
    │   └── graph.py          # create_lexicon_subgraph()
    │
    └── matcher/
        └── graph.py          # create_matcher_subgraph()
```

## How Worker Uses Router

Worker imports Router as a **Python package**:

```python
# contextworker/harvester/scheduler.py

from contextrouter.cortex.queue import get_enrichment_queue

class HarvesterScheduler:
    async def _get_queue(self):
        """Get Router's enrichment queue - direct Python import."""
        self._queue = get_enrichment_queue(self.config.redis_url)
        return self._queue
    
    async def _enqueue_pending_products(self):
        """Enqueue products to shared Redis queue."""
        product_ids = await self._get_pending_products()
        
        queue = await self._get_queue()
        await queue.enqueue(
            product_ids=product_ids,
            tenant_id=cfg.tenant_id,
            priority="normal",
            source="scheduler",
        )
```

### Gardener Graph Consumer

The Gardener graph runs as a separate process (or in Worker) and consumes from the queue:

```python
# Can be run in Worker or as standalone process
from contextrouter.cortex.graphs.commerce import build_commerce_graph

async def run_gardener_consumer():
    graph = build_commerce_graph()
    
    # Invoke with "enrich" intent routes to gardener subgraph
    result = await graph.ainvoke({
        "intent": "enrich",
        "batch_size": 10,
        "tenant_id": "default",
    })
```

## Running Gardener via Worker

### Manual Execution

```bash
# Trigger Gardener enrichment for pending products
mise run gardener

# With custom batch size
python -m contextworker gardener --batch-size 20

# Process specific dealer only
python -m contextworker gardener --dealer vysota
```

### Scheduled Execution

Worker scheduler enqueues products periodically:

```python
# contextworker/harvester/scheduler.py

self.scheduler.add_job(
    self._enqueue_pending_products,
    trigger=IntervalTrigger(seconds=gardener_cfg.poll_interval),
    id="harvester_enqueue",
)
```

## Gardener Subgraph

The Gardener subgraph in Router:

```python
# contextrouter/cortex/graphs/commerce/gardener/graph.py

from langgraph.graph import StateGraph, END
from .nodes import (
    fetch_pending_node,
    classify_taxonomy_node,
    extract_ner_node,
    update_kg_node,
    write_results_node,
)
from .state import GardenerState

def create_gardener_subgraph():
    """Create Gardener subgraph for taxonomy classification."""
    workflow = StateGraph(GardenerState)
    
    workflow.add_node("fetch", fetch_pending_node)
    workflow.add_node("classify", classify_taxonomy_node)
    workflow.add_node("extract_ner", extract_ner_node)
    workflow.add_node("update_kg", update_kg_node)
    workflow.add_node("write", write_results_node)
    
    workflow.set_entry_point("fetch")
    workflow.add_edge("fetch", "classify")
    workflow.add_edge("classify", "extract_ner")
    workflow.add_edge("extract_ner", "update_kg")
    workflow.add_edge("update_kg", "write")
    workflow.add_edge("write", END)
    
    return workflow.compile()
```

## Configuration

### Worker Side

```bash
# .env (Worker)
DATABASE_URL=postgresql://user:pass@localhost/commerce
REDIS_URL=redis://localhost:6379
TENANT_ID=default
GARDENER_BATCH_SIZE=10
GARDENER_POLL_INTERVAL=60
```

### Router Side

Gardener settings are in Router's config:
- Model selection (Claude, GPT-4, etc.)
- Taxonomy search parameters
- Confidence thresholds
- LLM prompts directory

## Monitoring

### Worker Logs

```bash
# View scheduler logs
journalctl -u contextworker -f | grep harvester

# Queue stats
redis-cli LLEN enrichment:queue:default
```

### Graph Execution

```bash
# If running Gardener as separate process
journalctl -u gardener-consumer -f
```

## Troubleshooting

### Queue Not Processing

1. Check Redis is running
2. Verify `REDIS_URL` matches in Worker and graph consumer
3. Check graph consumer process is running

### Classifications Are Wrong

This is a Router issue:
1. Check LLM responses in graph logs
2. Review taxonomy tree in ContextBrain
3. Adjust prompts in Router config

## Next Steps

- [Harvester Guide](/guides/harvester/) - Configure data sources
- [Workflows Guide](/guides/workflows/) - Custom Temporal workflows
