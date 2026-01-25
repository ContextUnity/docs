---
title: Ingestion Pipeline
description: Transform raw documents into a searchable, graph-enriched knowledge base.
---

The ingestion pipeline transforms raw data (PDFs, videos, Q&A transcripts) into a structured, searchable knowledge base. It's a multi-stage process that builds taxonomy, extracts entities, creates knowledge graphs, and deploys to your search index.

## Pipeline Overview

The ingestion pipeline transforms raw content into a searchable knowledge base through four main stages. Each stage builds upon the previous, creating increasingly rich and structured data.

```
Raw Documents (PDFs, Videos, Q&A, Web)
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: PREPROCESS                                         │
│                                                             │
│  Input: Raw files, transcripts, scraped content             │
│  Process:                                                   │
│  • Text extraction and cleaning                             │
│  • Speaker detection (Q&A)                                  │
│  • Content chunking with overlap                            │
│  • Normalization and deduplication                          │
│                                                             │
│  Output: clean_text/*.jsonl (chunked, cleaned content)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 2: STRUCTURE                                          │
│                                                             │
│  Input: clean_text/*.jsonl                                  │
│  Process:                                                   │
│  • Taxonomy building (hierarchical categories)              │
│  • Ontology creation (entity-relationship schemas)          │
│  • Content sampling and LLM analysis                        │
│  • Semantic relationship mapping                            │
│                                                             │
│  Output: taxonomy.json, ontology.json                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 3: INDEX                                              │
│                                                             │
│  Input: clean_text/*.jsonl + taxonomy.json + ontology.json  │
│  Process:                                                   │
│  • Named Entity Recognition (NER)                           │
│  • Key phrase extraction                                    │
│  • Knowledge graph construction                             │
│  • Shadow record generation with enriched metadata          │
│  • Relationship linking and graph edges                     │
│                                                             │
│  Output: knowledge_graph.pickle, shadow/*.jsonl             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 4: DEPLOY                                             │
│                                                             │
│  Input: shadow/*.jsonl + knowledge_graph.pickle             │
│  Process:                                                   │
│  • Format conversion (JSONL/SQL)                            │
│  • Embedding generation                                      │
│  • Vector index population                                   │
│  • Knowledge graph upload                                    │
│  • Ingestion report generation                               │
│                                                             │
│  Output: Data in Postgres/Vertex + report.html               │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Using the CLI

The fastest way to run ingestion:

```bash
# Full pipeline for a book
contextrouter ingest run --type book --input ./my-book.pdf

# Full pipeline for Q&A transcripts
contextrouter ingest run --type qa --input ./transcripts/

# Run specific stages
contextrouter ingest preprocess --type book
contextrouter ingest structure --type book
contextrouter ingest index --type book
contextrouter ingest deploy --type book
```

### Using Python

```python
from contextrouter.cortex.graphs.rag_ingestion import compile_graph

graph = compile_graph()

