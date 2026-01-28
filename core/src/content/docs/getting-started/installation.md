---
title: Installation
description: Install ContextCore and set up your environment.
---

## Prerequisites

- **Python 3.13+**
- **pip** or **uv** for package management

## Installation

### Using pip

```bash
pip install contextcore
```

### Using uv

```bash
uv add contextcore
```

## Verify Installation

```python
from contextcore import ContextUnit, ContextToken, SecurityScopes
from uuid import uuid4

# Create a ContextUnit
unit = ContextUnit(
    unit_id=uuid4(),
    trace_id=uuid4(),
    payload={"message": "Hello, ContextUnity!"},
    security=SecurityScopes(read=["public:read"])
)

# Create a ContextToken
token = ContextToken(
    token_id="test_token",
    permissions=("public:read",)
)

# Check authorization
assert token.can_read(unit.security)
print("✅ ContextCore installed correctly!")
```

## gRPC Support

ContextCore includes Protocol Buffer definitions for gRPC:

```python
from contextcore import context_unit_pb2

# Use Protocol Buffer types
unit_pb = context_unit_pb2.ContextUnit(
    unit_id=str(uuid4()),
    trace_id=str(uuid4())
)
```

## Shared Config

Use shared configuration:

```python
from contextcore import SharedConfig, load_shared_config_from_env

# Load from environment
config = load_shared_config_from_env()

# Access settings
print(config.log_level)
print(config.redis_url)
```

## Logging Setup

ContextCore provides centralized logging with automatic trace_id propagation:

```python
from contextcore import setup_logging, get_context_unit_logger, SharedConfig, LogLevel

# Setup logging at application startup
config = SharedConfig(log_level=LogLevel.INFO)
setup_logging(config=config)

# Get logger with ContextUnit support
logger = get_context_unit_logger(__name__)

# Log with ContextUnit (trace_id automatically included)
from contextcore import ContextUnit
unit = ContextUnit(payload={"data": "value"})
logger.info("Processing request", unit=unit)
```

See the [Logging Guide](/guides/logging/) for complete documentation.

## Next Steps

- **[Quick Start](/getting-started/quickstart/)** — Build your first ContextUnit
- **[ContextUnit Protocol](/contextunit/)** — Understand the data exchange format
- **[ContextToken](/token/)** — Learn about authorization
