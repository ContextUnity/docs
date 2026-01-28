---
title: Troubleshooting Guide
description: Common issues and their solutions when working with ContextRouter.
---

This guide covers common problems you might encounter when using ContextRouter, along with their solutions and debugging techniques.

## Configuration Issues

### "Configuration file not found"

**Symptoms:**
- `FileNotFoundError: settings.toml not found`
- Application fails to start

**Solutions:**

1. **Check file location:**
   ```bash
   ls -la settings.toml
   ```

2. **Specify custom path:**
   ```bash
   contextrouter --config ./my-settings.toml rag validate
   ```

3. **Create default configuration:**
   ```bash
   contextrouter config sample > settings.toml
   ```

4. **Check permissions:**
   ```bash
   chmod 644 settings.toml
   ```

### Invalid Configuration

**Symptoms:**
- `ValidationError` during startup
- "Required field missing" errors

**Solutions:**

1. **Validate configuration:**
   ```bash
   contextrouter rag validate --verbose
   ```

2. **Check required fields:**
   ```toml
   [models]
   default_llm = "vertex/gemini-2.0-flash"  # Required
   default_embeddings = "vertex/text-embedding-004"  # Required
   ```

3. **Fix environment variables:**
   ```bash
   export VERTEX_PROJECT_ID=your-project-id
   export VERTEX_LOCATION=us-central1
   ```

### Provider Connection Issues

**Symptoms:**
- "Connection failed" errors
- Timeout errors when accessing providers

**Solutions:**

1. **Test provider connectivity:**
   ```bash
   contextrouter rag validate --check-providers
   ```

2. **Check credentials:**
   ```bash
   # Vertex AI
   export VERTEX_PROJECT_ID=your-project
   export VERTEX_LOCATION=us-central1

   # OpenAI
   export OPENAI_API_KEY=sk-your-key

   # PostgreSQL
   export POSTGRES_PASSWORD=your-password
   ```

3. **Verify network access:**
   ```bash
   # Test Vertex AI
   curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        "https://us-central1-aiplatform.googleapis.com/v1/projects/your-project/locations/us-central1/publishers/google/models"

   # Test OpenAI
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        "https://api.openai.com/v1/models"
   ```

## Ingestion Problems

### Preprocessing Failures

**Symptoms:**
- "Failed to extract text from PDF"
- Empty or garbled text chunks

**Solutions:**

1. **Check file format:**
   ```bash
   file document.pdf  # Should show "PDF document"
   ```

2. **Install OCR for scanned PDFs:**
   ```bash
   pip install pdfplumber pytesseract
   sudo apt-get install tesseract-ocr  # Linux
   ```

3. **Adjust chunking parameters:**
   ```toml
   [ingestion.rag.preprocess]
   chunk_size = 800  # Smaller chunks
   chunk_overlap = 100  # More overlap
   ```

4. **Handle encoding issues:**
   ```bash
   # Detect file encoding
   file -bi document.pdf

   # Convert encoding if needed
   iconv -f latin1 -t utf8 document.pdf > converted.pdf
   ```

### Structure Stage Issues

**Symptoms:**
- "LLM failed to generate taxonomy"
- Empty or irrelevant categories

**Solutions:**

1. **Check LLM configuration:**
   ```toml
   [ingestion.rag.structure.taxonomy]
   scan_model = "vertex/gemini-2.0-flash"  # Ensure valid model
   max_samples = 50  # Reduce if timing out
   ```

2. **Provide custom categories:**
   ```toml
   [ingestion.rag.structure.taxonomy]
   categories = ["AI", "Machine Learning", "Data Science"]
   ```

3. **Adjust sampling:**
   ```toml
   [ingestion.rag.structure.taxonomy]
   max_samples = 25  # Fewer samples for faster processing
   hard_cap_samples = 100  # Maximum samples to analyze
   ```

### Index Stage Problems

**Symptoms:**
- "Entity extraction failed"
- Knowledge graph is empty or incomplete

