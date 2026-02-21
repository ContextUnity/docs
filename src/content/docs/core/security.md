---
title: Security Integration
description: SecurityGuard, token interceptors, signing backends, and service discovery.
---

## SecurityGuard

The `SecurityGuard` unifies token validation and Shield firewall into a single entrypoint used by all services:

```python
from contextcore import SecurityGuard, SecurityConfig

guard = SecurityGuard(SecurityConfig(
    security_enabled=True,
    shield_enabled=True,       # Auto-activates if contextshield is installed
    fail_open_on_shield=False, # Reject if Shield is down
))

# Validate token from gRPC context
token = guard.validate_token(context, require=True)

# Run Shield firewall on user input
result = guard.check_input(
    user_input="How do I hack the system?",
    context_text="System prompt...",
    rag_chunks=[{"text": "..."}],
    request_id="req_123",
    tenant="my_project",
)
if result.blocked:
    raise SecurityError(f"Blocked: {result.reason}")
```

### GuardResult

```python
from contextcore import GuardResult

# Returned by guard.check_input()
result.allowed          # bool — whether access is allowed
result.reason           # str — reason for blocking (if blocked)
result.shield_active    # bool — whether Shield firewall evaluated
result.processing_ms    # float — processing time
```

## Token Interceptors

gRPC interceptors for automatic token handling:

```python
from contextcore import (
    TokenValidationInterceptor,     # Server-side: validates incoming tokens
    ServicePermissionInterceptor,   # Server-side: checks per-RPC permissions
    TokenMetadataInterceptor,       # Client-side: injects token into metadata
    get_security_interceptors,      # Factory: creates appropriate interceptors
)

# Server-side setup
interceptors = get_security_interceptors(config)
server = grpc.aio.server(interceptors=interceptors)

# Client-side: auto-inject token into every call
from contextcore import TokenMetadataInterceptor
interceptor = TokenMetadataInterceptor(token)
channel = grpc.aio.insecure_channel(
    "brain:50051",
    interceptors=[interceptor],
)
```

## Token Serialization

Serialize tokens for transmission and parse them back:

```python
from contextcore import serialize_token, parse_token_string

# Serialize token → string (for gRPC metadata / HTTP headers)
token_str = serialize_token(token)

# Parse string → ContextToken
token = parse_token_string(token_str)

# gRPC metadata helpers
from contextcore import (
    create_grpc_metadata_with_token,
    extract_token_from_grpc_metadata,
)
metadata = create_grpc_metadata_with_token(token)
token = extract_token_from_grpc_metadata(context)

# HTTP header helpers
from contextcore import (
    create_http_headers_with_token,
    extract_token_from_http_request,
)
headers = create_http_headers_with_token(token)
token = extract_token_from_http_request(request)
```

## Signing Backends

Cryptographic signing for token integrity:

```python
from contextcore import (
    SigningBackend,    # Protocol (abstract interface)
    SignedPayload,     # Wire format (kid + algorithm + signature + payload)
    UnsignedBackend,   # Development: no signing
    get_signing_backend,
)

# Get backend based on config
backend = get_signing_backend(config.security)

# Sign
signed = backend.sign(payload_bytes)
token_str = signed.serialize()

# Verify
payload = backend.verify(token_str)  # Returns bytes or None
```

| Backend | Package | Use Case |
|---------|---------|----------|
| `UnsignedBackend` | `contextcore` | Development (no deps) |
| `Ed25519Backend` | `contextshield` | Production |
| `KMSBackend` | `contextshield` | Enterprise (Cloud KMS) |

## Service Discovery

Redis-based service registration and discovery:

```python
from contextcore import (
    ServiceInfo,
    register_service,
    deregister_service,
    discover_services,
    discover_endpoints,
)

# Register on startup (starts heartbeat thread)
register_service(
    service="brain",
    instance="default",
    endpoint="brain:50051",
    tenants=["project_a", "project_b"],
    metadata={"version": "1.0"},
)

# Discover running services
services = discover_services(service_type="brain")
for svc in services:
    print(f"{svc.service}/{svc.instance} → {svc.endpoint}")

# Discover endpoints (dict)
endpoints = discover_endpoints("brain", tenant_id="project_a")
# {"default": "brain:50051", "nszu": "brain-nszu:50051"}
```

### Project Registry

Server-side project ownership tracking (prevents spoofing):

```python
from contextcore import register_project, verify_project_owner

# Register project ownership
register_project(
    project_id="nszu",
    owner_tenant="nszu_tenant",
    tools=["search_products", "get_patient"],
)

# Verify before processing
is_owner = verify_project_owner("nszu", "nszu_tenant")  # True
```

## gRPC TLS

```python
from contextcore import create_channel, create_channel_sync, tls_enabled

# Check if TLS is enabled
if tls_enabled():
    channel = create_channel_sync("brain:50051")  # Auto-uses TLS
else:
    channel = create_channel_sync("brain:50051")  # Plain

# Async channel
channel = await create_channel("brain:50051")

# Server credentials
from contextcore import create_server_credentials
creds = create_server_credentials()
server.add_secure_port("[::]:50051", creds)
```
