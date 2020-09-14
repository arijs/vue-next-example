const path = require('path');
const fs = require('fs');
const { forEach } = require('./lib/function');
const { renderRouter } = require('./ssr/router');
const renderPage = require('./ssr/render-page');
const buildCssLinks = require('./ssr/build-css-links');

function logPath(path) {
	var lp = [];
	forEach(path, function(n) {
		lp.push([n.name, n.attrs.length+'a', n.children.length+'c'].join(' '));
	});
	return lp.join(', ');
}

renderRouter({
	// route: '/users/1'
	// all settings default
	onRenderString: function(comp) {
		console.log('/** vue app HTML rendered **/');
		var nodesRep = [];
		function renderRoot(node, elAdapter) {
			var name = elAdapter.nameGet(node);
			if ('div' !== name) return;
			var hasId = false;
			var attrMap = {};
			elAdapter.attrsEach(node, function(name, value) {
				attrMap[name] = (attrMap[name] || []).concat([value]);
				hasId = hasId || ('id' === name && 'root' === value);
			});
			if (!hasId) return;
			console.log('/** vue app inserted into HTML **/');
			nodesRep.push({
				replaced: 'root',
				nodeName: name,
				attributes: attrMap,
				childCount: elAdapter.childCount(node)
			});
			return {
				name: 'root',
				indent: 0,
				text: comp.html
			};
		}
		function renderCss(node, elAdapter, path) {
			var name = elAdapter.nameGet(node);
			if (
				'head' !== name ||
				1 !== path.length ||
				'html' !== path[0].name
			) return;
			console.log('/** vue css inserted into HTML **/');
			nodesRep.push({
				replaced: 'css',
				nodeName: name,
				childCount: elAdapter.childCount(node)
			});
			return {
				name: 'css',
				mode: 'append',
				tree: buildCssLinks(comp.css, elAdapter)
			};
		}
		renderPage({
			indentLevel: -1,
			pageFile: path.resolve(__dirname, '../index.html'),
			getReplacement: function(node, elAdapter, path) {
				var name = elAdapter.nameGet(node);
				console.log('/** test replacement for tag '+name+' **/', logPath(path));
				return renderRoot(node, elAdapter, path) ||
					renderCss(node, elAdapter, path);
			},
			cb: function(err, page) {
				if (err) {
					console.error('/** Error printing Vue app into page **/');
					var efirst = err.shift();
					console.error(efirst);
					if (err.length) console.error(err);
				}
				console.log('/** Replaced nodes: **/');
				console.log(nodesRep);

				/* @TODO: parse and print more element types: */
				/* <?xml ?> instructions */
				/* <! > declarations */
				/* <!-- --> comments (a subtype of declarations) */
				/* <![CDATA[ ]]> character data (a subtype of declarations) */
				page = '<!DOCTYPE html>\n'+page;

				console.log('/** Fully rendered page **/');
				fs.writeFile(path.resolve(__dirname, '../index-static.html'), page, function(err) {
					if (err) {
						console.error('/** Error saving page to file **/');
						console.error(err);
					} else {
						console.log('/** Page saved to file! **/');
					}
				});
			}
		});
	}
});
