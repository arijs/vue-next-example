!function(global) {

var Comp = global.Comp = prefixMatcher({
	map: {},
	mapCache: {},
	prefix: 'app--',
	basePath: '/comp/',
	getJsData: function(match) {return Comp.map[match.path];}
});

var Block = global.Block = prefixMatcher({
	map: {},
	mapCache: {},
	prefix: 'block--',
	basePath: '/block/',
	getJsData: function(match) {return Block.map[match.path];}
});

var Page = global.Page = prefixMatcher({
	map: {},
	mapCache: {},
	prefix: 'page--',
	basePath: '/page/',
	getJsData: function(match) {return Page.map[match.path];}
});
	
var resolveUserCompLoader = function(name) {
	return Comp.loader(name)
		|| Page.loader(name)
		|| Block.loader(name);
};

var resolveUserLoader = function(name) {
	var loader = resolveUserCompLoader(name);
	return loader && function() {
		return loader().then(function(load) {
			return load.comp.data;
		});
	};
};

var resolveUserComponent = function(name) {
	var loader = resolveUserLoader(name);
	return loader && Vue.defineAsyncComponent({
		loader: loader,
		name: 'loader--'+name
	});
};

global.resolveUserCompLoader = resolveUserCompLoader;
global.resolveUserLoader = resolveUserLoader;
global.resolveUserComponent = resolveUserComponent;

var originalRC = Vue.resolveComponent;

Vue.resolveComponent = global.scopeResolveComponent = function(name) {
	// console.log('ResolveComponent', name);
	return resolveUserComponent(name)
	// return resolveUserLoader(name)
		|| originalRC(name);
};

var originalRDC = Vue.resolveDynamicComponent;

Vue.resolveDynamicComponent = global.scopeResolveDynamicComponent = function(name) {
	return resolveUserComponent(name)
		|| originalRDC(name);
};

global.initApp = function() {
	var root = global.root = Vue.createSSRApp(Vue.resolveComponent('app--no-router'));

	root.mount('#root');
};

}(_app$);