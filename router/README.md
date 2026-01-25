# ContextRouter Documentation

Official documentation site for **ContextRouter** - the modular, LangGraph-powered AI Agent Framework.
Live at [contextrouter.dev](https://contextrouter.dev).

Built with [Astro Starlight](https://starlight.astro.build/).

## Important Notes

⚠️ **RAG and Ingestion content has been moved to ContextBrain**

- RAG pipeline documentation → `docs/brain/rag/`
- Ingestion pipeline documentation → `docs/brain/ingestion/`
- ContextRouter now focuses on agent orchestration, not RAG

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
docs/router/
├── src/
│   └── content/
│       └── docs/           # Documentation pages (Markdown/MDX)
│           ├── index.mdx   # Homepage
│           ├── orchestration/  # Agent orchestration (replaces RAG)
│           └── ...
├── astro.config.mjs        # Astro + Starlight configuration
├── package.json
└── pnpm-lock.yaml
```

## Contributing

1. Create or edit `.md` files in `src/content/docs/`
2. Each file needs frontmatter with `title` and `description`
3. Run `pnpm dev` to preview changes
4. **Do not add RAG/Ingestion content** - that belongs in ContextBrain docs

## Links

- [ContextRouter GitHub](https://github.com/ContextRouter/contextrouter)
- [Starlight Documentation](https://starlight.astro.build/)
