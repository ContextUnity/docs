import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://contextcommerce.dev',
	integrations: [
		starlight({
			title: 'ContextCommerce',
			description: 'Django-based E-commerce Platform with AI Agents',
			logo: {
				src: './src/assets/commerce-image.jpg',
				replacesTitle: false,
			},
			social: {
				github: 'https://github.com/ContextUnity/contextcommerce',
			},
			editLink: {
				baseUrl: 'https://github.com/ContextUnity/cu/edit/main/docs/commerce/',
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
					label: 'Architecture',
					items: [
						{ label: 'Overview', link: '/architecture/' },
						{ label: 'Admin Copilot', link: '/architecture/admin-copilot/' },
						{ label: 'Horoshop Integration', link: '/architecture/horoshop/' },
						{ label: 'Site Sync', link: '/architecture/site-sync/' },
					],
				},
				{
					label: 'Agents',
					items: [
						{ label: 'Overview', link: '/agents/' },
						{ label: 'Overlord', link: '/agents/overlord/' },
						{ label: 'Matcher', link: '/agents/matcher/' },
						{ label: 'Lexicon', link: '/agents/lexicon/' },
						{ label: 'Mutator', link: '/agents/mutator/' },
						{ label: 'Gardener', link: '/agents/gardener/' },
					],
				},
				{
					label: 'Integration',
					items: [
						{ label: 'ContextBrain', link: '/integration/brain/' },
						{ label: 'ContextRouter', link: '/integration/router/' },
						{ label: 'ContextWorker', link: '/integration/worker/' },
						{ label: 'MCP Apps', link: '/integration/mcp/' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Configuration', link: '/reference/configuration/' },
						{ label: 'API', link: '/reference/api/' },
						{ label: 'Permissions', link: '/reference/permissions/' },
					],
				},
			],
		}),
	],
});
