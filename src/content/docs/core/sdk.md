---
title: Core SDK Reference
description: Python API reference for ContextCore's public modules.
---

## ContextUnit

The atomic unit of data exchange. See [ContextUnit Protocol](/concepts/contextunit/) for full specification.

```python
from contextcore import ContextUnit

unit = ContextUnit(
    payload={"key": "value"},
    provenance=["service:action"],
)

# Serialize to protobuf
proto = unit.to_protobuf(pb2_module)

# Deserialize from protobuf
unit = ContextUnit.from_protobuf(proto)

# JSON serialization
json_data = unit.model_dump()
```

## ContextToken & TokenBuilder

```python
from contextcore.tokens import ContextToken, TokenBuilder

# Create a builder
builder = TokenBuilder(enabled=True)

# Mint a root token
token = builder.mint_root(
    user_ctx={},
    permissions=["brain:read", "brain:write"],
    ttl_s=3600,
    allowed_tenants=["my_project"],
    user_id="user_123",
)

# Validate
token.has_permission("brain:read")    # True
token.can_access_tenant("my_project") # True
token.is_expired()                    # False

# Attenuate (delegate with fewer permissions)
child = builder.attenuate(
    token,
    permissions=["brain:read"],  # Subset only
    agent_id="sub-agent",
)

# Verify (raises PermissionError if invalid)
builder.verify(token, required_permission="brain:read")
```

## SharedConfig

Configuration via Pydantic `BaseModel` with `load_shared_config_from_env()`:

```python
from contextcore.config import SharedConfig, load_shared_config_from_env

# Load from environment variables
config = load_shared_config_from_env()

# Access validated settings
print(config.log_level)       # LogLevel.INFO
print(config.redis_url)       # None or "redis://..."
print(config.otel_enabled)    # False
print(config.security.enabled) # False
```

:::note
Never use `os.environ.get()` directly. Use `load_shared_config_from_env()` or extend `SharedConfig` — it provides validation and documentation.
:::

## Logging

```python
from contextcore.logging import get_context_unit_logger, safe_log_value

logger = get_context_unit_logger(__name__)

# Safe logging of sensitive values
logger.info("API Key: %s", safe_log_value(api_key))
```

The `safe_log_value()` helper automatically masks API keys, tokens, and passwords in log output.

## gRPC Utilities

```python
from contextcore.grpc_utils import create_channel_sync

# Create a gRPC channel with standard configuration
channel = create_channel_sync("localhost:50051")

# Use with service stubs
from contextcore import brain_pb2_grpc
stub = brain_pb2_grpc.BrainServiceStub(channel)
```

## Exception Types

```python
from contextcore.exceptions import (
    ContextUnityError,          # Base exception for all ContextUnity errors
    ConfigurationError,         # Invalid configuration
    SecurityError,              # Security/auth failures
    RetrievalError,             # Knowledge retrieval failures
    ProviderError,              # LLM/storage provider failures
    ConnectorError,             # Data source connector failures
    ModelError,                 # LLM model errors
    TransformerError,           # Data transformer failures
    IngestionError,             # Data ingestion failures
    StorageError,               # Storage backend failures
    DatabaseConnectionError,    # Database connection failures
    GraphBuilderError,          # Graph construction failures
    IntentDetectionError,       # Intent classification failures
)
```
