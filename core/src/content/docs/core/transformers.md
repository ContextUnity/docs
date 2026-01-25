---
title: Transformers
description: Data transformation and enrichment components in ContextRouter.
---

Transformers are modular components that process, analyze, and enrich data as it flows through ContextRouter pipelines. They provide the "intelligence" that turns raw data into structured, searchable knowledge.

## What Are Transformers?

Transformers are functions or classes that take a `BisquitEnvelope` as input, process its content, and return an enriched envelope. They can:

- Extract entities and relationships
- Analyze sentiment and tone
- Classify content by topic
- Generate summaries and keywords
- Convert between formats
- Add metadata and provenance

## Core Architecture

### Base Interface

All transformers implement the `BaseTransformer` interface:

```python
from abc import ABC, abstractmethod
from contextrouter.core.bisquit import BisquitEnvelope

class BaseTransformer(ABC):
    """Base class for all transformers."""

    @abstractmethod
    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Transform the envelope content."""
        pass
```

### Registration

Transformers are registered using decorators:

```python
from contextrouter.core.registry import register_transformer

@register_transformer("my_transformer")
class MyTransformer(BaseTransformer):
    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        # Process envelope
        return envelope
```

## Built-in Transformers

### NER Transformer (`@register_transformer("ner")`)

Extracts named entities from text content.

**Features:**
- Person, Organization, Location recognition
- Date, money, percentage extraction
- Custom entity types support
- Confidence scoring

**Configuration:**
```toml
[ingestion.rag.transformers.ner]
enabled = true
model = "vertex/gemini-2.0-flash"
entity_types = ["PERSON", "ORG", "GPE", "DATE", "MONEY"]
confidence_threshold = 0.7
max_entities_per_chunk = 20
```

**Example Output:**
```python
# Input envelope
envelope = BisquitEnvelope(
    content={"text": "John Smith works at Google in New York."}
)

# After NER transformation
envelope.content["entities"] = [
    {"text": "John Smith", "type": "PERSON", "confidence": 0.95},
    {"text": "Google", "type": "ORG", "confidence": 0.92},
    {"text": "New York", "type": "GPE", "confidence": 0.88}
]
```

### Taxonomy Transformer (`@register_transformer("taxonomy")`)

Categorizes content into hierarchical topics.

**Features:**
- Automatic topic classification
- Hierarchical category trees
- Confidence-based categorization
- Custom taxonomy support

**Configuration:**
```toml
[ingestion.rag.transformers.taxonomy]
enabled = true
model = "vertex/gemini-2.0-flash"
max_categories = 5
category_depth = 3
confidence_threshold = 0.6
```

**Example Output:**
```python
envelope.content["categories"] = [
    {"name": "Technology", "confidence": 0.89},
    {"name": "Artificial Intelligence", "confidence": 0.76},
    {"name": "Machine Learning", "confidence": 0.68}
]
```

### Keyphrases Transformer (`@register_transformer("keyphrases")`)

Extracts important phrases and keywords.

**Features:**
- Statistical and LLM-based extraction
- Multi-language support
- Phrase length control
- Relevance ranking

**Configuration:**
```toml
[ingestion.rag.transformers.keyphrases]
enabled = true
algorithm = "mixed"  # "llm", "tfidf", "mixed"
max_phrases = 10
min_phrase_length = 2
max_phrase_length = 5
```

### Summarization Transformer (`@register_transformer("summarization")`)

Generates concise summaries of content.

**Features:**
- Extractive and abstractive summarization
- Length control
- Multi-language support
- Focus area specification

**Configuration:**
```toml
[ingestion.rag.transformers.summarization]
enabled = true
model = "vertex/gemini-2.0-flash"
max_length = 200
min_length = 50
focus_areas = ["main_points", "conclusion", "key_facts"]
```

### Sentiment Transformer (`@register_transformer("sentiment")`)

Analyzes emotional tone and sentiment.

**Features:**
- Positive/negative/neutral classification
- Intensity scoring
- Emotion detection
- Context-aware analysis

**Configuration:**
```toml
[ingestion.rag.transformers.sentiment]
enabled = true
model = "vertex/gemini-2.0-flash"
include_emotions = true
intensity_threshold = 0.3
```

