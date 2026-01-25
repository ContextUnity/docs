---
title: Quick Start
description: Build your first ContextRouter agent in 5 minutes.
---

This guide walks you through building a simple RAG-powered agent. By the end, you'll have a working chatbot that can answer questions using your knowledge base.

## Prerequisites

Before starting, make sure you have:

- ContextRouter installed (`pip install contextrouter[vertex]` or your preferred provider)
- At least one LLM provider configured (see [Installation](/getting-started/installation/))

## Step 1: Create Configuration

Create a `settings.toml` file in your project directory:

```toml
# settings.toml

[models]
default_llm = "vertex/gemini-2.0-flash"
default_embeddings = "vertex/text-embedding-004"

[vertex]
project_id = "your-gcp-project"
location = "us-central1"

[rag]
provider = "postgres"  # or "vertex" for Vertex AI Search
```

Or use environment variables:

```bash
export VERTEX_PROJECT_ID=your-gcp-project
export VERTEX_LOCATION=us-central1
```

## Step 2: Simple Chat

Create a file called `chat.py`:

```python
import asyncio
from contextrouter.cortex import stream_agent

async def main():
    # Example messages
    messages = [{"role": "user", "content": "Explain what RAG is in simple terms"}]
    
    # Stream the response from the shared brain
    print("Assistant: ", end="")
    async for event in stream_agent(
        messages=messages,
        session_id="quickstart-session",
        platform="console"
    ):
        # Events follow the AG-UI protocol format
        if event.get("event") == "text_delta":
            print(event.get("data", {}).get("text", ""), end="", flush=True)
    print()  # New line at the end

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:

```bash
python chat.py
```

You should see a streaming response explaining RAG!

## Step 3: Interactive Chat Loop

Let's make it interactive:

```python
import asyncio
from contextrouter.cortex import stream_agent

async def chat_loop():
    print("ContextRouter Chat (type 'quit' to exit)")
    print("-" * 40)
    
    history = []
    
    while True:
        user_input = input("\nYou: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if not user_input:
            continue
        
        history.append({"role": "user", "content": user_input})
        
        print("\nAssistant: ", end="")
        full_response = ""
        async for event in stream_agent(
            messages=history,
            session_id="interactive-session",
            platform="console"
        ):
            if event.get("event") == "text_delta":
                delta = event.get("data", {}).get("text", "")
                print(delta, end="", flush=True)
                full_response += delta
        print()
        
        history.append({"role": "assistant", "content": full_response})

if __name__ == "__main__":
    asyncio.run(chat_loop())
```

## Step 4: Enable Web Search

Add real-time web search capability:

```python
import asyncio
from contextrouter.cortex import stream_agent

async def main():
    print("Assistant: ", end="")
    async for event in stream_agent(
        messages=[{"role": "user", "content": "What are the latest developments in AI this week?"}],
        session_id="web-search-session",
        platform="console",
        enable_web_search=True
    ):
        if event.get("event") == "text_delta":
            print(event.get("data", {}).get("text", ""), end="", flush=True)
    print()

if __name__ == "__main__":
    asyncio.run(main())
```

## Step 5: Access Citations

Get sources for the response:

```python
import asyncio
from contextrouter.cortex import stream_agent

async def main():
    citations = []
    
    print("Assistant: ", end="")
    async for event in stream_agent(
        messages=[{"role": "user", "content": "What is machine learning?"}],
        session_id="citations-session",
        platform="console"
    ):
        if event.get("event") == "text_delta":
            print(event.get("data", {}).get("text", ""), end="", flush=True)
        
        # Collect citations from search_end event
        if event.get("event") == "search_end":
            citations.extend(event.get("data", {}).get("citations", []))
    
    print("\n")
    
    if citations:
        print("Sources:")
        for i, citation in enumerate(citations, 1):
            print(f"  {i}. {citation.get('title', 'Unknown')} - {citation.get('url', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Step 6: Using the CLI

ContextRouter includes a CLI for quick testing:

```bash
# Interactive chat
contextrouter rag chat

# Single query
contextrouter rag query "What is RAG?"

# Validate your configuration
contextrouter rag validate
```

## Using Different Providers

### With OpenAI

```toml
# settings.toml
[models]
default_llm = "openai/gpt-4o"
```

```bash
export OPENAI_API_KEY=sk-...
```

### With Anthropic

```toml
# settings.toml
[models]
default_llm = "anthropic/claude-sonnet-4"
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### With Local Ollama

```toml
# settings.toml
[models]
default_llm = "local/llama3.2"
```

```bash
# Make sure Ollama is running
ollama serve
ollama pull llama3.2
export LOCAL_OLLAMA_BASE_URL=http://localhost:11434/v1
```

## What's Happening Under the Hood?

When you call `runner.stream()`, ContextRouter:

1. **Detects intent** — Uses an LLM to understand what you're asking
2. **Decides on retrieval** — Should it search the knowledge base? The web?
3. **Fetches context** — Queries providers and connectors in parallel
4. **Reranks results** — Sorts by relevance using neural reranking
5. **Generates response** — Creates an answer using the context
6. **Suggests follow-ups** — Proposes related questions

All of this is orchestrated by the LangGraph-powered Cortex, while the actual implementation is handled by pluggable Modules.

## Next Steps

Now that you have a working agent, explore:

- **[Core Concepts](/core/)** — Understand the architecture in depth
- **[Models](/models/)** — Configure fallbacks and multiple providers
- **[RAG Pipeline](/rag/)** — Fine-tune retrieval and reranking
- **[Ingestion](/ingestion/)** — Load your own documents into the knowledge base
