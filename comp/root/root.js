!function(compMap) {

compMap['root'] = {
	template: null,
	setup: function() {
		var router = initRouter();
		var route = VueRouter.useRoute();
		var historyState = Vue.computed(function() {
			return route.fullPath && window.history.state
		});
		var routeWithModal = Vue.computed(function() {
			var bgView = historyState.value.bgView;
			if (bgView) {
				return router.resolve(bgView);
			} else {
				return route;
			}
		});
		var opt = Vue.toRefs(route);
		opt.route = route;
		opt.routeWithModal = routeWithModal;
		opt.historyState = historyState;
		return opt;
	}
};

function component(name) {
	return _shift$.getComponent({ hyphenated: name.replace(/\/+/g,'--') });
}
function page(name) {
	return component('app/pages/'+name);
}
function initRouter() {
	var router = compMap._router;
	if (router) return router;
	var webHistory = VueRouter.createWebHistory('/');
	router = VueRouter.createRouter({
		history: webHistory,
		routes: [
			{ path: '/', exact: true, component: page('home') },
			{ path: '/about', component: page('about') },
			{ path: '/users/:id', props: true, name: 'user', component: page('user/details') }
		]
	});

	_shift$.root.use(router);
	compMap._router = router;

	var users = Vue.readonly([
		{ name: 'John' },
		{ name: 'Jessica' },
		{ name: 'James' },
	]);
	compMap._users = users;
	return router;
}

}(AppComp);
