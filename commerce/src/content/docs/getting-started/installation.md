---
title: Installation
description: How to install ContextCommerce and configure your environment.
---

ContextCommerce is a Django-based e-commerce platform enhanced with AI agents. This guide covers installation and initial setup.

## Requirements

- **Python 3.11+**
- **Django 5.0+**
- **PostgreSQL 14+** (for HD Catalog)
- **ContextUnity services** (ContextBrain, ContextRouter, ContextWorker, ContextCore)

## Installation

### Using uv (Recommended)

```bash
# Clone the repository
git clone https://github.com/ContextUnity/contextcommerce.git
cd contextcommerce

# Install dependencies
uv sync
```

### Using pip

```bash
pip install -e .
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Create database and user
psql -U postgres -c "CREATE DATABASE context_commerce;"
psql -U postgres -c "CREATE USER context_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE context_commerce TO context_user;"
```

### 2. Configure Database Connection

Create a `.env` file:

```bash
# .env
DATABASE_URL=postgresql://context_user:your_password@localhost:5432/context_commerce
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Initial Setup

### 1. Run Migrations

```bash
uv run manage.py migrate
```

### 2. Create Superuser

```bash
uv run manage.py createsuperuser
```

Or use the automatic creation:

```bash
DJANGO_SUPERUSER_USERNAME=admin \
DJANGO_SUPERUSER_EMAIL=admin@example.com \
DJANGO_SUPERUSER_PASSWORD=admin123 \
uv run manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123')"
```

### 3. Load Initial Data (Optional)

```bash
uv run manage.py loaddata initial_data
```

## Logging Configuration

ContextCommerce uses ContextCore's centralized logging system. Logging is automatically configured in `manage.py`:

```python
# Logging is set up automatically
from contextcore import setup_logging, load_shared_config_from_env

config = load_shared_config_from_env()
setup_logging(config=config, service_name="contextcommerce")
```

### Environment Variables

Configure logging via environment variables:

```bash
# .env
LOG_LEVEL=INFO              # DEBUG, INFO, WARNING, ERROR, CRITICAL
SERVICE_NAME=contextcommerce
SERVICE_VERSION=1.0.0
OTEL_ENABLED=false          # Enable OpenTelemetry
OTEL_ENDPOINT=http://otel-collector:4317
```

### Using Loggers

```python
from contextcore import get_context_unit_logger
from contextcore import ContextUnit

logger = get_context_unit_logger(__name__)

# Log with ContextUnit (trace_id automatically included)
unit = ContextUnit(payload={"action": "process_order"})
logger.info("Processing order", unit=unit)
```

See the [ContextCore Logging Guide](/core/guides/logging/) for complete documentation.

## ContextUnity Integration

### ContextRouter

Configure ContextRouter connection:

```bash
# .env
CONTEXTROUTER_URL=http://localhost:8001
CONTEXTROUTER_API_KEY=your-api-key
```

### ContextBrain

Configure ContextBrain connection:

```bash
# .env
CONTEXTBRAIN_URL=http://localhost:50051
```

### ContextWorker

Configure ContextWorker (Temporal):

```bash
# .env
TEMPORAL_HOST=localhost:7233
```

## Verify Installation

### 1. Check Django Setup

```bash
uv run manage.py check
```

### 2. Run Development Server

```bash
uv run manage.py runserver
```

Visit `http://localhost:8000/admin/` and log in with your superuser credentials.

### 3. Test Logging

```bash
uv run manage.py shell
```

```python
from contextcore import get_context_unit_logger
logger = get_context_unit_logger('test')
logger.info("Test message")
```

## Development Setup

### Install Development Dependencies

```bash
uv sync --dev
```

### Run Tests

```bash
uv run pytest
```

### Code Quality

```bash
uv run black .
uv run ruff check .
```

## Production Deployment

### Environment Variables

For production, set:

```bash
DEBUG=False
ALLOWED_HOSTS=your-domain.com
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/db
LOG_LEVEL=INFO
OTEL_ENABLED=true
OTEL_ENDPOINT=https://your-otel-collector:4317
```

### Static Files

```bash
uv run manage.py collectstatic
```

### Database Migrations

```bash
uv run manage.py migrate
```

## Next Steps

With ContextCommerce installed:

1. **[Architecture](/architecture/)** — Understand system architecture
2. **[Agents](/agents/)** — Learn about the five AI agents
3. **[Configuration Reference](/reference/configuration/)** — Full settings documentation
4. **[ContextCore Logging](/core/guides/logging/)** — Logging best practices
