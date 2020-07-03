!function(global) {

global.Comp.map['root'] = {
	template: null,
	setup: function() {
		initUsers();
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
	return global.getComponent({ hyphenated: name.replace(/\/+/g,'--') });
}
function page(name) {
	return component('page/'+name);
}
function initUsers() {
	var users = global.users;
	if (users) return users;
	users = Vue.readonly([
		{ name: 'John' },
		{ name: 'Jessica' },
		{ name: 'James' },
	]);
	global.users = users;
	return users;
}
function initRouter() {
	var router = global.router;
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

	global.root.use(router);
	global.router = router;

	return router;
}

}(_app$);
