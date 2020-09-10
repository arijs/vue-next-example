!function(global) {

var Comp = global.Comp = {
	map: {},
	loader: prefixMatcher({
		prefix: 'app--',
		basePath: '/comp/',
		getJsData: function(match) {return Comp.map[match.path];}
	})
};

var Page = global.Page = {
	map: {},
	loader: prefixMatcher({
		prefix: 'page--',
		basePath: '/page/',
		getJsData: function(match) {return Page.map[match.path];}
	})
};

var originalResolveComponent = Vue.resolveComponent;

Vue.resolveComponent = function(name) {
	// console.log('ResolveComponent', name);
	var prom = Comp.loader(name)
		|| Page.loader(name);
	if (prom) {
		return Vue.defineAsyncComponent(prom);
	} else {
		return originalResolveComponent.apply(this, arguments);
	}
};

global.getHistoryState = function(route) {
	return route.fullPath && window.history.state;
};

global.routerHistory = VueRouter.createWebHistory('/');

global.initRouter();

var root = global.root = Vue.createApp(Vue.resolveComponent('app--root'));

root.use(global.router);

root.mount('#root');

}(_app$);