### Shadow Record Transformer (`@register_transformer("shadow")`)

Creates optimized metadata for search indexing.

**Features:**
- Combines multiple analysis results
- Generates search-friendly representations
- Pre-computes frequently accessed fields
- Optimizes for vector search

**Configuration:**
```toml
[ingestion.rag.transformers.shadow]
enabled = true
include_keywords = true
include_entities = true
include_taxonomy = true
include_summary = true
summary_length = 200
```

## Using Transformers

### Direct Usage

```python
from contextrouter.core.registry import select_transformer
from contextrouter.core.bisquit import BisquitEnvelope

# Get a transformer
ner_transformer = select_transformer("ner")

# Create envelope
envelope = BisquitEnvelope(
    content={"text": "Apple Inc. was founded by Steve Jobs in Cupertino."}
)

# Apply transformation
enriched = ner_transformer.transform(envelope)

print(enriched.content["entities"])
# [{"text": "Apple Inc.", "type": "ORG", ...}, {"text": "Steve Jobs", "type": "PERSON", ...}]
```

### Pipeline Composition

```python
from typing import List

def create_enrichment_pipeline(transformer_names: List[str]):
    """Create a pipeline of transformers."""
    transformers = [select_transformer(name) for name in transformer_names]

    def process(envelope: BisquitEnvelope) -> BisquitEnvelope:
        for transformer in transformers:
            envelope = transformer.transform(envelope)
        return envelope

    return process

# Create pipeline
enrich_pipeline = create_enrichment_pipeline([
    "ner",
    "taxonomy",
    "keyphrases",
    "summarization"
])

# Process content
envelope = BisquitEnvelope(content={"text": article_text})
enriched = enrich_pipeline(envelope)
```

### Conditional Transformation

```python
def smart_transform(envelope: BisquitEnvelope) -> BisquitEnvelope:
    """Apply transformers based on content analysis."""
    content = envelope.content
    text = content.get("text", "")

    # Detect content type
    if is_code(text):
        # Apply code-specific transformers
        code_transformer = select_transformer("code_analyzer")
        envelope = code_transformer.transform(envelope)

    elif is_news(text):
        # Apply news-specific transformers
        sentiment_transformer = select_transformer("sentiment")
        envelope = sentiment_transformer.transform(envelope)

    else:
        # Apply general transformers
        ner_transformer = select_transformer("ner")
        envelope = ner_transformer.transform(envelope)

    return envelope
```

## Custom Transformers

### Basic Custom Transformer

```python
from contextrouter.core.registry import register_transformer
from contextrouter.core.interfaces import BaseTransformer

@register_transformer("word_count")
class WordCountTransformer(BaseTransformer):
    """Counts words in text content."""

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        content = envelope.content

        if isinstance(content, dict) and "text" in content:
            text = content["text"]
            word_count = len(text.split())

            # Add metadata
            envelope.metadata["word_count"] = word_count
            envelope.metadata["character_count"] = len(text)

            # Add trace
            envelope.add_trace("transformer:word_count")

        return envelope
```

### Advanced Custom Transformer

