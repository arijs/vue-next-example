!function(global) {

global.Comp.map['root'] = {
	template: null,
	setup: function() {
		initUsers();
		global.routerInit();
		var router = global.router;
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

}(_app$);
