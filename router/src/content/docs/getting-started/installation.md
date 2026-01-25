---
title: Installation
description: How to install ContextRouter and configure your environment.
---

ContextRouter is distributed as a Python package with optional extras for different providers. This guide covers installation options and initial configuration.

## Requirements

- **Python 3.13 or higher**
- **pip**, **uv**, or another Python package manager
- At least one LLM provider (Vertex AI, OpenAI, or local Ollama)

## Basic Installation

Install the core package:

```bash
pip install contextrouter
```

This gives you the framework with minimal dependencies. You'll need to add extras for specific providers.

## Installation with Extras

ContextRouter uses optional dependencies to keep the base package lightweight. Install only what you need:

```bash
# Everything (recommended for development)
pip install contextrouter[all]

# Provider bundles
pip install contextrouter[vertex]           # Google Vertex AI (LLM + Search)
pip install contextrouter[storage]          # PostgreSQL + Google Cloud Storage
pip install contextrouter[models-openai]    # OpenAI + compatible APIs
pip install contextrouter[models-anthropic] # Anthropic Claude
pip install contextrouter[hf-transformers]  # Local HuggingFace models
pip install contextrouter[observability]    # Langfuse + OpenTelemetry

# Combinations
pip install contextrouter[vertex,storage,observability]
```

## Using uv (Recommended)

[uv](https://github.com/astral-sh/uv) is a fast, modern Python package manager that we recommend:

```bash
# Install uv if you haven't
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install ContextRouter
uv pip install contextrouter[all]
```

## Development Installation

For contributing or local development:

```bash
git clone https://github.com/ContextRouter/contextrouter.git
cd contextrouter

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install in development mode with all extras
pip install -e ".[dev,all]"

# Or with uv
uv pip install -e ".[dev,all]"
```

## Verify Installation

Check that ContextRouter is installed correctly:

```bash
# Check version
python -c "import contextrouter; print(contextrouter.__version__)"

# Or use the CLI
contextrouter --version
```

## Environment Configuration

ContextRouter reads configuration from multiple sources (in order of priority):

1. **Runtime settings** (passed directly to functions)
2. **Environment variables**
3. **settings.toml file**
4. **Default values**

### Option 1: Environment Variables

Create a `.env` file in your project root:

```bash
# .env
# Google Vertex AI
VERTEX_PROJECT_ID=your-gcp-project
VERTEX_LOCATION=us-central1

# OpenAI (if using)
OPENAI_API_KEY=sk-...

# Anthropic (if using)
ANTHROPIC_API_KEY=sk-ant-...

# Local models (if using Ollama)
LOCAL_OLLAMA_BASE_URL=http://localhost:11434/v1

# PostgreSQL (if using)
POSTGRES_HOST=localhost
POSTGRES_DATABASE=contextrouter
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
```

### Option 2: Configuration File

Create a `settings.toml` file:

```toml
# settings.toml

[models]
default_llm = "vertex/gemini-2.0-flash"
default_embeddings = "vertex/text-embedding-004"

[vertex]
project_id = "your-gcp-project"
location = "us-central1"

[postgres]
host = "localhost"
port = 5432
database = "contextrouter"
user = "postgres"
password = "${POSTGRES_PASSWORD}"  # Can reference env vars

[rag]
provider = "postgres"
reranking_enabled = true
```

### Loading Configuration

ContextRouter automatically detects and loads your configuration:

```python
from contextrouter.core import get_core_config

# Automatically finds .env and settings.toml in current directory
config = get_core_config()

# Or specify paths explicitly
config = get_core_config(
    env_path="./custom.env",
    toml_path="./custom-settings.toml"
)
```

## Provider-Specific Setup

### Google Vertex AI

1. Create a GCP project with Vertex AI enabled
2. Set up authentication:

```bash
# Option 1: Application Default Credentials
gcloud auth application-default login

# Option 2: Service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

3. Configure ContextRouter:

```toml
[vertex]
project_id = "your-project-id"
location = "us-central1"
```

### OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Set the environment variable:

```bash
export OPENAI_API_KEY=sk-...
```

### Local Models (Ollama)

1. Install and start Ollama:

```bash
ollama serve
ollama pull llama3.2
```

2. Configure ContextRouter:

```bash
export LOCAL_OLLAMA_BASE_URL=http://localhost:11434/v1
```

## Logging Configuration

ContextRouter uses ContextCore's centralized logging system. Logging is automatically configured in CLI:

```python
# Logging is set up automatically in CLI
from contextcore import setup_logging, load_shared_config_from_env

config = load_shared_config_from_env()
# Use plain text format for CLI (more readable than JSON)
setup_logging(config=config, json_format=False, service_name="contextrouter")
```

### Environment Variables

Configure logging via environment variables:

```bash
# .env
LOG_LEVEL=INFO              # DEBUG, INFO, WARNING, ERROR, CRITICAL
SERVICE_NAME=contextrouter
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
unit = ContextUnit(payload={"message": "test"})
logger.info("Processing request", unit=unit)
```

### CLI Logging

The CLI uses plain text format for better readability:

```bash
# Verbose mode enables DEBUG logging
contextrouter --verbose chat "Hello"
```

See the [ContextCore Logging Guide](/core/guides/logging/) for complete documentation.

## Next Steps

With ContextRouter installed, move on to:

- **[Quick Start](/getting-started/quickstart/)** — Build your first agent
- **[Models](/models/)** — Configure your LLM provider in detail
- **[Logging](/core/guides/logging/)** — Set up centralized logging
- **[Configuration Reference](/reference/configuration/)** — Full settings documentation
