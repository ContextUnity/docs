---
title: gRPC Integration
description: Service-to-service communication with gRPC
---

# gRPC Integration

ContextWorker exposes a gRPC service for triggering workflows from other services. This guide covers the setup, benefits, and integration patterns.

## What is gRPC?

[gRPC](https://grpc.io/) is a high-performance RPC framework developed by Google:

- **Protocol Buffers** — binary serialization (10x smaller than JSON)
- **Type Safety** — generated clients/servers from `.proto` files
- **Streaming** — bidirectional streaming support
- **Fast** — significantly faster than REST/HTTP

### gRPC vs REST

| Aspect | REST/JSON | gRPC/Protobuf |
|--------|-----------|---------------|
| Payload size | ~100 bytes | ~10 bytes |
| Latency | ~10ms | ~1ms |
| Type safety | Runtime | Compile-time |
| Streaming | Websockets needed | Native |
| Code generation | Manual | Automatic |

## WorkerService

ContextWorker exposes `WorkerService` for workflow triggers:

```protobuf
// contextcore/protos/worker.proto

service WorkerService {
  rpc StartWorkflow (ContextUnit) returns (ContextUnit);
  rpc GetTaskStatus (ContextUnit) returns (ContextUnit);
}
```

### Starting the gRPC Server

```bash
# Start gRPC service on port 50052
python -m contextworker.service --port 50052

# With custom Temporal host
python -m contextworker.service --port 50052 --temporal-host temporal:7233
```

## ContextUnit Protocol

All gRPC messages use ContextUnit for consistency and provenance tracking:

```python
from contextcore import ContextUnit

# Create request
unit = ContextUnit(
    payload={
        "workflow_type": "harvest",
        "source_id": "my-source",
        "tenant_id": "my-tenant",
    },
    provenance=["router:commerce-graph"],  # Track origin
)

# Send via gRPC
response = await stub.StartWorkflow(unit.to_protobuf())

# Parse response
result = ContextUnit.from_protobuf(response)
workflow_id = result.payload["workflow_id"]
```

### Provenance Tracking

Every service adds to provenance chain:

```
Router → Worker → Commerce
  ↓        ↓         ↓
["router:rag"] → ["router:rag", "worker:grpc"] → ["router:rag", "worker:grpc", "commerce:harvest"]
```

## Calling Worker from Router

```python
# In Router graph step
from contextcore import ContextUnit
from contextcore.rpc import get_worker_stub

async def trigger_enrichment(product_ids: list[str], tenant_id: str):
    """Trigger enrichment workflow via Worker gRPC."""
    
    stub = await get_worker_stub()
    
    unit = ContextUnit(
        payload={
            "workflow_type": "enrichment",
            "product_ids": product_ids,
            "tenant_id": tenant_id,
        },
        provenance=["router:gardener-graph"],
    )
    
    response = await stub.StartWorkflow(unit.to_protobuf())
    result = ContextUnit.from_protobuf(response)
    
    return {
        "workflow_id": result.payload["workflow_id"],
        "status": "started",
    }
```

## Calling Brain from Worker

Worker activities can call Brain for knowledge lookups:

```python
from contextcore.rpc import get_brain_stub
from contextcore import ContextUnit

@activity.defn
async def enrich_with_taxonomy(product_id: str) -> dict:
    """Enrich product using Brain's taxonomy."""
    
    stub = await get_brain_stub()
    
    # Search for matching taxonomy
    unit = ContextUnit(
        payload={
            "query": product_name,
            "collection": "taxonomy",
            "limit": 5,
        },
        provenance=["worker:enrichment"],
    )
    
    response = await stub.Search(unit.to_protobuf())
    result = ContextUnit.from_protobuf(response)
    
    return {
        "categories": result.payload["matches"],
    }
```

## Configuration

### Environment Variables

```bash
# Worker gRPC service
WORKER_GRPC_PORT=50052
WORKER_GRPC_HOST=0.0.0.0

# Connecting to other services
BRAIN_GRPC_HOST=localhost:50051
ROUTER_GRPC_HOST=localhost:50053

# Temporal
TEMPORAL_HOST=localhost:7233
```

### Service Discovery

In Docker/Kubernetes, use service names:

```yaml
# docker-compose.yml
services:
  worker:
    environment:
      - BRAIN_GRPC_HOST=brain:50051
      - ROUTER_GRPC_HOST=router:50053
      
  brain:
    ports:
      - "50051:50051"
```

## Why Offload Heavy Tasks?

### The Problem

AI/ML operations are resource-intensive:
- LLM calls: 5-30 seconds
- Embedding generation: 1-5 seconds  
- Large batch processing: minutes

Running these in API request = bad UX and timeouts.

### The Solution

Offload to Worker:

```
User Request → Router (fast response) → Worker (background processing)
     ↓                                         ↓
  "Job started"                          Actual work
   (< 100ms)                            (5-30 seconds)
```

### Example: Product Enrichment

```python
# Router: Fast response to user
async def handle_enrich_request(product_ids: list[str]):
    # Trigger async workflow (non-blocking)
    workflow_id = await trigger_worker_workflow(
        workflow_type="enrichment",
        product_ids=product_ids,
    )
    
    # Return immediately
    return {"status": "processing", "workflow_id": workflow_id}

# Worker: Heavy processing in background
@workflow.defn
class EnrichmentWorkflow:
    @workflow.run
    async def run(self, product_ids: list[str]):
        for product_id in product_ids:
            # LLM calls, embedding generation, etc.
            await workflow.execute_activity(
                enrich_product,
                product_id,
                start_to_close_timeout=timedelta(minutes=5),
            )
```

## Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              API Layer                                    │
│                         (User-facing, fast)                               │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           ContextRouter                                   │
│                    (AI Orchestration, LLM routing)                        │
│                                                                          │
│  • Receives user queries                                                 │
│  • Routes to appropriate LLM                                             │
│  • For heavy tasks: triggers Worker via gRPC                             │
│                                                                          │
└────────────────┬────────────────────────────────────┬────────────────────┘
                 │                                    │
          gRPC   │                                    │ gRPC
                 ▼                                    ▼
┌────────────────────────────┐      ┌────────────────────────────┐
│      ContextBrain          │      │      ContextWorker         │
│   (Knowledge & Memory)     │      │  (Background Processing)   │
│                            │      │                            │
│  • Semantic search         │      │  • Durable workflows       │
│  • Vector embeddings       │      │  • Scheduled jobs          │
│  • Taxonomy storage        │      │  • Batch processing        │
│                            │      │                            │
└────────────────────────────┘      └────────────────────────────┘
```

## Error Handling

```python
from grpc import StatusCode
from contextcore import ContextUnit

async def call_worker_safely(payload: dict):
    try:
        stub = await get_worker_stub()
        unit = ContextUnit(payload=payload, provenance=["my-service"])
        response = await stub.StartWorkflow(unit.to_protobuf())
        return ContextUnit.from_protobuf(response)
        
    except grpc.RpcError as e:
        if e.code() == StatusCode.UNAVAILABLE:
            logger.error("Worker service unavailable")
            raise ServiceUnavailableError("Worker offline")
        elif e.code() == StatusCode.INVALID_ARGUMENT:
            logger.error(f"Invalid request: {e.details()}")
            raise ValidationError(e.details())
        raise
```

## Next Steps

- [Workflows Guide](/guides/workflows/) — Temporal workflow patterns
- [Schedules Guide](/guides/schedules/) — Recurring jobs
- [CLI Reference](/reference/cli/) — Command-line tools