result = await graph.ainvoke({
    "ingestion_config_path": "./settings.toml",
    "only_types": ["book"],
    "overwrite": True,
})
```

## Content Types & Plugins

ContextRouter uses specialized plugins for different content types. Each plugin includes custom transformers that understand the specific structure and requirements of that content type.

### Book Plugin (`@register_ingestion_plugin("book")`)
For long-form documents (PDFs, ebooks, technical manuals):

**Transformers Used:**
- **BookAnalyzer**: Chapter/section detection, table of contents extraction
- **BookExtractor**: Page-level citations, figure/table handling, footnote processing
- **BookNormalizer**: Cross-reference resolution, glossary extraction

**Special Features:**
- Maintains page-level citation accuracy
- Preserves document structure hierarchy
- Handles multi-column layouts and complex formatting
- Extracts mathematical equations and code blocks

### Video Plugin (`@register_ingestion_plugin("video")`)
For video transcripts and multimedia content:

**Transformers Used:**
- **VideoAnalyzer**: Timestamp alignment, scene boundary detection
- **VideoSpeakerDetector**: Speaker identification and attribution
- **VideoNormalizer**: Timestamp formatting, visual description integration

**Special Features:**
- Synchronizes text with video timestamps
- Detects speaker changes and interruptions
- Integrates visual scene descriptions
- Handles multiple language tracks

### QA Plugin (`@register_ingestion_plugin("qa")`)
For question-answer transcripts, interviews, and conversational content:

**Transformers Used:**
- **QAAnalyzer**: Question-answer pairing, follow-up linking
- **QASpeakerDetector**: Speaker attribution using heuristics and LLM analysis
- **QATaxonomyMapper**: Topic clustering and conversation flow analysis
- **QATransformer**: Answer validation, correction mapping, host detection

**Special Features:**
- Distinguishes questions from answers automatically
- Links related Q&A pairs in conversation threads
- Identifies session hosts and panelists
- Applies custom corrections for known transcription errors

### Web Plugin (`@register_ingestion_plugin("web")`)
For scraped web content, articles, and online documents:

**Transformers Used:**
- **WebAnalyzer**: HTML cleaning, content extraction, readability scoring
- **WebNormalizer**: URL normalization, date detection, author extraction
- **WebLinkExtractor**: Related link discovery and categorization

**Special Features:**
- Removes boilerplate content (headers, footers, ads)
- Preserves article publication dates and authors
- Extracts structured metadata (OpenGraph, schema.org)
- Handles paywall and subscription content

### Knowledge Plugin (`@register_ingestion_plugin("knowledge")`)
For structured knowledge bases and databases:

**Transformers Used:**
- **KnowledgeAnalyzer**: Schema detection, relationship mapping
- **KnowledgeNormalizer**: Data type normalization, validation
- **KnowledgeMapper**: Ontology alignment, concept linking

**Special Features:**
- Handles structured data (JSON, CSV, databases)
- Maintains referential integrity
- Supports custom ontologies and taxonomies

## Transformers in Ingestion

Transformers are modular components that enrich and structure data during ingestion. Each transformer focuses on a specific type of data processing and can be configured independently.

### Core Transformers

#### NER Transformer (`@register_transformer("ner")`)
**Purpose**: Named Entity Recognition and extraction

**What it does:**
- Identifies persons, organizations, locations, dates, etc.
- Extracts technical terms and domain-specific entities
- Links entities across documents
- Generates confidence scores for extractions

**Configuration:**
```toml
[ingestion.rag.transformers.ner]
enabled = true
model = "vertex/gemini-2.0-flash"  # or local models
entity_types = ["PERSON", "ORG", "GPE", "DATE", "MONEY", "PERCENT"]
confidence_threshold = 0.7
max_entities_per_chunk = 20
```

#### Taxonomy Transformer (`@register_transformer("taxonomy")`)
**Purpose**: Automatic categorization and tagging

**What it does:**
- Classifies content into hierarchical categories
- Generates topic tags and keywords
- Creates content clusters for similar documents
- Builds taxonomy trees for navigation

**Configuration:**
```toml
[ingestion.rag.transformers.taxonomy]
enabled = true
model = "vertex/gemini-2.0-flash"
max_categories = 5
category_depth = 3
confidence_threshold = 0.6
custom_categories = ["Machine Learning", "AI Ethics", "Data Science"]
```

#### Keyphrases Transformer (`@register_transformer("keyphrases")`)
**Purpose**: Extract important phrases and concepts

**What it does:**
- Identifies key phrases that capture document essence
- Extracts technical terms and jargon
- Generates search-friendly keywords
- Supports multi-language phrase extraction

**Configuration:**
```toml
[ingestion.rag.transformers.keyphrases]
enabled = true
algorithm = "mixed"  # "llm", "tfidf", "mixed"
max_phrases = 10
min_phrase_length = 2
max_phrase_length = 5
language = "en"
```

#### Shadow Record Transformer (`@register_transformer("shadow")`)
**Purpose**: Generate optimized search metadata

**What it does:**
- Creates enriched metadata for search optimization
- Combines multiple analysis results
- Generates search-friendly text representations
- Pre-computes frequently accessed fields

**Configuration:**
```toml
[ingestion.rag.transformers.shadow]
enabled = true
include_keywords = true
include_entities = true
include_summary = true
include_taxonomy = true
summary_length = 200  # characters
```

#### Graph Builder Transformer (`@register_transformer("graph")`)
**Purpose**: Construct knowledge graph relationships

**What it does:**
- Analyzes entity co-occurrence patterns
- Builds semantic relationships between concepts
- Creates graph edges with confidence scores
- Supports both LLM and rule-based approaches

**Configuration:**
```toml
[ingestion.rag.transformers.graph]
enabled = true
builder_mode = "hybrid"  # "llm", "local", "hybrid"
max_entities_per_chunk = 10
relationship_types = ["related_to", "part_of", "causes", "affects"]
cognee_enabled = true
min_confidence = 0.3
```

## Configuration

```toml
# settings.toml
[ingestion.rag]
enabled = true
output_dir = "./ingestion_output"

