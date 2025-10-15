import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	optimizeDeps: {
		exclude: ['@rollup/browser']
	},
	build: {
		target: 'es2022',
		rollupOptions: {
			output: {
				hashCharacters: 'base36'
			}
		}
	},
	plugins: [sveltekit()]
})
