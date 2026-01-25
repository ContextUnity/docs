---
title: ContextToken
description: Authorization tokens for ContextUnit operations.
---

ContextToken provides **authorization** for ContextUnit operations. It integrates with ContextUnit security scopes for capability-based access control.

## Overview

ContextToken is the canonical authorization mechanism in ContextUnity. Every service that needs to access ContextUnits must provide a valid ContextToken.

## Structure

```python
from contextcore import ContextToken

token = ContextToken(
    token_id: str,              # Unique identifier for audit trails
    permissions: tuple[str, ...], # Capability strings
    exp_unix: float | None      # Expiration timestamp (None = no expiration)
)
```

## Capabilities

Capabilities are permission strings that match security scopes:

```python
token = ContextToken(
    token_id="token_123",
    permissions=(
        "catalog:read",
        "product:write",
        "admin:manage"
    )
)
```

Common patterns:
- `{resource}:{action}` — e.g., `"catalog:read"`, `"product:write"`
- `{service}:{operation}` — e.g., `"brain:query"`, `"router:route"`

## Authorization Flow

1. **Service receives ContextUnit** with security scopes
2. **Service extracts ContextToken** from request
3. **Service validates token** against security scopes
4. **Access granted/denied** based on permissions

```python
from contextcore import ContextUnit, SecurityScopes, ContextToken

# Unit with security scopes
unit = ContextUnit(
    payload={"data": "..."},
    security=SecurityScopes(
        read=["catalog:read"],
        write=["catalog:write"]
    )
)

# Token with permissions
token = ContextToken(
    token_id="token_123",
    permissions=("catalog:read", "product:read")
)

# Check authorization
if token.can_read(unit.security):
    # Access granted
    data = unit.payload
else:
    # Access denied
    raise PermissionError("Token lacks read permission")
```

## Token Methods

### `can_read(scopes: SecurityScopes) -> bool`

Check if token can read from security scopes:

```python
if token.can_read(unit.security):
    # Token has matching read permission
    pass
```

Returns `True` if:
- Any token permission matches any read scope, OR
- Read scopes are empty (no restrictions)

### `can_write(scopes: SecurityScopes) -> bool`

Check if token can write to security scopes:

```python
if token.can_write(unit.security):
    # Token has matching write permission
    pass
```

Returns `True` if:
- Any token permission matches any write scope, OR
- Write scopes are empty (no restrictions)

### `has_permission(permission: str) -> bool`

Check if token has a specific permission:

```python
if token.has_permission("catalog:read"):
    # Token has this permission
    pass
```

### `is_expired(now: float | None = None) -> bool`

Check if token has expired:

```python
if token.is_expired():
    raise PermissionError("Token expired")
```

## TokenBuilder

Create and validate tokens:

```python
from contextcore import TokenBuilder

builder = TokenBuilder(enabled=True)

# Mint a new root token
token = builder.mint_root(
    user_ctx={"user_id": "user_123"},
    permissions=["catalog:read", "product:write"],
    ttl_s=3600  # 1 hour
)

# Attenuate (reduce permissions)
limited_token = builder.attenuate(
    token,
    permissions=["catalog:read"],  # Remove write permission
    ttl_s=1800  # Reduce TTL to 30 minutes
)

# Verify token
builder.verify(token, required_permission="catalog:read")
```

## Integration with Services

### ContextBrain

```python
from contextbrain import BrainClient
from contextcore import ContextUnit, ContextToken

client = BrainClient()
unit = ContextUnit(payload={"query": "..."})
token = ContextToken(permissions=("knowledge:read",))

# Token is validated against unit.security
results = client.query_memory(unit, token=token)
```

### ContextCommerce

```python
from contextcommerce.core.auth import get_token_from_request
from django.http import HttpRequest

def my_view(request: HttpRequest):
    token = get_token_from_request(request)
    if not token:
        return HttpResponseForbidden("Missing token")
    
    # Use token for authorization
    if token.has_permission("catalog:read"):
        # Access granted
        pass
```

## Best Practices

1. **Always validate tokens** — Check expiration and permissions
2. **Match security scopes** — Token permissions should align with unit security
3. **Use capability strings** — Follow `{resource}:{action}` pattern
4. **Set expiration** — Use TTL for security
5. **Track token_id** — Include in audit logs

## Next Steps

- **[Authorization](/token/authorization/)** — Deep dive into authorization flow
- **[Capabilities](/token/capabilities/)** — Permission string patterns
