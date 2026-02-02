---
title: ContextUnit Protocol
description: The universal data contract for all gRPC communication in ContextUnity.
---

The ContextUnit is the **universal data contract** for all gRPC communication in the ContextUnity ecosystem. Every service MUST use ContextUnit for communication to ensure consistency, traceability, and security.

## Universal Protocol

**All gRPC methods in ContextUnity accept and return ContextUnit:**

```protobuf
service BrainService {
    rpc Search(ContextUnit) returns (stream ContextUnit);
    rpc Upsert(ContextUnit) returns (ContextUnit);
    rpc UpsertNewsItem(ContextUnit) returns (ContextUnit);
    rpc UpsertNewsPost(ContextUnit) returns (ContextUnit);
}
```

Domain-specific data is passed via the `payload` field. Server-side validation is done using Pydantic models.

## Structure

```python
from contextcore import ContextUnit, SecurityScopes, UnitMetrics
from uuid import UUID

unit = ContextUnit(
    # Identifiers
    unit_id: UUID,              # Unique identifier for this unit
    trace_id: UUID,             # Tracks entire request lifecycle
    parent_unit_id: UUID | None, # Reference to parent unit
    
    # Content
    modality: str,              # "text", "audio", or "spatial"
    payload: dict[str, Any],    # Actual data content (domain-specific)
    
    # Tracking
    provenance: list[str],       # Data journey (where it came from)
    chain_of_thought: list[CotStep], # Agent reasoning steps
    metrics: UnitMetrics,       # Latency, cost, tokens
    
    # Security
    security: SecurityScopes,   # Read/write restrictions
    
    # Metadata
    created_at: datetime        # Creation timestamp
)
```

## gRPC Usage

### Sending a Request

```python
from contextcore import ContextUnit, brain_pb2_grpc, context_unit_pb2
import grpc

async def search_brain(tenant_id: str, query_text: str):
    channel = grpc.aio.insecure_channel("localhost:50051")
    stub = brain_pb2_grpc.BrainServiceStub(channel)
    
    # Build ContextUnit with domain-specific data in payload
    unit = ContextUnit(
        payload={
            "tenant_id": tenant_id,
            "query_text": query_text,
            "limit": 10,
            "source_types": ["news_fact", "document"],
        },
        provenance=["my_service:search"],
    )
    
    # Convert to protobuf and send
    results = []
    async for response_pb in stub.Search(unit.to_protobuf(context_unit_pb2)):
        result = ContextUnit.from_protobuf(response_pb)
        results.append(result.payload)
    
    await channel.close()
    return results
```

### Server-Side Validation

On the server, use Pydantic to validate payloads:

```python
from pydantic import BaseModel

class SearchPayload(BaseModel):
    tenant_id: str
    query_text: str
    limit: int = 10
    source_types: list[str] = []

async def Search(self, request, context):
    unit = ContextUnit.from_protobuf(request)
    params = SearchPayload(**unit.payload)  # Validate
    
    results = await self.storage.search(
        query=params.query_text,
        tenant_id=params.tenant_id,
        limit=params.limit,
    )
    
    for res in results:
        yield ContextUnit(
            trace_id=unit.trace_id,
            payload={"id": res.id, "content": res.content, "score": res.score},
            provenance=unit.provenance + ["brain:search"],
        ).to_protobuf(context_unit_pb2)
```

## Core Fields

### Identifiers

- **unit_id**: Unique UUIDv4 for this specific unit
- **trace_id**: UUIDv4 tracking the entire request lifecycle across services
- **parent_unit_id**: Optional reference to parent unit for hierarchical tracing

### Content

- **modality**: Data type — `"text"`, `"audio"`, or `"spatial"`
- **payload**: The actual data as a dictionary (JSON-serializable). Domain-specific data goes here.

### Tracking

- **provenance**: List of strings showing where data came from
- **chain_of_thought**: List of agent reasoning steps
- **metrics**: Performance metrics (latency, cost, tokens)

### Security

- **security**: `SecurityScopes` defining read/write restrictions
  - `read`: List of required permissions for reading
  - `write`: List of required permissions for writing

## Provenance Tracking

Every ContextUnit tracks its journey through the system:

```python
unit = ContextUnit(
    payload={"query": "What is RAG?"},
    provenance=[
        "user:input",
        "router:intent_detection",
        "brain:vector_search",
        "router:response_generation"
    ]
)
```

**Provenance format**: `service:component:action`

Examples:
- `router:news_engine:harvest`
- `brain:search`
- `sdk:brain_client:upsert`
- `worker:gardener`

## Security Scopes

Security scopes enforce capability-based access control:

```python
from contextcore import SecurityScopes

# Restrictive: only specific permissions can read/write
unit = ContextUnit(
    payload={"sensitive_data": "..."},
    security=SecurityScopes(
        read=["admin:read", "analyst:read"],
        write=["admin:write"]
    )
)
```

ContextToken permissions must match these scopes for access.

## Chain of Thought

Track agent reasoning steps:

```python
from contextcore import CotStep

unit.chain_of_thought.append(CotStep(
    agent="matcher",
    action="analyze_product",
    status="completed",
    timestamp=datetime.utcnow()
))
```

## Metrics

Track performance and costs:

```python
from contextcore import UnitMetrics

unit.metrics = UnitMetrics(
    latency_ms=250,
    cost_usd=0.001,
    tokens_used=150,
    cost_limit_usd=1.0
)
```

## Best Practices

1. **Always propagate trace_id** — Use the same trace_id across all related operations
2. **Update provenance** — Add each transformation step using `service:component` format
3. **Use Pydantic for validation** — Server-side validation of payloads ensures type safety
4. **Set security scopes** — Restrict access appropriately for sensitive data
5. **Track metrics** — Monitor performance and costs for observability
6. **Use parent_unit_id** — Link related units for hierarchical tracing

## Migration from Domain-Specific Messages

If you have old code using domain-specific proto messages:

```python
# ❌ OLD (deprecated)
request = brain_pb2.SearchRequest(
    tenant_id=tenant_id,
    query_text=query,
    limit=10,
)
response = await stub.Search(request)

# ✅ NEW (ContextUnit protocol)
unit = ContextUnit(
    payload={"tenant_id": tenant_id, "query_text": query, "limit": 10},
    provenance=["my_service:search"],
)
async for response_pb in stub.Search(unit.to_protobuf(context_unit_pb2)):
    result = ContextUnit.from_protobuf(response_pb)
```

## Next Steps

- **[Security](/contextunit/security/)** — Capability-based access control
- **[Provenance](/contextunit/provenance/)** — Tracking data journey
- **[gRPC Integration](/guides/grpc/)** — Detailed gRPC patterns
