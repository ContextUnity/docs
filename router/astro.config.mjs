import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://contextrouter.org',
	integrations: [
		starlight({
			title: 'ContextRouter',
			description: 'Modular AI Agent Framework for RAG and Knowledge Orchestration',
			logo: {
				src: './src/assets/cr-image-big.jpg',
				replacesTitle: false,
			},
			social: {
				github: 'https://github.com/ContextRouter/contextrouter',
			},
			editLink: {
				baseUrl: 'https://github.com/ContextRouter/contextrouter-docs/edit/main/',
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
					label: 'Core Concepts',
					items: [
						{ label: 'Overview', link: '/core/' },
						{ label: 'Bisquit Protocol', link: '/core/bisquit/' },
						{ label: 'Registry System', link: '/core/registry/' },
					],
				},
				{
					label: 'Cortex',
					items: [
						{ label: 'Overview', link: '/cortex/' },
						{ label: 'Nodes & Steps', link: '/cortex/nodes/' },
					],
				},
				{
					label: 'Models',
					items: [
						{ label: 'Overview', link: '/models/' },
						{ label: 'LLM Providers', link: '/models/llm/' },
						{ label: 'Embeddings', link: '/models/embeddings/' },
					],
				},
				{
					label: 'Data Sources',
					items: [
						{ label: 'Overview', link: '/data-sources/' },
						{ label: 'Connectors', link: '/data-sources/connectors/' },
						{ label: 'Storage Providers', link: '/data-sources/providers/' },
					],
				},
				{
					label: 'Agent Orchestration',
					items: [
						{ label: 'Overview', link: '/orchestration/' },
						{ label: 'Graph Building', link: '/orchestration/graph/' },
						{ label: 'State Management', link: '/orchestration/state/' },
					],
				},
				{
					label: 'Integration',
					items: [
						{ label: 'Protocols', link: '/integration/' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Overview', link: '/reference/' },
						{ label: 'Configuration', link: '/reference/configuration/' },
						{ label: 'CLI', link: '/reference/cli/' },
						{ label: 'Roadmap', link: '/reference/roadmap/' },
					],
				},
			],
		}),
	],
});
