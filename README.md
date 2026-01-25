# ContextUnity Documentation Sites

This repository contains the documentation websites for all ContextUnity ecosystem components. Each component has its own documentation site built with [Astro Starlight](https://starlight.astro.build/).

## Documentation Sites

### 🌐 Live Sites

- **[contextcore.dev](https://contextcore.dev)** - The Kernel: Core types, protocols, and shared libraries
- **[contextrouter.dev](https://contextrouter.dev)** - The Gateway: AI Gateway and agent orchestration framework
- **[contextbrain.dev](https://contextbrain.dev)** - Smart Memory: Vector storage, RAG pipelines, and knowledge graphs
- **[contextcommerce.dev](https://contextcommerce.dev)** - The Platform: Django-based e-commerce with AI agents

### 📦 Components

Each documentation site is a separate Astro Starlight project:

```
docs/
├── core/          # ContextCore documentation (contextcore.dev)
├── router/        # ContextRouter documentation (contextrouter.dev)
├── brain/         # ContextBrain documentation (contextbrain.dev)
├── commerce/      # ContextCommerce documentation (contextcommerce.dev)
├── shield/        # ContextShield documentation (contextshield.dev) - Coming soon
├── zero/          # ContextZero documentation (contextzero.dev) - Coming soon
├── worker/        # ContextWorker documentation (contextworker.dev) - Coming soon
├── spatial/       # ContextSpatial documentation (contextspatial.dev) - Coming soon
├── view/          # ContextView documentation (contextview.dev) - Coming soon
└── workshop/      # ContextWorkshop documentation (contextworkshop.dev) - Coming soon
```

## Technology Stack

All documentation sites use:
- **[Astro](https://astro.build/)** - Static site generator
- **[Starlight](https://starlight.astro.build/)** - Documentation theme for Astro
- **[pnpm](https://pnpm.io/)** - Package manager
- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Hosting (via wrangler.toml)

## Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm** (`npm install -g pnpm`)

### Development

Each documentation site can be developed independently:

```bash
# Navigate to a specific site
cd docs/core

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:4321` to view the documentation.

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

Each documentation site follows this structure:

```
docs/{component}/
├── src/
│   ├── content/
│   │   └── docs/          # Documentation pages (Markdown/MDX)
│   │       ├── index.mdx  # Homepage
│   │       ├── getting-started/
│   │       ├── guides/
│   │       └── reference/
│   ├── assets/            # Images and other assets
│   └── styles/            # Custom CSS
├── public/                # Static files (CNAME, favicons, etc.)
├── astro.config.mjs       # Astro + Starlight configuration
├── package.json
├── pnpm-lock.yaml
└── wrangler.toml          # Cloudflare Pages configuration
```

## Contributing

### Adding Documentation

1. Navigate to the appropriate component directory (e.g., `docs/core/`)
2. Create or edit `.md` or `.mdx` files in `src/content/docs/`
3. Each file needs frontmatter:
   ```markdown
   ---
   title: Page Title
   description: Page description for SEO
   ---
   ```
4. Run `pnpm dev` to preview changes
5. Commit and push changes

### Documentation Guidelines

- **Use Markdown** for most content
- **Use MDX** for pages that need React components
- **Follow Starlight conventions** for navigation and structure
- **Keep content focused** - each component's docs should focus on that component
- **Cross-reference** other components when relevant
- **Include code examples** with proper syntax highlighting
- **Update regularly** - keep docs in sync with code changes

### Cross-Component References

When referencing other components, use relative paths:

```markdown
See [ContextCore Logging Guide](/core/guides/logging/) for details.
```

## Deployment

### Cloudflare Pages

Each site is configured for Cloudflare Pages deployment:

1. Connect the repository to Cloudflare Pages
2. Set build command: `pnpm build`
3. Set output directory: `dist`
4. Configure custom domain in `public/CNAME`

### Manual Deployment

```bash
# Build the site
cd docs/{component}
pnpm build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

## Environment Variables

Some sites may require environment variables for build-time features. Create `.env` files in the component directory (these are gitignored):

```bash
# .env
PUBLIC_API_URL=https://api.example.com
```

## Maintenance

### Updating Dependencies

```bash
# Update all dependencies in a site
cd docs/{component}
pnpm update

# Update Astro/Starlight
pnpm add astro@latest @astrojs/starlight@latest
```

### Adding a New Documentation Site

1. Create new directory: `docs/{component}/`
2. Initialize Astro Starlight project:
   ```bash
   npm create astro@latest -- --template starlight
   ```
3. Configure `astro.config.mjs` with component-specific settings
4. Add `CNAME` file in `public/` for custom domain
5. Configure `wrangler.toml` for Cloudflare Pages
6. Add entry to this README

## Links

- [ContextUnity GitHub](https://github.com/ContextUnity)
- [Astro Documentation](https://docs.astro.build/)
- [Starlight Documentation](https://starlight.astro.build/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

## License

Documentation content follows the same license as the ContextUnity project.
