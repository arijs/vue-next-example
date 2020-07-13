!function(global) {

function component(name) {
	return Vue.resolveComponent( name.replace(/\/+/g,'--') );
}
function page(name) {
	return component('page/'+name);
}

function initRouter() {

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

router.beforeEach(function(to, from, next) {
	// handle as necessary
	return next();
});

global.root.use(router);
global.router = router;

}

global.routerInit = initRouter;

}(_app$);
