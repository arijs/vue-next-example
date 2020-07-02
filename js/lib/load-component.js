
function loadComponent(opt) {
	//console.log('Component Dynamic: '+id);
	var load = {
		optMatch: opt,
		comp: {
			name: 'comp',
			error: null,
			data: null,
			done: !opt.setResult
		},
		html: {
			name: 'html',
			path: opt.pathHtml,
			error: null,
			data: null,
			resp: null,
			done: !opt.pathHtml,
		},
		js: {
			name: 'js',
			path: opt.pathJs,
			error: null,
			data: null,
			done: !opt.pathJs,
		},
		css: {
			name: 'css',
			path: opt.pathCss,
			error: null,
			done: !opt.pathCss,
		},
		error: null,
		done: false,
		order: []
	};
	// var {html, js, css, comp} = load;
	var html = load.html;
	var js = load.js;
	var css = load.css;
	var comp = load.comp;
	var order = load.order;
	function anyError() {
		var names = [];
		if (comp.error) names.push(comp.name);
		if (html.error) names.push(html.name);
		if (js  .error) names.push(js  .name);
		if (css .error) names.push(css .name);
		if (names.length) {
			load.error = new Error('Component '+opt.name+': Error loading '+names.join(', '));
		}
	}
	function itemLoad() {
		if (load.done) {
			console.warn('loadComponent: done already called', load);
		} else if (html.done && js.done && (css.done || !opt.waitCss)) {
			if (comp.done) {
				anyError();
				load.done = true;
				opt.onLoad(load);
			} else {
				opt.setResult(load, function(compResult) {
					extend(comp, compResult);
					comp.done = true;
					order.push(comp);
					itemLoad();
				});
			}
		}
	}
	loadAjax({
		url: html.path,
		type: loadAjax.types.html,
		cb(resp) {
			html.done = true;
			html.error = resp.error;
			html.data = resp.data;
			html.resp = resp;
			order.push(html);
			itemLoad();
		}
	});
	loadScript(js.path, function(error) {
		js.done = true;
		js.error = error;
		if (!error && opt.getJsData) {
			try {
				js.data = opt.getJsData(opt);
			} catch (e) {
				js.error = e;
			}
		}
		order.push(js);
		itemLoad();
	});
	loadStylesheet(css.path, function(error) {
		css.done = true;
		css.error = error;
		order.push(css);
		itemLoad();
	});
}

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
	js.template = html;
	cb({data: js});
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
	extend(match, optPrefix);
	match.id = id;
	match.href = href;
	match.path = path;
	match.url = compPathBase(optPrefix.getUrl, match);
	match.pathHtml = compPathResource(pathHtml, match, extHtml);
	match.pathJs   = compPathResource(pathJs  , match, extJs  );
	match.pathCss  = compPathResource(pathCss , match, extCss );
	match.setResult = optPrefix.setResult || compSetResult;
	match.mapCache = match.mapCache || {};
	match.mapLoading = match.mapLoading || {};
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
		console.log('Component prefix load', match, load);
		if (load.error) {
			def.reject(load.error, load);
		} else {
			mapCache[path] = def.promise;
			def.resolve(load.comp.data, load);
		}
	};
	loadComponent(match);
	return def.promise;
}

function prefixMatcher(optPrefix) {
	var prefix = optPrefix.prefix;
	return function(name) {
		var match = testNamePrefix(name, prefix);
		if (match) {
			match = getPrefixPaths(optPrefix, match);
			return function() {
				return prefixLoader(match);
			};
		}
	};
}
