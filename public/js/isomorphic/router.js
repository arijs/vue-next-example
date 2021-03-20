!function(global) {

function component(name) {
	var loader = global.resolveUserLoader( name.replace(/\/+/g,'--') );
	return loader && function() {
		var result = loader();
		console.log('Page Component loaded from the router', result);
		if (result && result.then instanceof Function) {
			// probably a promise
			result.then(function(comp) {
				console.log('Page Component loaded, promise resolved from the router', comp);
			});
			result.catch(function(err) {
				console.log('Page Component loaded, promise rejected from the router', err);
			});
		}
		return result;
	};
}
function page(name) {
	return component('page/'+name);
}

function initRouter() {

var router = VueRouter.createRouter({
	history: global.routerHistory,
	routes: [
		{ path: '/', exact: true, component: page('home'), meta: { headerTopTransparent: true } },
		{ path: '/about', component: page('about') },
		{ path: '/users/:id', props: true, name: 'user', component: page('user/details') }
	]
});

global.router = router;

}

global.initRouter = initRouter;

}(_app$);
