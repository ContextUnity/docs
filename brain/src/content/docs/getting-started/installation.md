---
title: Installation
description: Install ContextBrain and set up your environment.
---

## Prerequisites

- **Python 3.11+**
- **PostgreSQL 14+** with pgvector extension (or LanceDB/Vertex AI)
- **ContextCore** package installed

## Installation

### Using pip

```bash
pip install contextbrain
```

### Using uv

```bash
uv add contextbrain
```

## Database Setup

### PostgreSQL + pgvector

1. Install PostgreSQL 14+ and pgvector extension:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-14 postgresql-14-pgvector

# macOS (Homebrew)
brew install postgresql@14
brew install pgvector
```

2. Create database and enable extension:

```sql
CREATE DATABASE contextbrain;
\c contextbrain
CREATE EXTENSION vector;
```

3. Configure connection:

```bash
export CONTEXTBRAIN_DB_URL="postgresql://user:password@localhost/contextbrain"
```

### LanceDB

LanceDB is embedded and requires no setup. Just install:

```bash
pip install lancedb
```

### Vertex AI Search

1. Set up Google Cloud project
2. Enable Vertex AI Search API
3. Configure credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export VERTEX_PROJECT_ID="your-project-id"
```

## Configuration

Create `settings.toml`:

```toml
[storage]
backend = "postgres"  # or "lancedb" or "vertex"
db_url = "postgresql://user:password@localhost/contextbrain"

[rag]
rerank_model = "vertex/reranker-001"
rerank_top_k = 20

[security]
enabled = true
```

Or use environment variables:

```bash
export CONTEXTBRAIN_STORAGE_BACKEND="postgres"
export CONTEXTBRAIN_DB_URL="postgresql://..."
export CONTEXTBRAIN_RAG_RERANK_MODEL="vertex/reranker-001"
```

## Logging Configuration

ContextBrain uses ContextCore's centralized logging system. Logging is automatically configured in `service.py`:

```python
# Logging is set up automatically in serve() function
from contextcore import setup_logging, load_shared_config_from_env

config = load_shared_config_from_env()
setup_logging(config=config, service_name="contextbrain")
```

### Environment Variables

Configure logging via environment variables:

```bash
# .env
LOG_LEVEL=INFO              # DEBUG, INFO, WARNING, ERROR, CRITICAL
SERVICE_NAME=contextbrain
SERVICE_VERSION=1.0.0
OTEL_ENABLED=false          # Enable OpenTelemetry
OTEL_ENDPOINT=http://otel-collector:4317
```

### Using Loggers

```python
from contextcore import get_context_unit_logger
from contextcore import ContextUnit

logger = get_context_unit_logger(__name__)

# Log with ContextUnit (trace_id automatically included)
unit = ContextUnit(payload={"query": "test"})
logger.info("Processing query", unit=unit)
```

See the [ContextCore Logging Guide](/core/guides/logging/) for complete documentation.

## Verify Installation

```python
from contextbrain import BrainClient
from contextcore import ContextUnit, ContextToken
from contextcore import setup_logging, get_context_unit_logger, SharedConfig, LogLevel

# Setup logging
config = SharedConfig(log_level=LogLevel.INFO)
setup_logging(config=config, service_name="contextbrain")
logger = get_context_unit_logger(__name__)

# Create client
client = BrainClient(host="localhost:50051")

# Test query
unit = ContextUnit(payload={"query": "test"})
token = ContextToken(permissions=("knowledge:read",))

# Log query
logger.info("Testing query", unit=unit)

# Should not raise errors
async for result in client.query_memory(unit, token=token):
    logger.debug("Retrieved result", unit=result)
    print(result.payload)
```

## Next Steps

- **[Quick Start](/getting-started/quickstart/)** — Build your first RAG query
- **[RAG Pipeline](/rag/)** — Understand retrieval and reranking
- **[Logging](/core/guides/logging/)** — Set up centralized logging
- **[Storage](/storage/postgres/)** — Configure your vector database
