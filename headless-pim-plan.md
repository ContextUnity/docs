# Headless PIM Architecture Plan

> ContextCommerce — Headless Product Information Management
> Updated: 2026-02-06

## Overview

ContextCommerce впроваджує архітектуру **Headless PIM** для:
- AI-powered product enrichment (Gardener Agent)
- Modern admin UI (Django Unfold + HTMX)
- Unified API (Strawberry GraphQL)
- Wiki content management (Wagtail + wagtail-ai)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HEADLESS PIM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐     ┌──────────────────────┐                      │
│  │   Django Admin       │     │   Wagtail Admin      │                      │
│  │   (Unfold + HTMX)    │     │   (wagtail-ai)       │                      │
│  │   ─────────────────  │     │   ─────────────────  │                      │
│  │   Products           │     │   Brands Wiki        │                      │
│  │   Categories         │     │   Technologies Wiki  │                      │
│  │   🤖 AI Enrich       │     │   🤖 AI Content      │                      │
│  └────────┬─────────────┘     └────────┬─────────────┘                      │
│           │                            │                                    │
│           ▼                            ▼                                    │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                    Strawberry GraphQL API                             ║  │
│  ║  ─────────────────────────────────────────────────────────────────    ║  │
│  ║  /graphql                                                             ║  │
│  ║  • Products, Categories, Brands (unified query)                       ║  │
│  ║  • JWT + Session auth                                                 ║  │
│  ║  • Redis caching                                                      ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│           │                                                                 │
│           ▼                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     ContextRouter (AI)                                 │  │
│  │   ─────────────────────────────────────────────────────────────────   │  │
│  │   Gardener Agent:                                                     │  │
│  │   • Taxonomy classification (ProductClass, Categories)                │  │
│  │   • NER extraction (brands, technologies)                             │  │
│  │   • Parameter extraction (specs)                                      │  │
│  │   • Description enhancement                                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│           │                                                                 │
│           ▼                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     PUSH SYNC                                          │  │
│  │   ─────────────────────────────────────────────────────────────────   │  │
│  │   Temporal Workflows:                                                  │  │
│  │   • sync_products_to_horoshop                                          │  │
│  │   • sync_stock_and_prices                                              │  │
│  │   • generate_product_images                                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Django Unfold + HTMX ✅ IMPLEMENTED

### 1.1 Dependencies

```bash
uv add django-unfold wagtail-ai
```

### 1.2 Settings Configuration

```python
# settings.py

INSTALLED_APPS = [
    # Django Unfold - BEFORE django.contrib.admin
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    # ...
    "django_ai_core",
    "wagtail_ai",
]

UNFOLD = {
    "SITE_TITLE": "ContextCommerce",
    "SITE_HEADER": "ContextCommerce PIM",
    "SITE_SYMBOL": "shopping_cart",
    "COLORS": {
        "primary": {
            "500": "#0ea5e9",  # Sky blue
            # ... full palette
        },
    },
    "SIDEBAR": {
        "navigation": [
            {
                "title": "Catalogue",
                "items": [
                    {"title": "Products", "icon": "inventory_2", "link": "..."},
                    # ...
                ],
            },
        ],
    },
}
```

### 1.3 ProductAdmin with AI Enrich

```python
# src/catalogue/admin.py

from unfold.admin import ModelAdmin
from unfold.decorators import action

@admin.register(Product)
class ProductAdmin(ModelAdmin):
    """Product admin with Unfold UI and AI Enrich button."""
    
    # Unfold settings
    warn_unsaved_form = True
    compressed_fields = True
    
    fieldsets = (
        (None, {'fields': ('title', 'upc', 'description')}),
        ('🤖 AI Enrichment', {
            'fields': ('ai_enrich_button',),
            'classes': ('collapse',),
        }),
        # ...
    )
    
    readonly_fields = ['ai_enrich_button']
    
    def ai_enrich_button(self, obj):
        """HTMX-powered AI Enrich button."""
        return format_html('''
            <div id="ai-enrich-container">
                <button type="button"
                    hx-post="/api/ai/enrich-product/{pk}/"
                    hx-target="#ai-enrich-container"
                    hx-swap="innerHTML">
                    🤖 AI Enrich
                </button>
            </div>
        ''', pk=obj.pk)
    
    class Media:
        js = ['https://unpkg.com/htmx.org@1.9.12']
```

### 1.4 AI Enrich Endpoint

```python
# src/api/views/ai_enrich.py

class AIEnrichProductView(View):
    """HTMX endpoint with OOB swaps."""
    
    def post(self, request, pk):
        product = Product.objects.get(pk=pk)
        result = gardener.enrich_product(product)
        
        if result.success:
            return HttpResponse(f'''
                <div class="alert-success">✅ Enriched!</div>
                
                <!-- OOB Swaps -->
                <input id="id_title" value="{result.title}" hx-swap-oob="true" />
                <textarea id="id_description" hx-swap-oob="true">{result.description}</textarea>
            ''')
```

---

## Phase 2: wagtail-ai for Wiki Content

### 2.1 Configuration

