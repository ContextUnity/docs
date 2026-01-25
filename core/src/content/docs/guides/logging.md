---
title: Logging Guide
description: Complete guide to using the centralized logging system in ContextUnity services.
---

ContextCore provides a comprehensive logging infrastructure that automatically configures logging, includes trace context, and redacts sensitive data.

## Overview

The logging system provides:
- **Automatic configuration** from `SharedConfig.log_level`
- **Structured logging** with JSON format and automatic `trace_id`/`unit_id` inclusion
- **Secret redaction** for passwords, API keys, tokens, and other sensitive data
- **Safe previews** of large data structures to prevent log bloat
- **ContextUnit integration** for automatic trace_id propagation

## Quick Start

### Basic Setup

```python
from contextcore import setup_logging, get_context_unit_logger, SharedConfig, LogLevel

# At application startup
config = SharedConfig(log_level=LogLevel.INFO)
setup_logging(config=config)

# In your modules
logger = get_context_unit_logger(__name__)
logger.info("Application started")
```

### With ContextUnit

```python
from contextcore import ContextUnit, get_context_unit_logger

logger = get_context_unit_logger(__name__)

async def process_request(unit: ContextUnit):
    # trace_id and unit_id automatically included in logs
    logger.info("Processing request", unit=unit)
    logger.debug("Unit payload", unit=unit, extra={"payload_size": len(unit.payload)})
```

## Configuration

### From Environment Variables

```python
from contextcore import setup_logging, load_shared_config_from_env

# Automatically loads LOG_LEVEL from environment
config = load_shared_config_from_env()
setup_logging(config=config)
```

Environment variables:
- `LOG_LEVEL`: `DEBUG`, `INFO`, `WARNING`, `ERROR`, or `CRITICAL`
- `SERVICE_NAME`: Service name for observability
- `SERVICE_VERSION`: Service version

### Custom Configuration

```python
from contextcore import setup_logging, SharedConfig, LogLevel

config = SharedConfig(
    log_level=LogLevel.DEBUG,
    service_name="my-service",
    service_version="1.0.0",
)

setup_logging(
    config=config,
    json_format=True,      # Use JSON format (default: True)
    redact_secrets=True,   # Redact secrets (default: True)
    service_name="my-service",
)
```

## Safe Logging

### Safe Previews

Always use `safe_preview()` or `safe_log_value()` when logging potentially large or sensitive data:

```python
from contextcore import safe_preview, safe_log_value

# For any data type
data = {"key": "value", "large": "x" * 1000}
logger.info(f"Data: {safe_preview(data, limit=100)}")

# With automatic secret redaction
user_input = "password: secret123"
logger.info(f"Input: {safe_log_value(user_input)}")
# Output: "Input: password: [REDACTED]"
```

### Secret Redaction

The logging system automatically redacts:
- Passwords: `password: secret123` → `password: [REDACTED]`
- API keys: `api_key: sk-123456` → `api_key: [REDACTED]`
- Bearer tokens: `Bearer abc123` → `[REDACTED]`
- Private keys: Full PEM keys are redacted

```python
from contextcore import redact_secrets

text = "api_key: sk-1234567890abcdef"
safe_text = redact_secrets(text)
# Result: "api_key: [REDACTED]"
```

## Structured Logging

### JSON Format (Default)

When `json_format=True`, logs are output as JSON:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "my_service",
  "message": "Processing request",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "unit_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

### Plain Text Format

When `json_format=False`, logs are human-readable:

```
[2024-01-15T10:30:00Z] INFO my_service trace_id=550e8400-e29b-41d4-a716-446655440000 : Processing request
```

## ContextUnit Integration

### Automatic Trace ID Propagation

When you log with a `ContextUnit`, the `trace_id` and `unit_id` are automatically included:

```python
from contextcore import ContextUnit, get_context_unit_logger

logger = get_context_unit_logger(__name__)

unit = ContextUnit(
    unit_id=uuid4(),
    trace_id=uuid4(),
    payload={"data": "value"},
)

# trace_id and unit_id automatically added to log
logger.info("Processing unit", unit=unit)
```

### Manual Trace ID

You can also set trace_id manually:

```python
logger = get_context_unit_logger(__name__, trace_id=my_trace_id)
logger.info("Message")  # Includes trace_id
```

## Best Practices

### 1. Always Use Safe Previews

❌ **Don't:**
```python
logger.info(f"Full data: {large_dict}")
logger.info(f"User input: {user_prompt}")
```

✅ **Do:**
```python
logger.info(f"Data preview: {safe_preview(large_dict, limit=200)}")
logger.info(f"User input: {safe_log_value(user_prompt)}")
```

### 2. Never Log Secrets

❌ **Don't:**
```python
logger.debug(f"API key: {api_key}")
logger.info(f"Password: {password}")
```

✅ **Do:**
```python
logger.debug(f"API key configured: {bool(api_key)}")
logger.info("Password validated")
```

### 3. Include ContextUnit When Available

❌ **Don't:**
```python
logger.info("Processing request")
```

✅ **Do:**
```python
logger.info("Processing request", unit=context_unit)
```

### 4. Use Appropriate Log Levels

- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARNING`: Warning messages for potential issues
- `ERROR`: Error messages for failures
- `CRITICAL`: Critical errors requiring immediate attention

## Integration with Observability

The logging system integrates with OpenTelemetry through `SharedConfig`:

```python
config = SharedConfig(
    log_level=LogLevel.INFO,
    otel_enabled=True,
    otel_endpoint="http://otel-collector:4317",
    service_name="my-service",
    service_version="1.0.0",
)

setup_logging(config=config)
```

All logs will include `trace_id` which can be correlated with OpenTelemetry traces.

## API Reference

### Functions

- `setup_logging(config, json_format, redact_secrets, service_name)` - Configure logging
- `get_context_unit_logger(name, trace_id, unit_id)` - Get logger adapter
- `safe_preview(value, limit)` - Create safe preview of value
- `safe_log_value(value, limit, redact)` - Create safe log value with redaction
- `redact_secrets(text, replacement)` - Redact secrets from text

### Classes

- `ContextUnitFormatter` - Custom formatter with trace_id support
- `ContextUnitLoggerAdapter` - Logger adapter for ContextUnit integration

## See Also

- [ContextUnit Protocol](/contextunit/) - Understanding the data exchange format
- [Configuration Reference](/reference/configuration/) - Complete configuration options
- [Shared Config](/getting-started/installation/#shared-config) - Configuration management
