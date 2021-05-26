// import * as Vue from "https://unpkg.com/vue@3.0.11/dist/vue.esm-browser.js";

var compList = [
	{ prefix: 'app--', basePath: '/comp/' },
	{ prefix: 'block--', basePath: '/block/' },
	{ prefix: 'page--', basePath: '/page/' },
];

var reDash = /--/g;

function resolveUserLoader(name) {
	var count = compList.length;
	for (let i = 0; i < count; i++) {
		const {prefix, basePath} = compList[i];
		if (name.startsWith(prefix)) {
			const path = name.substr(prefix.length).replace(reDash, '/');
			return () => import(basePath + path);
		}
	}
}

function resolveUserComponent(name) {
	var loader = resolveUserLoader(name);
	if (loader) return Vue.defineAsyncComponent(loader);
}

var originalRC = Vue.resolveComponent;

Vue.resolveComponent = function(name) {
	return resolveUserComponent(name)
		|| originalRC(name);
};

var originalRDC = Vue.resolveDynamicComponent;

Vue.resolveDynamicComponent = function(name) {
	return resolveUserComponent(name)
		|| originalRDC(name);
};

resolveUserLoader('app--no-router')()
	.then(function({default: comp}) {

		var root = _app$.root = Vue.createSSRApp(comp);
		root.mount('#root');

	})
	.catch(function(err) {
		console.error(`Error loading root component`, err);
	});
