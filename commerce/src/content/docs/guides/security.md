---
title: Security Guide
description: Implementing secure AI systems with ContextRouter's security features.
---

Building secure AI systems requires careful consideration of data privacy, access control, audit trails, and compliance. ContextRouter provides comprehensive security features designed for production deployment.

## Security Principles

ContextRouter follows these core security principles:

1. **Data Provenance** - Every piece of data is traceable to its source
2. **Access Control** - Fine-grained permissions for data access
3. **Audit Trails** - Complete logging of all operations
4. **Defense in Depth** - Multiple security layers
5. **Privacy by Design** - Security built into the architecture

## Bisquit Protocol Security

The BisquitEnvelope provides the foundation for secure data handling.

### Data Provenance

Every envelope maintains a complete audit trail:

```python
from contextrouter.core.bisquit import BisquitEnvelope

# Data from external source
envelope = BisquitEnvelope(
    content=user_data,
    provenance=["connector:web", "transformer:validation"],
    metadata={
        "source_ip": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "timestamp": datetime.now().isoformat(),
        "data_classification": "public"
    }
)

# Each processing step adds trace
envelope.add_trace("transformer:anonymization")
envelope.add_trace("provider:storage")
```

### Access Tokens

Implement row-level security with token-based access control:

```python
from contextrouter.core.tokens import create_token, TokenPermissions

# Create user-specific token
user_token = create_token(
    user_id="user_123",
    permissions=[
        TokenPermissions.RAG_READ,
        TokenPermissions.RAG_WRITE,
        TokenPermissions.INGEST_READ
    ],
    expires_in_hours=24,
    metadata={"department": "engineering"}
)

# Attach to envelope
envelope.sign(user_token.id)

# Later, verify access
def check_access(envelope: BisquitEnvelope, required_permission: str) -> bool:
    if not envelope.token_id:
        return False

    token = get_token(envelope.token_id)
    if not token or token.is_expired():
        return False

    return required_permission in token.permissions
```

## Authentication & Authorization

### API Security

When deploying ContextRouter as an API service:

```python
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validate JWT token and return user context."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "permissions": payload.get("permissions", [])}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/rag/chat")
async def chat_endpoint(
    request: ChatRequest,
    user_ctx: dict = Depends(get_current_user)
):
    """Secure chat endpoint with user context."""
    # User context is automatically passed to ContextRouter
    async for event in stream_agent(request.messages, user_ctx=user_ctx):
        yield event
```

### Session Management

Implement secure session handling:

```python
from contextrouter.core.security import SessionManager

session_manager = SessionManager(config)

# Create session with security context
session = session_manager.create_session(
    user_id="user_123",
    permissions=["rag:read", "rag:write"],
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent")
)

# Validate session on each request
if not session_manager.validate_session(session.id):
    raise HTTPException(status_code=401, detail="Invalid session")

# ContextRouter automatically respects session permissions
runner = ChatRunner(config, session=session)
```

## Data Privacy & Compliance

### PII Detection & Handling

Automatically detect and handle personally identifiable information:

```python
from contextrouter.modules.transformers.privacy import PIITransformer

class PIITransformer(BaseTransformer):
    """Detect and anonymize PII."""

    def __init__(self, config):
        self.pii_patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            "ssn": r'\b\d{3}[-]?\d{2}[-]?\d{4}\b'
        }

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        content = envelope.content

        if isinstance(content, dict) and "text" in content:
            text = content["text"]
            pii_found = []

            for pii_type, pattern in self.pii_patterns.items():
                matches = re.findall(pattern, text)
                if matches:
                    pii_found.extend([(pii_type, match) for match in matches])
                    # Anonymize
                    text = re.sub(pattern, f"[{pii_type.upper()}]", text)

            if pii_found:
                envelope.content["text"] = text
                envelope.metadata["pii_detected"] = pii_found
                envelope.metadata["anonymized"] = True
                envelope.add_trace("transformer:pii_anonymization")

        return envelope

# Register and use
@register_transformer("pii_protection")
class PIIProtectionTransformer(PIITransformer):
    pass
```

### Data Classification

Implement data classification for compliance:

```python
class DataClassifier(BaseTransformer):
    """Classify data sensitivity level."""

    SENSITIVITY_LEVELS = {
        "public": 0,
        "internal": 1,
        "confidential": 2,
        "restricted": 3
    }

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        content = envelope.content

        # Analyze content for sensitive keywords
        sensitivity_score = self._analyze_sensitivity(content)

        # Determine classification
        if sensitivity_score >= 0.8:
            classification = "restricted"
        elif sensitivity_score >= 0.6:
            classification = "confidential"
        elif sensitivity_score >= 0.3:
            classification = "internal"
        else:
            classification = "public"

        envelope.metadata["sensitivity_level"] = self.SENSITIVITY_LEVELS[classification]
        envelope.metadata["data_classification"] = classification
        envelope.add_trace("transformer:data_classification")

        return envelope

    def _analyze_sensitivity(self, content) -> float:
        """Analyze content for sensitive information."""
        sensitive_keywords = [
            "password", "secret", "confidential", "internal",
            "salary", "medical", "personal", "private"
        ]

        if isinstance(content, dict) and "text" in content:
            text = content["text"].lower()
            matches = sum(1 for keyword in sensitive_keywords if keyword in text)
            return min(matches / len(sensitive_keywords), 1.0)

        return 0.0
```

## Secure Deployment

### Environment Security

Secure configuration management:

```bash
# Use environment variables, never hardcode secrets
export VERTEX_PROJECT_ID=your-secure-project
export OPENAI_API_KEY=sk-your-secure-key
export POSTGRES_PASSWORD=your-secure-password

# Use .env files with restricted permissions
chmod 600 .env

# Never commit secrets to version control
echo ".env" >> .gitignore
echo "secrets/" >> .gitignore
```

