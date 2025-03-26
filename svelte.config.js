import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: "index.html"
		})
	},
	vitePlugin: {
		// inspector: true
	},
	onwarn: (warning, handler) => {
		// console.log({ warning })
		if (warning.code === 'css-unused-selector') return
		// Handle all other warnings normally
		handler(warning)
	}
}

export default config