```python
@register_transformer("complexity_analyzer")
class ComplexityAnalyzer(BaseTransformer):
    """Analyzes text complexity using multiple metrics."""

    def __init__(self, config=None):
        self.config = config or {}
        self.readability_metrics = self.config.get("readability", True)

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        content = envelope.content

        if not isinstance(content, dict) or "text" not in content:
            return envelope

        text = content["text"]
        analysis = {}

        # Basic metrics
        analysis["word_count"] = len(text.split())
        analysis["sentence_count"] = len(text.split('.'))
        analysis["avg_word_length"] = sum(len(word) for word in text.split()) / max(1, analysis["word_count"])

        # Readability (if enabled)
        if self.readability_metrics:
            analysis["flesch_score"] = self._calculate_flesch(text)
            analysis["reading_level"] = self._get_reading_level(analysis["flesch_score"])

        # Complexity classification
        analysis["complexity"] = self._classify_complexity(analysis)

        # Update envelope
        content["complexity_analysis"] = analysis
        envelope.metadata.update({
            "complexity_score": analysis["complexity"],
            "reading_level": analysis.get("reading_level", "unknown")
        })
        envelope.add_trace("transformer:complexity_analyzer")

        return envelope

    def _calculate_flesch(self, text: str) -> float:
        """Calculate Flesch Reading Ease score."""
        # Simplified implementation
        words = len(text.split())
        sentences = len(text.split('.'))
        syllables = sum(self._count_syllables(word) for word in text.split())

        if words == 0 or sentences == 0:
            return 0.0

        return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)

    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word."""
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        prev_was_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                count += 1
            prev_was_vowel = is_vowel

        if word.endswith("e"):
            count -= 1
        if count == 0:
            count = 1

        return count

    def _get_reading_level(self, flesch_score: float) -> str:
        """Convert Flesch score to reading level."""
        if flesch_score >= 90:
            return "5th grade"
        elif flesch_score >= 80:
            return "6th grade"
        elif flesch_score >= 70:
            return "7th grade"
        elif flesch_score >= 60:
            return "8th-9th grade"
        elif flesch_score >= 50:
            return "10th-12th grade"
        elif flesch_score >= 30:
            return "college"
        else:
            return "college graduate"

    def _classify_complexity(self, analysis: dict) -> float:
        """Classify text complexity on 0-1 scale."""
        # Combine multiple factors
        word_length_factor = min(1.0, analysis["avg_word_length"] / 8.0)
        sentence_length_factor = min(1.0, analysis["word_count"] / max(1, analysis["sentence_count"]) / 20.0)

        return (word_length_factor + sentence_length_factor) / 2.0
```

### Asynchronous Transformers

```python
import asyncio
from typing import List

@register_transformer("async_batch_processor")
class AsyncBatchTransformer(BaseTransformer):
    """Processes multiple envelopes asynchronously."""

    async def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Async transformation with batch processing."""
        content = envelope.content

        if isinstance(content, dict) and "batch_items" in content:
            # Process items in parallel
            items = content["batch_items"]
            tasks = [self._process_item(item) for item in items]
            processed_items = await asyncio.gather(*tasks)

            content["processed_batch"] = processed_items
            envelope.add_trace("transformer:async_batch_processor")

        return envelope

    async def _process_item(self, item: dict) -> dict:
        """Process a single item (simulate async work)."""
        await asyncio.sleep(0.1)  # Simulate I/O
        return {
            "original": item,
            "processed": True,
            "timestamp": asyncio.get_event_loop().time()
        }
```

## Configuration & Deployment

### Global Configuration

Configure transformers globally in `settings.toml`:

```toml
[ingestion.rag.transformers]
# Global settings for all transformers
timeout_seconds = 30
retry_attempts = 3
batch_size = 10

[ingestion.rag.transformers.ner]
enabled = true
model = "vertex/gemini-2.0-flash"
entity_types = ["PERSON", "ORG", "GPE"]
confidence_threshold = 0.7

[ingestion.rag.transformers.taxonomy]
enabled = true
model = "vertex/gemini-2.0-flash"
max_categories = 5
custom_categories = ["AI", "Machine Learning", "Data Science"]
```

### Runtime Configuration

Override settings at runtime:

```python
# Runtime transformer configuration
runtime_config = {
    "transformers": {
        "ner": {
            "enabled": True,
            "confidence_threshold": 0.8,
            "entity_types": ["PERSON", "ORG", "TECH"]
        },
        "taxonomy": {
            "enabled": False  # Disable taxonomy for this request
        }
    }
}

# Apply to processing
result = await process_with_config(envelope, runtime_config)
```

### Plugin-Based Transformers

Package transformers as plugins:

```python
# my_transformers/__init__.py
from .sentiment import SentimentTransformer
from .code_analysis import CodeAnalysisTransformer

# Register on import
__all__ = ["SentimentTransformer", "CodeAnalysisTransformer"]

# my_transformers/sentiment.py
from contextrouter.core.registry import register_transformer

@register_transformer("advanced_sentiment")
class SentimentTransformer(BaseTransformer):
    # Advanced sentiment analysis implementation
    pass
```

## Best Practices

### Performance

1. **Batch processing** for multiple envelopes
2. **Caching** for expensive operations
3. **Async I/O** for external API calls
4. **Early termination** for irrelevant content

