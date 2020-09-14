const VueRouter = require('vue-router')
const Vue = require('vue')
const prefixMatcher = require('./loaders/comp-prefix')
const loadScriptQueue = require('./loaders/script-queue');
const services = require('./services');
const {forEach, forEachProperty} = require('../lib/function');
const {
	renderToString,
	// ssrInterpolate,
	// ssrRenderComponent,
} = require('@vue/server-renderer');

var global = exports.jsGlobal = {
	services: services
};
var ctx = exports.jsCtx = {
	Vue: Vue,
	VueRouter: VueRouter,
	_app$: global
};

var Comp = global.Comp = {
	map: {},
	mapCss: {},
	mapDefined: {},
	name: 'Comp',
	loader: prefixMatcher({
		prefix: 'app--',
		basePath: 'comp/',
		jsCtx: ctx,
		waitCss: true,
		getJsData: function(match) {return Comp.map[match.path];},
		onCssData: function(data, match) {Comp.mapCss[match.path] = {
			match: match,
			data: data
		};}
	})
};

var Page = global.Page = {
	map: {},
	mapCss: {},
	mapDefined: {},
	name: 'Page',
	loader: prefixMatcher({
		prefix: 'page--',
		basePath: 'page/',
		jsCtx: ctx,
		waitCss: true,
		getJsData: function(match) {return Page.map[match.path];},
		onCssData: function(data, match) {Page.mapCss[match.path] = {
			match: match,
			data: data
		};}
	})
};

var Block = global.Block = {
	map: {},
	mapCss: {},
	mapDefined: {},
	name: 'Block',
	loader: prefixMatcher({
		prefix: 'block--',
		basePath: 'block/',
		jsCtx: ctx,
		waitCss: true,
		getJsData: function(match) {return Block.map[match.path];},
		onCssData: function(data, match) {Block.mapCss[match.path] = {
			match: match,
			data: data
		};}
	})
};

function compAsyncLoad(loader, name) {

	return Vue.defineAsyncComponent(function() {
		return new Promise(function(resolve, reject) {
			console.log('## load comp loader: '+name);
			loader().then(resolve).catch(reject);
		});
	});

}

function getCompsCss() {
	var tries = [ Comp, Page, Block ];
	var list = [];
	forEach(tries, function(comp) {
		forEachProperty(comp.mapCss, function(item) {
			item.comp = comp.name;
			list.push(item);
		});
	});
	return list;
}

function resolveUserComponents(name) {
	var tries = [ Comp, Page, Block ];
	var defined;
	var loader, match;
	forEach(tries, function(comp) {
		defined = comp.mapDefined[name];
		if (defined) {
			match = comp;
			return this._break;
		}
		loader = comp.loader(name);
		if (loader) {
			match = comp;
			return this._break;
		}
	});
	if (defined) {
		console.log('/** user component predefined **/', match.name, name);
		return defined;
	} else if (loader) {
		console.log('/** user component found **/', match.name, name);
		defined = match.mapDefined[name] = compAsyncLoad(loader, name);
		return defined;
	} else {
		console.log('/** user component NOT found **/', name);
	}
}

var originalRC = Vue.resolveComponent;

Vue.resolveComponent = function(name) {
	return resolveUserComponents(name)
		|| originalRC(name);
};

var originalRDC = Vue.resolveDynamicComponent;

Vue.resolveDynamicComponent = function(name) {
	return resolveUserComponents(name)
		|| originalRDC(name);
};

var historyState = {};
global.getHistoryState = function() {
	return historyState;
};
global.routerHistory = VueRouter.createMemoryHistory();

var pointerDrag = {};
global.pointerDrag = function() {
	return pointerDrag;
};

var scriptQueue = [
	{ url: 'js/router.js', ctx: ctx }
];

function defaultErrorScriptQueue(err) {
	return console.error('/** error loading script queue **/', err);
}
function defaultErrorRouter() {
	return console.error('/** vue router instance not found **/');
}

exports.renderRouter = function renderRouter(opt) {
	var jsq = opt.scriptsReplace || scriptQueue.concat(opt.scripts || []);
	loadScriptQueue(jsq, function(err) {
		console.log('/** loadScriptQueue **/');
		if (err) {
			return (opt.onErrorScripts || defaultErrorScriptQueue)(err);
		}
		global.initRouter();
		if (!global.router) {
			return (opt.onErrorRouter || defaultErrorRouter)();
		}
		// global.onRouterCreate();
		(opt.onRouterCreated || routerCreated)(opt);
	}, ctx);
}

function routerCreated(opt) {
	(opt.onGetApp || defaultGetApp)(opt.rootCompName || 'app--root', function(err, App) {
		if (err) {
			(opt.onErrorGetApp || defaultGetAppError)(err);
		} else {
			(opt.renderApp || defaultRenderApp)(App, global.router, opt.route, function(err, app) {
				if (err) {
					(opt.onErrorRouterReady || defaultErrorRouterReady)(err);
				} else {
					(opt.renderAppToString || defaultRenderAppToString)(opt, app);
				}
			})
		}
	});
}

function defaultGetApp(name, cb) {
	var App = resolveUserComponents(name);
	if (App) {
		cb(null, App);
	} else {
		// defaultGetAppError('Not found');
		cb('Not found');
	}
}
function defaultGetAppError(err) {
	return console.error('/** vue get root app error **/', err);
}
function defaultErrorRouterReady(err) {
	return console.error('/** vue router isready error **/', err);
}

function defaultRenderApp(App, router, route, cb) {
	console.log('/** App root loaded **/')
	console.log(App);
	const app = global.app = Vue.createSSRApp(App);
	app.use(router);
	console.log('/** app created **/');

	router.push(route || '/');
	console.log('/** vue router push called **/');

	router.isReady().then(function() {
		cb(undefined, app);
	}).catch(function(err) {
		cb(err, app);
	});
}

function defaultRenderAppToString(opt, app) {
	renderToString(app)
		.then(renderAppToStringSuccess)
		.catch(opt.onRenderStringError || defaultRenderAppToStringError);
	function renderAppToStringSuccess(html) {
		var fn = opt.onRenderString || defaultRenderAppToStringSuccess
		fn({
			html: html,
			css: getCompsCss()
		});
	}
}
function defaultRenderAppToStringSuccess(html) {
	console.log('/** vue app HTML rendered **/');
	console.log(html);
}
function defaultRenderAppToStringError(err) {
	console.error('/** vue app renderToString error **/', err);
}