**Solutions:**

1. **Check NER model:**
   ```toml
   [ingestion.rag.index.ner]
   enabled = true
   model = "vertex/gemini-2.0-flash"
   confidence_threshold = 0.6  # Lower for more entities
   ```

2. **Enable graph building:**
   ```toml
   [ingestion.rag.index.graph]
   enabled = true
   builder_mode = "llm"  # or "local" for faster processing
   cognee_enabled = true
   ```

3. **Adjust entity limits:**
   ```toml
   [ingestion.rag.index.graph]
   max_entities_per_chunk = 15  # More entities for richer graphs
   ```

### Deploy Stage Issues

**Symptoms:**
- "Upload to provider failed"
- Data not appearing in search results

**Solutions:**

1. **Check provider configuration:**
   ```bash
   contextrouter rag validate --check-providers
   ```

2. **Verify provider permissions:**
   ```sql
   -- PostgreSQL: Check user permissions
   SELECT * FROM information_schema.role_table_grants
   WHERE grantee = 'contextrouter_user';
   ```

3. **Check data format:**
   ```bash
   # Validate JSONL format
   head -5 shadow/book.jsonl | jq .
   ```

4. **Monitor deployment progress:**
   ```bash
   contextrouter ingest deploy --verbose --workers 2
   ```

## RAG Query Issues

### No Results Returned

**Symptoms:**
- Queries return empty results
- "No documents found" messages

**Solutions:**

1. **Check data deployment:**
   ```bash
   # Test basic search
   contextrouter rag query "test" --json
   ```

2. **Verify provider connectivity:**
   ```bash
   contextrouter rag validate --check-providers
   ```

3. **Check index population:**
   ```sql
   -- PostgreSQL: Check document count
   SELECT count(*) FROM documents;
   ```

4. **Test with simple queries:**
   ```bash
   # Try different query types
   contextrouter rag query "machine learning"
   contextrouter rag query "artificial intelligence"
   ```

### Poor Result Quality

**Symptoms:**
- Irrelevant results
- Missing expected documents
- Low-quality citations

**Solutions:**

1. **Adjust retrieval settings:**
   ```toml
   [rag]
   general_retrieval_final_count = 15  # More results
   reranking_enabled = true           # Enable reranking
   hybrid_fusion = "rrf"              # Better fusion
   ```

2. **Check embeddings:**
   ```bash
   # Test embedding generation
   contextrouter rag query "test embeddings" --debug
   ```

3. **Review ingestion quality:**
   ```bash
   contextrouter ingest report --type book
   ```

4. **Fine-tune search parameters:**
   ```toml
   [rag]
   enable_fts = true          # Full-text search
   rrff_k = 50               # RRF parameter
   hybrid_vector_weight = 0.8  # Favor semantic search
   ```

### Performance Issues

**Symptoms:**
- Slow query responses
- High latency

**Solutions:**

1. **Optimize retrieval:**
   ```toml
   [rag]
   general_retrieval_final_count = 8  # Fewer results
   max_retrieval_queries = 2          # Fewer query variations
   ```

2. **Use faster models:**
   ```toml
   [models]
   default_llm = "groq/llama-3.3-70b"  # Faster inference
   ```

3. **Enable caching:**
   ```toml
   [rag]
   cache_enabled = true
   cache_ttl_seconds = 3600
   ```

4. **Database optimization:**
   ```sql
   -- PostgreSQL: Add indexes
   CREATE INDEX CONCURRENTLY idx_documents_embedding
   ON documents USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   ```

## Model & API Issues

### Model Authentication Errors

**Symptoms:**
- "Authentication failed" errors
- "Invalid API key" messages

**Solutions:**

1. **Verify API keys:**
   ```bash
   # OpenAI
   export OPENAI_API_KEY=sk-your-key-here

   # Test key validity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        "https://api.openai.com/v1/models" | jq .data[0]
   ```

