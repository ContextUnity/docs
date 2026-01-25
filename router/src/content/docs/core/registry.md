---
title: Registry System
description: Dynamic component registration and hot-swapping in ContextRouter.
---

ContextRouter uses a powerful dynamic registry system that enables runtime component discovery, hot-swapping, and true plugin architectures. This is one of the key features that makes ContextRouter so flexible and extensible.

## Why a Registry?

In traditional frameworks, components are hardcoded or require configuration files to be reloaded. ContextRouter's registry system allows you to:

- **Register components at import time** using simple decorators
- **Discover components dynamically** without knowing them in advance
- **Hot-swap implementations** without restarting your application
- **Build plugin ecosystems** where third parties can extend functionality

## Registry API Overview

ContextRouter uses a dynamic registry system that allows components to be registered at runtime and discovered automatically. This enables hot-swapping, plugin architectures, and seamless component replacement.

### Registration Decorators

Components are registered using decorators during Python's import phase:

```python
from contextrouter.core.registry import (
    register_connector,
    register_provider,
    register_transformer,
    register_agent,
    register_graph
)

# Register a custom connector
@register_connector("weather")
class WeatherConnector(BaseConnector):
    """Fetches weather data from an external API."""

    async def connect(self, query: str):
        data = await self.fetch_weather(query)
        yield BisquitEnvelope(content=data, provenance=["connector:weather"])

# Register a custom provider
@register_provider("redis")
class RedisProvider(BaseProvider):
    """Redis cache provider for fast retrieval."""

    async def read(self, query: str):
        return await self.redis_client.get(query)

# Register a custom transformer
@register_transformer("sentiment")
class SentimentTransformer(BaseTransformer):
    """Adds sentiment analysis to content."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        sentiment = self.analyze_sentiment(envelope.content)
        envelope.content["sentiment"] = sentiment
        envelope.add_trace("transformer:sentiment")
        return envelope

# Register a custom agent
@register_agent("sentiment_agent")
class SentimentAgent(BaseAgent):
    """Agent that analyzes sentiment in conversations."""

    async def process(self, messages: list[BaseMessage]) -> dict[str, Any]:
        # Agent logic here
        return {"sentiment_analysis": "positive"}

# Register a custom graph
@register_graph("sentiment_workflow")
def create_sentiment_graph():
    """Create a custom graph for sentiment analysis."""
    workflow = StateGraph(AgentState)
    # Graph definition here
    return workflow
```

Once registered, these components are immediately available throughout the system via their registered names.

## Available Registries

ContextRouter maintains separate registries for different component types:

| Registry | Decorator | Interface | Purpose |
|----------|-----------|-----------|---------|
| **Connectors** | `@register_connector` | `BaseConnector` | Fetch live data (Web, RSS, APIs) |
| **Providers** | `@register_provider` | `BaseProvider` | Storage backends (databases, cloud) |
| **Transformers** | `@register_transformer` | `BaseTransformer` | Data enrichment (NER, summarization) |
| **Agents** | `@register_agent` | `BaseAgent` | Graph node implementations |
| **Graphs** | `@register_graph` | Callable | Custom LangGraph workflows |

## Component Discovery & Retrieval

Once registered, components can be retrieved anywhere in your code using the registry API:

### Basic Retrieval

```python
from contextrouter.core.registry import (
    select_connector,
    select_provider,
    select_transformer,
    connector_registry,
    provider_registry,
    transformer_registry
)

# Get a specific component by name
web_connector = select_connector("web")
redis_provider = select_provider("redis")
sentiment_transformer = select_transformer("sentiment")

# Use the component
async for envelope in web_connector.connect("machine learning"):
    processed = sentiment_transformer.transform(envelope)
    await redis_provider.write(processed)
```

### Safe Retrieval with Fallbacks

```python
# Check if a component exists before using it
if "weather" in connector_registry:
    weather = select_connector("weather")
    async for envelope in weather.connect("New York"):
        process(envelope)
else:
    print("Weather connector not available")

# Provide fallback options
def get_storage_provider(primary: str = "postgres", fallback: str = "vertex"):
    """Get storage provider with fallback."""
    try:
        return select_provider(primary)
    except KeyError:
        logger.warning(f"Provider {primary} not found, using {fallback}")
        return select_provider(fallback)

provider = get_storage_provider("mongodb", "postgres")  # Falls back to postgres
```

### Registry Inspection

