!function(global) {

function component(name) {
	return Vue.resolveComponent( name.replace(/\/+/g,'--') );
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
