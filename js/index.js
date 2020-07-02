
var users = Vue.readonly([
	{ name: 'James' },
	{ name: 'Jessica' },
	{ name: 'John' }
]);

function showUserModal(id) {
	var bgView = router.currentRoute.value.fullPath;
	return router.push({
		name: 'user',
		params: { id: String(id) },
		state: { bgView: bgView }
	});
}

function closeUserModal() {
	history.back();
}

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

/*
var _shift$ = Vue.createApp({
	setup: function() {
		var state = Vue.reactive({
			value: 42
		});
		return {
			state: state
		};
	},
	getComponent: function(spellings, instance) {
		// example of spellings object:
		// {
		// 	"raw": "shift-foo",
		// 	"hyphenated": "shift-foo",
		// 	"camelized": "shiftFoo",
		// 	"PascalCase": "ShiftFoo"
		// }
		var prom = appLoader(spellings.hyphenated);
		if ( prom ) {
			console.log('got loader', spellings, prom, instance);
			prom.then(function(comp, load) {
				console.log('got loader success', comp, load);
			});
			prom.catch(function(error, load) {
				console.error('got loader failure', error, load);
			});
			return Vue.defineAsyncComponent(function() { return prom; });
		} else {
			console.log('App GetComponent', spellings, instance);
		}
		return {
			template: '<div><p>She\'s like the {{state.shesLikeThe}}</p></div>',
			setup: function() {
				var state = Vue.reactive({
					shesLikeThe: 'wind'
				});
				return {
					state: state
				};
			}
		}
	}
}).mount('#root');
*/
