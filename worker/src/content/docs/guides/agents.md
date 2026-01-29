---
title: Background Agents
description: Polling-based background agents in ContextWorker
---

ContextWorker provides a registry-based system for background agents — long-running processes that poll for work and execute tasks.

## Agent Registry

Agents register via the `@register` decorator:

```python
from contextworker.registry import register, BaseAgent

@register("myagent")
class MyAgent(BaseAgent):
    name = "myagent"
    
    def __init__(self, config: dict = None):
        super().__init__(config)
        self.poll_interval = config.get("poll_interval", 60)
    
    async def run(self):
        """Main polling loop."""
        while self._running:
            try:
                items = await self.poll_for_work()
                
                for item in items:
                    await self.process(item)
                
                await asyncio.sleep(self.poll_interval)
            except Exception as e:
                logger.error(f"Error: {e}")
                await asyncio.sleep(self.poll_interval)
```

## Built-in Agents

| Agent | Purpose | Poll Interval | Source |
|-------|---------|---------------|--------|
| `gardener` | Enrich pending products via Router AI | 5 min | `agents/gardener.py` |
| `harvester` | Trigger supplier imports | 1 hour | `agents/harvester.py` |
| `lexicon` | Sync terminology to Brain | 15 min | `agents/lexicon.py` |

## Running Agents

### All Agents

```bash
python -m contextworker
```

### Specific Agents

```bash
python -m contextworker --agents gardener harvester
```

### With Custom Config

```bash
TEMPORAL_HOST=temporal.example.com:7233 python -m contextworker --agents gardener
```

## Creating a New Agent

### Step 1: Create Agent Module

Create `src/contextworker/agents/myagent.py`:

```python
"""MyAgent - Background polling agent."""

import asyncio
import logging

from ..registry import register, BaseAgent

logger = logging.getLogger(__name__)


@register("myagent")
class MyAgent(BaseAgent):
    """Polls for pending items and processes them."""
    
    name = "myagent"
    
    async def run(self):
        logger.info(f"Starting {self.name}")
        
        while self._running:
            try:
                # Poll for work
                items = await self.poll_for_work()
                
                if items:
                    logger.info(f"Found {len(items)} items")
                    for item in items:
                        await self.process_item(item)
                
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error: {e}")
                await asyncio.sleep(60)
    
    async def poll_for_work(self) -> list:
        """Query for pending items from your domain package."""
        # Import your domain models here
        from your_package.models import PendingItem
        
        return list(await PendingItem.objects.filter(
            status="pending"
        ).values_list("id", flat=True)[:100])
    
    async def process_item(self, item_id: str):
        """Process a single item."""
        # Call Router graph, external API, etc.
        pass
```

### Step 2: Register in Registry

Update `src/contextworker/registry.py`:

```python
def _load_agents():
    try:
        from .agents import gardener  # noqa
        from .agents import harvester  # noqa
        from .agents import myagent  # noqa  # Add this
    except ImportError as e:
        logger.warning(f"Some agents failed to load: {e}")
```

### Step 3: Test

```bash
# Verify registration
python -c "from contextworker.registry import list_agents; print(list_agents())"

# Run agent
python -m contextworker --agents myagent
```

## BaseAgent API

```python
class BaseAgent:
    name: str = "base"
    
    def __init__(self, config: dict = None):
        self.config = config or {}
        self._running = False
    
    def start(self):
        """Start the agent loop (handles both sync and async)."""
        ...
    
    def stop(self):
        """Signal the agent to stop."""
        self._running = False
    
    def run(self):
        """Override this — main loop (sync or async)."""
        raise NotImplementedError
```

## Best Practices

1. **Handle errors gracefully** — catch exceptions in the loop, don't crash
2. **Respect `_running` flag** — check it in your loop for clean shutdown
3. **Use appropriate poll intervals** — balance freshness vs. load
4. **Import domain models inside methods** — avoid circular imports
5. **Log progress** — use structured logging for observability
