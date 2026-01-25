# ContextBrain Documentation

Official documentation site for **ContextBrain** - the SmartMemory and Intelligence layer of ContextUnity.
Live at [contextbrain.dev](https://contextbrain.dev).

Built with [Astro Starlight](https://starlight.astro.build/).

## Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Then visit `http://localhost:4321`.

## Build for Production

```bash
pnpm build
pnpm preview
```

## Project Structure

```
docs/brain/
├── src/
│   └── content/
│       └── docs/           # Documentation pages (Markdown/MDX)
│           ├── index.mdx   # Homepage
│           ├── rag/
│           ├── ingestion/
│           └── ...
├── astro.config.mjs        # Astro + Starlight configuration
├── package.json
└── pnpm-lock.yaml
```

## Contributing

1. Create or edit `.md` files in `src/content/docs/`
2. Each file needs frontmatter with `title` and `description`
3. Run `pnpm dev` to preview changes

## Links

- [ContextBrain GitHub](https://github.com/ContextUnity/contextbrain)
- [Starlight Documentation](https://starlight.astro.build/)
