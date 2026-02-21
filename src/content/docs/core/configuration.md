---
title: Configuration
description: SharedConfig reference and environment variables for ContextCore.
---

ContextCore uses Pydantic `BaseModel` as the configuration contract. Values are loaded from environment variables via `load_shared_config_from_env()`.

## SharedConfig

```python
from contextcore.config import SharedConfig, load_shared_config_from_env

config = load_shared_config_from_env()
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`) |
| `LOG_JSON` | `false` | Use JSON log format (`true`/`false`) |
| `REDIS_URL` | — | Redis connection URL (e.g., `redis://localhost:6379/0`) |
| `OTEL_ENABLED` | `false` | Enable OpenTelemetry tracing |
| `OTEL_ENDPOINT` | — | OpenTelemetry collector endpoint |
| `SERVICE_NAME` | — | Service name for observability |
| `SERVICE_VERSION` | — | Service version for observability |
| `TENANT_ID` | — | Default tenant ID for multi-tenant deployments |

### Security Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECURITY_ENABLED` | `false` | Enable security enforcement |
| `SIGNING_BACKEND` | `ed25519` | Signing backend type (`ed25519` or `kms`) |
| `SIGNING_KEY_ID` | `ed25519-001` | Active key identifier (`kid`) for token signing |
| `SIGNING_ALLOWED_KIDS` | — | Comma-separated kid allowlist for rotation |
| `SIGNING_PRIVATE_KEY_PATH` | — | Ed25519 private key file path (signer only) |
| `SIGNING_PUBLIC_KEY_PATH` | — | Ed25519 public key file path (verifier) |
| `KMS_KEY_RESOURCE` | — | Cloud KMS key resource name |
| `TOKEN_TTL_SECONDS` | `3600` | Default token TTL in seconds |
| `TOKEN_ISSUER` | — | Token issuer identifier |

### SharedConfig Fields

```python
class SharedConfig(BaseModel):
    log_level: LogLevel                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
    log_json: bool                         # JSON vs plain text logs
    redis_url: str | None                  # Redis connection
    otel_enabled: bool                     # OpenTelemetry tracing
    otel_endpoint: str | None              # OTEL collector endpoint
    service_name: str | None               # Service name for observability
    service_version: str | None            # Service version
    tenant_id: str | None                  # Default tenant ID
    security: SharedSecurityConfig         # Nested security config
```

:::note[Service-Specific Configuration]
`SharedConfig` contains only **common** settings. Service-specific variables like `BRAIN_DATABASE_URL`, `ROUTER_PORT`, and `TEMPORAL_HOST` are defined in each service's own configuration module:
- Brain → `contextbrain/config.py`
- Router → `contextrouter/core/config/`
- Worker → `contextworker/config.py`
:::

### Adding New Config Options

1. Add field to `SharedConfig` in `config.py`:
```python
class SharedConfig(BaseModel):
    my_new_option: str = Field(default="", description="My new option")
```

2. Add env loading in `load_shared_config_from_env()`:
```python
my_new_option=os.getenv("MY_NEW_OPTION", ""),
```

3. Document in README
4. Add tests