[ingestion.rag.preprocess]
chunk_size = 1000
chunk_overlap = 200
min_chunk_size = 100

[ingestion.rag.graph]
builder_mode = "hybrid"    # "llm", "local", or "hybrid"
cognee_enabled = true
max_entities_per_chunk = 10

[ingestion.rag.shadow]
include_keywords = true
include_entities = true
include_summary = true

[ingestion.rag.skip]
# Skip stages that are already complete
preprocess = false
structure = false
index = false
deploy = false
```

## Detailed Pipeline Stages

### Stage 1: Preprocess - Text Extraction & Normalization

The preprocessing stage converts raw input files into clean, structured text chunks that can be processed by subsequent stages.

**Input Types Supported:**
- **PDF files**: Text extraction with layout preservation
- **Video transcripts**: Timestamp synchronization and speaker attribution
- **Q&A transcripts**: Speaker detection and conversation flow analysis
- **Web content**: HTML cleaning and content extraction
- **Plain text**: Encoding detection and normalization

**Key Processes:**

1. **Text Extraction**
   - PDF: Uses advanced OCR for scanned documents, preserves formatting
   - Video: Aligns transcript text with timestamps, handles multiple speakers
   - Web: Removes HTML tags, extracts main content, preserves metadata

2. **Content Cleaning**
   - Removes noise: headers, footers, page numbers, watermarks
   - Normalizes whitespace and formatting
   - Handles encoding issues and special characters
   - Filters out irrelevant content (advertisements, navigation)

3. **Speaker Detection (Q&A content)**
   - Uses heuristics: punctuation patterns, capitalization
   - Applies LLM analysis for complex cases
   - Identifies conversation participants and roles

4. **Intelligent Chunking**
   - **Sliding window**: Overlapping chunks preserve context
   - **Semantic boundaries**: Respects sentence/paragraph boundaries
   - **Content-aware**: Avoids splitting related information
   - **Size optimization**: Balances retrieval precision vs. context

**Configuration Options:**
```toml
[ingestion.rag.preprocess]
chunk_size = 1000          # Target chunk size in characters
chunk_overlap = 200        # Overlap between chunks
min_chunk_size = 100       # Minimum chunk size
max_chunk_size = 2000      # Maximum chunk size
encoding = "utf-8"         # Text encoding
preserve_formatting = true # Keep bold/italic in markdown
```

**CLI Usage:**
```bash
# Basic preprocessing
contextrouter ingest preprocess --type book --input ./document.pdf

# Advanced options
contextrouter ingest preprocess \
  --type video \
  --input ./transcripts/ \
  --chunk-size 800 \
  --chunk-overlap 150 \
  --encoding utf-8