```python
# List all registered components
available_connectors = list(connector_registry.keys())
available_providers = list(provider_registry.keys())
available_transformers = list(transformer_registry.keys())

print(f"Connectors: {available_connectors}")
print(f"Providers: {available_providers}")
print(f"Transformers: {available_transformers}")

# Output:
# Connectors: ['web', 'file', 'rss', 'api', 'weather', 'slack']
# Providers: ['postgres', 'vertex', 'gcs', 'redis', 'mongodb']
# Transformers: ['ner', 'taxonomy', 'sentiment', 'summarization', 'keyphrases']
```

### Dynamic Component Loading

```python
# Load components dynamically
def load_component(component_type: str, name: str):
    """Load any type of component dynamically."""
    registries = {
        "connector": connector_registry,
        "provider": provider_registry,
        "transformer": transformer_registry,
        "agent": agent_registry,
        "graph": graph_registry,
    }

    registry = registries.get(component_type)
    if not registry or name not in registry:
        raise ValueError(f"Unknown {component_type}: {name}")

    return registry[name]

# Usage
connector = load_component("connector", "web")
transformer = load_component("transformer", "sentiment")
```

## Runtime Hot-Swapping

One of the most powerful features is the ability to switch components at runtime:

```python
def get_storage_provider(user_preference: str, fallback: str = "postgres"):
    """Select storage based on runtime conditions."""
    try:
        return select_provider(user_preference)
    except KeyError:
        logger.warning(f"Provider {user_preference} not found, using {fallback}")
        return select_provider(fallback)

# A/B testing different transformer implementations
def process_with_variant(data, experiment_group: str):
    """Use different transformers for A/B testing."""
    variant = "summarizer_v2" if experiment_group == "B" else "summarizer_v1"
    transformer = select_transformer(variant)
    return transformer.transform(data)

# Load balancing between providers
def get_optimal_provider(current_load: float):
    """Route to backup during high load."""
    if current_load > 0.8:
        return select_provider("backup_db")
    return select_provider("primary_db")
```

## Creating Custom Components

### Base Classes & Interfaces

All components inherit from base classes that define the required interface:

```python
from contextrouter.core.interfaces import (
    BaseConnector,
    BaseProvider,
    BaseTransformer,
    BaseAgent
)
from contextrouter.core.bisquit import BisquitEnvelope
from typing import AsyncIterator, Any

class CustomConnector(BaseConnector):
    """Custom connector interface."""

    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        """Connect to data source and yield envelopes."""
        # Implementation here
        yield BisquitEnvelope(content=data, provenance=["connector:custom"])

class CustomProvider(BaseProvider):
    """Custom provider interface."""

    async def read(self, query: str) -> list[BisquitEnvelope]:
        """Read data from storage."""
        # Implementation here

    async def write(self, envelope: BisquitEnvelope) -> None:
        """Write data to storage."""
        # Implementation here

class CustomTransformer(BaseTransformer):
    """Custom transformer interface."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Transform envelope content."""
        # Implementation here
        return envelope

class CustomAgent(BaseAgent):
    """Custom agent interface."""

    async def process(self, messages: list[BaseMessage]) -> dict[str, Any]:
        """Process messages and return state updates."""
        # Implementation here
        return {"result": "processed"}
```

### Complete Component Examples

#### Custom Database Connector

```python
from contextrouter.core.registry import register_connector
from contextrouter.core.interfaces import BaseConnector
from contextrouter.core.bisquit import BisquitEnvelope
from typing import AsyncIterator

@register_connector("mongodb")
class MongoDBConnector(BaseConnector):
    """Connect to MongoDB collections."""

    def __init__(self, config):
        self.client = MongoClient(config.mongodb_uri)
        self.db = self.client[config.database]

    async def connect(self, query: str) -> AsyncIterator[BisquitEnvelope]:
        """Search MongoDB collection."""
        # Parse query (could be JSON or simple text)
        search_criteria = self._parse_query(query)

        async for doc in self.db.documents.find(search_criteria):
            yield BisquitEnvelope(
                content={
                    "title": doc.get("title", ""),
                    "content": doc.get("content", ""),
                    "metadata": doc.get("metadata", {})
                },
                provenance=["connector:mongodb"],
                metadata={
                    "collection": doc.get("collection"),
                    "document_id": str(doc["_id"]),
                    "fetched_at": datetime.now().isoformat()
                }
            )

    def _parse_query(self, query: str) -> dict:
        """Parse query string into MongoDB criteria."""
        try:
            return json.loads(query)  # JSON query
        except json.JSONDecodeError:
            return {"$text": {"$search": query}}  # Text search
```