### Error Handling

1. **Graceful degradation** when transformers fail
2. **Timeout protection** for long-running operations
3. **Retry logic** for transient failures
4. **Logging** of transformation errors

### Data Quality

1. **Input validation** before processing
2. **Confidence scoring** for uncertain results
3. **Fallback values** for missing data
4. **Provenance tracking** for all transformations

### Testing

1. **Unit tests** for individual transformers
2. **Integration tests** for transformer pipelines
3. **Mock external dependencies** for reliable testing
4. **Performance benchmarks** for optimization

## Troubleshooting

### Common Issues

**Transformer not found:**
```python
# Check if transformer is registered
from contextrouter.core.registry import transformer_registry
print(list(transformer_registry.keys()))

# Ensure import happened
import my_transformers  # Triggers registration
```

**Timeout errors:**
```toml
# Increase timeout
[ingestion.rag.transformers]
timeout_seconds = 60
```

**Memory issues:**
```python
# Process in batches
def batch_transform(envelopes: List[BisquitEnvelope], batch_size: int = 10):
    for i in range(0, len(envelopes), batch_size):
        batch = envelopes[i:i + batch_size]
        # Process batch
        yield process_batch(batch)
```

**Inconsistent results:**
```python
# Add seed for reproducible results
@register_transformer("consistent_ner")
class ConsistentNERTransformer(BaseTransformer):
    def __init__(self, seed: int = 42):
        self.seed = seed

    def transform(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        # Use seed for consistent randomization
        import random
        random.seed(self.seed)
        # ... rest of implementation
```

## Advanced Topics

### Transformer Chains

Create complex processing pipelines:

```python
class TransformerChain:
    """Chain multiple transformers with conditional logic."""

    def __init__(self, transformers_config: dict):
        self.config = transformers_config
        self.transformers = {}

        # Initialize transformers
        for name, settings in self.config.items():
            if settings.get("enabled", True):
                self.transformers[name] = select_transformer(name)

    def process(self, envelope: BisquitEnvelope) -> BisquitEnvelope:
        """Process envelope through transformer chain."""
        content_type = self._detect_content_type(envelope)

        # Apply content-specific transformers
        if content_type == "code":
            chain = ["code_analyzer", "complexity_analyzer"]
        elif content_type == "news":
            chain = ["sentiment", "taxonomy", "summarization"]
        else:
            chain = ["ner", "keyphrases", "taxonomy"]

        for transformer_name in chain:
            if transformer_name in self.transformers:
                transformer = self.transformers[transformer_name]
                envelope = transformer.transform(envelope)

        return envelope

    def _detect_content_type(self, envelope: BisquitEnvelope) -> str:
        """Detect content type for conditional processing."""
        content = envelope.content
        if isinstance(content, dict) and "text" in content:
            text = content["text"].lower()
            if any(ext in text for ext in [".py", ".js", ".java", "function", "class "]):
                return "code"
            elif any(word in text for word in ["breaking", "news", "announced", "reported"]):
                return "news"
        return "general"
```

### Custom Transformer Registry

Create domain-specific transformer registries:

```python
from contextrouter.core.registry import ComponentFactory

class DomainTransformerRegistry:
    """Registry for domain-specific transformers."""

    def __init__(self, domain: str):
        self.domain = domain
        self.transformers = {}

    def register(self, name: str, transformer_class: type):
        """Register a domain transformer."""
        self.transformers[name] = transformer_class

    def get(self, name: str):
        """Get transformer with domain-specific logic."""
        transformer_class = self.transformers.get(name)
        if not transformer_class:
            raise KeyError(f"Transformer '{name}' not found in {self.domain} domain")

        # Initialize with domain-specific config
        return transformer_class(domain_config=self._get_domain_config())

    def _get_domain_config(self) -> dict:
        """Get configuration for this domain."""
        # Domain-specific configuration logic
        return {"domain": self.domain}

# Usage
medical_registry = DomainTransformerRegistry("medical")
medical_registry.register("diagnosis_extractor", DiagnosisExtractor)

extractor = medical_registry.get("diagnosis_extractor")
```

This comprehensive transformer system enables flexible, modular data processing that can be easily extended and customized for specific use cases.