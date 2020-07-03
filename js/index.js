var _app$ = function() {

var Comp = {
	map: {},
	loader: prefixMatcher({
		prefix: 'app--',
		basePath: '/comp/',
		getJsData: function(match) {return Comp.map[match.path];}
	})
};

var Page = {
	map: {},
	loader: prefixMatcher({
		prefix: 'page--',
		basePath: '/page/',
		getJsData: function(match) {return Page.map[match.path];}
	})
};

function getComponent(sp) {
	sp = sp.hyphenated;
	var prom = Comp.loader(sp) || Page.loader(sp);
	return prom && Vue.defineAsyncComponent(prom);
}

var root = Vue.createApp(getComponent({ hyphenated: 'app--root' }));

var global = {
	root: root,
	Comp: Comp,
	Page: Page,
	getComponent: getComponent
};

return global;

}();

_app$.root.mount('#root');
