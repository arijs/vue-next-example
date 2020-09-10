var extend = require('../../lib/extend');
var {deferredPromise} = require('../../lib/deferred');
var loadComponent = require('./component');

function testNamePrefix(name, prefix) {
	var plen = prefix.length;
	if (name.substr(0, plen) === prefix) {
		return { name, prefix, suffix: name.substr(plen) };
	}
}
function compPathBase(param, match) {
	return param instanceof Function ? param(match) : match.href;
}
function compPathResource(param, match, extension) {
	return param === false ? null :
		param instanceof Function ? param(match) :
		match.url + extension;
}

function compSetResult(load, cb) {
	var js = load.js.data;
	var html = load.html.data;
	var err = [];
	if (!js) err.push('javascript');
	if (!html) err.push('html');
	if (err.length) {
		cb({error: new Error(
			// 'Component '+load.optMatch.name+': '+
			err.join(', ')+' not found'
		)});
	} else {
		js.name = load.optMatch.id;
		js.template = html;
		cb({data: js});
	}
}

function getPrefixPaths(optPrefix, match) {
	var prefix = match.prefix;
	var suffix = match.suffix;
	var basePath = optPrefix.basePath || '';
	var extHtml = optPrefix.extHtml || '.html';
	var extJs = optPrefix.extJs || '.js';
	var extCss = optPrefix.extCss || '.css';
	var pathHtml = optPrefix.pathHtml;
	var pathJs = optPrefix.pathJs;
	var pathCss = optPrefix.pathCss;
	var reDash = /--/g;
	var path = suffix.replace(reDash,'/');
	var lastIndex = path.lastIndexOf('/');
	var lastName = path.substr(lastIndex+1);
	var href = basePath+path+'/'+lastName;
	var id = prefix.replace(reDash,'/')+path;
	optPrefix.mapCache = optPrefix.mapCache || {};
	optPrefix.mapLoading = optPrefix.mapLoading || {};
	extend(match, optPrefix);
	match.id = id;
	match.href = href;
	match.path = path;
	match.url = compPathBase(optPrefix.getUrl, match);
	match.pathHtml = compPathResource(pathHtml, match, extHtml);
	match.pathJs   = compPathResource(pathJs  , match, extJs  );
	match.pathCss  = compPathResource(pathCss , match, extCss );
	match.setResult = optPrefix.setResult || compSetResult;
	return match;
}

function prefixLoader(match) {
	var path = match.path;
	var mapCache = match.mapCache;
	var mapLoading = match.mapLoading;
	var isCached = mapCache[path];
	if (isCached) return isCached;
	var isLoading = mapLoading[path];
	if (isLoading) return isLoading;
	var def = deferredPromise(match);
	mapLoading[path] = def.promise;
	match.onLoad = function(load) {
		mapLoading[path] = undefined;
		// console.log('Component prefix load', match, load);
		if (load.error) {
			def.reject(load.error);//, load);
			console.log('/** prefix comp reject **/', load.error);
		} else {
			mapCache[path] = def.promise;
			def.resolve(load.comp.data);//, load);
			console.log('/** prefix comp loaded **/', load.comp.data);
		}
	};
	loadComponent(match);
	return def.promise;
}

module.exports = function prefixMatcher(optPrefix) {
	var prefix = optPrefix.prefix;
	return function(name) {
		var match = testNamePrefix(name, prefix);
		if (match) {
			match = getPrefixPaths(optPrefix, match);
			console.log('/** prefix comp found **/', match.id);
			return function() {
				return prefixLoader(match);
			};
		}
	};
}
