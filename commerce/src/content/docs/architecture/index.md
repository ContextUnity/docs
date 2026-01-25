---
title: Architecture Overview
description: System architecture and component overview of ContextCommerce.
---

ContextCommerce is a Django-based e-commerce platform that integrates AI agents for intelligent product management, content generation, and automation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DJANGO BACKEND                           │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│   │   Admin      │   │   PIM UI     │   │   Agents     │      │
│   │   Copilot    │   │   (HTMX)     │   │   (Router)   │      │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘      │
│          │                  │                  │               │
│          └──────────────────┴──────────────────┘               │
│                            │                                    │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────┐             │
│   │         HD Catalog (SSoT)                    │             │
│   │  • Canonical Products                        │             │
│   │  • Brands & Technologies                     │             │
│   │  • Categories (LTREE)                        │             │
│   └──────────────────────────────────────────────┘             │
│                            │                                    │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────┐             │
│   │         Harvester Module                     │             │
│   │  • Raw vendor data (harvester.* schema)     │             │
│   │  • Normalization & matching                  │             │
│   └──────────────────────────────────────────────┘             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXTUNITY SERVICES                       │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│   │  ContextRouter│  │  ContextBrain│  │ ContextWorker │      │
│   │  (Orchestration)│ │  (RAG/Search)│  │ (Background)  │      │
│   └──────────────┘   └──────────────┘   └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### HD Catalog (Single Source of Truth)

The canonical product database:

- **Canonical Products** — Atoms (physical specs), Identities (IDs), Prices
- **Brands & Technologies** — Managed entities with descriptions
- **Categories** — Hierarchical taxonomy using PostgreSQL LTREE

### Harvester Module

Buffers and normalizes raw vendor data:

- **Supplier Products** — Raw data from vendors (XML, JSON, CSV)
- **Normalization** — Standardized formats and schemas
- **Matching Queue** — Products awaiting canonical matching

### Admin Copilot

Interactive Django Admin UI with AI assistance:

- **Chat Interface** — Natural language commands
- **HTMX Integration** — Real-time UI updates
- **Tool System** — Agent tools for product management

### Agent System

Five specialized agents orchestrated by ContextRouter:

1. **Overlord** — Supervisor, routes intent and orchestrates tasks
2. **Matcher** — Links raw data to canonical products
3. **Lexicon** — Researches and generates content
4. **Mutator** — Real-time editor assistant
5. **Gardener** — Knowledge graph builder

## Integration Points

### ContextRouter

- **Agent Orchestration** — Routes tasks to appropriate agents
- **State Management** — LangGraph-based workflow management
- **Tool Execution** — Agent tools for product operations

### ContextBrain

- **Semantic Search** — Product matching and knowledge retrieval
- **Vector Knowledge Base** — Products, brands, categories, articles
- **Taxonomy Management** — Hierarchical category structures

### ContextWorker

- **Background Tasks** — Long-running syncs and research
- **Workflow Execution** — Durable workflows for complex operations

## Data Flow

### Product Import Flow

```
Vendor Data → Harvester → Normalization → Matcher → HD Catalog
                                    │
                                    ▼
                            ContextBrain (Search)
```

### Content Generation Flow

```
New Brand/Technology → Lexicon → Research → Draft Content → Review Queue
                              │
                              ▼
                        ContextBrain (Knowledge)
```

### Product Editing Flow

```
Admin UI → Mutator → HTMX Update → Save → HD Catalog
              │
              ▼
        ContextBrain (Context)
```

## Security & Permissions

### Permission Model

- **CATALOG_PATCH_*** — Product modification permissions
- **HOROSHOP_*** — Horoshop API access permissions
- **ContextToken** — Capability-based access control

### Multi-Tenant Isolation

- Security scopes per tenant
- ContextToken validation
- Data isolation at database level

## Next Steps

- **[Admin Copilot](/architecture/admin-copilot/)** — Interactive UI with AI agents
- **[Horoshop Integration](/architecture/horoshop/)** — API synchronization
- **[Site Sync](/architecture/site-sync/)** — XML/API data import architecture