```python
# settings.py

WAGTAIL_AI = {
    "BACKENDS": {
        "default": {
            "CLASS": "wagtail_ai.ai.llm.LLMBackend",
            "CONFIG": {
                "MODEL_ID": "gpt-4o-mini",
            },
        },
    },
}
```

### 2.2 BrandPage with AI Panels

```python
# src/wiki/models/pages.py

from wagtail_ai.panels import AIPanel

class BrandPage(Page):
    tagline = models.CharField(max_length=255, blank=True)
    description = RichTextField(blank=True)
    history = RichTextField(blank=True)
    
    content_panels = Page.content_panels + [
        MultiFieldPanel([
            AIPanel('tagline', prompt='''
                Generate a short, memorable tagline for outdoor brand "{title}".
                Maximum 100 characters.
            '''),
            AIPanel('description', prompt='''
                Write a compelling description for outdoor brand "{title}".
                Include specialty, target audience, and unique selling points.
                2-3 paragraphs, professional tone.
            '''),
            AIPanel('history', prompt='''
                Write a brief history of outdoor brand "{title}".
                Include founding story, key milestones, and growth.
            '''),
        ], heading='Content (AI-Enhanced)'),
    ]
```

---

## Phase 3: Strawberry GraphQL API

### 3.1 Installation

```bash
uv add strawberry-graphql strawberry-graphql-django
```

### 3.2 Unified Schema

```python
# src/api/graphql/schema.py

import strawberry
from strawberry_django import type

@strawberry_django.type(Product)
class ProductType:
    id: strawberry.ID
    title: str
    description: str
    brand: Optional['BrandType']
    technologies: List['TechnologyType']

@strawberry_django.type(Brand)
class BrandType:
    id: strawberry.ID
    name: str
    slug: str
    description: str
    products: List[ProductType]

@strawberry.type
class Query:
    products: List[ProductType] = strawberry_django.field()
    product: ProductType = strawberry_django.field()
    brands: List[BrandType] = strawberry_django.field()
    
    @strawberry.field
    async def search_products(
        self,
        query: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        limit: int = 20,
    ) -> List[ProductType]:
        """Full-text search with faceting."""
        return await search_products(query, category, brand, limit)

schema = strawberry.Schema(query=Query)
```

### 3.3 URL Configuration

```python
# urls.py

from strawberry.django.views import GraphQLView
from src.api.graphql.schema import schema

urlpatterns = [
    path("graphql/", GraphQLView.as_view(schema=schema)),
]
```

---

## Phase 4: Audit Trail & Permissions

### 4.1 PatchAuditLog Model

```python
# src/catalogue/models.py

class PatchAuditLog(models.Model):
    """Audit trail for AI-powered changes."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    patch_type = models.CharField(max_length=50)  # TITLE, DESCRIPTION, CATEGORY
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    
    confidence = models.FloatField(null=True)
    sources = models.JSONField(default=list)  # provenance
    
    applied_at = models.DateTimeField(auto_now_add=True)
    applied_by = models.CharField(max_length=20)  # 'user', 'auto', 'ai'
```

### 4.2 Permission Thresholds

| Permission | Fields | Auto-apply Threshold |
|------------|--------|---------------------|
| `CATALOG_PATCH_TITLE` | title, short_name | confidence > 0.9 |
| `CATALOG_PATCH_DESCRIPTION` | description | confidence > 0.85 |
| `CATALOG_PATCH_CATEGORY` | category_id | confidence > 0.8 |
| `CATALOG_PATCH_ATTRIBUTES` | color, size, gender | confidence > 0.9 |

---

## Implementation Checklist

### Phase 1: Unfold + HTMX ✅
- [x] Install django-unfold
- [x] Configure UNFOLD settings
- [x] Update ProductAdmin to UnfoldTranslatableAdmin
- [x] Add AI Enrich button with HTMX
- [x] Create /api/ai/enrich-product/ endpoint
- [x] Implement GardenerService (placeholder)

### Phase 2: wagtail-ai ✅
- [x] Install wagtail-ai
- [x] Configure WAGTAIL_AI settings
- [ ] Add AIPanel to BrandPage
- [ ] Add AIPanel to TechnologyPage

### Phase 3: Strawberry GraphQL 📋
- [ ] Install strawberry-graphql-django
- [ ] Define ProductType, BrandType, TechnologyType
- [ ] Create unified Query schema
- [ ] Add search_products resolver
- [ ] Configure Redis caching
- [ ] Add JWT authentication

### Phase 4: Audit & Permissions 📋
- [ ] Create PatchAuditLog model
- [ ] Implement permission checks in AI Enrich
- [ ] Add auto-apply logic based on confidence
- [ ] Track provenance (sources)

---

## Technology Summary

| Component | Technology | Status |
|-----------|------------|--------|
| Admin UI | Django Unfold | ✅ Done |
| Dynamic Forms | HTMX OOB Swaps | ✅ Done |
| AI Enrichment | Gardener (ContextRouter) | 🔄 Integration pending |
| Wiki Content AI | wagtail-ai | ✅ Installed |
| Frontend API | Strawberry GraphQL | 📋 Planned |
| Caching | Redis | 📋 Planned |
| Audit | PatchAuditLog | 📋 Planned |