```

**Output Format:** `clean_text/{type}.jsonl`
```json
{"id": "chunk_001", "content": "Machine learning is a subset of AI...", "metadata": {"page": 1, "speaker": null}}
{"id": "chunk_002", "content": "...that enables computers to learn...", "metadata": {"page": 1, "speaker": null}}
```

### Stage 2: Structure - Taxonomy & Ontology Building

The structure stage analyzes content to build semantic frameworks that organize knowledge hierarchically and define relationships between concepts.

**Taxonomy Building Process:**

1. **Content Sampling**
   - Selects representative chunks across the entire document
   - Uses stratified sampling to ensure coverage of different sections
   - Considers document structure (chapters, sections) when available

2. **Category Discovery**
   - LLM analyzes content to identify main themes and topics
   - Builds hierarchical category trees (e.g., AI → Machine Learning → Deep Learning)
   - Applies confidence scoring and validation

3. **Semantic Clustering**
   - Groups similar concepts and topics together
   - Identifies relationships between categories
   - Creates navigation-friendly hierarchies

**Ontology Creation Process:**

1. **Entity Type Definition**
   - Identifies common entity types in the domain
   - Defines relationships between entity types
   - Creates schemas for structured data extraction

2. **Relationship Mapping**
   - Defines semantic relationships (is-a, part-of, related-to)
   - Establishes domain-specific connection types
   - Validates relationship consistency

3. **Schema Generation**
   - Creates formal ontologies in JSON format
   - Supports multiple ontology standards
   - Enables cross-document relationship linking

**Configuration Options:**
```toml
[ingestion.rag.structure]
enabled = true

[ingestion.rag.structure.taxonomy]
philosophy_focus = "Extract core concepts, terminology, and relationships"
include_types = ["video", "book", "qa", "knowledge"]
max_samples = 100
scan_model = "vertex/gemini-2.0-flash"
hard_cap_samples = 500
categories = {}  # Custom category overrides

[ingestion.rag.structure.ontology]
enabled = true
relationship_types = ["is_a", "part_of", "related_to", "causes"]
entity_types = ["PERSON", "ORG", "CONCEPT", "EVENT"]
validation_enabled = true
```

**CLI Usage:**
```bash
# Build taxonomy and ontology
contextrouter ingest structure --type book