2. **Check Vertex AI setup:**
   ```bash
   # Authenticate with gcloud
   gcloud auth login
   gcloud config set project your-project-id

   # Test Vertex AI access
   gcloud ai models list --region=us-central1
   ```

3. **Verify permissions:**
   ```bash
   # Check GCP permissions
   gcloud projects get-iam-policy your-project-id \
     --flatten="bindings[].members" \
     --format="table(bindings.members)"
   ```

### Model Timeout Errors

**Symptoms:**
- "Request timeout" errors
- Long response times

**Solutions:**

1. **Increase timeouts:**
   ```toml
   [models]
   timeout_sec = 120  # Increase timeout
   ```

2. **Use faster models:**
   ```toml
   [models]
   default_llm = "groq/llama-3.3-70b"  # Fast inference
   ```

3. **Reduce token limits:**
   ```toml
   [models]
   max_output_tokens = 512  # Shorter responses
   ```

### Rate Limiting

**Symptoms:**
- "Rate limit exceeded" errors
- Intermittent failures

**Solutions:**

1. **Implement backoff:**
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential

   @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
   async def call_model():
       return await model.generate(request)
   ```

2. **Use multiple providers:**
   ```toml
   # Fallback configuration
   [models.fallback]
   primary = "vertex/gemini-2.0-flash"
   secondary = ["openai/gpt-5-mini", "groq/llama-3.3-70b"]
   ```

3. **Implement caching:**
   ```toml
   [models]
   cache_enabled = true
   cache_ttl_seconds = 3600
   ```

## Registry & Plugin Issues

### Component Not Found

**Symptoms:**
- "Component not registered" errors
- Import errors for custom components

**Solutions:**

1. **Check registry:**
   ```bash
   contextrouter registry list --type transformers
   ```

2. **Verify imports:**
   ```python
   # Ensure module is imported
   import my_custom_transformers

   # Check registration
   from contextrouter.core.registry import transformer_registry
   print(list(transformer_registry.keys()))
   ```

3. **Fix import order:**
   ```python
   # Import before using ContextRouter
   import my_plugins
   from contextrouter.core import get_core_config
   ```

### Plugin Loading Problems

**Symptoms:**
- Plugins not appearing in registry
- Import errors during startup

**Solutions:**

1. **Check plugin directory:**
   ```bash
   ls -la plugins/
   # Should contain __init__.py
   ```

2. **Verify plugin structure:**
   ```python
   # plugins/my_plugin.py
   from contextrouter.core.registry import register_transformer

   @register_transformer("my_transformer")
   class MyTransformer(BaseTransformer):
       def transform(self, envelope):
           return envelope
   ```

3. **Check plugin configuration:**
   ```toml
   [plugins]
   paths = ["./plugins", "~/my-plugins"]
   auto_discover = true
   ```

## Memory & Performance Issues

### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Out of memory errors

**Solutions:**

1. **Monitor memory usage:**
   ```python
   import psutil
   import os

   process = psutil.Process(os.getpid())
   memory_mb = process.memory_info().rss / 1024 / 1024
   print(f"Memory usage: {memory_mb:.1f} MB")
   ```

2. **Process in batches:**
   ```python
   def process_batch(items, batch_size=100):
       for i in range(0, len(items), batch_size):
           batch = items[i:i + batch_size]
           process_batch_items(batch)
           # Force garbage collection
           import gc
           gc.collect()
   ```

3. **Use streaming for large datasets:**
   ```python
   async def stream_processing(data_source):
       async for batch in data_source.batches(batch_size=50):
           await process_batch(batch)
           yield batch  # Allow async processing
   ```

### High CPU Usage

**Symptoms:**
- High CPU utilization
- Slow processing

**Solutions:**

1. **Adjust parallelism:**
   ```toml
   [ingestion.rag]
   workers = 2  # Reduce worker count
   ```

2. **Use CPU-efficient settings:**
   ```toml
   [ingestion.rag.index.graph]
   builder_mode = "local"  # Avoid LLM calls for graph building
   ```

3. **Profile performance:**
   ```python
   import cProfile
   import pstats

   profiler = cProfile.Profile()
   profiler.enable()
   # Run your code
   profiler.disable()

   stats = pstats.Stats(profiler).sort_stats('cumulative')
   stats.print_stats(20)  # Top 20 functions
   ```

## Network & Connectivity Issues

### DNS Resolution Problems

**Symptoms:**
- "Name resolution failure" errors
- Intermittent connection issues

**Solutions:**

1. **Check DNS configuration:**
   ```bash
   nslookup api.openai.com
   nslookup us-central1-aiplatform.googleapis.com
   ```

2. **Use different DNS servers:**
   ```bash
   echo "nameserver 8.8.8.8" > /etc/resolv.conf
   echo "nameserver 1.1.1.1" >> /etc/resolv.conf
   ```

3. **Configure proxy if needed:**
   ```bash
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   ```

### SSL/TLS Issues

**Symptoms:**
- "SSL certificate verify failed" errors
- Connection refused errors

**Solutions:**

1. **Update certificates:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install ca-certificates

   # macOS
   brew install curl
   ```

