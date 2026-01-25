---
title: Integration & Protocols
description: Connect ContextRouter to frontends, other agents, and observability tools.
---

ContextRouter provides standardized protocols for integrating with external systems. This includes streaming events to UIs, communicating between agents, and monitoring with observability tools.

## AG-UI Protocol

The **Agent-to-UI** protocol defines how events flow from your agent to the frontend, enabling real-time streaming interfaces.

### Event Types

| Event | Description | Use Case |
|-------|-------------|----------|
| `text_delta` | Incremental text chunk | Streaming response display |
| `tool_call_start` | Tool execution began | Show loading indicator |
| `tool_call_end` | Tool execution completed | Update UI with result |
| `citations` | Source citations | Display references |
| `suggestions` | Follow-up suggestions | Show related questions |
| `state_update` | Agent state changed | Debug/status display |
| `error` | Error occurred | Show error message |

### Using AG-UI

```python
from contextrouter.modules.protocols.agui import AGUIMapper

# Create mapper
mapper = AGUIMapper()

# Stream events to UI
async def stream_to_ui(runner, query):
    async for internal_event in runner.stream(query):
        # Convert to AG-UI format
        ui_event = mapper.map(internal_event)
        
        # Send to frontend (e.g., via SSE)
        yield f"data: {ui_event.to_json()}\n\n"
```

### Frontend Integration (TypeScript)

```typescript
interface AGUIEvent {
  type: 'text_delta' | 'citations' | 'suggestions' | 'error';
  data: unknown;
  timestamp: string;
}

// Connect to event stream
const eventSource = new EventSource('/api/chat/stream');

eventSource.onmessage = (event) => {
  const aguiEvent: AGUIEvent = JSON.parse(event.data);
  
  switch (aguiEvent.type) {
    case 'text_delta':
      appendToResponse(aguiEvent.data.delta);
      break;
    case 'citations':
      displayCitations(aguiEvent.data.citations);
      break;
    case 'suggestions':
      showSuggestions(aguiEvent.data.suggestions);
      break;
    case 'error':
      handleError(aguiEvent.data);
      break;
  }
};
```

### FastAPI Example

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/chat/stream")
async def chat_stream(message: str):
    async def generate():
        async for event in runner.stream(message):
            ui_event = mapper.map(event)
            yield f"data: {ui_event.to_json()}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

## A2A Protocol (Agent-to-Agent)

For multi-agent systems, the **A2A protocol** enables structured communication between agents.

### Message Format

```python
from contextrouter.modules.protocols.a2a import A2AMessage

# Create a task request
message = A2AMessage(
    id="msg_123",
    sender="research_agent",
    receiver="summarization_agent",
    task="summarize",
    payload={
        "documents": retrieved_docs,
        "max_length": 500,
        "style": "bullet_points"
    },
    priority="high",
    deadline=datetime.now() + timedelta(seconds=30)
)

# Send to another agent
response = await agent_bus.send(message)
```

### Use Cases

- **Task delegation** — Research agent asks summarization agent to condense findings
- **Parallel processing** — Split work across specialized agents
- **Orchestration** — Coordinator agent manages workflow across multiple workers

## Observability with Langfuse

ContextRouter integrates with [Langfuse](https://langfuse.com) for comprehensive tracing and analytics.

### Setup

```bash
export LANGFUSE_PUBLIC_KEY=pk-lf-...
export LANGFUSE_SECRET_KEY=sk-lf-...
export LANGFUSE_HOST=https://cloud.langfuse.com
```

Or in settings:

```toml
[observability]
langfuse_enabled = true
langfuse_public_key = "${LANGFUSE_PUBLIC_KEY}"
langfuse_secret_key = "${LANGFUSE_SECRET_KEY}"
langfuse_host = "https://cloud.langfuse.com"
trace_all_requests = true
```

### Automatic Tracing

With Langfuse enabled, ContextRouter automatically traces:

- **LLM calls** — Model, tokens, latency, cost
- **Retrieval** — Queries, results, scores
- **Graph execution** — Node transitions, timing
- **Errors** — Full stack traces

### Custom Spans

Add custom tracing to your code:

```python
from contextrouter.modules.observability import trace_span, get_langfuse

langfuse = get_langfuse()

# Decorator for functions
@trace_span("custom_processing")
async def process_data(data):
    # Your code here
    return result

# Context manager for blocks
async def my_function():
    with langfuse.span(name="data_validation") as span:
        span.update(input={"data_size": len(data)})
        validated = validate(data)
        span.update(output={"valid": validated})
```

### Viewing Traces

In the Langfuse dashboard, you can:

- **View request timelines** — See each step and its duration
- **Analyze token usage** — Track costs across models
- **Debug errors** — Full context for failures
- **Compare performance** — A/B test different configurations

## Webhooks

Send events to external systems:

```toml
[webhooks]
enabled = true
endpoints = [
    "https://api.example.com/contextrouter-webhook",
    "https://slack.com/api/webhook/..."
]
events = ["response_complete", "error", "ingestion_complete"]
secret = "${WEBHOOK_SECRET}"
```

### Webhook Payload

```json
{
  "event": "response_complete",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "query": "What is RAG?",
    "response_length": 500,
    "citations_count": 3,
    "latency_ms": 1200
  },
  "signature": "sha256=..."
}
```

## Best Practices

1. **Use AG-UI for all user-facing streams** — Consistent event format across clients

2. **Enable Langfuse in production** — Essential for debugging and optimization

3. **Secure webhooks** — Always verify signatures on incoming webhook requests

4. **Monitor latency** — Set alerts for response times exceeding thresholds

5. **Log trace IDs** — Include Langfuse trace IDs in error logs for correlation
