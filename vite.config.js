import loadVue from "./plugin/rollup-plugin-load-vue";
import url from "url";
import { resolve } from "path";
import { strict as assert } from 'assert';

const dirname = url.fileURLToPath(new URL('./', import.meta.url)).replace(/\/+$/,'');

assert.strictEqual(dirname, __dirname);

export default {
	root: 'public',
	// root: resolve(__dirname, 'public'),
	plugins: [
		{
			name: 'reload',
			configureServer(server) {
				const { ws, watcher } = server;
				watcher.on('change', () => {
					ws.send({ type: 'full-reload' });
				});
			},
		},
		loadVue('Comp', 'comp', '_app$'),
	],
	build: {
		rollupOptions: {
			input: {
				index: 'vite.html',
				// index: resolve(__dirname, 'public/vite.html'),
			},
		},
	},
};
