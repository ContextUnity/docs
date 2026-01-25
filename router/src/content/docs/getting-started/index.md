---
title: Getting Started
description: Quick introduction to ContextRouter and how to get up and running.
---

Welcome to ContextRouter! This guide will help you understand what ContextRouter is and get you up and running quickly.

## What is ContextRouter?

ContextRouter is a **modular AI agent framework** designed for building production-ready agent orchestration systems. It's built on top of LangGraph and provides a clean separation between your agent's decision logic and the technical implementation details.

Think of it as an **AI Gateway** that can:
- **Orchestrate multiple LLM providers** (OpenAI, Anthropic, Vertex AI, Groq, local models)
- **Route requests intelligently** based on latency, cost, and user tier
- **Manage agent workflows** using LangGraph state machines
- **Handle voice I/O** for speech-to-text and text-to-speech
- **Scale across instances** with shared state management

## Key Features

### 🧩 Truly Modular
Every component in ContextRouter can be swapped without changing your agent logic:
- Switch from OpenAI to Anthropic with a config change
- Move from one provider to another without code changes
- Add new data sources by registering a connector

### 🎯 Agent Orchestration
Build sophisticated agent workflows:
- **LangGraph-powered** state management
- **Conditional routing** based on agent decisions
- **Multi-step workflows** with state persistence
- **Error handling** and retry strategies

### 🛡️ Production Ready
Built for real-world deployments:
- **ContextUnit Protocol** for data provenance and audit trails
- **Multi-instance safe state** for horizontal scaling
- **Rate limiting and caching** built-in
- **Voice I/O** for personal assistants
- **Centralized logging** with automatic trace_id propagation

### 🌐 Universal Model Support
Use any LLM provider:
- **Commercial**: OpenAI, Anthropic, Google Vertex AI, Groq
- **Aggregators**: OpenRouter (hundreds of models)
- **Local**: Ollama, vLLM, HuggingFace Transformers

## How It Works

```
Your App → ContextRouter Cortex → Agent Graph → Response
              (Decision Logic)    (LangGraph)   (ContextUnit)
```

1. **Your application** sends a ContextUnit to ContextRouter
2. **The Cortex** (powered by LangGraph) decides what to do:
   - Which agent should handle this?
   - What's the next step in the workflow?
   - Should we route to a different provider?
3. **Agent Graph** executes the workflow:
   - State management across steps
   - Conditional branching
   - Error recovery
4. **Response** flows back as ContextUnit with full provenance

## Quick Example

Here's a minimal example:

```python
from contextrouter.cortex.runners import ChatRunner
from contextrouter.core import get_core_config
from contextcore import ContextUnit, ContextToken
from contextcore import setup_logging, get_context_unit_logger, SharedConfig, LogLevel

# Setup logging at application startup
config = SharedConfig(log_level=LogLevel.INFO)
setup_logging(config=config, service_name="contextrouter")

# Get logger with ContextUnit support
logger = get_context_unit_logger(__name__)

# Load configuration
config = get_core_config()

# Create a chat runner
runner = ChatRunner(config)

# Create a query
unit = ContextUnit(
    payload={"message": "What is agent orchestration?"}
)

# Log with ContextUnit (trace_id automatically included)
logger.info("Processing chat request", unit=unit)

token = ContextToken(permissions=("agent:query",))

# Stream a response
async for event in runner.stream(unit, token=token):
    if hasattr(event, 'content'):
        print(event.content, end="", flush=True)
```

That's it! The runner handles:
- Intent detection
- Agent routing
- Workflow orchestration
- Response generation with citations

All operations are automatically logged with `trace_id` for full observability.

## Next Steps

Ready to dive in? Here's your path:

1. **[Installation](/getting-started/installation/)** — Get ContextRouter installed
2. **[Quick Start](/getting-started/quickstart/)** — Build your first agent
3. **[Core Concepts](/core/)** — Understand the architecture
4. **[Logging](/core/guides/logging/)** — Set up centralized logging
5. **[Orchestration](/orchestration/)** — Learn about agent workflows

## Requirements

- **Python 3.11+**
- **pip** or **uv** for package management
- At least one LLM provider configured (Vertex AI, OpenAI, or local)
