---
title: Harvester Guide
description: Configure data harvesting from suppliers
---

# Harvester Guide

The Harvester module automates data collection from multiple suppliers, transforming raw inventory data into normalized product records.

## Supported Suppliers

ContextWorker supports 15+ suppliers out of the box:

| Code | Name | Format | Auth |
|------|------|--------|------|
| `vysota` | Висота | XLSX | URL |
| `abris` | Абріс | XLSX | URL |
| `theclimb` | TheClimb | Scraper | Login |
| `shambala` | Шамбала | XLSX | Cookie |
| `terraincognita` | Terra Incognita | XLSX | Password |
| `travelextreme` | Travel Extreme | XLSX | URL |
| `adrenalin` | Адреналін | XLSX | URL |
| `arnica` | Арніка | XLSX | Login |
| `campingtrade` | Camping Trade | API | Token |

## Pipeline Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Fetch     │────►│  Transform  │────►│   Load      │────►│  Gardener   │
│  (Fetcher)  │     │(Transformer)│     │   (DB)      │     │ (Enrichment)│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. **Fetch** - Download data from supplier (HTTP, Email, API)
2. **Transform** - Parse and normalize into standard format
3. **Load** - Insert/update records in database
4. **Gardener** - AI enrichment for new/updated products

## Configuration

### Supplier Config Files

Each supplier has a TOML config in `config/suppliers/`:

```toml
# config/suppliers/vysota.toml

[dealer]
code = "vysota"
name = "Висота"
country = "UKR"
currency = "UAH"

[[sources]]
name = "outdoor"
url = "https://supplier.com/stock.xlsx"
format = "xlsx"
sheet = 0

[columns]
sku = "Артикул"
name = "Найменування"
rrp = "РРЦ"
dealer_price = "Оптова ціна"
stock = "Залишок"

[brands]
allowlist = ["Osprey", "Deuter", "MSR"]
denylist = ["NoName"]
```

### Environment Variables

```bash
# Credentials (from vault)
VYSOTA_USERNAME=...
VYSOTA_PASSWORD=...
ARNICA_API_KEY=...

# General settings
HARVESTER_RETENTION_DAYS=30
HARVESTER_TIMEZONE=Europe/Kyiv
```

## Running Harvester

### Full Pipeline

```bash
# All suppliers
mise run harvest_all

# Single supplier
mise run harvest_vysota

# With force (re-process unchanged data)
python -m contextworker harvest --supplier vysota --force
```

### Individual Steps

```bash
# Fetch only
mise run fetch_vysota

# Transform only (uses cached fetch)
mise run transform_vysota

# Fetch + transform
mise run vysota_all
```

## Adding a New Supplier

### 1. Create Config

```toml
# config/suppliers/newsupplier.toml
[dealer]
code = "newsupplier"
name = "New Supplier"

[[sources]]
name = "main"
url = "https://newsupplier.com/data.xlsx"
format = "xlsx"
```

### 2. Create Transformer (if needed)

```python
# harvester/transformers/newsupplier.py

from harvester.base import BaseTransformer

class NewSupplierTransformer(BaseTransformer):
    def transform(self, data: pd.DataFrame) -> list[Product]:
        # Custom transformation logic
        products = []
        for _, row in data.iterrows():
            product = self.normalize_row(row)
            products.append(product)
        return products
```

### 3. Register in Registry

```python
# harvester/registry.py

TRANSFORMERS = {
    "newsupplier": "harvester.transformers.newsupplier.NewSupplierTransformer",
}
```

### 4. Add Mise Tasks

```toml
# .mise.toml

[tasks.fetch_newsupplier]
run = "python -m contextworker fetch newsupplier"

[tasks.transform_newsupplier]
run = "python -m contextworker transform newsupplier"

[tasks.newsupplier_all]
run = "mise run fetch_newsupplier && mise run transform_newsupplier"
```

## Scheduling

### Automated Daily Runs

The scheduler runs all suppliers daily:

```python
# config.py
SCHEDULE = {
    "enabled": True,
    "run_time": "06:00",
    "timezone": "Europe/Kyiv",
}
```

### Temporal Scheduling

For Temporal-based scheduling:

```python
# workflows.py
@workflow.defn
class ScheduledHarvestWorkflow:
    @workflow.run
    async def run(self):
        suppliers = get_enabled_suppliers()
        for supplier in suppliers:
            await workflow.execute_child_workflow(
                HarvestWorkflow.run,
                supplier,
            )
```

## Monitoring

### Alerts

Configure email alerts for:
- Fetch failures
- Stale data (no update in 24+ hours)
- Transform errors

```python
NOTIFICATIONS = {
    "enabled": True,
    "send_errors": True,
    "send_daily_digest": True,
    "recipients": ["team@example.com"],
}
```

### Logs

```bash
# View harvester logs
journalctl -u contextworker -f | grep harvester

# Specific supplier
mise run harvest_vysota 2>&1 | tee logs/vysota.log
```

## Troubleshooting

### Empty Data

1. Check source URL accessibility
2. Verify authentication credentials
3. Check column mappings in config

### Duplicate Products

1. Verify SKU column mapping
2. Check deduplication logic in transformer
3. Review merge strategy settings

## Next Steps

- [Gardener Agent](/guides/gardener/) - AI enrichment
- [Workflows](/guides/workflows/) - Custom workflow creation
