---
title: Configuration Reference
description: Complete reference for all ContextRouter settings and environment variables.
---

This page documents all configuration options available in ContextRouter.

## Configuration Loading

Settings are loaded in this order (later overrides earlier):

1. **Built-in defaults**
2. **Environment variables** (`.env` file and system env)
3. **TOML file** (`settings.toml`)
4. **Runtime settings** (passed to functions)

```python
from contextrouter.core import get_core_config

# Automatic loading
config = get_core_config()

# Custom paths
config = get_core_config(
    env_path="./custom.env",
    toml_path="./custom-settings.toml"
)
```

## Model Settings

```toml
[models]
default_llm = "vertex/gemini-2.0-flash"
default_embeddings = "vertex/text-embedding-004"
temperature = 0.7
max_output_tokens = 4096
timeout_sec = 60
max_retries = 3
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `default_llm` | string | required | Default LLM in format `provider/model` |
| `default_embeddings` | string | required | Default embedding model |
| `temperature` | float | 0.7 | Generation randomness (0-2) |
| `max_output_tokens` | int | 4096 | Maximum response tokens |
| `timeout_sec` | int | 60 | Request timeout in seconds |
| `max_retries` | int | 3 | Retry attempts on failure |

## Provider Settings

### Google Vertex AI

```toml
[vertex]
project_id = "your-gcp-project"
location = "us-central1"
datastore_id = "your-datastore-id"
```

| Setting | Env Var | Description |
|---------|---------|-------------|
| `project_id` | `VERTEX_PROJECT_ID` | GCP project ID |
| `location` | `VERTEX_LOCATION` | GCP region |
| `datastore_id` | `VERTEX_DATASTORE_ID` | Vertex AI Search datastore |

### PostgreSQL

```toml
[postgres]
host = "localhost"
port = 5432
database = "contextrouter"
user = "postgres"
password = "${POSTGRES_PASSWORD}"
pool_size = 10
ssl_mode = "prefer"
```

| Setting | Default | Description |
|---------|---------|-------------|
| `host` | localhost | Database host |
| `port` | 5432 | Database port |
| `database` | - | Database name |
| `user` | - | Database user |
| `password` | - | Database password |
| `pool_size` | 10 | Connection pool size |
| `ssl_mode` | prefer | SSL mode |

### OpenAI

```toml
[openai]
api_key = "${OPENAI_API_KEY}"
organization = "org-..."
base_url = "https://api.openai.com/v1"
```

### Anthropic

```toml
[anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

### Local Models

```toml
[local]
ollama_base_url = "http://localhost:11434/v1"
vllm_base_url = "http://localhost:8000/v1"
```

| Env Var | Description |
|---------|-------------|
| `LOCAL_OLLAMA_BASE_URL` | Ollama server URL |
| `LOCAL_VLLM_BASE_URL` | vLLM server URL |

## RAG Settings

```toml
[rag]
# Provider selection
provider = "postgres"

# Reranking
reranking_enabled = true
reranker = "vertex"

# Hybrid search (Postgres only)
hybrid_fusion = "rrf"
enable_fts = true
rrf_k = 60
hybrid_vector_weight = 0.7
hybrid_text_weight = 0.3

# Result limits
general_retrieval_enabled = true
general_retrieval_final_count = 10
max_retrieval_queries = 3

# Per-source limits
max_books = 5
max_videos = 3
max_qa = 5
max_web = 3
max_knowledge = 5

# Citations
citations_enabled = true
citations_books = 3
citations_videos = 2
citations_qa = 3
citations_web = 2

# Knowledge graph
graph_facts_enabled = true
max_graph_facts = 50

# Caching
cache_enabled = false
cache_ttl_seconds = 3600

# Blue/green deployment
data_store_id_blue = ""
data_store_id_green = ""
active_store = "blue"
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `provider` | string | postgres | Retrieval backend |
| `reranking_enabled` | bool | true | Enable second-pass reranking |
| `reranker` | string | vertex | Reranker: vertex, mmr, none |
| `hybrid_fusion` | string | rrf | Fusion method: rrf, weighted |
| `enable_fts` | bool | true | Enable full-text search |
| `general_retrieval_final_count` | int | 10 | Max total documents |

## Ingestion Settings

```toml
[ingestion.rag]
enabled = true
output_dir = "./ingestion_output"

[ingestion.rag.preprocess]
chunk_size = 1000
chunk_overlap = 200
min_chunk_size = 100

[ingestion.rag.taxonomy]
builder = "llm"
max_depth = 4
min_samples_per_category = 3

[ingestion.rag.graph]
builder_mode = "hybrid"
cognee_enabled = true
max_entities_per_chunk = 10

[ingestion.rag.shadow]
include_keywords = true
include_entities = true
include_summary = true

[ingestion.rag.skip]
preprocess = false
structure = false
index = false
export = false
deploy = false
```

## Connector Settings

```toml
[connectors.web]
google_api_key = "${GOOGLE_API_KEY}"
google_cse_id = "${GOOGLE_CSE_ID}"
max_results = 10

[connectors.rss]
feeds = [
    "https://example.com/feed.xml"
]
fetch_full_content = true
max_age_hours = 24
```

## Security Settings

```toml
[security]
require_auth = true
allowed_origins = ["https://example.com"]
rate_limit_rpm = 60

[security.tokens]
secret_key = "${TOKEN_SECRET_KEY}"
expiry_hours = 24
algorithm = "HS256"
```

## Observability Settings

```toml
[observability]
langfuse_enabled = true
langfuse_public_key = "${LANGFUSE_PUBLIC_KEY}"
langfuse_secret_key = "${LANGFUSE_SECRET_KEY}"
langfuse_host = "https://cloud.langfuse.com"
trace_all_requests = true
log_level = "INFO"
```

| Env Var | Description |
|---------|-------------|
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key |
| `LANGFUSE_HOST` | Langfuse server URL |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) |

## Plugin Settings

```toml
[plugins]
paths = [
    "~/my-plugins",
    "./custom-extensions"
]
auto_discover = true
```

## Router Settings

```toml
[router]
graph = "rag_retrieval"
override_path = ""  # Optional: path to custom graph function
```

## Environment Variable Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VERTEX_PROJECT_ID` | GCP project ID | For Vertex AI |
| `VERTEX_LOCATION` | GCP region | For Vertex AI |
| `OPENAI_API_KEY` | OpenAI API key | For OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Anthropic |
| `GROQ_API_KEY` | Groq API key | For Groq |
| `OPENROUTER_API_KEY` | OpenRouter API key | For OpenRouter |
| `POSTGRES_PASSWORD` | Database password | For Postgres |
| `GOOGLE_API_KEY` | Google API key | For web search |
| `GOOGLE_CSE_ID` | Custom Search Engine ID | For web search |
| `LOCAL_OLLAMA_BASE_URL` | Ollama server URL | For local models |
| `LOCAL_VLLM_BASE_URL` | vLLM server URL | For local models |
| `RAG_PROVIDER` | Default RAG provider | Optional |
| `RAG_EMBEDDINGS_MODEL` | Override embedding model | Optional |
| `LOG_LEVEL` | Logging verbosity | Optional |