# Custom model for analysis
contextrouter ingest structure --type qa --model vertex/gemini-2.0-flash
```

**Output Files:**

**`taxonomy.json`** - Hierarchical category structure:
```json
{
  "categories": [
    {
      "name": "Artificial Intelligence",
      "children": [
        {
          "name": "Machine Learning",
          "children": [
            {"name": "Supervised Learning"},
            {"name": "Unsupervised Learning"},
            {"name": "Deep Learning"}
          ]
        },
        {"name": "Natural Language Processing"},
        {"name": "Computer Vision"}
      ]
    }
  ],
  "metadata": {
    "total_documents": 150,
    "confidence_score": 0.89,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**`ontology.json`** - Entity relationship schema:
```json
{
  "entities": [
    {
      "type": "PERSON",
      "properties": ["name", "role", "affiliation"],
      "relationships": ["works_for", "collaborates_with"]
    },
    {
      "type": "CONCEPT",
      "properties": ["definition", "examples"],
      "relationships": ["related_to", "part_of", "prerequisite_for"]
    }
  ],
  "relationships": [
    {
      "name": "works_for",
      "domain": "PERSON",
      "range": "ORG",
      "description": "Employment relationship"
    }
  ]
}
```

### Stage 3: Index - Entity Extraction & Graph Construction

The indexing stage performs deep analysis of content to extract entities, relationships, and build the knowledge graph that powers intelligent search and reasoning.

**Entity Recognition Process:**

1. **Named Entity Recognition (NER)**
   - Identifies standard entities: Person, Organization, Location, Date, etc.
   - Extracts domain-specific entities based on taxonomy
   - Applies confidence scoring and disambiguation
   - Links entities across document chunks

2. **Key Phrase Extraction**
   - Identifies important multi-word phrases and concepts
   - Uses combination of statistical and LLM-based methods
   - Generates search-friendly keywords and tags

3. **Content Enrichment**
   - Adds semantic metadata to each chunk
   - Links to taxonomy categories
   - Attaches confidence scores and provenance

**Knowledge Graph Construction:**

1. **Entity Relationship Discovery**
   - Analyzes entity co-occurrence patterns
   - Identifies semantic relationships using LLM analysis
   - Creates graph edges with relationship types and confidence

2. **Graph Integration**
   - Merges local document graphs into global knowledge graph
   - Handles entity disambiguation across documents
   - Maintains graph consistency and removes duplicates

3. **Graph Enhancement**
   - Applies Cognee integration for advanced graph features
   - Adds inferred relationships and transitive connections
   - Optimizes graph structure for query performance

**Shadow Record Generation:**

1. **Metadata Aggregation**
   - Combines all extracted information into searchable format
   - Creates multiple representations for different search types
   - Pre-computes frequently accessed fields

2. **Search Optimization**
   - Generates keyword indexes for full-text search
   - Creates vector-ready text representations
   - Prepares citation metadata for result formatting

**Configuration Options:**
```toml
[ingestion.rag.index]
enabled = true
incremental = false  # Build on existing graph or start fresh

[ingestion.rag.index.ner]
enabled = true
model = "vertex/gemini-2.0-flash"
entity_types = ["PERSON", "ORG", "GPE", "DATE", "MONEY"]
confidence_threshold = 0.7

[ingestion.rag.index.graph]
enabled = true
builder_mode = "hybrid"  # llm, local, hybrid
cognee_enabled = true
max_entities_per_chunk = 10
relationship_types = ["related_to", "part_of", "causes"]

[ingestion.rag.index.shadow]
enabled = true
include_keywords = true
include_entities = true
include_taxonomy = true
include_summary = true
summary_model = "vertex/gemini-2.0-flash"
```

**CLI Usage:**
```bash
# Full indexing with all features
contextrouter ingest index --type book

# Incremental indexing (preserve existing graph)
contextrouter ingest index --type qa --incremental

# Custom NER model
contextrouter ingest index --type knowledge --ner-model vertex/gemini-2.0-flash
```

**Output Files:**

**`knowledge_graph.pickle`** - Serialized knowledge graph:
```python
# Graph contains nodes (entities) and edges (relationships)
graph = {
    "nodes": [
        {"id": "entity_001", "type": "PERSON", "name": "Alan Turing", "properties": {...}},
        {"id": "entity_002", "type": "CONCEPT", "name": "Turing Machine", "properties": {...}}
    ],
    "edges": [
        {"source": "entity_001", "target": "entity_002", "type": "invented", "confidence": 0.95}
    ]
}
```

**`shadow/{type}.jsonl`** - Enriched search records:
```json
{
  "id": "shadow_001",
  "content": "Alan Turing invented the Turing machine...",
  "metadata": {
    "source_type": "book",
    "page": 45,
    "entities": [
      {"text": "Alan Turing", "type": "PERSON", "confidence": 0.98},
      {"text": "Turing machine", "type": "CONCEPT", "confidence": 0.95}
    ],
    "keyphrases": ["Turing machine", "computational model", "theoretical computer"],
    "taxonomy": ["Computer Science", "Theory of Computation"],
    "summary": "Discussion of Alan Turing's invention of the Turing machine...",
    "relationships": [
      {"entity1": "Alan Turing", "entity2": "Turing machine", "type": "invented"}
    ]
  }
}
```

### Stage 4: Deploy - Index Population & Optimization

The deployment stage transfers processed data to your search infrastructure, making it available for real-time queries and RAG applications.

**Format Conversion Process:**

1. **Target Format Selection**
   - **Postgres**: Converts to SQL INSERT statements with pgvector embeddings
   - **Vertex AI Search**: Transforms to JSONL format for Vertex import
   - **Hybrid**: Prepares data for multi-provider deployments

2. **Data Serialization**
   - Serializes shadow records into provider-specific formats
   - Handles large datasets with batching and streaming
   - Preserves all metadata and provenance information

3. **Embedding Generation**
   - Generates vector embeddings for semantic search
   - Supports multiple embedding models (Vertex, OpenAI, local)
   - Batch processes for efficiency with large datasets

**Index Population:**

1. **Database Upload**
   - **Postgres**: Uses bulk INSERT with pgvector for vector storage
   - **Vertex AI Search**: Uploads via Vertex AI Search API
   - **Incremental Updates**: Supports partial updates without full rebuilds

2. **Knowledge Graph Integration**
   - Uploads graph data to Cognee or Postgres KG
   - Establishes cross-document relationships
   - Enables graph-powered search features

3. **Index Optimization**
   - Creates appropriate database indexes
   - Optimizes for hybrid search (vector + keyword)
   - Sets up partitioning for large datasets

**Reporting & Validation:**

1. **Ingestion Report Generation**
   - Statistics: documents processed, entities extracted, relationships created
   - Quality metrics: confidence scores, error rates
   - Performance data: processing times, resource usage

2. **Data Validation**
   - Verifies data integrity after upload
   - Checks search functionality with sample queries
   - Validates embedding quality and retrieval accuracy

**Configuration Options:**
```toml
[ingestion.rag.deploy]
enabled = true
provider = "postgres"  # postgres, vertex, hybrid
batch_size = 1000      # Records per batch
max_workers = 4        # Parallel upload workers

[ingestion.rag.deploy.embedding]
enabled = true
model = "vertex/text-embedding-004"
batch_size = 100
dimensions = 768

[ingestion.rag.deploy.validation]
enabled = true
sample_queries = 10
accuracy_threshold = 0.8

[ingestion.rag.deploy.report]
enabled = true
format = "html"  # html, json, markdown
include_charts = true
include_samples = true
```

**CLI Usage:**
```bash
# Deploy to default provider
contextrouter ingest deploy --type book

# Deploy to specific provider
contextrouter ingest deploy --type qa --provider vertex

# Custom embedding model
contextrouter ingest deploy --type knowledge \
  --embedding-model vertex/text-embedding-004 \
  --batch-size 500

# Skip validation for faster deployment
contextrouter ingest deploy --type web --no-validation
```

**Output Files:**

**Search Index** - Data becomes searchable:
```sql
-- Example Postgres record
INSERT INTO documents (
  id, content, embedding, metadata, entities, taxonomy
) VALUES (
  'shadow_001',
  'Alan Turing invented the Turing machine...',
  '[0.123, 0.456, ...]'::vector(768),
  '{"source_type": "book", "page": 45}'::jsonb,
  '["Alan Turing", "Turing machine"]'::text[],
  '["Computer Science", "Theory of Computation"]'::text[]
);
```

**`report.html`** - Comprehensive ingestion report:
```html
<h1>Ingestion Report: book</h1>

<h2>Summary</h2>
<ul>
  <li>Documents processed: 25</li>
  <li>Chunks created: 1,247</li>
  <li>Entities extracted: 3,891</li>
  <li>Relationships created: 2,156</li>
  <li>Processing time: 45m 32s</li>
</ul>

<h2>Quality Metrics</h2>
<ul>
  <li>Average NER confidence: 87.3%</li>
  <li>Taxonomy coverage: 94.1%</li>
  <li>Graph connectivity: 78.5%</li>
</ul>
```

## Skipping Stages

Re-run only what you need:

```bash
# Skip preprocessing (already done)
contextrouter ingest run --type book --skip-preprocess

# Skip structure (taxonomy exists)
contextrouter ingest run --type book --skip-structure

# Only deploy (everything else done)
contextrouter ingest deploy --type book
```

## Output Structure

After running the full pipeline:

```
ingestion_output/
├── clean_text/
│   ├── book.jsonl
│   └── qa.jsonl
├── taxonomy.json
├── ontology.json
├── knowledge_graph.pickle
├── shadow/
│   ├── book.jsonl
│   └── qa.jsonl
├── output/
│   └── jsonl/
│       └── book/
│           └── book_001.jsonl
└── report.html
```

## Troubleshooting Common Issues

### Preprocessing Problems

**Issue**: PDF text extraction is garbled or missing content
```
Solution: Check PDF type - scanned documents need OCR
contextrouter ingest preprocess --type book --ocr-enabled --input document.pdf
```

**Issue**: Video transcripts have incorrect timestamps
```
Solution: Use timestamp correction in video plugin
[ingestion.rag.plugins.video]
timestamp_correction = true
speaker_sync_enabled = true
```

**Issue**: Q&A speaker detection is inaccurate
```
Solution: Enable LLM-based speaker detection
[ingestion.rag.plugins.qa]
llm_speaker_detect_enabled = true
llm_host_detect_enabled = true
```

### Structure Stage Issues

**Issue**: Taxonomy categories are too generic or specific
```
Solution: Adjust taxonomy parameters
[ingestion.rag.structure.taxonomy]
max_categories = 8  # Increase for more specific categories
category_depth = 2  # Reduce for broader categories
```

**Issue**: Ontology relationships are incorrect
```
Solution: Customize relationship types for your domain
[ingestion.rag.structure.ontology]
relationship_types = ["is_a", "part_of", "used_in", "related_to", "causes"]
```

### Index Stage Problems

**Issue**: NER is missing domain-specific entities
```
Solution: Add custom entity types
[ingestion.rag.index.ner]
entity_types = ["PERSON", "ORG", "PRODUCT", "TECHNOLOGY", "METHOD"]
```

**Issue**: Knowledge graph has too many/too few connections
```
Solution: Adjust graph building parameters
[ingestion.rag.index.graph]
max_entities_per_chunk = 8  # Reduce for fewer connections
min_confidence = 0.5        # Increase for stricter relationships
```

### Deploy Stage Issues

**Issue**: Upload fails due to large dataset
```
Solution: Reduce batch size and increase workers
[ingestion.rag.deploy]
batch_size = 500
max_workers = 2
```

**Issue**: Embedding generation is slow
```
Solution: Use GPU-enabled embedding model or reduce dimensions
[ingestion.rag.deploy.embedding]
model = "local/all-MiniLM-L6-v2"  # Faster local model
dimensions = 384                   # Smaller embeddings
```

## Best Practices

### Performance Optimization

1. **Chunk Size Tuning**
   - Smaller chunks (500-800 chars): Better precision, slower search
   - Larger chunks (1000-1500 chars): Better context, faster search
   - Test with your typical query lengths

2. **Parallel Processing**
   ```toml
   [ingestion.rag]
   workers = 4  # Match your CPU cores
   ```

3. **Incremental Updates**
   ```bash
   # Only process new/changed content
   contextrouter ingest run --type book --incremental
   ```

### Quality Assurance

1. **Validation Checks**
   ```toml
   [ingestion.rag.deploy.validation]
   enabled = true
   sample_queries = 20
   accuracy_threshold = 0.85
   ```

2. **Regular Audits**
   - Review ingestion reports weekly
   - Monitor entity extraction accuracy
   - Validate taxonomy relevance

### Data Management

1. **Backup Strategy**
   - Keep raw source files for reprocessing
   - Backup taxonomy.json and ontology.json
   - Version control your configuration

2. **Content Updates**
   ```bash
   # Update existing content
   contextrouter ingest run --type book --overwrite
   ```

## Advanced Usage

### Custom Transformers

Create domain-specific transformers for specialized content:

```python
from contextrouter.core.registry import register_transformer
from contextrouter.modules.ingestion.rag.core.types import ShadowRecord

@register_transformer("medical_ner")
class MedicalNERTransformer:
    """Extract medical entities and terminology."""

    def transform(self, record: ShadowRecord) -> ShadowRecord:
        # Custom medical entity extraction
        medical_entities = self.extract_medical_terms(record.content)
        record.metadata["medical_entities"] = medical_entities
        record.add_trace("transformer:medical_ner")
        return record
```

### Multi-Stage Pipelines

For complex workflows, run stages separately:

```bash
# Stage 1: Preprocess all content types
contextrouter ingest preprocess --type book
contextrouter ingest preprocess --type qa

# Stage 2: Build unified taxonomy
contextrouter ingest structure --type book
contextrouter ingest structure --type qa

# Stage 3: Create integrated knowledge graph
contextrouter ingest index --type book
contextrouter ingest index --type qa --incremental

# Stage 4: Deploy to production
contextrouter ingest deploy --type book
contextrouter ingest deploy --type qa
```

## Learn More

- **[Taxonomy & Ontology](/ingestion/taxonomy/)** — How category and entity structures are built
- **[CLI Reference](/reference/cli/)** — All ingestion commands
- **[Configuration](/reference/configuration/)** — Full ingestion settings
