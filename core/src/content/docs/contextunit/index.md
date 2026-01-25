---
title: ContextUnit Protocol
description: The atomic unit of data exchange in ContextUnity.
---

The ContextUnit is the **atomic unit** of all data exchange in the ContextUnity ecosystem. Every service MUST use ContextUnit for communication to ensure consistency, traceability, and security.

## Structure

A ContextUnit contains:

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
    payload: dict[str, Any],    # Actual data content
    
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

## Core Fields

### Identifiers

- **unit_id**: Unique UUIDv4 for this specific unit
- **trace_id**: UUIDv4 tracking the entire request lifecycle across services
- **parent_unit_id**: Optional reference to parent unit for hierarchical tracing

### Content

- **modality**: Data type — `"text"`, `"audio"`, or `"spatial"`
- **payload**: The actual data as a dictionary (JSON-serializable)

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

**Rule**: If a step isn't in the provenance, it didn't happen.

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

1. **Always set trace_id** — Propagate across service boundaries
2. **Update provenance** — Add each transformation step
3. **Set security scopes** — Restrict access appropriately
4. **Track metrics** — Monitor performance and costs
5. **Use parent_unit_id** — Link related units for hierarchical tracing

## Next Steps

- **[Structure Details](/contextunit/structure/)** — Deep dive into each field
- **[Security Scopes](/contextunit/security/)** — Capability-based access control
- **[Provenance](/contextunit/provenance/)** — Tracking data journey
