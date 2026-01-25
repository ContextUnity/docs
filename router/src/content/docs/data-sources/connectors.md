---
title: Connectors
description: Fetch live data from Web, RSS, Files, and custom APIs.
---

Connectors fetch **live** or **raw** data from external sources. Unlike Providers (which query indexed knowledge), Connectors are designed for "at-the-edge" data gathering where you need real-time or unprocessed information.

## Web Search Connector

Fetches real-time search results from Google Custom Search Engine.

### Setup

1. Create a Custom Search Engine at [cse.google.com](https://cse.google.com)
2. Get an API key from [Google Cloud Console](https://console.cloud.google.com)
3. Configure:

```bash
export GOOGLE_API_KEY=your-api-key
export GOOGLE_CSE_ID=your-cse-id
```

Or in settings:

```toml
[connectors.web]
google_api_key = "${GOOGLE_API_KEY}"
google_cse_id = "${GOOGLE_CSE_ID}"
max_results = 10
```

### Usage

```python
from contextrouter.modules.connectors import WebConnector

connector = WebConnector(config)

async for envelope in connector.connect("latest Python 3.12 features"):
    print(f"Title: {envelope.content['title']}")
    print(f"URL: {envelope.metadata['url']}")
    print(f"Snippet: {envelope.content['snippet'][:100]}...")
    print("---")
```

### Output Fields

Each envelope contains:
- `content.title` — Page title
- `content.snippet` — Search result snippet
- `metadata.url` — Full URL
- `metadata.fetched_at` — Timestamp
- `provenance` — `["connector:web"]`

---

## File Connector

Ingests local files for processing or immediate use.

### Supported Formats

| Format | Extensions | Notes |
|--------|------------|-------|
| PDF | `.pdf` | Text extraction, OCR if needed |
| Markdown | `.md` | Preserves formatting |
| Plain text | `.txt` | Raw text |
| JSON | `.json`, `.jsonl` | Structured data |

### Usage

```python
from contextrouter.modules.connectors import FileConnector

# Single file
connector = FileConnector(path="./report.pdf")

# Directory (non-recursive)
connector = FileConnector(path="./documents/")

# Directory (recursive)
connector = FileConnector(path="./documents/", recursive=True)

# With file filter
connector = FileConnector(
    path="./documents/",
    recursive=True,
    extensions=[".pdf", ".md"]  # Only these types
)

async for envelope in connector.connect():
    print(f"File: {envelope.metadata['filename']}")
    print(f"Size: {envelope.metadata['size']} bytes")
    print(f"Content preview: {envelope.content[:200]}...")
```

---

## RSS Connector

Monitors RSS and Atom feeds for new content.

### Configuration

```toml
[connectors.rss]
feeds = [
    "https://news.ycombinator.com/rss",
    "https://feeds.feedburner.com/TechCrunch",
    "https://blog.langchain.dev/rss/"
]
fetch_full_content = true  # Try to fetch full article
max_age_hours = 24         # Only items from last 24 hours
```

### Usage

```python
from contextrouter.modules.connectors import RSSConnector

connector = RSSConnector(config)

async for envelope in connector.connect():
    print(f"Title: {envelope.content['title']}")
    print(f"Link: {envelope.content['link']}")
    print(f"Published: {envelope.metadata['published']}")
    print(f"Author: {envelope.metadata.get('author', 'Unknown')}")
```

---

## API Connector

Generic connector for REST APIs.

### Usage

```python
from contextrouter.modules.connectors import APIConnector

connector = APIConnector(
    base_url="https://api.example.com",
    headers={
        "Authorization": "Bearer your-token",
        "Content-Type": "application/json"
    }
)

# GET request
async for envelope in connector.connect("/search?q=python"):
    print(envelope.content)

# With custom parameters
async for envelope in connector.connect("/users", params={"limit": 100}):
    for user in envelope.content["users"]:
        print(user["name"])
```

---

## Creating Custom Connectors

Build your own connector for any data source:

```python
from contextrouter.core.registry import register_connector
from contextrouter.core.interfaces import BaseConnector
from contextrouter.core.bisquit import BisquitEnvelope
from datetime import datetime

@register_connector("slack")
class SlackConnector(BaseConnector):
    """Fetch messages from Slack channels."""
    
    def __init__(self, config):
        self.token = config.slack_token
        self.client = SlackClient(self.token)
    
    async def connect(self, query: str):
        """
        Search Slack for messages matching the query.
        
        Yields BisquitEnvelope for each message found.
        """
        results = await self.client.search_messages(
            query=query,
            count=50
        )
        
        for message in results.messages:
            yield BisquitEnvelope(
                content={
                    "text": message.text,
                    "user": message.user_name,
                    "channel": message.channel_name,
                },
                provenance=["connector:slack"],
                metadata={
                    "timestamp": message.ts,
                    "thread_ts": message.thread_ts,
                    "reactions": [r.name for r in message.reactions],
                    "fetched_at": datetime.now().isoformat(),
                }
            )
```

### Using Your Custom Connector

Once registered, it's available everywhere:

```python
from contextrouter.core.registry import select_connector

# Get the connector
slack = select_connector("slack")

# Use it
async for envelope in slack.connect("project roadmap"):
    print(f"{envelope.content['user']}: {envelope.content['text']}")
```

### Enabling in RAG

Add to runtime settings:

```python
runtime_settings = {
    "connectors": ["slack", "web"],  # Include your connector
}
```

---

## Best Practices

### Rate Limiting

Implement rate limiting for external APIs:

```python
from asyncio import sleep

@register_connector("rate_limited_api")
class RateLimitedConnector(BaseConnector):
    def __init__(self, config):
        self.requests_per_second = 2
        self.last_request = 0
    
    async def connect(self, query: str):
        # Enforce rate limit
        elapsed = time.time() - self.last_request
        if elapsed < 1 / self.requests_per_second:
            await sleep(1 / self.requests_per_second - elapsed)
        
        self.last_request = time.time()
        # ... fetch data
```

### Error Handling

Handle failures gracefully:

```python
async def connect(self, query: str):
    try:
        results = await self.api.search(query)
    except RateLimitError:
        logger.warning("Rate limited, waiting...")
        await sleep(60)
        results = await self.api.search(query)
    except APIError as e:
        logger.error(f"API error: {e}")
        return  # Yield nothing on failure
    
    for result in results:
        yield BisquitEnvelope(...)
```

### Caching

Cache results when appropriate:

```python
from functools import lru_cache

@register_connector("cached_api")
class CachedConnector(BaseConnector):
    @lru_cache(maxsize=100)
    def _fetch_cached(self, query: str):
        # Sync fetch for caching
        return self.api.search_sync(query)
    
    async def connect(self, query: str):
        results = self._fetch_cached(query)
        for result in results:
            yield BisquitEnvelope(...)
```
