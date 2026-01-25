# ContextCore Documentation

Official documentation site for **ContextCore** - The Source of Truth for ContextUnity Ecosystem.
Live at [contextcore.dev](https://contextcore.dev).

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
docs/core/
├── src/
│   └── content/
│       └── docs/           # Documentation pages (Markdown/MDX)
│           ├── index.mdx   # Homepage
│           ├── contextunit/
│           ├── token/
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

- [ContextCore GitHub](https://github.com/ContextUnity/contextcore)
- [Starlight Documentation](https://starlight.astro.build/)
