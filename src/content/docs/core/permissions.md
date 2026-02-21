---
title: Permissions & Access Control
description: Permission constants, tool policies, namespace profiles, and access enforcement.
---

ContextCore provides a comprehensive permission system for controlling access to tools, graphs, and service operations.

## Permission Format

Permissions follow `domain:action` or `domain:action:resource` patterns:

```python
from contextcore import Permissions

# Constants for common permissions
Permissions.BRAIN_READ     # "brain:read"
Permissions.BRAIN_WRITE    # "brain:write"
Permissions.TOOL_ALL       # "tool:*"
Permissions.ADMIN_ALL      # "admin:all"
```

## Access Check Helpers

### Tool Access

```python
from contextcore import has_tool_access, has_tool_scope_access, check_tool_scope

# Basic tool access check
has_tool_access(token.permissions, "brain_search")   # True/False

# Scoped access (read, write, admin)
from contextcore import ToolScope
has_tool_scope_access(token.permissions, "sql", ToolScope.ADMIN)  # True/False
```

### Graph Access

```python
from contextcore import has_graph_access

# Check if token can execute a specific graph
has_graph_access(token.permissions, "rag_retrieval")     # True/False
has_graph_access(token.permissions, "commerce_search")   # True/False
```

### Registration Access

```python
from contextcore import has_registration_access

# Check if token can register tools for a project
has_registration_access(token.permissions, "my_project")  # True/False
```

## Tool Policies

Tool policies classify operations by **risk level** and control enforcement:

```python
from contextcore import ToolPolicy, ToolRisk, ToolScope

# Risk levels
ToolRisk.LOW       # Read-only operations
ToolRisk.MEDIUM    # Data modification
ToolRisk.HIGH      # System-level operations
ToolRisk.CRITICAL  # Destructive/irreversible

# Scopes
ToolScope.READ     # Read-only access
ToolScope.WRITE    # Write access
ToolScope.ADMIN    # Administrative access
```

### check_tool_scope

The main authorization + policy enforcement function:

```python
from contextcore import check_tool_scope

# Returns: "allow", "hitl" (human-in-the-loop), or "deny"
result = check_tool_scope(
    permissions=token.permissions,
    tool_name="sql",
    scope=ToolScope.ADMIN,
    policy=my_tool_policy,    # optional ToolPolicy override
)

if result == "deny":
    raise PermissionError("Access denied")
elif result == "hitl":
    # Request human approval before proceeding
    await request_approval()
```

## User Namespaces

Namespace profiles define permission tiers:

```python
from contextcore import UserNamespace, NAMESPACE_PROFILES

# Access tiers
UserNamespace.FREE     # Basic access
UserNamespace.PRO      # Extended access
UserNamespace.ADMIN    # Full tenant admin
UserNamespace.SYSTEM   # System-level (internal)
```

`NAMESPACE_PROFILES` maps each namespace to a set of default permissions.

## Permission Inheritance

```python
from contextcore import PERMISSION_INHERITANCE, expand_permissions

# Permissions implicitly include child permissions
# e.g., "graph:dispatcher" implies access to all sub-graphs
expanded = expand_permissions(token.permissions)
```

`PERMISSION_INHERITANCE` defines which permissions inherit from others. For example, `graph:dispatcher` implies `graph:rag_retrieval`, `graph:gardener`, etc.

## Project Profiles

```python
from contextcore import PROJECT_PROFILES

# Pre-defined permission sets for common project types
# Used during project registration to assign default permissions
```
