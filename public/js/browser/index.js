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

var resolveUserComponent = function(name) {
	var loader = resolveUserCompLoader(name);
	return loader && Vue.defineAsyncComponent({
		loader: function() {
			return new Promise(function(resolve, reject) {
				return loader()
					.then(function(load) { resolve(load.comp.data); })
					.catch(function(err) { reject(err); });
			});
		},
		name: 'loader--'+name
	});
};

global.resolveUserCompLoader = resolveUserCompLoader;
global.resolveUserComponent = resolveUserComponent;

var originalRC = Vue.resolveComponent;

Vue.resolveComponent = global.scopeResolveComponent = function(name) {
	// console.log('ResolveComponent', name);
	return resolveUserComponent(name)
		|| originalRC(name);
};

var originalRDC = Vue.resolveDynamicComponent;

Vue.resolveDynamicComponent = global.scopeResolveDynamicComponent = function(name) {
	return resolveUserComponent(name)
		|| originalRDC(name);
};

global.initRouter();

global.routeWithModal = global.getRouteWithModal(global.router);

global.initApp = function() {
	global.router.afterEach(function(to, from) {
		window.scrollTo(0, 0);
	});

	var root = global.root = Vue.createSSRApp(Vue.resolveComponent('app--root'));
	root.use(global.router);

	global.router.isReady().then(function() {
		root.mount('#root');
	});
};

}(_app$);