#### Custom AI Model Provider

```python
from contextrouter.core.registry import register_provider
from contextrouter.core.interfaces import BaseProvider
from contextrouter.core.bisquit import BisquitEnvelope

@register_provider("anthropic_vertex")
class AnthropicVertexProvider(BaseProvider):
    """Anthropic models via Vertex AI."""

    def __init__(self, config):
        from anthropic import AnthropicVertex
        self.client = AnthropicVertex(
            region=config.vertex_region,
            project_id=config.vertex_project
        )

    async def read(self, query: str) -> list[BisquitEnvelope]:
        """Use Claude for generation."""
        response = await self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": query}]
        )

        return [BisquitEnvelope(
            content={
                "text": response.content[0].text,
                "model": response.model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            },
            provenance=["provider:anthropic_vertex"],
            metadata={
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "model_version": response.model
            }
        )]

    async def write(self, envelope: BisquitEnvelope) -> None:
        """Not applicable for LLM providers."""
        pass
```

#### Custom Content Transformer

```python
from contextrouter.core.registry import register_transformer
from contextrouter.core.interfaces import BaseTransformer
from contextrouter.core.bisquit import BisquitEnvelope

@register_transformer("code_analyzer")
class CodeAnalyzerTransformer(BaseTransformer):
    """Analyze code content for programming languages."""

    def __init__(self, config):
        self.supported_languages = config.get("languages", ["python", "javascript", "java"])

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Analyze code content."""
        content = envelope.content

        if not isinstance(content, dict) or "text" not in content:
            return envelope

        text = content["text"]
        language = self._detect_language(text)

        if language and language in self.supported_languages:
            analysis = self._analyze_code(text, language)
            content["code_analysis"] = analysis
            envelope.add_trace("transformer:code_analyzer")
            envelope.metadata["detected_language"] = language

        return envelope

    def _detect_language(self, code: str) -> str | None:
        """Simple language detection."""
        if "def " in code and "import " in code:
            return "python"
        elif "function " in code and "const " in code:
            return "javascript"
        elif "public class " in code and "import java." in code:
            return "java"
        return None

    def _analyze_code(self, code: str, language: str) -> dict:
        """Perform basic code analysis."""
        return {
            "language": language,
            "line_count": len(code.split('\n')),
            "character_count": len(code),
            "has_functions": "def " in code or "function " in code,
            "has_classes": "class " in code,
            "complexity_score": self._calculate_complexity(code)
        }

    def _calculate_complexity(self, code: str) -> int:
        """Simple complexity calculation."""
        return len([line for line in code.split('\n') if line.strip() and not line.strip().startswith('#')])
```

## Plugin Architecture

### Plugin Discovery

ContextRouter can automatically discover and load plugins from configured directories:

```toml
# settings.toml
[plugins]
paths = [
    "~/my-contextrouter-plugins",
    "./custom-extensions",
    "/opt/company-plugins"
]
auto_discover = true
auto_reload = false  # Set to true for development
```

The system scans these directories for `.py` files and imports them at startup. Any decorated classes are automatically registered.

### Creating Plugin Packages

```python
# my_custom_plugins/__init__.py
"""Custom ContextRouter plugins."""

# my_custom_plugins/connectors.py
from contextrouter.core.registry import register_connector
from contextrouter.core.interfaces import BaseConnector

@register_connector("custom_api")
class CustomAPIConnector(BaseConnector):
    """Connect to custom API."""
    # Implementation here

# my_custom_plugins/transformers.py
from contextrouter.core.registry import register_transformer
from contextrouter.core.interfaces import BaseTransformer

@register_transformer("custom_enrichment")
class CustomEnrichmentTransformer(BaseTransformer):
    """Custom content enrichment."""
    # Implementation here
```

### Plugin Distribution

```python
# setup.py for plugin package
from setuptools import setup

setup(
    name="contextrouter-custom-plugins",
    version="1.0.0",
    packages=["my_custom_plugins"],
    entry_points={
        "contextrouter.plugins": [
            "custom_plugins = my_custom_plugins",
        ]
    },
    install_requires=[
        "contextrouter",
        # Other dependencies
    ],
)
```

