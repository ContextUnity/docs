---
title: Architecture
description: How the ContextUnity ecosystem connects and communicates.
---

ContextUnity is a **service mesh** of modular Python services communicating over **gRPC**. Each service has a single responsibility and shares types through `ContextCore`.

## Ecosystem Map

```mermaid
graph TB
    subgraph "Open Source (Apache 2.0)"
        Core["ContextCore<br/>Kernel & Types"]
        Router["ContextRouter<br/>Agent Gateway"]
        Brain["ContextBrain<br/>Knowledge Store"]
        Worker["ContextWorker<br/>Temporal Workflows"]
    end
    
    subgraph "Enterprise (Paid)"
        Shield["ContextShield<br/>Security Firewall"]
        Zero["ContextZero<br/>Privacy Proxy"]
        Commerce["ContextCommerce<br/>E-Commerce PIM"]
        View["ContextView<br/>Admin Dashboard"]
    end

    subgraph "External"
        LLM["LLM Providers<br/>OpenAI / Anthropic / Vertex"]
        Temporal["Temporal Server"]
        PG["PostgreSQL + pgvector"]
    end

    Core -->|types & protos| Router
    Core -->|types & protos| Brain
    Core -->|types & protos| Worker
    Core -->|types & protos| Shield

    Router -->|gRPC: QueryMemory| Brain
    Router -->|gRPC: TriggerWorkflow| Worker
    Router -->|gRPC: ValidateToken| Shield
    Router -->|API calls| LLM
    Zero -->|intercept| Router

    Brain --> PG
    Worker --> Temporal
    Commerce -->|gRPC| Brain
    Commerce -->|gRPC| Router
    View -->|gRPC| Router
    View -->|gRPC| Worker
```

## Communication Pattern

All inter-service communication uses the **ContextUnit** protocol. Every RPC call carries a typed Pydantic envelope with:
- **Payload** — domain-specific data (`google.protobuf.Struct`)
- **Provenance** — ordered trace of processing stages
- **Security** — scopes for access control
- **Tracing** — `trace_id` and `parent_unit_id` for distributed observability

```mermaid
sequenceDiagram
    participant Client
    participant Router as ContextRouter
    participant Brain as ContextBrain
    participant Worker as ContextWorker

    Client->>Router: ContextUnit (query + token)
    Router->>Router: Validate ContextToken
    Router->>Brain: QueryMemory (RAG retrieval)
    Brain-->>Router: Results with provenance
    Router->>Router: LLM reasoning (LangGraph)
    
    opt Long-running task
        Router->>Worker: TriggerWorkflow
        Worker-->>Router: Workflow started
    end
    
    Router-->>Client: ContextUnit (response + full provenance)
```

## Service Roles

| Service | Role | Protocol | License |
|---------|------|----------|---------|
| **ContextCore** | Shared kernel — types, protos, tokens, config | dependency | Apache 2.0 |
| **ContextRouter** | Agent orchestration — LangGraph, tool dispatch | gRPC server | Apache 2.0 |
| **ContextBrain** | Knowledge — vectors, memory, taxonomy, RAG | gRPC server | Apache 2.0 |
| **ContextWorker** | Workflows — Temporal, schedules, agents | gRPC server | Apache 2.0 |
| **ContextShield** | Security — token signing, prompt filtering | gRPC server | Commercial |
| **ContextZero** | Privacy — PII masking, persona engine | middleware | Commercial |
| **ContextCommerce** | E-commerce — PIM, product matching, enrichment | Django app | Commercial |
| **ContextView** | Observability — dashboard, traces, admin | Django app | Commercial |

## Technology Stack

- **Language:** Python 3.13+
- **Inter-service:** gRPC with Protocol Buffers
- **Agent Framework:** LangGraph (LangChain)
- **Database:** PostgreSQL 16+ with pgvector and ltree extensions
- **Task Engine:** Temporal.io
- **LLM Providers:** OpenAI, Anthropic Claude, Google Vertex AI, Groq, Perplexity
- **Package Management:** uv
- **Configuration:** Pydantic BaseModel with `load_shared_config_from_env()`
