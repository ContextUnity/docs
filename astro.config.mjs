import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
	site: 'https://contextunity.com',
	markdown: {
		rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg', dark: true }]],
	},
	integrations: [
		starlight({
			title: 'ContextUnity',
			description: 'Modular AI Infrastructure — Agents, Memory, Workflows',
			logo: {
				src: './src/assets/contextunity.jpg',
				replacesTitle: false,
			},
			social: {
				github: 'https://github.com/ContextUnity',
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
						{ label: 'Overview', link: '/' },
						{ label: 'Architecture', link: '/architecture/' },
						{ label: 'Quick Start', link: '/quickstart/' },
					],
				},
				{
					label: 'Core Concepts',
					items: [
						{ label: 'ContextUnit Protocol', link: '/concepts/contextunit/' },
						{ label: 'ContextToken Security', link: '/concepts/contexttoken/' },
						{ label: 'gRPC Contracts', link: '/concepts/grpc/' },
					],
				},
				{
					label: 'ContextCore',
					collapsed: true,
					items: [
						{ label: 'Overview', link: '/core/' },
						{ label: 'SDK Reference', link: '/core/sdk/' },
						{ label: 'BrainClient SDK', link: '/core/brain-client/' },
						{ label: 'Permissions', link: '/core/permissions/' },
						{ label: 'Security Integration', link: '/core/security/' },
						{ label: 'Configuration', link: '/core/configuration/' },
					],
				},
				{
					label: 'ContextRouter',
					collapsed: true,
					items: [
						{ label: 'Overview', link: '/router/' },
						{ label: 'Agent Orchestration', link: '/router/agents/' },
						{ label: 'Dispatcher & Security', link: '/router/dispatcher/' },
						{ label: 'Cortex Pipeline', link: '/router/cortex/' },
						{ label: 'Tool System', link: '/router/tools/' },
						{ label: 'Configuration', link: '/router/configuration/' },
					],
				},
				{
					label: 'ContextBrain',
					collapsed: true,
					items: [
						{ label: 'Overview', link: '/brain/' },
						{ label: 'Knowledge Store', link: '/brain/knowledge/' },
						{ label: 'Memory System', link: '/brain/memory/' },
						{ label: 'Taxonomy & Ontology', link: '/brain/taxonomy/' },
						{ label: 'RAG Pipeline', link: '/brain/rag/' },
						{ label: 'Configuration', link: '/brain/configuration/' },
					],
				},
				{
					label: 'ContextWorker',
					collapsed: true,
					items: [
						{ label: 'Overview', link: '/worker/' },
						{ label: 'Workflows & Activities', link: '/worker/workflows/' },
						{ label: 'Schedules', link: '/worker/schedules/' },
						{ label: 'Agent System', link: '/worker/agents/' },
						{ label: 'Configuration', link: '/worker/configuration/' },
					],
				},
				{
					label: 'Enterprise Services',
					collapsed: true,
					badge: { text: 'Paid', variant: 'caution' },
					items: [
						{ label: 'ContextShield', link: '/shield/' },
						{ label: 'ContextZero', link: '/zero/' },
						{ label: 'ContextCommerce', link: '/commerce/' },
						{ label: 'ContextView', link: '/view/' },
					],
				},
				{
					label: 'Roadmap',
					collapsed: true,
					items: [
						{ label: 'ContextSpatial', link: '/roadmap/spatial/' },
						{ label: 'ContextWorkshop', link: '/roadmap/workshop/' },
					],
				},
			],
		}),
	],
});
