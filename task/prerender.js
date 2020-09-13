const path = require('path');
const fs = require('fs');
const { renderRouter } = require('./ssr/router');
const renderPage = require('./ssr/render-page');

renderRouter({
	// route: '/users/1'
	// all settings default
	onRenderString: function(compHtml) {
		console.log('/** vue app HTML rendered **/');
		var nodesRep = [];
		renderPage({
			indentLevel: -1,
			pageFile: path.resolve(__dirname, '../index.html'),
			getReplacement: function(node, elAdapter) {
				var name = elAdapter.nameGet(node);
				console.log('/** test replacement for tag '+name+' **/');
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
					text: compHtml
				};
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
