import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://contextbrain.dev',
	integrations: [
		starlight({
			title: 'ContextBrain',
			description: 'SmartMemory and Intelligence Layer for ContextUnity',
			logo: {
				src: './src/assets/brain-image.jpg',
				replacesTitle: false,
			},
			social: {
				github: 'https://github.com/ContextUnity/contextbrain',
			},
			editLink: {
				baseUrl: 'https://github.com/ContextUnity/cu/edit/main/docs/brain/',
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
						{ label: 'ContextUnit Protocol', link: '/core/contextunit/' },
						{ label: 'ContextToken', link: '/core/token/' },
						{ label: 'Storage', link: '/core/storage/' },
					],
				},
				{
					label: 'RAG Pipeline',
					items: [
						{ label: 'Overview', link: '/rag/' },
						{ label: 'Retrieval', link: '/rag/retrieval/' },
						{ label: 'Reranking', link: '/rag/reranking/' },
						{ label: 'Knowledge Graph', link: '/rag/knowledge-graph/' },
					],
				},
				{
					label: 'Ingestion',
					items: [
						{ label: 'Pipeline', link: '/ingestion/' },
						{ label: 'Taxonomy & Ontology', link: '/ingestion/taxonomy/' },
					],
				},
				{
					label: 'Storage',
					items: [
						{ label: 'PostgreSQL + pgvector', link: '/storage/postgres/' },
						{ label: 'LanceDB', link: '/storage/lancedb/' },
						{ label: 'Vertex AI', link: '/storage/vertex/' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'gRPC API', link: '/api/grpc/' },
						{ label: 'Python SDK', link: '/api/python/' },
						{ label: 'Configuration', link: '/api/configuration/' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Overview', link: '/reference/' },
						{ label: 'Configuration', link: '/reference/configuration/' },
						{ label: 'Roadmap', link: '/reference/roadmap/' },
					],
				},
			],
		}),
	],
});
