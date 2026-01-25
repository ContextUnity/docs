---
title: Agents Overview
description: The five specialized AI agents in ContextCommerce.
---

ContextCommerce uses five specialized agents orchestrated by ContextRouter. Each agent handles specific workflows in the e-commerce platform.

## Agent Architecture

```
User Request
    │
    ▼
┌────────────────────────────────────────────────────────────┐
│                    OVERLORD (Supervisor)                    │
│  Routes intent and orchestrates multi-step tasks           │
└────────────────────────┬───────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌────────┐      ┌────────┐      ┌────────┐
   │MATCHER │      │LEXICON │      │MUTATOR │
   │        │      │        │      │        │
   └────┬───┘      └────┬───┘      └────┬───┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  ┌──────────┐
                  │GARDENER  │
                  │          │
                  └──────────┘
```

## 1. Overlord (The Supervisor)

**Role**: Routes intent within the PIM Chat and orchestrates multi-step tasks.

**Skills**:
- `sync_channel(channel_name)` — Triggers push to external channels (e.g., Horoshop)

**Example**:
```
User: "Import new prices"
Overlord → Triggers Harvester task → Matcher → HD Catalog
```

**Environment**: Django Admin Chat Interface

## 2. Matcher (The Linker)

**Role**: Connects incoming raw data to canonical products.

**Workflow**:
1. Harvester saves `SupplierProduct`
2. Matcher analyzes `raw_name` + `sku`
3. Matcher queries Oscar DB & ContextBrain
4. **Action**: Creates link (if 100% sure) OR puts in `UnmatchedQueue`

**Skills**:
- Semantic search via ContextBrain
- SKU matching
- Confidence scoring

**Environment**: Background Task OR Matcher UI Page

## 3. Lexicon (The Researcher)

**Role**: Background worker that fills the Wiki/Content.

**Trigger**: New `Brand` or `Technology` created without description

**Skills**:
- `perplexity_search(topic)` — Get facts/specs
- `draft_wagtail_page(title, body)` — Creates Draft Page in CMS

**Output**: User sees new item in `/manage/review/` queue

**Example**:
```
New Brand "Mammut" created → Lexicon → Research → Draft Page → Review Queue
```

## 4. Mutator (The Editor)

**Role**: Real-time assistant in the PIM Editor.

**Environment**: Works on `/manage/product/{id}/` page

**Capabilities**:
- Reads current form state (snapshot)
- **Skill: `htmx_update_field(field_id, new_value)`** — Returns HTMX OOB swap
- **Skill: `commit_changes()`** — Saves to DB (creates Wagtail Revision)

**Example**:
```
User: "Rewrite description based on Gore-Tex wiki"
Mutator → Reads Wiki → Generates Text → HTMX Swap → User clicks Save
```

## 5. Gardener (The Ontologist)

**Role**: Background Knowledge Graph builder.

**Skill: `sync_ontology()`**:
- Reads `Product` attributes (e.g., "Gore-Tex")
- Ensures "Gore-Tex" node exists in ContextBrain
- Creates edge: `Product -> USES -> Gore-Tex`

**Example**:
```
Product updated with "Gore-Tex" → Gardener → ContextBrain Graph → Entity Link
```

## Agent Communication

All agents communicate via ContextUnit protocol:

```python
from contextcore import ContextUnit, ContextToken
from contextrouter import FlowManager

# Overlord routes to Matcher
unit = ContextUnit(
    payload={
        "action": "match_product",
        "supplier_product_id": 123
    }
)

# Matcher processes
result = await matcher.process(unit, token=token)
```

## Integration with ContextRouter

Agents are registered with ContextRouter:

```python
from contextrouter.core import agent_registry

@agent_registry.register("matcher")
class MatcherAgent(BaseAgent):
    async def process(self, unit: ContextUnit, token: ContextToken):
        # Match product logic
        pass
```

## Next Steps

- **[Overlord](/agents/overlord/)** — Supervisor agent details
- **[Matcher](/agents/matcher/)** — Product matching workflow
- **[Lexicon](/agents/lexicon/)** — Content research and generation
- **[Mutator](/agents/mutator/)** — Real-time editor assistant
- **[Gardener](/agents/gardener/)** — Knowledge graph builder
