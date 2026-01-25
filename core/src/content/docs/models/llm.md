---
title: LLM Providers
description: Detailed configuration for each supported LLM provider.
---

This guide covers setup and configuration for each LLM provider supported by ContextRouter. Choose the provider(s) that best fit your use case.

## Google Vertex AI

**Best for**: Production deployments, multimodal, enterprise requirements

Google's Vertex AI provides access to Gemini models with enterprise SLAs and built-in grounding capabilities.

### Setup

1. Create a GCP project with Vertex AI enabled
2. Authenticate:

```bash
# Application Default Credentials (development)
gcloud auth application-default login

# Service Account (production)
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

3. Configure:

```toml
[vertex]
project_id = "your-gcp-project"
location = "us-central1"  # or europe-west1, asia-northeast1, etc.
```

### Available Models

```python
# Fast, cost-effective
llm = model_registry.create_llm("vertex/gemini-2.0-flash", config=config)

# Ultra-lightweight
llm = model_registry.create_llm("vertex/gemini-2.0-flash-lite", config=config)

# Most capable
llm = model_registry.create_llm("vertex/gemini-2.5-pro", config=config)
```

### Features
- ✅ Native multimodal (text, images, audio, video)
- ✅ Structured output with JSON mode
- ✅ Built-in grounding with Google Search
- ✅ Function calling / tool use
- ✅ Long context (up to 1M tokens on Pro)

---

## OpenAI

**Best for**: Ecosystem compatibility, proven quality, function calling

### Setup

```bash
export OPENAI_API_KEY=sk-...
```

Or in settings:

```toml
[openai]
api_key = "${OPENAI_API_KEY}"
organization = "org-..."  # Optional
```

### Available Models

```python
# GPT-4o (multimodal)
llm = model_registry.create_llm("openai/gpt-4o", config=config)

# GPT-4o Mini (cost-effective)
llm = model_registry.create_llm("openai/gpt-4o-mini", config=config)

# o1 (reasoning)
llm = model_registry.create_llm("openai/o1", config=config)
```

### Features
- ✅ Vision (GPT-4o)
- ✅ Function calling
- ✅ JSON mode
- ✅ Whisper for audio transcription

---

## Anthropic

**Best for**: Long documents, safety-focused applications, nuanced reasoning

### Setup

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Available Models

```python
# Claude 4 Sonnet (balanced)
llm = model_registry.create_llm("anthropic/claude-sonnet-4", config=config)

# Claude 3.5 Sonnet
llm = model_registry.create_llm("anthropic/claude-3.5-sonnet", config=config)

# Claude 3 Opus (most capable)
llm = model_registry.create_llm("anthropic/claude-3-opus", config=config)
```

### Features
- ✅ 200K token context window
- ✅ Vision support
- ✅ Tool use
- ✅ Constitutional AI safety

---

## Groq

**Best for**: Ultra-fast inference, real-time applications

Groq provides extremely fast inference for open-source models.

### Setup

```bash
export GROQ_API_KEY=gsk_...
```

### Available Models

```python
# Llama 3.3 70B
llm = model_registry.create_llm("groq/llama-3.3-70b-versatile", config=config)

# Mixtral 8x7B
llm = model_registry.create_llm("groq/mixtral-8x7b-32768", config=config)

# Whisper (ASR)
llm = model_registry.create_llm("groq/whisper-large-v3", config=config)
```

### Features
- ✅ Sub-second latency for most queries
- ✅ Open-source models
- ✅ Whisper ASR integration

---

## OpenRouter

**Best for**: Access to hundreds of models through one API

OpenRouter aggregates models from many providers.

### Setup

```bash
export OPENROUTER_API_KEY=sk-or-...
```

### Available Models

```python
# DeepSeek R1 (reasoning)
llm = model_registry.create_llm("openrouter/deepseek/deepseek-r1", config=config)

# Qwen 2.5
llm = model_registry.create_llm("openrouter/qwen/qwen-2.5-72b", config=config)

# Many more at openrouter.ai/models
```

---

## Local Models (Ollama)

**Best for**: Privacy, offline use, development, cost savings

### Setup

1. Install and start Ollama:

```bash
# Install (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Start server
ollama serve

# Pull a model
ollama pull llama3.2
```

2. Configure:

```bash
export LOCAL_OLLAMA_BASE_URL=http://localhost:11434/v1
```

### Available Models

```python
# Llama 3.2 (latest)
llm = model_registry.create_llm("local/llama3.2", config=config)

# Mistral
llm = model_registry.create_llm("local/mistral", config=config)

# Code Llama
llm = model_registry.create_llm("local/codellama", config=config)
```

---

## Local Models (vLLM)

**Best for**: High-throughput production serving of open models

### Setup

1. Start vLLM server:

```bash
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --port 8000
```

2. Configure:

```bash
export LOCAL_VLLM_BASE_URL=http://localhost:8000/v1
```

### Usage

```python
llm = model_registry.create_llm(
    "local-vllm/meta-llama/Llama-3.1-8B-Instruct", 
    config=config
)
```

---

## HuggingFace Transformers

**Best for**: Running models directly in-process, specialized tasks (STT, classification)

### Setup

```bash
pip install contextrouter[hf-transformers]
```

### Usage

```python
# Small model for testing
llm = model_registry.create_llm("hf/distilgpt2", config=config)

# TinyLlama for chat
llm = model_registry.create_llm("hf/TinyLlama/TinyLlama-1.1B-Chat-v1.0", config=config)

# Whisper for ASR
asr = model_registry.create_llm(
    "hf/openai/whisper-tiny",
    config=config,
    task="automatic-speech-recognition"
)
```

**Note**: HuggingFace models run locally and require sufficient RAM/GPU. Use for specialized tasks or small models.

---

## Best Practices

### For Production RAG

Use reliable models with good instruction following:
- `vertex/gemini-2.0-flash` — Best balance of speed/quality
- `openai/gpt-4o-mini` — Reliable, good value

### For Structured Output (JSON)

Some models are better at following JSON schema requirements:
- ✅ `vertex/gemini-2.0-flash`
- ✅ `openai/gpt-4o-mini`
- ⚠️ Local models may struggle with complex JSON

### For Cost Optimization

```python
# Try cheap/free first, fall back to premium
model = model_registry.get_llm_with_fallback(
    key="local/llama3.2",
    fallback_keys=["groq/llama-3.3-70b", "vertex/gemini-2.0-flash"],
    strategy="cost-priority"
)
```

### For Maximum Reliability

```python
# Multiple fallbacks across providers
model = model_registry.get_llm_with_fallback(
    key="vertex/gemini-2.0-flash",
    fallback_keys=["openai/gpt-4o", "anthropic/claude-sonnet-4"],
    strategy="fallback"
)
```
