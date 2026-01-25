---
title: Getting Started
description: Quick introduction to ContextCommerce and how to get up and running.
---

Welcome to ContextCommerce! This guide will help you understand what ContextCommerce is and get you up and running quickly.

## What is ContextCommerce?

ContextCommerce is a **Django-based e-commerce platform** enhanced with AI agents for intelligent product management, content generation, and automation.

Key capabilities:
- **Admin Copilot** — Interactive Django Admin UI with AI chat
- **Horoshop Integration** — Automated product sync via Horoshop API
- **AI Agents** — Five specialized agents for different workflows
- **Vector Knowledge Base** — Semantic search across products, brands, and articles

## Key Features

### 🤖 AI Agents
Five specialized agents orchestrated by ContextRouter:
- **Overlord** — Supervisor, routes intent and orchestrates tasks
- **Matcher** — Links raw vendor data to canonical products
- **Lexicon** — Researches and generates content
- **Mutator** — Real-time editor assistant
- **Gardener** — Knowledge graph builder

### 🛍️ Product Management
- **HD Catalog** — Single source of truth for products
- **Harvester** — Raw vendor data normalization
- **Matching** — Automated product linking
- **Taxonomy** — Hierarchical category management

### 🔗 Integrations
- **ContextBrain** — Semantic search and knowledge retrieval
- **ContextRouter** — Agent orchestration
- **ContextWorker** — Background task execution
- **ContextCore** — Centralized logging and configuration
- **Horoshop API** — E-commerce platform integration

## How It Works

```
Admin UI → Django Backend → ContextRouter → Agents → HD Catalog
              (HTMX)         (Orchestration)  (AI)     (Database)
```

1. **Admin interacts** with Django Admin UI (chat or forms)
2. **Django backend** processes request and routes to ContextRouter
3. **ContextRouter** orchestrates appropriate agent
4. **Agent executes** workflow (matching, content generation, etc.)
5. **HD Catalog** is updated with results

## Quick Example

Here's a simple agent interaction:

```python
from contextcommerce.core.agents import MatcherAgent
from contextcore import ContextUnit, ContextToken

# Matcher agent matches product
unit = ContextUnit(
    payload={
        "action": "match_product",
        "supplier_product_id": 123
    }
)

token = ContextToken(permissions=("catalog:read", "catalog:write"))

# Process matching
result = await matcher_agent.process(unit, token=token)
```

## Next Steps

Ready to dive in? Here's your path:

1. **[Installation](/getting-started/installation/)** — Get ContextCommerce installed
2. **[Architecture](/architecture/)** — Understand system architecture
3. **[Agents](/agents/)** — Learn about the five agents
4. **[Horoshop Integration](/architecture/horoshop/)** — Set up API sync

## Logging

ContextCommerce uses ContextCore's centralized logging system:

```python
# Logging is automatically configured in manage.py
from contextcore import get_context_unit_logger

logger = get_context_unit_logger(__name__)
logger.info("Processing request", unit=context_unit)
```

All logs automatically include `trace_id` and `unit_id` for full observability. See [ContextCore Logging Guide](/core/guides/logging/) for details.

## Requirements

- **Python 3.11+**
- **Django 4.2+**
- **PostgreSQL 14+** (for HD Catalog)
- **ContextUnity services** (ContextBrain, ContextRouter, ContextWorker, ContextCore)
