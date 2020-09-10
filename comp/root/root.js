!function(global) {

global.Comp.map['root'] = {
	template: null,
	serverPrefetch: function() {
		return new Promise(function(resolve, reject) {
			global.usersLoad(function(resp) {
				if (resp.error) reject(new Error(
					'Error loading users in comp root: '+String(resp.error)
				));
				else resolve();
			});
		});
	},
	setup: function() {
		initUsers();
		// global.routerInit();
		var router = global.router;
		var route = VueRouter.useRoute();
		var historyState = Vue.computed(function() {
			// return route.fullPath && window.history.state
			var cr = router.currentRoute;
			return global.getHistoryState(route || cr);
		});
		var routeWithModal = Vue.computed(function() {
			var hs = historyState.value;
			var bgView = hs && hs.bgView;
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
	// users = Vue.readonly([
	// 	{ name: 'John' },
	// 	{ name: 'Jessica' },
	// 	{ name: 'James' },
	// ]);
	var lastResp;
	users = Vue.reactive({
		loading: false,
		data: null,
		error: null
	});
	global.users = users;
	global.usersLoad = function(cb) {
		users.loading = true;
		global.services.getUsers({
			cb: function(resp) {
				lastResp = resp;
				users.loading = false;
				users.data = resp.data;
				users.error = resp.error;
				if (cb instanceof Function) cb(resp);
			}
		});
	};
	global.usersLastResp = function() { return lastResp; };
	Vue.onMounted(function() {
		global.usersLoad();
	});
	return users;
}

}(_app$);
