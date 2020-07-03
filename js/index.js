
var AppComp = {};

var appLoader = prefixMatcher({
	prefix: 'app--',
	basePath: '/comp/',
	getJsData: function(match) {return AppComp[match.path];}
});

var _shift$ = {
	root: null,
	getComponent: function(sp) {
		var prom = appLoader(sp.hyphenated);
		return prom && Vue.defineAsyncComponent(prom);
	}
};

appLoader('app--root')()
.then(function(comp) {
	comp.getComponent = _shift$.getComponent;
	_shift$.root = Vue.createApp(comp);
	_shift$.root.mount('#root');
})
.catch(function(err, load) {
	console.error('Error loading root component', err, load);
});
