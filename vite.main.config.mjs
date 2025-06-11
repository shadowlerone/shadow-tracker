import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy'
// https://vitejs.dev/config
// export default defineConfig({});
export default {
	plugins: [
		viteStaticCopy({
			targets: [
				{
					src: 'data/paths.csv',
					dest: 'data'
				},
				{
					src: 'data/completed.json',
					dest: 'data'
				}
			]
		})
	]
}
