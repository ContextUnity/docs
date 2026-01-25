---
title: Core Concepts
description: Fundamental architecture and design principles of ContextRouter.
---

Understanding ContextRouter's core concepts will help you build better agents and extend the framework effectively. This guide covers the fundamental architecture that makes ContextRouter modular, secure, and production-ready.

## The Big Picture

ContextRouter is built on a simple but powerful principle: **separate what you want to do from how you do it**.

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR APPLICATION                         │
│                    (FastAPI, CLI, Telegram Bot)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Messages
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           CORTEX                                 │
│                  "The Brain" - Decision Logic                    │
│                                                                  │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│   │  Intent  │ → │ Retrieve │ → │ Generate │ → │ Suggest  │    │
│   │Detection │   │  Context │   │ Response │   │Follow-ups│    │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│                                                                  │
│                    Powered by LangGraph                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          MODULES                                 │
│                "The Body" - Technical Implementation             │
│                                                                  │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│   │    Models     │  │   Providers   │  │  Connectors   │      │
│   │ (LLM, Embed)  │  │   (Storage)   │  │    (Data)     │      │
│   │               │  │               │  │               │      │
│   │ • Vertex      │  │ • Postgres    │  │ • Web Search  │      │
│   │ • OpenAI      │  │ • Vertex AI   │  │ • RSS Feeds   │      │
│   │ • Anthropic   │  │ • GCS         │  │ • Files       │      │
│   │ • Ollama      │  │               │  │ • APIs        │      │
│   └───────────────┘  └───────────────┘  └───────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

This separation means you can:
- **Change your LLM provider** without touching your agent logic
- **Switch databases** without rewriting retrieval code
- **Add new data sources** by just registering a new connector
- **Test components in isolation** with mock implementations

## Key Components

### The Cortex

The Cortex is the "brain" of your agent. It's implemented using **LangGraph** and defines the decision-making workflow:

1. **Receives messages** from your application
2. **Detects intent** to understand what the user wants
3. **Routes the request** to appropriate handlers
4. **Orchestrates retrieval** from multiple sources
5. **Generates responses** with proper citations
6. **Suggests follow-ups** for continued conversation

The Cortex doesn't know *how* to search a database or call an LLM — it just knows *when* to do these things and in what order.

→ [Learn more about the Cortex](/cortex/)

### Modules

Modules provide the actual capabilities:

- **Models** — LLM and embedding providers (Vertex, OpenAI, local)
- **Providers** — Storage backends for your knowledge base (Postgres, Vertex AI Search)
- **Connectors** — Data fetchers for live/external data (Web, RSS, APIs)
- **Transformers** — Data enrichment (NER, taxonomy, summarization)

Each module implements a standard interface, making them interchangeable.

→ [Explore Models](/models/) | [Data Sources](/data-sources/)

### The Bisquit Protocol

Every piece of data in ContextRouter is wrapped in a `BisquitEnvelope`. This envelope tracks:

- **Where the data came from** (provenance)
- **What transformations were applied** (trace)
- **Who is authorized to access it** (token)

This means you can always trace any piece of information back to its source — critical for production AI systems where you need to explain your agent's responses.

→ [Understand Bisquit](/core/bisquit/)

### The Registry System

Components are registered dynamically using decorators:

```python
@register_connector("my_source")
class MyConnector(BaseConnector):
    async def connect(self, query):
        # Your implementation
        yield BisquitEnvelope(...)
```

This enables hot-swapping, plugin architectures, and A/B testing of different implementations.

→ [Registry Guide](/core/registry/)

## Design Principles

ContextRouter follows these core principles:

### 1. Separation of Concerns
The Cortex handles *logic*, Modules handle *implementation*. Neither should leak into the other.

### 2. Immutability
LangGraph state is treated as immutable. Nodes return partial updates, never mutate state directly.

### 3. Provenance First
Every data transformation is traced. You should always be able to answer "where did this come from?"

### 4. Registry-First Components
All components are registered and can be swapped at runtime. No hardcoded dependencies.

### 5. Type Safety
- **Pydantic models** for runtime entities (validation, serialization)
- **TypedDict** for JSON contracts (API responses, storage formats)
- **Strict typing** throughout the codebase

### 6. Configuration Hierarchy
Settings flow from defaults → environment → TOML → runtime overrides. Each layer can override the previous.

## What's Next?

Now that you understand the architecture, dive deeper into specific areas:

- **[Bisquit Protocol](/core/bisquit/)** — Data provenance and security
- **[Registry System](/core/registry/)** — Component registration and plugins
- **[Cortex](/cortex/)** — LangGraph orchestration
- **[Models](/models/)** — LLM and embedding configuration
