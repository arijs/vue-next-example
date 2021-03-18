import Vue, { createSSRApp } from 'vue';
import VueRouter from 'vue-router';
import VueCompiler from '@vue/compiler-dom';
const { compile } = VueCompiler;
import VueServerRenderer from '@vue/server-renderer';
const { renderToString } = VueServerRenderer;
import { minify } from 'terser';
import {
	loaders,
	routerPush,
	renderApp,
	parseHtml,
	printHtml,
	buildCssLinks,
	buildCompScripts,
	nodeUtils,
	routeToOutput,
	writeFile,
	frontend,
} from '@arijs/vue-prerender';
const { treeMetaDesc } = nodeUtils;
const {
	utils: { forEach, numberString: { numberFormat } },
} = frontend;
const { scriptQueue, initVueLoaders } = loaders;

import appPath from './app-path.mjs';
import services from './services.mjs';

function rightPad(str, num, chr = ' ') {
	var len = str.length;
	var clen = chr.length;
	if (len >= num) return str;
	while (len < num) {
		str += chr;
		len += clen;
	}
	return str.substr(0, num);
}

var reUserId = /^\d+$/;
function pgUsers(path) {
	if (!reUserId.test(path)) {
		throw new Error('Invalid User ID: '+JSON.stringify(path));
	}
	return { route: '/users/' + path, waitUsers: true };
}

var pages = [
	{ route: '/', waitUsers: true },
	{ route: '/about' }
];
var pgSuccess = [];
var pgError = [];

function nop() {};

var oRC = Vue.resolveComponent;
var oRDC = Vue.resolveDynamicComponent;
var customResolve = nop;

function resolveComponent() {
	return customResolve.apply(this, arguments)
		|| oRC.apply(this, arguments);
}
function resolveDynamicComponent() {
	return customResolve.apply(this, arguments)
		|| oRDC.apply(this, arguments);
}

Vue.resolveComponent = resolveComponent;
Vue.resolveDynamicComponent = resolveDynamicComponent;

console.log('/** Before users loaded **/');

services.setDebug(false);
services.getUsersLista().then(function({data}) {
	console.log('/** Users loaded **/');
	forEach(data.data, function(item, index) {
		if (item) pages.push(pgUsers(String(index)));
	});
	// console.log(pages);
	console.log('/** :: START :: **/');
	setTimeout(runNext, 0);
}).catch(function(obj) {
	console.error('Error when loading users', obj instanceof Object ? Object.keys(obj)+obj : String(obj));
});

function runOrNot(next) {
	return true;
	// for testing specific routes
	// return false
	// 	|| ('/' === next.route)
	// 	|| ('/about' === next.route)
	// 	|| ('/users/0' === next.route);
}

function runNext() {
	var next = pages.shift();
	if (next) {
		if (!runOrNot(next)) {
			return setTimeout(runNext, 0);
		}
		// console.log('/** :: Render Page '+next.route+' :: **/');
		ssr(next).then(function(){
			pgSuccess.push(next);
			// console.log('/** :: Finish Page '+next.route+' :: '+(null?'FAIL':'ok!')+' :: **/');
			console.log('ok!');
			setTimeout(runNext, 50);
		}).catch(function(err) {
			pgError.push({
				pg: next,
				err
			});
			// console.log('/** :: Finish Page '+next.route+' :: '+(err?'FAIL':'ok!')+' :: **/');
			console.log('FAIL');
			console.error(err);
			// setTimeout(runNext, 50);
		});
	} else {
		var ec = pgError.length;
		if (ec) {
			console.error(ec + ( 1 == ec
				? ' página teve'
				: ' páginas tiveram' ) +
				' erro na renderização'
			);
			console.error(pgError);
		}
		var sc = pgSuccess.length;
		console.log(sc + ( 1 == sc
			? ' página renderizada'
			: ' páginas renderizadas') +
			' com sucesso'
		);
		// console.log(pgSuccess);
		false && forEach(pgSuccess, function(pg) {
			console.log(`${rightPad(pg.route, 40)} → ${pg.outputPath}`);
		});
	}
}

