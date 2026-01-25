---
title: CLI Reference
description: Command-line interface for ContextRouter ingestion and RAG operations.
---

ContextRouter includes a powerful CLI built with Click and Rich for beautiful, colorized output.

## Installation

The CLI is included with the main package:

```bash
pip install contextrouter
contextrouter --help
```

## Global Options

```bash
contextrouter [OPTIONS] COMMAND [ARGS]

Options:
  --config PATH    Path to settings.toml
  --env PATH       Path to .env file
  -v, --verbose    Enable debug logging
  --version        Show version
  --help           Show help
```

## RAG Commands

### validate - Configuration Validation

Validate your ContextRouter configuration and check for common issues.

**Usage:**
```bash
contextrouter rag validate [OPTIONS]
```

**Options:**
- `--config PATH` - Path to settings file (default: auto-detect)
- `--check-providers` - Test provider connections
- `--check-models` - Test model availability
- `--verbose` - Show detailed validation results

**Examples:**
```bash
# Basic validation
contextrouter rag validate

# Full system check
contextrouter rag validate --check-providers --check-models --verbose
```

### chat - Interactive RAG Chat

Start an interactive chat session with RAG capabilities.

**Usage:**
```bash
contextrouter rag chat [OPTIONS]
```

**Options:**
- `--web / --no-web` - Enable/disable web search (default: enabled)
- `--rerank / --no-rerank` - Enable/disable reranking (default: enabled)
- `--citations / --no-citations` - Show/hide citations (default: enabled)
- `--provider STR` - Override default provider
- `--model STR` - Override default LLM
- `--style STR` - Response style (concise, detailed, technical)
- `--max-results INT` - Maximum search results (default: 10)
- `--temperature FLOAT` - LLM temperature (default: 0.7)
- `--stream / --no-stream` - Enable/disable streaming responses

**Examples:**
```bash
# Basic chat
contextrouter rag chat

# Technical Q&A with web search
contextrouter rag chat --web --style technical --max-results 15

# Fast responses without reranking
contextrouter rag chat --no-rerank --temperature 0.1

# Use specific model
contextrouter rag chat --model vertex/gemini-2.0-flash --provider postgres
```

**Interactive Commands:**
- `quit` or `exit` - End session
- `clear` - Clear conversation history
- `history` - Show conversation history
- `config` - Show current configuration
- `help` - Show available commands

### query - Single Query Execution

Execute a single RAG query without interactive mode.

**Usage:**
```bash
contextrouter rag query [OPTIONS] QUERY
```

**Options:**
- `--json` - Output results as JSON
- `--output PATH` - Save results to file
- `--web / --no-web` - Enable/disable web search
- `--rerank / --no-rerank` - Enable/disable reranking
- `--citations / --no-citations` - Include/exclude citations
- `--max-results INT` - Maximum results to return
- `--provider STR` - Search provider to use
- `--model STR` - LLM model for generation

**Examples:**
```bash
# Simple query
contextrouter rag query "What is machine learning?"

# JSON output for scripting
contextrouter rag query "Latest AI developments" --web --json

# Save detailed results
contextrouter rag query "RAG architecture" --output ./rag-explanation.json --max-results 20

# Technical query with citations
contextrouter rag query "How does vector search work?" --citations --provider vertex
```

**JSON Output Format:**
```json
{
  "query": "What is machine learning?",
  "response": "Machine learning is a subset of AI...",
  "citations": [
    {
      "text": "...machine learning definition...",
      "source": {"type": "book", "title": "AI Handbook", "page": 45},
      "confidence": 0.92
    }
  ],
  "metadata": {
    "execution_time": 1.2,
    "results_count": 5,
    "model_used": "vertex/gemini-2.0-flash"
  }
}
```

## Ingestion Commands

### run - Complete Pipeline Execution

Run the full ingestion pipeline from raw content to deployed knowledge base.

**Usage:**
```bash
contextrouter ingest run [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type: book, video, qa, web, knowledge
- `--input PATH` - Input file or directory path
- `--output PATH` - Output directory (default: ./ingestion_output)
- `--overwrite` - Overwrite existing artifacts
- `--skip-preprocess` - Skip preprocessing stage
- `--skip-structure` - Skip taxonomy/ontology building
- `--skip-index` - Skip indexing stage
- `--skip-deploy` - Skip deployment stage
- `--workers INT` - Number of parallel workers (default: CPU cores / 2)
- `--dry-run` - Show what would be done without executing

**Examples:**
```bash
# Full book ingestion
contextrouter ingest run --type book --input ./my-book.pdf

