import appPath from './app-path.mjs';
import { loaders, frontend } from '@arijs/vue-prerender';
// import inspect from '@arijs/frontend/isomorphic/utils/inspect';

var { ajaxFs } = loaders;
var { utils: { inspect } } = frontend;

var isDebug = true;
var host = appPath('api/');

var cacheBack = {};
var cacheFront = {};

function injectService(name, key, cb, load) {
	var cacheVal = cacheFront[name] || cacheBack[name];
	if (cacheVal) {
		// if (isDebug) 
		console.log('  ~ svc load from cache:', name);
		cbInject(cacheVal);
	} else {
		// if (isDebug) 
		console.log('  ~ svc loading:', name);
		load().then(function(data) {
			return cbInject({data});
		}).catch(function(error) {
			return cbInject({error});
		});
	}
	return;
	function cbInject(resp) {
		var cache =
			'b' === key ? cacheBack :
			'f' === key ? cacheFront :
			null;
		if (cache) {
			// if (isDebug) 
			console.log('  ~ svc inject: save', name, 'into cache', key, inspect(resp, 1, 16));
			cache[name] = resp;
		} else {
			// if (isDebug) 
			console.log('  ~ svc inject: no cache', key, 'to save', name, inspect(resp, 1, 16));
		}
		cb(resp);
	};
}

function injectPromise(name, key, load) {
	return new Promise(function(resolve, reject) {
		injectService(name, key, function(resp) {
			console.log('  ~ svc promise:', name, inspect(resp, 1, 16));
			if (resp.error) reject(resp);
			else resolve(resp);
		}, load);
	})
}

var services = {
	setDebug: function(d) {
		isDebug = d;
	},
	host,
	keyInitial: 'f',
	cacheBack,
	cacheFront,

	getUsersLista: function() {
		var name = 'users';
		var key = services.keyInitial;
		return injectPromise(name, key, function() {
			return ajaxFs({
				url: host+'users.json',
				json: true,
			});
		});
	}
};

export default services;
