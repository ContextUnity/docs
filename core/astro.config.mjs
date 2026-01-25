import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://contextcore.dev',
	integrations: [
		starlight({
			title: 'ContextCore',
			description: 'The Source of Truth for ContextUnity Ecosystem',
			logo: {
				src: './src/assets/core-image.jpg',
				replacesTitle: false,
			},
			social: {
				github: 'https://github.com/ContextUnity/contextcore',
			},
			editLink: {
				baseUrl: 'https://github.com/ContextUnity/cu/edit/main/docs/core/',
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
					label: 'ContextUnit Protocol',
					items: [
						{ label: 'Overview', link: '/contextunit/' },
						{ label: 'Structure', link: '/contextunit/structure/' },
						{ label: 'Security Scopes', link: '/contextunit/security/' },
						{ label: 'Provenance', link: '/contextunit/provenance/' },
					],
				},
				{
					label: 'ContextToken',
					items: [
						{ label: 'Overview', link: '/token/' },
						{ label: 'Authorization', link: '/token/authorization/' },
						{ label: 'Capabilities', link: '/token/capabilities/' },
					],
				},
				{
					label: 'Shared Config',
					items: [
						{ label: 'Overview', link: '/config/' },
						{ label: 'Settings', link: '/config/settings/' },
					],
				},
				{
					label: 'gRPC Contracts',
					items: [
						{ label: 'Overview', link: '/grpc/' },
						{ label: 'ContextUnit', link: '/grpc/contextunit/' },
						{ label: 'Brain', link: '/grpc/brain/' },
						{ label: 'Commerce', link: '/grpc/commerce/' },
						{ label: 'Worker', link: '/grpc/worker/' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Python SDK', link: '/reference/python/' },
						{ label: 'Type Definitions', link: '/reference/types/' },
					],
				},
			],
		}),
	],
});