### Network Security

Deploy behind security layers:

```python
# Nginx configuration for API deployment
server {
    listen 443 ssl http2;
    server_name api.contextrouter.example.com;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/contextrouter.crt;
    ssl_certificate_key /etc/ssl/private/contextrouter.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req zone=api burst=10 nodelay;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Security

Secure database access:

```sql
-- Create restricted database user
CREATE USER contextrouter_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE contextrouter TO contextrouter_user;

-- Grant minimal permissions
GRANT USAGE ON SCHEMA public TO contextrouter_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO contextrouter_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO contextrouter_user;

-- Row-level security (PostgreSQL 15+)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_data_policy ON documents
    USING (user_id = current_user_id());
```

### Monitoring & Auditing

Implement comprehensive security monitoring:

```python
from contextrouter.core.observability import SecurityMonitor

security_monitor = SecurityMonitor(config)

class SecurityLoggingTransformer(BaseTransformer):
    """Log security-relevant operations."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        # Log access patterns
        security_monitor.log_access({
            "user_id": envelope.token_id,
            "operation": "transform",
            "data_type": envelope.metadata.get("data_classification"),
            "timestamp": datetime.now().isoformat()
        })

        # Check for suspicious patterns
        if self._is_suspicious(envelope):
            security_monitor.alert_suspicious_activity(envelope)

        envelope.add_trace("transformer:security_logging")
        return envelope

    def _is_suspicious(self, envelope: BisquitEnvelope) -> bool:
        """Detect potentially suspicious activity."""
        # Check for unusual access patterns
        access_count = envelope.metadata.get("access_count", 0)
        if access_count > 100:  # High access frequency
            return True

        # Check for sensitive data access
        sensitivity = envelope.metadata.get("sensitivity_level", 0)
        if sensitivity >= 2:  # Confidential or restricted
            return True

        return False
```

## Compliance Features

### GDPR Compliance

Implement data subject rights:

```python
class GDPRController:
    """Handle GDPR data subject requests."""

    def __init__(self, config):
        self.config = config

    async def right_to_access(self, user_id: str) -> list[BisquitEnvelope]:
        """Return all data for a user."""
        query = f"user_id:{user_id}"
        return await self.provider.read(query)

    async def right_to_be_forgotten(self, user_id: str) -> bool:
        """Delete all user data."""
        # Mark for deletion (don't actually delete immediately)
        envelopes = await self.right_to_access(user_id)

        for envelope in envelopes:
            envelope.metadata["gdpr_deletion_requested"] = True
            envelope.metadata["deletion_timestamp"] = datetime.now().isoformat()
            await self.provider.write(envelope)

        # Schedule actual deletion after retention period
        await self._schedule_deletion(user_id)
        return True

    async def data_portability(self, user_id: str) -> dict:
        """Export user data in portable format."""
        envelopes = await self.right_to_access(user_id)

        return {
            "user_id": user_id,
            "export_timestamp": datetime.now().isoformat(),
            "data": [envelope.model_dump() for envelope in envelopes]
        }
```

### Audit Logging

Comprehensive audit trails:

```python
class AuditLogger:
    """Centralized audit logging."""

    def __init__(self, config):
        self.config = config

    async def log_operation(self, operation: str, envelope: BisquitEnvelope,
                          user_id: str, metadata: dict = None):
        """Log auditable operation."""

        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation": operation,
            "user_id": user_id,
            "envelope_id": envelope.id,
            "provenance": envelope.provenance,
            "data_classification": envelope.metadata.get("data_classification"),
            "ip_address": metadata.get("ip_address"),
            "user_agent": metadata.get("user_agent")
        }

        # Store in secure audit log
        await self._store_audit_entry(audit_entry)

        # Alert on sensitive operations
        if self._is_sensitive_operation(operation, envelope):
            await self._send_security_alert(audit_entry)

    def _is_sensitive_operation(self, operation: str, envelope: BisquitEnvelope) -> bool:
        """Determine if operation requires alerting."""
        sensitive_ops = ["delete", "export", "admin_access"]
        high_sensitivity = envelope.metadata.get("sensitivity_level", 0) >= 2

        return operation in sensitive_ops or high_sensitivity
```

## Security Best Practices

### Development

1. **Input Validation** - Always validate user inputs
2. **Output Encoding** - Encode outputs to prevent injection
3. **Error Handling** - Don't leak sensitive information in errors
4. **Dependency Updates** - Keep dependencies updated for security patches

### Deployment

1. **Principle of Least Privilege** - Give minimal required permissions
2. **Network Segmentation** - Isolate sensitive components
3. **Regular Backups** - Secure backup and recovery procedures
4. **Monitoring** - Continuous security monitoring and alerting

### Operations

1. **Access Reviews** - Regular review of user permissions
2. **Incident Response** - Documented security incident procedures
3. **Training** - Security awareness training for team members
4. **Compliance Audits** - Regular security and compliance audits

## Security Checklist

### Pre-Deployment
- [ ] All secrets stored in environment variables
- [ ] Database user has minimal required permissions
- [ ] SSL/TLS enabled for all connections
- [ ] Security headers configured in web server
- [ ] Rate limiting implemented

### Runtime Verification
- [ ] Authentication required for all API endpoints
- [ ] Authorization checks on data access
- [ ] Audit logging enabled and monitored
- [ ] Data classification implemented
- [ ] PII detection and handling active

### Monitoring
- [ ] Security events logged and alerted
- [ ] Regular vulnerability scans performed
- [ ] Access patterns monitored for anomalies
- [ ] Compliance requirements met and documented

This security guide provides the foundation for deploying ContextRouter securely. Always consult with security experts for your specific compliance requirements and threat model.