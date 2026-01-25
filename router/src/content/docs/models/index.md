---
title: Models & Providers
description: Configure LLMs and embeddings across multiple providers.
---

ContextRouter provides a unified interface for working with LLMs and embedding models. Whether you're using commercial APIs, self-hosted models, or local inference, the same code works everywhere.

## Universal Model Support

One of ContextRouter's key strengths is provider flexibility. You can switch between providers with a configuration change — no code modifications required.

### Commercial APIs

| Provider | LLM | Embeddings | Key Format | Best For |
|----------|-----|------------|------------|----------|
| **Google Vertex AI** | ✅ | ✅ | `vertex/gemini-2.0-flash` | Production, multimodal |
| **OpenAI** | ✅ | ✅ | `openai/gpt-4o` | Quality, ecosystem |
| **Anthropic** | ✅ | ❌ | `anthropic/claude-sonnet-4` | Long context, safety |
| **Groq** | ✅ | ❌ | `groq/llama-3.3-70b` | Ultra-fast inference |

### Aggregators & Self-Hosted

| Provider | LLM | Embeddings | Key Format | Best For |
|----------|-----|------------|------------|----------|
| **OpenRouter** | ✅ | ❌ | `openrouter/deepseek/deepseek-r1` | Model variety |
| **Ollama** | ✅ | ✅ | `local/llama3.2` | Privacy, local dev |
| **vLLM** | ✅ | ❌ | `local-vllm/meta-llama/Llama-3.1-8B` | High-throughput serving |
| **HuggingFace** | ✅ | ✅ | `hf/distilgpt2` | Custom models, STT |

## Quick Configuration

### Option 1: Settings File

```toml
# settings.toml
[models]
default_llm = "vertex/gemini-2.0-flash"
default_embeddings = "vertex/text-embedding-004"

[vertex]
project_id = "my-gcp-project"
location = "us-central1"
```

### Option 2: Environment Variables

```bash
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_LOCATION=us-central1
# or
export OPENAI_API_KEY=sk-...
```

## Using Models

### Basic Usage

```python
from contextrouter.modules.models import model_registry
from contextrouter.modules.models.types import ModelRequest, TextPart
from contextrouter.core import get_core_config

config = get_core_config()

# Get an LLM
llm = model_registry.create_llm("vertex/gemini-2.0-flash", config=config)

# Generate a response
request = ModelRequest(
    parts=[TextPart(text="Explain quantum computing simply")],
    temperature=0.7,
    max_output_tokens=1024,
)
response = await llm.generate(request)
print(response.text)
```

### Streaming Responses

```python
# Stream for real-time output
async for event in llm.stream(request):
    if event.event_type == "text_delta":
        print(event.delta, end="", flush=True)
    elif event.event_type == "final_text":
        print()  # New line at end
```

### Embeddings

```python
# Get embedding model
embeddings = model_registry.create_embeddings(
    "vertex/text-embedding-004", 
    config=config
)

# Embed a query
vector = await embeddings.embed_query("What is machine learning?")
print(f"Dimensions: {len(vector)}")

# Embed multiple documents
vectors = await embeddings.embed_documents([
    "First document text...",
    "Second document text...",
])
```

## Fallback Strategies

Production systems need resilience. ContextRouter supports automatic fallback between providers:

```python
model = model_registry.get_llm_with_fallback(
    key="vertex/gemini-2.0-flash",        # Primary
    fallback_keys=[
        "openai/gpt-4o-mini",              # First fallback
        "local/llama3.2",                   # Last resort (local)
    ],
    strategy="fallback"
)

# Uses primary, falls back automatically on failure
response = await model.generate(request)
```

### Available Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `fallback` | Try sequentially until one succeeds | Maximum reliability |
| `parallel` | Race all, return first success | Minimum latency |
| `cost-priority` | Prefer cheaper models first | Budget optimization |

```python
# Cost optimization: try cheap first
model = model_registry.get_llm_with_fallback(
    key="local/llama3.2",                  # Free, local
    fallback_keys=[
        "groq/llama-3.3-70b",              # Fast, cheap
        "vertex/gemini-2.0-flash",         # Reliable, moderate
        "openai/gpt-4o",                   # Premium
    ],
    strategy="cost-priority"
)
```

## Multimodal Support

ContextRouter's model interface supports multiple modalities:

```python
from contextrouter.modules.models.types import (
    ModelRequest, 
    TextPart, 
    ImagePart,
    AudioPart
)

# Text + Image request
request = ModelRequest(
    parts=[
        TextPart(text="What's in this image?"),
        ImagePart(
            mime="image/jpeg",
            data_b64="...",  # Base64 encoded
            # or
            uri="https://example.com/image.jpg"
        )
    ]
)

# Audio transcription
request = ModelRequest(
    parts=[
        AudioPart(
            mime="audio/wav",
            data_b64="...",
            sample_rate_hz=16000
        )
    ]
)
```

## Learn More

- **[LLM Providers](/models/llm/)** — Detailed setup for each provider
- **[Embeddings](/models/embeddings/)** — Embedding model configuration
- **[Configuration Reference](/reference/configuration/)** — All model settings