### Runtime Plugin Loading

```python
from contextrouter.core.registry import load_plugin

# Load a plugin module at runtime
load_plugin("my_custom_plugins")

# Now custom components are available
connector = select_connector("custom_api")
transformer = select_transformer("custom_enrichment")
```

### Creating a Plugin

Create a file in your plugins directory:

```python
# ~/my-contextrouter-plugins/slack_connector.py
from contextrouter.core.registry import register_connector
from contextrouter.core.interfaces import BaseConnector
from contextrouter.core.bisquit import BisquitEnvelope

@register_connector("slack")
class SlackConnector(BaseConnector):
    """Fetch messages from Slack channels."""
    
    def __init__(self, config):
        self.token = config.slack_token
        self.client = SlackClient(self.token)
    
    async def connect(self, query: str):
        """Search Slack for messages matching the query."""
        results = await self.client.search_messages(query)
        
        for message in results:
            yield BisquitEnvelope(
                content={
                    "text": message.text,
                    "user": message.user,
                    "channel": message.channel,
                },
                provenance=["connector:slack"],
                metadata={
                    "timestamp": message.ts,
                    "thread_ts": message.thread_ts,
                    "reactions": message.reactions,
                }
            )
```

After placing this file in your plugins directory and restarting, `"slack"` becomes available:

```python
slack = select_connector("slack")
async for envelope in slack.connect("project update"):
    print(f"Message from {envelope.content['user']}: {envelope.content['text']}")
```

## Built-in Components

ContextRouter ships with these pre-registered components:

### Connectors
| Name | Description |
|------|-------------|
| `web` | Google Custom Search integration |
| `file` | Local file ingestion (PDF, TXT, MD, JSON) |
| `rss` | RSS/Atom feed monitoring |
| `api` | Generic REST API connector |

### Providers
| Name | Description |
|------|-------------|
| `postgres` | PostgreSQL with pgvector for hybrid search |
| `vertex` | Vertex AI Search for enterprise deployments |
| `gcs` | Google Cloud Storage for assets |

### Transformers
| Name | Description |
|------|-------------|
| `ner` | Named Entity Recognition |
| `taxonomy` | Category tagging and classification |
| `summarization` | Text summarization |
| `shadow` | Shadow record generation for optimized search |
| `keyphrases` | Key phrase extraction |

## Advanced Patterns

### Component Factories

Create factory functions for complex component initialization:

```python
from contextrouter.core.registry import register_connector
from typing import Callable

def connector_factory(connector_class: type, **defaults):
    """Create a connector factory with default configuration."""
    def factory(config=None, **kwargs):
        merged_config = {**defaults, **(config or {}), **kwargs}
        return connector_class(**merged_config)
    return factory

# Register factory-based connectors
@register_connector("weather_openweather")
def create_openweather_connector(**config):
    """OpenWeather API connector."""
    from my_plugins.weather import OpenWeatherConnector
    return OpenWeatherConnector(**config)

@register_connector("weather_accuweather")
def create_accuweather_connector(**config):
    """AccuWeather API connector."""
    from my_plugins.weather import AccuWeatherConnector
    return AccuWeatherConnector(**config)

# Usage
openweather = select_connector("weather_openweather")(
    api_key="your_key",
    units="metric"
)
```

### Dynamic Configuration

Load component configurations from external sources:

```python
import yaml

def load_component_config(config_file: str) -> dict:
    """Load component configuration from YAML."""
    with open(config_file) as f:
        return yaml.safe_load(f)

# Load and register components dynamically
config = load_component_config("components.yaml")

for component_config in config.get("connectors", []):
    name = component_config["name"]
    component_class = component_config["class"]
    settings = component_config.get("settings", {})

    # Dynamically register component
    @register_connector(name)
    def create_component(**kwargs):
        merged_settings = {**settings, **kwargs}
        return component_class(**merged_settings)
```

### Component Versioning

Handle component versioning for compatibility:

```python
from contextrouter.core.registry import register_transformer

class SentimentTransformerV1(BaseTransformer):
    """Legacy sentiment transformer."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        # Legacy implementation
        return envelope

class SentimentTransformerV2(BaseTransformer):
    """Enhanced sentiment transformer."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        # Enhanced implementation with better accuracy
        return envelope

# Register both versions
register_transformer("sentiment_v1", SentimentTransformerV1)
register_transformer("sentiment_v2", SentimentTransformerV2)
register_transformer("sentiment", SentimentTransformerV2)  # Default to latest

# Usage
legacy_transformer = select_transformer("sentiment_v1")
latest_transformer = select_transformer("sentiment")  # Gets v2
```

