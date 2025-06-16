import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy'
// https://vitejs.dev/config
// export default defineConfig({});
export default {
	plugins: [
		viteStaticCopy({
			targets: [
				/* {
					src: 'data/table.json',
					dest: 'data'
				},
				{
					src: 'data/completed.json',
					dest: 'data'
				}, */
				{
					src: 'data/',
					dest: './'
				},
				{
					src: 'public/',
					dest: './'
				},
				{
					src: 'src/shadowpath.js',
					dest: './'
				},
				{
					src: 'src/twitch.js',
					dest: './'
				},
			]
		})
	]
}