# Q&A transcripts with custom output
contextrouter ingest run --type qa --input ./transcripts/ --output ./qa-knowledge

# Resume after preprocessing
contextrouter ingest run --type book --skip-preprocess

# Parallel processing
contextrouter ingest run --type video --input ./videos/ --workers 8

# Dry run to preview
contextrouter ingest run --type web --input ./articles/ --dry-run
```

### preprocess - Text Extraction & Chunking

Clean raw content and prepare it for analysis by converting to structured text chunks.

**Usage:**
```bash
contextrouter ingest preprocess [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type (book, video, qa, web, knowledge)
- `--input PATH` - Input file or directory
- `--chunk-size INT` - Target chunk size in characters (default: 1000)
- `--chunk-overlap INT` - Overlap between chunks (default: 200)
- `--min-chunk-size INT` - Minimum chunk size (default: 100)
- `--max-chunk-size INT` - Maximum chunk size (default: 2000)
- `--encoding STR` - Text encoding (default: utf-8)
- `--preserve-formatting` - Keep markdown formatting in chunks

**Examples:**
```bash
# Basic preprocessing
contextrouter ingest preprocess --type book --input ./document.pdf

# Custom chunking for long documents
contextrouter ingest preprocess --type book --chunk-size 1500 --chunk-overlap 300

# Video transcripts with smaller chunks
contextrouter ingest preprocess --type video --chunk-size 500 --min-chunk-size 50

# Preserve code formatting
contextrouter ingest preprocess --type knowledge --preserve-formatting
```

### structure - Taxonomy & Ontology Building

Analyze content to build hierarchical categories and entity relationship schemas.

**Usage:**
```bash
contextrouter ingest structure [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type
- `--model STR` - LLM model for analysis (default: from config)
- `--max-samples INT` - Maximum content samples to analyze (default: 100)
- `--max-depth INT` - Maximum taxonomy depth (default: 3)
- `--categories LIST` - Custom category hints
- `--philosophy-focus STR` - Custom analysis focus prompt

**Examples:**
```bash
# Build taxonomy for books
contextrouter ingest structure --type book

# Custom analysis with specific categories
contextrouter ingest structure --type qa --categories "AI,Machine Learning,Deep Learning"

# Use specific model
contextrouter ingest structure --type knowledge --model vertex/gemini-2.0-flash

# Deep taxonomy for complex domains
contextrouter ingest structure --type book --max-depth 5 --max-samples 200
```

### index - Knowledge Graph & Shadow Records

Extract entities, build relationships, and create optimized search metadata.

**Usage:**
```bash
contextrouter ingest index [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type
- `--incremental` - Build on existing knowledge graph
- `--no-graph` - Skip knowledge graph construction
- `--max-entities-per-chunk INT` - Entity extraction limit (default: 10)
- `--confidence-threshold FLOAT` - Minimum confidence for relationships (default: 0.3)
- `--builders LIST` - Graph builders to use (llm, local, hybrid)

**Examples:**
```bash
# Full indexing with knowledge graph
contextrouter ingest index --type book

# Incremental indexing (preserve existing)
contextrouter ingest index --type qa --incremental

# Skip graph for simple search-only indexing
contextrouter ingest index --type web --no-graph

# High-precision entity extraction
contextrouter ingest index --type knowledge --max-entities-per-chunk 20 --confidence-threshold 0.5
```

### export - Data Export for Indexing

Convert processed data to formats suitable for search index population.

**Usage:**
```bash
contextrouter ingest export [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type
- `--format STR` - Export format: jsonl, sql, csv (default: jsonl)
- `--include-metadata` - Include full metadata in export
- `--compress` - Compress output files
- `--batch-size INT` - Records per output file (default: 1000)

**Examples:**
```bash
# Export for Vertex AI Search
contextrouter ingest export --type book --format jsonl

# Export SQL for Postgres
contextrouter ingest export --type qa --format sql

# Compressed export for large datasets
contextrouter ingest export --type web --compress --batch-size 5000
```

### deploy - Index Population & Upload

Upload processed data to search indexes and knowledge graphs.

**Usage:**
```bash
contextrouter ingest deploy [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type
- `--provider STR` - Target provider (postgres, vertex, gcs)
- `--target STR` - Deployment target for blue/green (blue, green)
- `--batch-size INT` - Upload batch size (default: 1000)
- `--workers INT` - Parallel upload workers (default: 4)
- `--validate` - Run validation after deployment
- `--dry-run` - Show what would be deployed

**Examples:**
```bash
# Deploy to default provider
contextrouter ingest deploy --type book

# Deploy to specific provider
contextrouter ingest deploy --type qa --provider vertex

# Blue/green deployment
contextrouter ingest deploy --type book --target green

# Large dataset deployment with validation
contextrouter ingest deploy --type knowledge --workers 8 --validate
```

### report - Ingestion Analytics & Reporting

Generate detailed reports on ingestion quality and performance.

**Usage:**
```bash
contextrouter ingest report [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type
- `--output PATH` - Report output path (default: ./report.html)
- `--format STR` - Report format: html, json, markdown (default: html)
- `--include-charts` - Include charts in HTML report
- `--include-samples` - Include data samples in report

**Examples:**
```bash
# HTML report with charts
contextrouter ingest report --type book

# JSON report for automation
contextrouter ingest report --type qa --format json --output ./qa-report.json

# Markdown report for documentation
contextrouter ingest report --type knowledge --format markdown --include-samples
```

### persona - Assistant Persona Generation

Generate personalized assistant configurations based on ingested content.

**Usage:**
```bash
contextrouter ingest persona [OPTIONS]
```

**Options:**
- `--type TYPE` - Content type
- `--traits LIST` - Personality traits to emphasize
- `--expertise LIST` - Expertise areas to focus on
- `--style STR` - Response style (formal, casual, technical)
- `--output PATH` - Persona configuration output path

**Examples:**
```bash
# Generate persona for Q&A content
contextrouter ingest persona --type qa

# Technical expert persona
contextrouter ingest persona --type knowledge --style technical --expertise "AI,Machine Learning"

# Custom personality traits
contextrouter ingest persona --type book --traits "helpful,concise,accurate"
```

## Registry Commands

### list - Component Discovery

List all registered components in the system.

**Usage:**
```bash
contextrouter registry list [OPTIONS]
```

**Options:**
- `--type STR` - Filter by component type (connectors, providers, transformers, agents, graphs)
- `--pattern STR` - Filter by name pattern (supports wildcards)
- `--json` - Output as JSON
- `--verbose` - Show detailed information

**Examples:**
```bash
# List all components
contextrouter registry list

# List only connectors
contextrouter registry list --type connectors

# Find components by pattern
contextrouter registry list --pattern "*web*"

# JSON output for automation
contextrouter registry list --json --type providers
```

**Sample Output:**
```
Registered Components
══════════════════════

Connectors (5)
├── web          - Google Custom Search integration
├── file         - Local file ingestion (PDF, TXT, MD, JSON)
├── rss          - RSS/Atom feed monitoring
├── api          - Generic REST API connector
└── slack        - Slack messages connector

Providers (3)
├── postgres     - PostgreSQL with pgvector
├── vertex       - Vertex AI Search
└── gcs          - Google Cloud Storage

Transformers (6)
├── ner          - Named Entity Recognition
├── taxonomy     - Category classification
├── summarization- Text summarization
├── keyphrases   - Key phrase extraction
└── shadow       - Shadow record generation
```

### show - Component Details

Show detailed information about a specific component.

**Usage:**
```bash
contextrouter registry show [OPTIONS] NAME
```

**Options:**
- `--type STR` - Component type (if name conflicts)
- `--config` - Show configuration schema
- `--examples` - Show usage examples
- `--verbose` - Show full implementation details

**Examples:**
```bash
# Show provider details
contextrouter registry show postgres

# Show with configuration
contextrouter registry show vertex --config

# Verbose output
contextrouter registry show ner --verbose

# Show examples
contextrouter registry show web --examples
```

**Sample Output:**
```
Component: postgres
Type: provider
Description: PostgreSQL with pgvector for hybrid search
Class: PostgresProvider

Configuration Schema:
├── host (str): Database host (default: localhost)
├── port (int): Database port (default: 5432)
├── database (str): Database name (required)
├── user (str): Database user (required)
├── password (str): Database password (from env)
└── search_path (str): Schema search path (default: public)

Usage Example:
from contextrouter.core.registry import select_provider
provider = select_provider("postgres")
results = await provider.read("machine learning", limit=10)
```

## Advanced CLI Features

### Configuration Management

#### Configuration Hierarchy

ContextRouter uses a layered configuration system:

1. **Default values** (built into code)
2. **Environment variables** (highest priority except runtime)
3. **Settings file** (`settings.toml`)
4. **Runtime overrides** (CLI flags, API parameters)

#### Configuration Commands

```bash
# Show current configuration
contextrouter config show

# Show configuration schema
contextrouter config schema

# Validate configuration
contextrouter config validate

# Generate sample configuration
contextrouter config sample > settings.toml
```

#### Environment Variables

```bash
# Provider credentials
export VERTEX_PROJECT_ID=my-project
export VERTEX_LOCATION=us-central1
export OPENAI_API_KEY=sk-...
export POSTGRES_PASSWORD=mysecret

# Application settings
export CR_CONFIG_PATH=./settings.toml
export CR_LOG_LEVEL=DEBUG
export CR_WORKERS=4
```

### Parallel Processing & Performance

#### Worker Management

```bash
# Use all CPU cores
contextrouter ingest run --workers 0  # 0 = auto-detect

# Limit parallelism for memory-constrained systems
contextrouter ingest run --workers 2

# Check optimal worker count
contextrouter ingest run --dry-run --workers 8
```

#### Memory Management

```bash
# Process large files in chunks
contextrouter ingest preprocess --chunk-size 500 --max-chunk-size 1000

# Batch processing for large datasets
contextrouter ingest deploy --batch-size 500 --workers 2

# Monitor memory usage
contextrouter ingest run --verbose  # Shows memory stats
```

### Pipeline Orchestration

#### Selective Execution

```bash
# Run only specific stages
contextrouter ingest preprocess --type book --input ./book.pdf
contextrouter ingest structure --type book
contextrouter ingest index --type book
contextrouter ingest deploy --type book

# Skip completed stages
contextrouter ingest run --type book --skip-preprocess --skip-structure

# Run stages for multiple types
contextrouter ingest index --type book,qa,web
```

#### Conditional Processing

```bash
# Only process if source changed (requires checksums)
contextrouter ingest run --type book --if-changed

# Force reprocessing
contextrouter ingest run --type book --overwrite

# Continue after failure
contextrouter ingest run --type book --continue-on-error
```

### Output & Logging

#### Enhanced Logging

```bash
# Debug mode
contextrouter --verbose ingest run --type book

# Structured JSON logging
contextrouter --log-format json ingest run --type book

# Log to file
contextrouter --log-file ./ingestion.log ingest run --type book

# Filter log levels
contextrouter --log-level INFO ingest run --type book
```

#### Progress Monitoring

```bash
# Show progress bars
contextrouter ingest run --type book --progress

# Show detailed timing
contextrouter ingest run --type book --timing

# Show resource usage
contextrouter ingest run --type book --profile
```

## Common Options Reference

| Option | Commands | Description |
|--------|----------|-------------|
| `--type TYPE` | ingest * | Content type: book, video, qa, web, knowledge |
| `--input PATH` | preprocess | Input file or directory path |
| `--output PATH` | export, report | Output path (default: ./ingestion_output) |
| `--overwrite` | run, * | Overwrite existing artifacts |
| `--skip-*` | run | Skip specific pipeline stages |
| `--workers INT` | run, deploy | Number of parallel workers |
| `--batch-size INT` | export, deploy | Records per batch |
| `--json` | query, list | Output as JSON |
| `--verbose` | all | Enable debug logging |
| `--dry-run` | run, deploy | Show what would be done |
| `--config PATH` | all | Path to settings file |
| `--env PATH` | all | Path to .env file |

## Examples

### Full Book Ingestion

```bash
# Run complete pipeline
contextrouter ingest run --type book --input ./my-book.pdf

# Or step by step
contextrouter ingest preprocess --type book --input ./my-book.pdf
contextrouter ingest structure --type book
contextrouter ingest index --type book
contextrouter ingest deploy --type book
```

### Resume After Failure

```bash
# Skip already-completed stages
contextrouter ingest run --type book --skip-preprocess --skip-structure
```

### Multiple Content Types

```bash
# Process books and Q&A together
contextrouter ingest run --type book,qa --input ./content/
```

### Blue/Green Deployment

```bash
# Deploy to staging (green)
contextrouter ingest deploy --type book --target green

# Verify staging
contextrouter rag chat --dataset green

# Switch to production (manual config change)
```

## Scripting & Automation

### Bash Scripting Examples

#### Automated Ingestion Pipeline

```bash
#!/bin/bash
# auto_ingest.sh - Automated ingestion for multiple content types

set -e  # Exit on any error

CONTENT_DIR="./content"
OUTPUT_DIR="./knowledge-base"
LOG_FILE="./ingestion.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Validate environment
log "Validating configuration..."
contextrouter rag validate --quiet

# Process different content types
for content_type in book qa web; do
    input_dir="$CONTENT_DIR/$content_type"
    if [ -d "$input_dir" ]; then
        log "Processing $content_type content from $input_dir"

        # Run full pipeline
        contextrouter ingest run \
            --type "$content_type" \
            --input "$input_dir" \
            --output "$OUTPUT_DIR" \
            --overwrite \
            --workers 4 \
            >> "$LOG_FILE" 2>&1

        # Generate report
        contextrouter ingest report \
            --type "$content_type" \
            --output "$OUTPUT_DIR/reports/$content_type.html" \
            >> "$LOG_FILE" 2>&1

        log "Completed $content_type processing"
    fi
done

# Validate deployment
log "Validating deployment..."
contextrouter rag query "test query" --json --quiet > /dev/null

log "Ingestion pipeline completed successfully"
```

#### Continuous Integration

```yaml
# .github/workflows/ingestion.yml
name: Knowledge Base Ingestion

on:
  push:
    paths:
      - 'content/**'
      - 'settings.toml'

jobs:
  ingest:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install ContextRouter
      run: pip install contextrouter[vertex,postgres]

    - name: Validate Configuration
      run: contextrouter rag validate

    - name: Run Ingestion
      run: |
        contextrouter ingest run \
          --type book,qa \
          --input ./content \
          --output ./kb-output \
          --workers 2

    - name: Generate Report
      run: |
        contextrouter ingest report \
          --type book \
          --output ./kb-output/report.html

    - name: Test Search
      run: |
        contextrouter rag query "test query" --json --quiet

    - name: Upload Report
      uses: actions/upload-artifact@v3
      with:
        name: ingestion-report
        path: ./kb-output/report.html
```

### Python Scripting

#### Batch Processing Script

```python
#!/usr/bin/env python3
"""
batch_ingest.py - Batch ingestion with progress monitoring
"""

import subprocess
import sys
from pathlib import Path
from typing import List

def run_command(cmd: List[str], description: str) -> bool:
    """Run command with error handling."""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    content_types = ["book", "qa", "web"]
    base_dir = Path("./content")

    for content_type in content_types:
        content_dir = base_dir / content_type
        if not content_dir.exists():
            print(f"⚠️  Skipping {content_type}: directory {content_dir} not found")
            continue

        # Preprocess
        if not run_command([
            "contextrouter", "ingest", "preprocess",
            "--type", content_type,
            "--input", str(content_dir)
        ], f"Preprocessing {content_type}"):
            sys.exit(1)

        # Structure
        if not run_command([
            "contextrouter", "ingest", "structure",
            "--type", content_type
        ], f"Building structure for {content_type}"):
            sys.exit(1)

        # Index
        if not run_command([
            "contextrouter", "ingest", "index",
            "--type", content_type
        ], f"Indexing {content_type}"):
            sys.exit(1)

        # Deploy
        if not run_command([
            "contextrouter", "ingest", "deploy",
            "--type", content_type
        ], f"Deploying {content_type}"):
            sys.exit(1)

        print(f"🎉 {content_type} ingestion completed successfully")

    # Final validation
    if run_command([
        "contextrouter", "rag", "query",
        "test query", "--json", "--quiet"
    ], "Validating search functionality"):
        print("🎉 All content types ingested successfully!")
    else:
        print("❌ Search validation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

#### Monitoring & Health Checks

```python
#!/usr/bin/env python3
"""
health_check.py - Monitor ContextRouter health
"""

import subprocess
import json
import time
from typing import Dict, Any

def run_query(query: str) -> Dict[str, Any]:
    """Run a test query and return metrics."""
    try:
        result = subprocess.run([
            "contextrouter", "rag", "query", query,
            "--json", "--quiet"
        ], capture_output=True, text=True, check=True, timeout=30)

        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError, subprocess.TimeoutExpired) as e:
        return {"error": str(e), "success": False}

def check_configuration() -> bool:
    """Check if configuration is valid."""
    try:
        subprocess.run([
            "contextrouter", "rag", "validate", "--quiet"
        ], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("🔍 ContextRouter Health Check")
    print("=" * 40)

    # Configuration check
    config_ok = check_configuration()
    print(f"Configuration: {'✅ Valid' if config_ok else '❌ Invalid'}")

    if not config_ok:
        print("❌ Health check failed: invalid configuration")
        return 1

    # Query performance tests
    test_queries = [
        "What is machine learning?",
        "artificial intelligence applications",
        "deep learning neural networks"
    ]

    total_time = 0
    successful_queries = 0

    for query in test_queries:
        print(f"\nTesting query: '{query}'")
        start_time = time.time()

        result = run_query(query)
        query_time = time.time() - start_time

        if "error" not in result:
            successful_queries += 1
            print(".2f"        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")

        total_time += query_time

    # Results summary
    success_rate = successful_queries / len(test_queries) * 100
    avg_time = total_time / len(test_queries)

    print("
📊 Results Summary"    print(f"Success rate: {success_rate:.1f}%")
    print(".2f"    print(f"Queries tested: {len(test_queries)}")

    if success_rate >= 90 and avg_time < 5.0:
        print("✅ System is healthy")
        return 0
    else:
        print("⚠️  System may need attention")
        return 1

if __name__ == "__main__":
    exit(main())
```

## Troubleshooting

### Common Issues & Solutions

#### Configuration Errors

**Issue**: `Configuration file not found`
```
Solution: Specify config path explicitly
contextrouter --config ./settings.toml rag validate
```

**Issue**: `Provider connection failed`
```
Solution: Check credentials and network
export VERTEX_PROJECT_ID=your-project
contextrouter rag validate --check-providers
```

#### Memory Issues

**Issue**: `Out of memory during ingestion`
```
Solutions:
- Reduce batch size: --batch-size 500
- Use fewer workers: --workers 2
- Process in chunks: --chunk-size 500
- Add swap space or increase RAM
```

#### Performance Problems

**Issue**: `Ingestion is too slow`
```
Solutions:
- Increase workers: --workers 8
- Use faster storage (SSD vs HDD)
- Disable unnecessary features: --no-graph for simple search
- Use GPU-enabled models for transformers
```

#### Search Issues

**Issue**: `Queries return no results`
```
Solutions:
- Check deployment: contextrouter ingest report
- Validate provider: contextrouter rag validate --check-providers
- Test simple query: contextrouter rag query "test"
- Check index population: verify data in Postgres/Vertex
```

#### Import Errors

**Issue**: `Module not found`
```
Solutions:
- Install missing packages: pip install missing-package
- Check Python path: python -c "import contextrouter"
- Reinstall: pip uninstall contextrouter && pip install contextrouter
```

### Debug Mode

Enable detailed debugging for troubleshooting:

```bash
# Maximum verbosity
contextrouter --verbose rag chat

# Log everything
contextrouter --log-level DEBUG --log-file debug.log ingest run --type book

# Show stack traces
export PYTHONUNBUFFERED=1
contextrouter --verbose rag query "test"
```

### Getting Help

```bash
# Show all commands
contextrouter --help

# Command-specific help
contextrouter ingest run --help

# Show version and system info
contextrouter --version

# Report issues
# GitHub: https://github.com/ContextRouter/contextrouter/issues
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | - |
| 1 | General error | Check error message |
| 2 | Configuration error | Validate settings.toml |
| 3 | Provider error | Check credentials/network |
| 4 | Validation error | Fix data quality issues |
| 5 | Timeout error | Increase timeouts or reduce load |
| 130 | Interrupted (Ctrl+C) | Safe to retry |

## Error Handling

The CLI uses Rich for enhanced error output:

- **Colorized tracebacks** with syntax highlighting
- **Local variables** shown in stack traces
- **Clear error messages** with suggested fixes
- **Contextual help** for common issues

All errors go to `stderr`, keeping `stdout` clean for scripting.
