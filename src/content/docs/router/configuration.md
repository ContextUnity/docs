---
title: Router Configuration
description: Environment variables and settings for ContextRouter.
---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ROUTER_PORT` | `50052` | gRPC server port |
| `BRAIN_HOST` | `localhost:50051` | ContextBrain gRPC address |
| `SHIELD_HOST` | — | ContextShield gRPC address (optional) |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `GOOGLE_PROJECT_ID` | — | Google Cloud project for Vertex AI |
| `GROQ_API_KEY` | — | Groq API key |
| `PERPLEXITY_API_KEY` | — | Perplexity API key |
| `DEFAULT_LLM` | `openai/gpt-5-mini` | Default LLM provider |
| `DEBUG_PIPELINE` | `0` | Enable pipeline debug logs |
| `DEBUG_WEB_SEARCH` | `0` | Enable web search debug logs |

## Agent Configuration

Agents are configured via `AgentConfig` objects stored in ContextView's database. Each agent specifies:

- **LLM provider** — which model to use
- **Allowed tools** — which tools the agent can invoke
- **System prompt** — base personality and instructions
- **Temperature** — LLM temperature setting
- **Fallback models** — backup providers if primary fails

## Running

```bash
# Start gRPC server
uv run python -m contextrouter

# With custom port
ROUTER_PORT=50099 uv run python -m contextrouter
```
