---
title: Gardener Agent
description: Running the Gardener taxonomy classification agent
---

# Gardener Agent

Gardener is an AI agent that lives in **ContextRouter** and performs product taxonomy classification. ContextWorker triggers Gardener runs on schedule or on-demand.

## Architecture

> **Important**: Gardener is a **ContextRouter** agent (LangGraph graph).
> ContextWorker only invokes it — the actual AI logic lives in Router.

```
ContextWorker                    ContextRouter                 ContextBrain
     │                               │                              │
     │ trigger (HTTP/gRPC)           │                              │
     ▼                               ▼                              │
┌──────────────┐              ┌──────────────┐                     │
│  Harvester   │──invoke────►│  Gardener    │                     │
│  Workflow    │              │  Graph       │                     │
└──────────────┘              │  (LangGraph) │                     │
                              └──────────────┘                     │
                                    │                              │
                                    │ search taxonomy              │
                                    │─────────────────────────────►│
                                    │◄────taxonomy nodes───────────│
                                    │                              │
                                    ▼                              │
                              ┌──────────────┐                     │
                              │  Classified  │──────update───────►│
                              │  Product     │                     │
                              └──────────────┘                     │
```

## Where Does Gardener Live?

| Component | Location | Purpose |
|-----------|----------|---------|
| **Gardener Graph** | `contextrouter/cortex/graphs/gardener.py` | LangGraph workflow with AI reasoning |
| **Gardener Activity** | `contextworker/activities.py` | Temporal activity that calls Router |
| **Gardener Workflow** | `contextworker/workflows.py` | Temporal workflow that triggers enrichment |

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

### How Worker Invokes Gardener

Worker calls the Router's Gardener endpoint:

```python
# contextworker/activities.py

@activity.defn
async def gardener_activity(batch_size: int = 10) -> dict:
    """Call Router's Gardener agent for product enrichment."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.ROUTER_URL}/api/v1/agents/gardener/run",
            json={"batch_size": batch_size},
            headers={"Authorization": f"Bearer {settings.ROUTER_API_KEY}"},
        )
        return response.json()
```

### Scheduled Execution

Gardener typically runs after harvester jobs:

```python
# contextworker/workflows.py

@workflow.defn
class HarvestWorkflow:
    @workflow.run
    async def run(self, supplier: str):
        # 1. Fetch and transform data
        await workflow.execute_activity(
            harvest_activity,
            supplier,
            start_to_close_timeout=timedelta(minutes=30)
        )
        
        # 2. Trigger Gardener on Router
        await workflow.execute_activity(
            gardener_activity,
            start_to_close_timeout=timedelta(hours=1)
        )
```

## Gardener Graph (in Router)

The actual AI logic is a LangGraph workflow in ContextRouter:

```python
# contextrouter/cortex/graphs/gardener.py

class GardenerState(TypedDict):
    product: Product
    taxonomy_candidates: list[TaxonomyNode]
    classification: Classification | None
    confidence: float

def build_gardener_graph():
    workflow = StateGraph(GardenerState)
    
    workflow.add_node("search_taxonomy", search_taxonomy_node)
    workflow.add_node("classify", classify_product_node)
    workflow.add_node("validate", validate_classification_node)
    workflow.add_node("extract_attributes", extract_attributes_node)
    
    workflow.set_entry_point("search_taxonomy")
    # ... edges and conditions
    
    return workflow.compile()
```

For full Gardener documentation, see **[ContextRouter Agents](/router/agents/gardener/)**.

## Configuration

### Worker Side

```bash
# .env
ROUTER_URL=http://localhost:8000
ROUTER_API_KEY=your-api-key
GARDENER_BATCH_SIZE=10
```

### Router Side

Gardener configuration is in ContextRouter:
- Model selection (Claude, GPT-4, etc.)
- Taxonomy search parameters
- Confidence thresholds
- Retry logic

See [Router Gardener Config](/router/reference/configuration/#gardener).

## Monitoring

### From Worker

```bash
# View workflow execution
temporal workflow list --query "WorkflowType='GardenerWorkflow'"

# View logs
journalctl -u contextworker -f | grep gardener
```

### From Router

```bash
# Router logs show actual classification
journalctl -u contextrouter -f | grep gardener
```

## Troubleshooting

### Worker Can't Reach Router

1. Check `ROUTER_URL` is correct
2. Verify Router is running
3. Check API key is valid

### Classifications Are Wrong

This is a **Router** issue, not Worker:
1. Check Router logs for LLM responses
2. Review taxonomy tree in ContextBrain
3. Adjust Router's Gardener config

## Next Steps

- [ContextRouter Gardener Agent](/router/agents/gardener/) - Full agent documentation
- [Harvester Guide](/guides/harvester/) - Configure data sources
- [Workflows Guide](/guides/workflows/) - Custom workflow creation
