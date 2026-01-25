---
title: Getting Started
description: Quick introduction to ContextCore and how to get up and running.
---

Welcome to ContextCore! This guide will help you understand what ContextCore is and get you up and running quickly.

## What is ContextCore?

ContextCore is the **Source of Truth** for the entire ContextUnity ecosystem. It defines:

- **ContextUnit Protocol** — The atomic unit of data exchange
- **ContextToken** — Authorization tokens for capability-based access control
- **gRPC Contracts** — Service boundaries via Protocol Buffers
- **Shared Config** — Unified configuration model

## Key Features

### 🔐 ContextUnit Protocol
Every piece of data in ContextUnity uses the ContextUnit structure:
- **unit_id** — Unique identifier
- **trace_id** — Request lifecycle tracking
- **payload** — Actual data content
- **provenance** — Data journey tracking
- **security** — Read/write scopes

### 🎫 ContextToken
Authorization tokens that integrate with ContextUnit security:
- **Capability-based** — Permissions match security scopes
- **Expiration** — Time-to-live support
- **Audit trails** — Token ID tracking

### 📡 gRPC Contracts
Hard service boundaries defined via `.proto` files:
- **Type safety** — Protocol Buffer definitions
- **Version compatibility** — Backward compatibility guarantees
- **Service isolation** — Clear boundaries between services

### ⚙️ Shared Config
Unified configuration model:
- **Pydantic validation** — Runtime type checking
- **Environment variables** — Standardized settings
- **Service-agnostic** — Works across all ContextUnity services

### 📊 Centralized Logging
Enterprise-grade logging infrastructure:
- **Automatic configuration** — Setup from `SharedConfig.log_level`
- **Structured logging** — JSON format with automatic `trace_id` and `unit_id`
- **Secret redaction** — Automatic redaction of passwords, API keys, tokens
- **Safe previews** — Length-bounded previews to prevent log bloat
- **ContextUnit integration** — Automatic trace_id propagation

## How It Works

```
Your Service → ContextUnit → ContextCore → Other Services
              (Protocol)    (Validation)  (gRPC)
```

1. **Your service** creates a ContextUnit with data
2. **ContextCore** validates the structure and security scopes
3. **gRPC** transports the ContextUnit to other services
4. **ContextToken** authorizes access based on security scopes

## Quick Example

Here's a minimal example:

```python
from contextcore import ContextUnit, SecurityScopes, ContextToken
from contextcore import setup_logging, get_context_unit_logger, SharedConfig, LogLevel
from uuid import uuid4

# Setup logging at application startup
config = SharedConfig(log_level=LogLevel.INFO)
setup_logging(config=config)

# Get logger with ContextUnit support
logger = get_context_unit_logger(__name__)

# Create a ContextUnit
unit = ContextUnit(
    unit_id=uuid4(),
    trace_id=uuid4(),
    payload={"message": "Hello, ContextUnity!"},
    security=SecurityScopes(
        read=["public:read"],
        write=["admin:write"]
    )
)

# Log with ContextUnit (trace_id automatically included)
logger.info("Processing request", unit=unit)

# Create a ContextToken
token = ContextToken(
    token_id="token_123",
    permissions=("public:read", "admin:write")
)

# Check authorization
if token.can_read(unit.security):
    logger.info("Access granted!", unit=unit)
```

## Next Steps

Ready to dive in? Here's your path:

1. **[Installation](/getting-started/installation/)** — Get ContextCore installed
2. **[ContextUnit Protocol](/contextunit/)** — Understand the data exchange format
3. **[ContextToken](/token/)** — Learn about authorization
4. **[Logging](/guides/logging/)** — Set up centralized logging
5. **[gRPC Contracts](/grpc/)** — Explore service boundaries

## Requirements

- **Python 3.11+**
- **pip** or **uv** for package management
