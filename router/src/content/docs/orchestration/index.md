---
title: Agent Orchestration
description: Building agent workflows with LangGraph and ContextRouter.
---

ContextRouter uses **LangGraph** for sophisticated agent orchestration. This enables complex, multi-step workflows with state management, conditional routing, and error handling.

## Overview

Agent orchestration in ContextRouter is built on:

- **LangGraph** — State machine framework for agent workflows
- **ContextUnit Protocol** — Consistent data exchange format
- **State Management** — Persistent state across workflow steps
- **Conditional Routing** — Dynamic decision-making

## Workflow Structure

```
┌────────────────────────────────────────────────────────────┐
│                    Agent Workflow                           │
│                                                            │
│   Start → Agent 1 → Decision → Agent 2 → ... → End        │
│            │         │          │                          │
│            ▼         ▼          ▼                          │
│         State    Condition   State                          │
└────────────────────────────────────────────────────────────┘
```

## Building Agent Graphs

### Simple Linear Workflow

```python
from contextrouter.core import FlowManager
from contextcore import ContextUnit, ContextToken

# Define workflow
workflow = FlowManager()

@workflow.node("start")
async def start_node(state):
    # Initial processing
    return {"step": "started"}

@workflow.node("process")
async def process_node(state):
    # Main processing
    return {"step": "processed"}

@workflow.node("end")
async def end_node(state):
    # Finalization
    return {"step": "completed"}

# Connect nodes
workflow.add_edge("start", "process")
workflow.add_edge("process", "end")
```

### Conditional Routing

```python
@workflow.conditional("route")
async def route_decision(state):
    if state.get("needs_retrieval"):
        return "retrieve"
    else:
        return "generate"

# Conditional edges
workflow.add_conditional_edges("route", route_decision)
```

## State Management

State is managed through ContextUnit:

```python
unit = ContextUnit(
    unit_id=uuid4(),
    trace_id=uuid4(),
    payload={"workflow_state": {...}},
    provenance=["workflow:start", "workflow:process"]
)

# State persists across nodes
async def process_node(state):
    current_state = state.payload.get("workflow_state", {})
    current_state["processed"] = True
    state.payload["workflow_state"] = current_state
    state.provenance.append("workflow:processed")
    return state
```

## Multi-Instance Safe State

For production deployments, state is shared across instances:

```python
from contextrouter.core.state import SharedStateStore

store = SharedStateStore()

# Store state
await store.set_shared_state(
    key=f"workflow:{unit.trace_id}",
    value=state,
    ttl=3600
)

# Retrieve state
state = await store.get_shared_state(f"workflow:{unit.trace_id}")
```

## Error Handling

Workflows include error recovery:

```python
@workflow.node("process")
async def process_node(state):
    try:
        # Process
        return {"status": "success"}
    except Exception as e:
        # Error recovery
        return {"status": "error", "error": str(e)}
```

## Agent Registration

Register agents for orchestration:

```python
from contextrouter.core import agent_registry

@agent_registry.register("my_agent")
class MyAgent(BaseAgent):
    async def process(self, unit: ContextUnit, token: ContextToken):
        # Agent logic
        return result_unit
```

## Integration with Services

### ContextBrain

```python
from contextbrain import BrainClient

brain_client = BrainClient()

# Query knowledge base
results = brain_client.query_memory(query_unit, token=token)
```

### ContextWorker

```python
from contextworker import WorkerClient

worker_client = WorkerClient()

# Start background workflow
result = worker_client.start_workflow(workflow_unit, token=token)
```

## Best Practices

1. **Use ContextUnit** — All data exchange via ContextUnit
2. **Track Provenance** — Update provenance at each step
3. **Handle Errors** — Implement error recovery
4. **Share State** — Use shared state for multi-instance deployments
5. **Validate Tokens** — Check ContextToken permissions

## Next Steps

- **[Graph Building](/orchestration/graph/)** — Advanced graph construction
- **[State Management](/orchestration/state/)** — State persistence and sharing
