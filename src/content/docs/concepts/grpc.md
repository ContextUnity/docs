---
title: gRPC Contracts
description: Protocol Buffer service definitions that bind the ContextUnity ecosystem.
---

All ContextUnity services communicate via **gRPC** — a high-performance RPC framework using Protocol Buffers for type-safe serialization. The `.proto` files are defined in [ContextCore](https://github.com/ContextUnity/contextcore) and compiled into stubs used by every service.

## Proto File Structure

```
contextcore/protos/
├── context_unit.proto   # ContextUnit message (shared by all)
├── brain.proto          # BrainService RPCs
├── router.proto         # RouterService RPCs
├── worker.proto         # WorkerService RPCs
├── commerce.proto       # CommerceService RPCs
├── shield.proto         # ShieldService RPCs
├── admin.proto          # AdminService RPCs (ContextView)
└── zero.proto           # ZeroService RPCs
```

## Key Design: Unified Envelope

All RPCs use `ContextUnit` as both input and output. Domain-specific data goes in the `payload` field:

```protobuf
rpc QueryMemory(contextcore.ContextUnit) returns (stream contextcore.ContextUnit);
```

This means every call carries provenance, security scopes, and tracing metadata automatically.

## Service Definitions

### BrainService

```protobuf
service BrainService {
    // Knowledge
    rpc Search(ContextUnit) returns (stream ContextUnit);
    rpc Upsert(ContextUnit) returns (ContextUnit);
    rpc QueryMemory(ContextUnit) returns (stream ContextUnit);
    rpc GraphSearch(ContextUnit) returns (ContextUnit);
    rpc CreateKGRelation(ContextUnit) returns (ContextUnit);

    // Memory
    rpc AddEpisode(ContextUnit) returns (ContextUnit);
    rpc GetRecentEpisodes(ContextUnit) returns (stream ContextUnit);
    rpc UpsertFact(ContextUnit) returns (ContextUnit);
    rpc GetUserFacts(ContextUnit) returns (stream ContextUnit);

    // News
    rpc UpsertNewsItem(ContextUnit) returns (ContextUnit);
    rpc GetNewsItems(ContextUnit) returns (stream ContextUnit);
    rpc UpsertNewsPost(ContextUnit) returns (ContextUnit);
    rpc CheckNewsPostExists(ContextUnit) returns (ContextUnit);

    // Traces
    rpc LogTrace(ContextUnit) returns (ContextUnit);
    rpc GetTraces(ContextUnit) returns (stream ContextUnit);

    // Taxonomy
    rpc UpsertTaxonomy(ContextUnit) returns (ContextUnit);
    rpc GetTaxonomy(ContextUnit) returns (stream ContextUnit);
}
```

### RouterService

```protobuf
service RouterService {
    rpc ExecuteAgent(ContextUnit) returns (ContextUnit);
    rpc StreamAgent(ContextUnit) returns (stream ContextUnit);
    rpc ExecuteDispatcher(ContextUnit) returns (ContextUnit);
    rpc StreamDispatcher(ContextUnit) returns (stream ContextUnit);
    rpc RegisterTools(ContextUnit) returns (ContextUnit);
    rpc DeregisterTools(ContextUnit) returns (ContextUnit);
    rpc ToolExecutorStream(stream ContextUnit) returns (stream ContextUnit);
}
```

### WorkerService

```protobuf
service WorkerService {
    rpc StartWorkflow(ContextUnit) returns (ContextUnit);
    rpc GetTaskStatus(ContextUnit) returns (ContextUnit);
    rpc ExecuteCode(ContextUnit) returns (ContextUnit);   // Planned (currently UNIMPLEMENTED)
}
```

### ShieldService

```protobuf
service ShieldService {
    // Core security
    rpc Scan(ContextUnit) returns (ContextUnit);
    rpc EvaluatePolicy(ContextUnit) returns (ContextUnit);
    rpc CheckCompliance(ContextUnit) returns (ContextUnit);
    rpc RecordAudit(ContextUnit) returns (ContextUnit);
    rpc MintToken(ContextUnit) returns (ContextUnit);
    rpc VerifyToken(ContextUnit) returns (ContextUnit);
    rpc RevokeToken(ContextUnit) returns (ContextUnit);
    rpc GetStats(ContextUnit) returns (ContextUnit);

    // Secrets management
    rpc GetSecret(ContextUnit) returns (ContextUnit);
    rpc PutSecret(ContextUnit) returns (ContextUnit);
    rpc ListSecrets(ContextUnit) returns (ContextUnit);
    rpc RotateSecret(ContextUnit) returns (ContextUnit);

    // Encryption
    rpc Encrypt(ContextUnit) returns (ContextUnit);
    rpc Decrypt(ContextUnit) returns (ContextUnit);
}
```

### ZeroService

```protobuf
service ZeroService {
    rpc Anonymize(ContextUnit) returns (ContextUnit);
    rpc Deanonymize(ContextUnit) returns (ContextUnit);
    rpc ScanPII(ContextUnit) returns (ContextUnit);
    rpc ProcessPrompt(ContextUnit) returns (ContextUnit);
    rpc DestroySession(ContextUnit) returns (ContextUnit);
    rpc GetStats(ContextUnit) returns (ContextUnit);
}
```

### CommerceService

```protobuf
service CommerceService {
    rpc GetProduct(ContextUnit) returns (ContextUnit);
    rpc UpdateProduct(ContextUnit) returns (ContextUnit);
    rpc GetProducts(ContextUnit) returns (stream ContextUnit);
    rpc UpsertDealerProduct(ContextUnit) returns (ContextUnit);
    rpc UpdateEnrichment(ContextUnit) returns (ContextUnit);
    rpc TriggerHarvest(ContextUnit) returns (ContextUnit);
    rpc GetPendingVerifications(ContextUnit) returns (stream ContextUnit);
    rpc SubmitVerification(ContextUnit) returns (ContextUnit);
}
```

### AdminService (ContextView)

```protobuf
service AdminService {
    // Health & Monitoring
    rpc GetServiceHealth(ContextUnit) returns (ContextUnit);
    rpc GetServiceMetrics(ContextUnit) returns (ContextUnit);
    rpc CheckServiceConnectivity(ContextUnit) returns (ContextUnit);

    // Memory
    rpc GetMemoryStats(ContextUnit) returns (ContextUnit);
    rpc GetMemoryLayerStats(ContextUnit) returns (ContextUnit);

    // Agent Management
    rpc ListAgents(ContextUnit) returns (ContextUnit);
    rpc GetAgentConfig(ContextUnit) returns (ContextUnit);
    rpc UpdateAgentPermissions(ContextUnit) returns (ContextUnit);
    rpc UpdateAgentTools(ContextUnit) returns (ContextUnit);
    rpc GetAgentActivity(ContextUnit) returns (ContextUnit);

    // Traces & Debugging
    rpc GetTraceDetails(ContextUnit) returns (ContextUnit);
    rpc SearchTraces(ContextUnit) returns (ContextUnit);
    rpc GetTraceChainOfThought(ContextUnit) returns (ContextUnit);

    // Analytics
    rpc GetSystemAnalytics(ContextUnit) returns (ContextUnit);
    rpc GetErrorAnalytics(ContextUnit) returns (ContextUnit);

    // Self-Healing
    rpc DetectSystemErrors(ContextUnit) returns (ContextUnit);
    rpc TriggerSelfHealing(ContextUnit) returns (ContextUnit);
    rpc GetHealingStatus(ContextUnit) returns (ContextUnit);
}
```

## Connecting to Services

```python
from contextcore import create_channel_sync
from contextcore import brain_pb2_grpc, router_pb2_grpc, worker_pb2_grpc

# Create channels
brain_channel = create_channel_sync("localhost:50051")
router_channel = create_channel_sync("localhost:50052")
worker_channel = create_channel_sync("localhost:50053")

# Create stubs
brain_stub = brain_pb2_grpc.BrainServiceStub(brain_channel)
router_stub = router_pb2_grpc.RouterServiceStub(router_channel)
worker_stub = worker_pb2_grpc.WorkerServiceStub(worker_channel)
```

## Compiling Protos

After editing any `.proto` file, regenerate Python stubs:

```bash
cd services/contextcore
./compile_protos.sh
```

:::caution[Proto Compatibility Rules]
- **Never** remove or renumber existing fields
- Add new fields as `optional` for backward compatibility
- After editing protos, all downstream services must update their stubs
:::

## Token Transmission

Authorization tokens are passed via gRPC metadata:

```python
metadata = [("authorization", f"Bearer {token_data}")]
response = stub.QueryMemory(request, metadata=metadata)
```

Every service has a `TokenValidationInterceptor` that extracts and verifies the token before the RPC handler runs.
