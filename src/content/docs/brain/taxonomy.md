---
title: Taxonomy & Ontology
description: ltree-based hierarchical classification and AI-powered categorization.
---

ContextBrain manages hierarchical taxonomies using PostgreSQL's `ltree` extension for efficient tree operations.

## Taxonomy Structure

Taxonomies are tree-structured category hierarchies:

```
Electronics
├── Smartphones
│   ├── Apple
│   └── Samsung
├── Laptops
│   ├── Gaming
│   └── Ultrabooks
└── Audio
    ├── Headphones
    └── Speakers
```

Stored as ltree paths: `Electronics.Smartphones.Apple`

## gRPC Operations

### Upserting Taxonomy

```python
from contextcore import ContextUnit, context_unit_pb2

unit = ContextUnit(payload={
    "tenant_id": "my_project",
    "domain": "products",
    "entries": [
        {
            "path": "Electronics.Smartphones.Apple",
            "label": "Apple",
            "canonical_name": "Apple iPhone",
        },
    ],
})
stub.UpsertTaxonomy(unit.to_protobuf(context_unit_pb2))
```

### Querying Taxonomy

```python
unit = ContextUnit(payload={
    "tenant_id": "my_project",
    "domain": "products",
})

for entry_pb in stub.GetTaxonomy(unit.to_protobuf(context_unit_pb2)):
    entry = ContextUnit.from_protobuf(entry_pb)
    print(entry.payload)
```

## Knowledge Graph Relations

Brain stores typed relationships between entities:

```python
unit = ContextUnit(payload={
    "tenant_id": "my_project",
    "source": "Positive Mental Attitude",
    "target": "Success",
    "relation_type": "CAUSES",
    "metadata": {"confidence": 0.92},
})
stub.CreateKGRelation(unit.to_protobuf(context_unit_pb2))
```

Relations are used during RAG retrieval to inject background facts into the generation prompt (see [Cortex Pipeline](/router/cortex/)).

## Ontology Filtering

An `ontology.json` configuration defines which relation types are surfaced during runtime:

```json
{
  "runtime_fact_labels": ["CAUSES", "REQUIRES", "ENABLES"],
  "hidden_labels": ["INTERNAL_LINK", "DEBUG"]
}
```

Only relations with labels in `runtime_fact_labels` are returned as graph facts during retrieval.