### Component Health Checks

Implement health checks for components:

```python
from typing import Protocol

class HealthCheckable(Protocol):
    async def health_check(self) -> dict[str, Any]:
        """Return health status."""
        ...

@register_connector("database")
class DatabaseConnector(BaseConnector, HealthCheckable):
    """Database connector with health checks."""

    async def connect(self, query: str):
        # Implementation
        yield envelope

    async def health_check(self) -> dict[str, Any]:
        """Check database connectivity."""
        try:
            await self.client.ping()
            return {"status": "healthy", "latency_ms": 10}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

# Global health check
async def check_all_components() -> dict[str, Any]:
    """Check health of all registered components."""
    health = {}

    for name in connector_registry.keys():
        connector = select_connector(name)
        if hasattr(connector, 'health_check'):
            health[f"connector:{name}"] = await connector.health_check()

    for name in provider_registry.keys():
        provider = select_provider(name)
        if hasattr(provider, 'health_check'):
            health[f"provider:{name}"] = await provider.health_check()

    return health
```

## Troubleshooting

### Common Issues

**Component Not Found**
```python
# Problem
select_connector("my_custom")  # Raises KeyError

# Solution - Check registration
print(list(connector_registry.keys()))  # See what's available

# Ensure module is imported
import my_custom_connectors  # Import triggers registration
connector = select_connector("my_custom")
```

**Import Errors**
```python
# Problem: Component fails to import
# Check for missing dependencies
pip install missing-package

# Check Python path
import sys
sys.path.append("/path/to/custom/components")
```

**Registration Conflicts**
```python
# Problem: Multiple components with same name
@register_connector("web")  # Conflicts with built-in
class CustomWebConnector(BaseConnector):
    pass

# Solution: Use unique names
@register_connector("custom_web")
class CustomWebConnector(BaseConnector):
    pass
```

**Plugin Loading Issues**
```python
# Debug plugin loading
from contextrouter.core.registry import load_plugin

try:
    load_plugin("my_plugin")
    print("Plugin loaded successfully")
except ImportError as e:
    print(f"Failed to load plugin: {e}")

# Check plugin directory structure
import os
print(os.listdir("plugins/"))  # Should contain __init__.py
```

### Debug Registry State

```python
from contextrouter.core.registry import (
    connector_registry,
    provider_registry,
    transformer_registry,
    agent_registry,
    graph_registry
)

def debug_registry():
    """Print current registry state."""
    print("=== Registry State ===")
    print(f"Connectors: {list(connector_registry.keys())}")
    print(f"Providers: {list(provider_registry.keys())}")
    print(f"Transformers: {list(transformer_registry.keys())}")
    print(f"Agents: {list(agent_registry.keys())}")
    print(f"Graphs: {list(graph_registry.keys())}")

debug_registry()
```

## Best Practices

### Naming Conventions
1. **Use descriptive names** — `"company_crm"` is better than `"crm1"`
2. **Include version in name** — `"sentiment_v2"` for versioned components
3. **Use namespaces** — `"mycompany_crm"` to avoid conflicts
4. **Be consistent** — Follow patterns like `type_variant` (e.g., `web_scraper`, `db_postgres`)

### Error Handling
1. **Handle missing components gracefully** — Always check existence or use try/except
2. **Provide meaningful error messages** — Explain what went wrong and how to fix it
3. **Implement timeouts** — For network-dependent components
4. **Use circuit breakers** — For unreliable external services

### Documentation & Testing
1. **Document your plugins** — Include docstrings explaining what the component does
2. **Test in isolation** — Plugins should be testable without the full system
3. **Provide examples** — Show how to configure and use the component
4. **Version your plugins** — Use semantic versioning for plugin packages

### Performance Considerations
1. **Lazy loading** — Don't initialize expensive resources until needed
2. **Connection pooling** — Reuse connections for database providers
3. **Caching** — Cache expensive operations where appropriate
4. **Async everywhere** — Use async methods for I/O operations

### Security Best Practices
1. **Validate inputs** — Check query parameters and configuration
2. **Use secure defaults** — Don't expose sensitive information
3. **Implement rate limiting** — For external API connectors
4. **Log access** — Track component usage for security auditing