async function ssr(next) {
	const dtStart = new Date();
	const isDebug = false; // '/users/7' === next.route;
	services.setDebug(isDebug);

	console.log('\n  --- init --- '+next.route);

	const jsGlobal = {
		originRoute: next.route,
		services,
		log: function() {
			return console.log.apply(console, arguments);
		}
	};
	const jsGlobalVar = '_app$';
	const jsContext = {
		[jsGlobalVar]: jsGlobal,
		Vue,
		VueRouter,
		forEach,
	};

	const vueLoaders = await initVueLoaders([
		{
			name: 'Comp',
			prefix: 'app--',
			basePath: appPath('comp/'),
			relPath: '/comp/'
		},
		{
			name: 'Page',
			prefix: 'page--',
			basePath: appPath('page/'),
			relPath: '/page/'
		},
		{
			name: 'Block',
			prefix: 'block--',
			basePath: appPath('block/'),
			relPath: '/block/'
		}
	], {
		onResolveDefined: isDebug && function(match, name) {
			var r = JSON.stringify(next.route);
			console.log('/** user component predefined from '+r+' **/', match.name, name);
		},
		onResolveFound: isDebug && function(match, name) {
			var r = JSON.stringify(next.route);
			console.log('/** user component found from '+r+' **/', match.name, name);
		},
		onResolveNotFound: isDebug && function(name) {
			var r = JSON.stringify(next.route);
			console.log('/** user component NOT found from '+r+' **/', name);
		},
		Vue,
		compile,
		jsGlobal,
		jsContext,
		jsOnError: function(error, jsRef) {
			console.error('Script error in', jsRef.url);
		}
	});

	console.log(' +  init vue load');

	({
		resolveAsyncComponent: customResolve,
	} = vueLoaders);

	await scriptQueue({ jsContext, queue: [
		appPath('js/isomorphic/router.js'),
		appPath('js/isomorphic/use.js'),
		appPath('js/prerender/use.js'),
	], processResult: function(req) {
		if (isDebug) console.log(' +  script load', req.url, inspect(jsGlobal, 1, 32));
	} });

	console.log(' +  init scripts');

	await jsGlobal.users.load();
	console.log(' +  waited for users!');

	jsGlobal.initRouter();
	const { router } = jsGlobal;

	await routerPush({ router, route: next.route });

	console.log(' +  router pushed', next.route);

	const [rootHtml] = await Promise.all([
		renderApp({
			componentName: 'app--root',
			resolveComponent,
			router,
			createSSRApp,
			renderToString,
		})
	]);

	console.log(' +  page root component rendered', String(rootHtml).length, 'str length');

	const htmlParsed = await parseHtml(appPath('template.html'));
	const { elAdapter } = htmlParsed;

	let {page, nodesRep} = await printHtml(htmlParsed, {}, [
		{
			name: 'comp html',
			matcher: {
				name: 'div',
				attrs: [['id', 'root'], [null, null, '<0>']],
				path: ['html', 'body']
			},
			callback: function(opt) {
				return opt.callback(null, {
					name: 'comp html',
					noFormat: true,
					children: {text: rootHtml, noFormat: true}
				});
			}
		},
		{
			name: 'comp css',
			matcher: {
				name: 'head',
				path: ['html']
			},
			callback: function(opt) {
				return opt.callback(null, {
					name: 'comp css',
					append: {tree: buildCssLinks(vueLoaders.getCompsCss(), elAdapter)}
				});
			}
		},
		{
			name: 'comp scripts',
			matcher: {
				name: 'script',
				attrs: [['src', '/js/browser/index.js'], [null, null, '<0>']],
				path: ['html', 'body']
			},
			callback: function(opt) {
				return buildCompScripts({
					list: vueLoaders.getCompsLoad(),
					elAdapter,
					jsGlobalVar,
					jsInitialState: services.cacheFront,
					compile,
					// formatJs: minify,
					formatJs: async code => ({code}),
					callback: function(err, text) {
						return opt.callback(err, {
							name: 'comp scripts',
							after: {text: text, noFormat: true}
						});
					}
				}), true;
			}
		},
		{
			name: 'doc title',
			matcher: {
				name: 'title',
				attrs: [[null, null, '<0>']],
				path: ['html', 'head']
			},
			callback: function(opt) {
				var meta = jsGlobal.getDocMeta();
				if (!(meta && meta.title)) {
					return opt.callback();
				}
				return opt.callback(null, {
					name: 'doc title',
					noFormat: true,
					children: {text: meta.title, noFormat: true}
				});
			}
		},
		{
			name: 'doc desc',
			matcher: {
				name: 'meta',
				attrs: [['name', 'description'], ['content', null], [null, null, '<0>']],
				path: ['html', 'head']
			},
			callback: function(opt) {
				var meta = jsGlobal.getDocMeta();
				if (!(meta && meta.description)) {
					return opt.callback();
				}
				return opt.callback(null, {
					name: 'doc desc',
					full: {tree: treeMetaDesc(opt.node, meta.description, elAdapter)}
				});
			}
		}
	]);

	console.log(' +  page printed', String(page).length, 'bytes');

	vueLoaders.destroy();

	nodesRep = forEach(nodesRep, [], function(nr) {
		this.result.push(nr.replaced);
	});

	console.log('  --- rep --- ' + nodesRep.join(' - '));

	const outputPath = next.outputPath = routeToOutput(next.route);

	await writeFile(appPath('.'), outputPath, page);

	const dtEnd = new Date();
	console.log('  --- out --- '+numberFormat((dtEnd.getTime()-dtStart.getTime())*0.001,1)+'s '+outputPath);
}
