---
title: Data Sources
description: Connect to various data sources using Connectors and Providers.
---

ContextRouter can retrieve information from multiple sources simultaneously. Data sources are divided into two categories based on their purpose and behavior.

## Connectors vs Providers

Understanding the difference is key to architecting your system:

| Aspect | Connectors | Providers |
|--------|------------|-----------|
| **Purpose** | Fetch live, raw data | Access indexed knowledge |
| **Data Type** | Real-time, external | Persisted, internal |
| **Interface** | `connect()` generator | `read()` / `write()` |
| **Examples** | Web search, RSS, APIs | Postgres, Vertex AI Search |
| **Use Case** | "What's happening now?" | "What do we know?" |

### When to Use Which?

**Use Connectors when**:
- You need real-time information (news, weather, stock prices)
- Data comes from external APIs you don't control
- The source doesn't support indexing

**Use Providers when**:
- You have a knowledge base to query
- Data is preprocessed and optimized for search
- You need fast, repeatable queries

## Built-in Connectors

### Web Search
Fetch real-time search results from Google Custom Search:

```python
from contextrouter.modules.connectors import WebConnector

connector = WebConnector(config)
async for envelope in connector.connect("latest AI developments"):
    print(f"Title: {envelope.content['title']}")
    print(f"URL: {envelope.metadata['url']}")
```

### File Connector
Ingest local files for processing:

```python
from contextrouter.modules.connectors import FileConnector

# Single file
connector = FileConnector(path="./report.pdf")

# Directory (recursive)
connector = FileConnector(path="./documents/", recursive=True)

async for envelope in connector.connect():
    print(f"Processing: {envelope.metadata['filename']}")
```

Supported formats: `.pdf`, `.md`, `.txt`, `.json`, `.jsonl`

### RSS Connector
Monitor news feeds and blogs:

```python
from contextrouter.modules.connectors import RSSConnector

connector = RSSConnector(config)
async for envelope in connector.connect():
    print(f"Article: {envelope.content['title']}")
    print(f"Published: {envelope.metadata['published']}")
```

### API Connector
Connect to any REST API:

```python
from contextrouter.modules.connectors import APIConnector

connector = APIConnector(
    base_url="https://api.example.com",
    headers={"Authorization": "Bearer token"}
)

async for envelope in connector.connect("/search?q=query"):
    process(envelope.content)
```

## Built-in Providers

### PostgreSQL
The recommended provider for most deployments. Combines:
- **pgvector** for semantic search
- **tsvector** for full-text search
- **ltree** for taxonomy filtering

```python
from contextrouter.modules.providers import PostgresProvider

provider = PostgresProvider(config)
results = await provider.read(query="machine learning", limit=10)
```

### Vertex AI Search
Google's enterprise search service:

```python
from contextrouter.modules.providers import VertexProvider

provider = VertexProvider(config)
results = await provider.read(query="product documentation", limit=10)
```

### Google Cloud Storage
Asset storage for documents and media:

```python
from contextrouter.modules.providers import GCSProvider

provider = GCSProvider(config)
await provider.write(envelope, path="documents/report.pdf")
```

## How They Work Together

In a typical RAG flow, both are used:

```
User Query
    │
    ▼
┌──────────────────────────────────────────────┐
│              Cortex (Retrieve Node)           │
│                                              │
│   ┌─────────────┐        ┌─────────────┐    │
│   │  Providers  │        │ Connectors  │    │
│   │             │        │             │    │
│   │  • Postgres │        │  • Web      │    │
│   │  • Vertex   │        │  • RSS      │    │
│   └──────┬──────┘        └──────┬──────┘    │
│          │                      │            │
│          └──────────┬───────────┘            │
│                     │                        │
│                     ▼                        │
│              Deduplicate & Merge             │
│                     │                        │
│                     ▼                        │
│                  Rerank                      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
                Retrieved Context
```

## Configuration

### In settings.toml

```toml
[providers]
default = "postgres"

[postgres]
host = "localhost"
port = 5432
database = "contextrouter"
user = "postgres"
password = "${POSTGRES_PASSWORD}"

[vertex]
project_id = "my-project"
datastore_id = "my-datastore"

[connectors.web]
google_api_key = "${GOOGLE_API_KEY}"
google_cse_id = "${GOOGLE_CSE_ID}"
max_results = 10

[connectors.rss]
feeds = [
    "https://news.ycombinator.com/rss",
    "https://feeds.feedburner.com/TechCrunch"
]
```

### Runtime Selection

Override the provider per-request:

```python
runtime_settings = {
    "provider": "vertex",  # Use Vertex instead of default
    "web_search_enabled": True,  # Enable web connector
}

async for event in runner.stream(query, runtime_settings=runtime_settings):
    process(event)
```

## Learn More

- **[Connectors](/data-sources/connectors/)** — Detailed connector setup and custom connectors
- **[Storage Providers](/data-sources/providers/)** — Database configuration and hybrid search
- **[Registry System](/core/registry/)** — How to register custom data sources
