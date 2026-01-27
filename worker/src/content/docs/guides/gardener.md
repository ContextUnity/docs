---
title: Gardener Agent
description: AI-powered product taxonomy classification
---

# Gardener Agent

Gardener is the AI agent responsible for product taxonomy classification in the ContextUnity ecosystem. It runs as a ContextWorker job to enrich products with proper categories, attributes, and metadata.

## Overview

The Gardener agent:
- Classifies products into taxonomy categories using LLM reasoning
- Extracts structured attributes (brand, model, size, color)
- Generates SEO-friendly titles and descriptions
- Validates classifications against the taxonomy tree

## Architecture

```
ContextWorker                    ContextRouter                 ContextBrain
     │                               │                              │
     │ trigger enrichment            │                              │
     ▼                               │                              │
┌──────────────┐                    │                              │
│  Gardener    │─────invoke───────►│◄── LangGraph Agent           │
│  Workflow    │                    │                              │
└──────────────┘                    │                              │
     │                               │    search taxonomy           │
     │                               │─────────────────────────────►│
     │                               │◄────taxonomy nodes───────────│
     │                               │                              │
     │◄──────classified product──────│                              │
     │                               │                              │
     ▼                               │                              │
┌──────────────┐                    │                              │
│  Commerce DB │◄───update product──│                              │
└──────────────┘                    │                              │
```

## Configuration

### Environment Variables

```bash
# Router connection
ROUTER_URL=http://localhost:8000
ROUTER_API_KEY=your-api-key

# Processing settings
GARDENER_BATCH_SIZE=10
GARDENER_MAX_RETRIES=3
GARDENER_TIMEOUT_SECONDS=60
```

### Workflow Settings

In `config.py`:

```python
GARDENER_CONFIG = {
    "batch_size": 10,
    "max_concurrent": 5,
    "taxonomy_search_limit": 10,
    "confidence_threshold": 0.7,
    "retry_on_low_confidence": True,
}
```

## Running Gardener

### Manual Execution

```bash
# Process pending products
mise run gardener

# With custom batch size
python -m contextworker gardener --batch-size 20

# Process specific dealer
python -m contextworker gardener --dealer vysota
```

### Scheduled Execution

Gardener runs automatically after harvester jobs:

```python
# In workflows.py
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
        
        # 2. Run Gardener enrichment
        await workflow.execute_activity(
            gardener_activity,
            supplier,
            start_to_close_timeout=timedelta(hours=1)
        )
```

## Gardener Graph (Router)

The actual AI logic lives in ContextRouter as a LangGraph:

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
    workflow.add_edge("search_taxonomy", "classify")
    workflow.add_edge("classify", "validate")
    workflow.add_conditional_edges(
        "validate",
        should_retry,
        {"retry": "search_taxonomy", "continue": "extract_attributes"}
    )
    workflow.add_edge("extract_attributes", END)
    
    return workflow.compile()
```

## Enrichment Status

Products track their enrichment status:

| Status | Description |
|--------|-------------|
| `PENDING` | Not yet processed |
| `PROCESSING` | Currently being enriched |
| `ENRICHED` | Successfully classified |
| `FAILED` | Classification failed |
| `SKIPPED` | Manually excluded |

## Monitoring

### Logs

```bash
# View Gardener logs
journalctl -u contextworker -f | grep gardener
```

### Metrics

Gardener exposes metrics via ContextWorker:

- `gardener_products_processed` - Total products processed
- `gardener_classification_success` - Successful classifications
- `gardener_classification_failed` - Failed classifications
- `gardener_avg_confidence` - Average confidence score

## Troubleshooting

### Low Confidence Classifications

If Gardener consistently produces low confidence:

1. Check taxonomy tree completeness
2. Verify product names have sufficient context
3. Review and expand taxonomy embeddings

### Timeouts

For timeout issues:

1. Reduce batch size
2. Increase timeout in workflow
3. Check Router/Brain service health

## Next Steps

- [Harvester Guide](/guides/harvester/) - Configure data sources
- [Workflows Guide](/guides/workflows/) - Custom workflow creation
- [Router Agents](/reference/agents/) - Agent configuration
