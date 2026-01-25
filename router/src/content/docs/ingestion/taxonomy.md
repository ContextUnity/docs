---
title: Taxonomy & Ontology
description: Build hierarchical categories and entity schemas for your knowledge base.
---

Taxonomy and ontology provide structure to your knowledge base, enabling filtered search, relationship-aware retrieval, and more accurate categorization.

## Understanding the Concepts

### What is Taxonomy?

A **taxonomy** is a hierarchical category tree that organizes your content:

```
Knowledge Base
├── Technology
│   ├── Artificial Intelligence
│   │   ├── Machine Learning
│   │   │   ├── Supervised Learning
│   │   │   ├── Unsupervised Learning
│   │   │   └── Reinforcement Learning
│   │   └── Natural Language Processing
│   │       ├── Text Classification
│   │       └── Question Answering
│   └── Software Engineering
│       ├── Backend
│       └── Frontend
├── Business
│   ├── Strategy
│   └── Operations
└── Science
    └── Physics
```

### What is Ontology?

An **ontology** defines the types of entities in your domain and how they can relate:

```yaml
# Entity types
entities:
  - Person
  - Organization  
  - Technology
  - Concept
  - Location

# Allowed relationships
relations:
  - (Person, works_at, Organization)
  - (Person, created, Technology)
  - (Technology, used_by, Organization)
  - (Technology, part_of, Technology)
  - (Concept, related_to, Concept)
```

## Building Taxonomy

### Automatic Generation (LLM-Based)

ContextRouter can automatically discover categories from your content:

```bash
contextrouter ingest structure --type book
```

The process:
1. **Sample** representative chunks from your documents
2. **Analyze** with LLM to identify topics and themes
3. **Cluster** similar concepts
4. **Build** hierarchical tree

Configuration:
```toml
[ingestion.rag.taxonomy]
builder = "llm"
max_depth = 4                    # Maximum hierarchy depth
min_samples_per_category = 3     # Minimum docs per category
sampling_rate = 0.1              # Percentage of chunks to analyze
```

### Manual Taxonomy

Provide your own taxonomy for controlled vocabularies:

```json
// taxonomy.json
{
  "Technology": {
    "AI": {
      "Machine Learning": {
        "Deep Learning": {},
        "Classical ML": {}
      },
      "NLP": {}
    },
    "Cloud": {
      "AWS": {},
      "GCP": {},
      "Azure": {}
    }
  },
  "Business": {
    "Finance": {},
    "Marketing": {}
  }
}
```

```toml
[ingestion.rag.taxonomy]
builder = "manual"
taxonomy_path = "./taxonomy.json"
```

### Hybrid Approach

Start with manual top-level categories, auto-expand deeper levels:

```toml
[ingestion.rag.taxonomy]
builder = "hybrid"
seed_taxonomy_path = "./seed_taxonomy.json"
auto_expand_depth = 2  # Auto-generate 2 levels below seed
```

## Using Taxonomy in Retrieval

### Filtered Search

Query only specific categories:

```python
results = await pipeline.retrieve(
    query="best practices",
    taxonomy_filter="Technology.AI.Machine Learning"
)
```

### Concept Extraction

During intent detection, taxonomy concepts are automatically extracted:

```python
# User: "How do I train a transformer model?"

# Extracted concepts:
taxonomy_concepts = [
    "Technology.AI.Machine Learning.Deep Learning",
    "Technology.AI.NLP"
]
```

These concepts:
1. Filter retrieval to relevant categories
2. Guide knowledge graph lookups
3. Improve reranking relevance

## Building Ontology

### Automatic Extraction

The ontology is built alongside taxonomy:

```bash
contextrouter ingest structure --type book
```

The LLM identifies:
- **Entity types** — What kinds of things appear in your content?
- **Relation types** — How do these things connect?
- **Constraints** — Which relations make sense between which entities?

### Manual Ontology

Define your own schema:

```json
// ontology.json
{
  "entities": [
    {"name": "Person", "description": "A human individual"},
    {"name": "Company", "description": "A business organization"},
    {"name": "Product", "description": "A software or physical product"},
    {"name": "Technology", "description": "A technical concept or tool"}
  ],
  "relations": [
    {"name": "works_at", "source": "Person", "target": "Company"},
    {"name": "founded", "source": "Person", "target": "Company"},
    {"name": "created", "source": "Person", "target": "Product"},
    {"name": "uses", "source": "Product", "target": "Technology"},
    {"name": "competes_with", "source": "Company", "target": "Company"}
  ]
}
```

## Entity Extraction Example

With the ontology defined, the ingestion pipeline extracts entities:

```
Input text:
"Sam Altman, CEO of OpenAI, announced GPT-5 at the 2024 conference.
The new model uses transformer architecture and was trained on 
Azure's infrastructure."

Extracted entities:
- Sam Altman (Person)
- OpenAI (Company)
- GPT-5 (Product)
- transformer (Technology)
- Azure (Company)

Extracted relations:
- (Sam Altman, works_at, OpenAI)
- (OpenAI, created, GPT-5)
- (GPT-5, uses, transformer)
- (OpenAI, uses, Azure)
```

These become nodes and edges in your knowledge graph.

## Output Files

After running `contextrouter ingest structure`:

```
ingestion_output/
├── taxonomy.json           # Category hierarchy
├── ontology.json           # Entity/relation schema
├── taxonomy_stats.json     # Distribution statistics
└── ontology_examples.json  # Example extractions
```

## Configuration Reference

```toml
[ingestion.rag.taxonomy]
# Builder type: "llm", "manual", or "hybrid"
builder = "llm"

# For manual/hybrid
taxonomy_path = "./taxonomy.json"
seed_taxonomy_path = "./seed.json"

# LLM generation settings
max_depth = 4
min_samples_per_category = 3
sampling_rate = 0.1
merge_similar_threshold = 0.8

[ingestion.rag.ontology]
# Entity types to extract
entity_types = ["Person", "Organization", "Technology", "Concept"]

# Relation types to identify
relation_types = ["works_at", "created", "uses", "part_of", "related_to"]

# Extraction settings
max_entities_per_chunk = 10
confidence_threshold = 0.7
```

## Best Practices

1. **Start broad, refine later** — Let the LLM discover categories, then manually curate

2. **Balance depth vs. sparsity** — Too deep = sparse categories; too shallow = poor filtering

3. **Review extracted entities** — Spot-check the ontology examples before full extraction

4. **Iterate on taxonomy** — Run generation multiple times, compare results

5. **Version your schemas** — Keep taxonomy.json and ontology.json in version control

6. **Test filtered retrieval** — Verify that taxonomy filters actually improve results
