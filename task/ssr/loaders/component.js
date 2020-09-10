var {forEach} = require('../../lib/function');
var extend = require('../../lib/extend');
var loadAjax = require('./ajax');
var loadScript = require('./script');
var loadStylesheet = require('./style');

module.exports = function loadComponent(opt) {
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
		// var names = [];
		var list = [];
		forEach([comp, html, js, css], function(item) {
			if (item.error) {
				// names.push(item.name);
				list.push(
					'('+item.name+': '+
					String(item.error.message || item.error)+')'
				);
			}
		});
		// if (comp.error) names.push(comp.name);
		// if (html.error) names.push(html.name);
		// if (js  .error) names.push(js  .name);
		// if (css .error) names.push(css .name);
		if (list.length) {
			load.error = new Error(
				'Component '+opt.name+': '+
				// names.join(', ')+' // '+
				list.join(', ')
			);
		}
	}
	function itemLoad() {
		if (load.done) {
			// console.warn('loadComponent: done already called', load);
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
		// type: loadAjax.types.html,
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
	}, opt.jsCtx);
	loadStylesheet(css.path, function(error, data) {
		css.done = true;
		css.error = error;
		if (!error && opt.onCssData) {
			try {
				opt.onCssData(data, opt);
			} catch (e) {
				js.error = e;
			}
		}
		order.push(css);
		itemLoad();
	});
}