2. **Disable SSL verification (temporary):**
   ```python
   import ssl
   ssl._create_default_https_context = ssl._create_unverified_context
   ```

3. **Check firewall settings:**
   ```bash
   # Test connectivity
   telnet api.openai.com 443
   ```

## Debugging Techniques

### Enable Debug Logging

```bash
# Maximum verbosity
contextrouter --verbose rag chat

# Structured logging
contextrouter --log-format json --log-file debug.log ingest run --type book

# Filter specific components
contextrouter --log-level DEBUG --log-filter "contextrouter.modules.models" rag query "test"
```

### Inspect Internal State

```python
# Debug configuration loading
from contextrouter.core import get_core_config
config = get_core_config()
print(config.model_dump())  # Show full configuration

# Debug registry state
from contextrouter.core.registry import transformer_registry
print("Registered transformers:", list(transformer_registry.keys()))

# Debug provider connections
from contextrouter.core.registry import select_provider
try:
    provider = select_provider("postgres")
    print("Provider initialized successfully")
except Exception as e:
    print(f"Provider initialization failed: {e}")
```

### Performance Profiling

```python
import time
from contextlib import contextmanager

@contextmanager
def time_operation(name):
    start = time.time()
    try:
        yield
    finally:
        elapsed = time.time() - start
        print(f"{name} took {elapsed:.2f} seconds")

# Usage
with time_operation("Ingestion preprocessing"):
    await preprocess_documents()

with time_operation("Graph building"):
    await build_knowledge_graph()
```

### Interactive Debugging

```python
# Drop into debugger on error
import pdb

try:
    result = await process_documents()
except Exception as e:
    print(f"Error: {e}")
    pdb.post_mortem()  # Start debugger at error point

# Or set breakpoint
def debug_function():
    import pdb; pdb.set_trace()  # Breakpoint here
    result = do_something()
    return result
```

## Getting Help

### Community Support

1. **GitHub Issues:** Report bugs and request features
2. **GitHub Discussions:** Ask questions and share solutions
3. **Discord:** Real-time community support

### Diagnostic Information

When reporting issues, include:

```bash
# System information
contextrouter --version
python --version
pip list | grep contextrouter

# Configuration validation
contextrouter rag validate --verbose

# Registry status
contextrouter registry list

# Recent logs
tail -50 ~/.contextrouter/logs/app.log
```

### Common Diagnostic Commands

```bash
# Full system health check
contextrouter rag validate --check-providers --check-models --verbose

# Test ingestion pipeline
contextrouter ingest run --type book --input test.pdf --dry-run

# Test RAG query pipeline
contextrouter rag query "test query" --debug --json

# Check database connectivity
contextrouter registry show postgres --config
```

This troubleshooting guide should help you resolve most common issues. If you encounter problems not covered here, please check the GitHub repository for the latest information and community solutions.