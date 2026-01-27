import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
    site: 'https://contextworker.dev',
    integrations: [
        starlight({
            title: 'ContextWorker',
            description: 'Job Runner and Automation for ContextUnity',
            logo: {
                src: './src/assets/worker-image.jpg',
                replacesTitle: false,
            },
            social: {
                github: 'https://github.com/ContextUnity/contextworker',
            },
            editLink: {
                baseUrl: 'https://github.com/ContextUnity/cu/edit/main/docs/worker/',
            },
            customCss: [
                './src/styles/custom.css',
            ],
            head: [
                {
                    tag: 'link',
                    attrs: {
                        rel: 'preconnect',
                        href: 'https://fonts.googleapis.com',
                    },
                },
                {
                    tag: 'link',
                    attrs: {
                        rel: 'preconnect',
                        href: 'https://fonts.gstatic.com',
                        crossorigin: true,
                    },
                },
                {
                    tag: 'link',
                    attrs: {
                        rel: 'stylesheet',
                        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
                    },
                },
            ],
            sidebar: [
                {
                    label: 'Getting Started',
                    items: [
                        { label: 'Introduction', link: '/getting-started/' },
                        { label: 'Installation', link: '/getting-started/installation/' },
                        { label: 'Quick Start', link: '/getting-started/quickstart/' },
                    ],
                },
                {
                    label: 'Guides',
                    items: [
                        { label: 'Harvester', link: '/guides/harvester/' },
                        { label: 'Gardener Agent', link: '/guides/gardener/' },
                        { label: 'Workflows', link: '/guides/workflows/' },
                    ],
                },
                {
                    label: 'Agents',
                    items: [
                        { label: 'Overview', link: '/agents/' },
                        { label: 'Gardener', link: '/agents/gardener/' },
                        { label: 'Lexicon', link: '/agents/lexicon/' },
                    ],
                },
                {
                    label: 'Reference',
                    items: [
                        { label: 'CLI', link: '/reference/cli/' },
                        { label: 'Configuration', link: '/reference/configuration/' },
                        { label: 'API', link: '/reference/api/' },
                    ],
                },
            ],
        }),
    ],
});
