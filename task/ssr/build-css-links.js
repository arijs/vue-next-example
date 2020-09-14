var {forEach} = require('../lib/function');

function buildLink(item, elAdapter) {
	var link = elAdapter.initName('link');
	var path = String(item.match.pathCss).replace(/^\/*/,'/');
	elAdapter.attrsAdd(link, {name: 'rel', value: 'stylesheet'});
	elAdapter.attrsAdd(link, {name: 'href', value: path });
	return link;
}

module.exports = function buildCssLinks(list, elAdapter) {
	var links = elAdapter.initRoot();
	forEach(list, function(item) {
		elAdapter.childElement(links, buildLink(item, elAdapter));
	});
	return elAdapter.childrenGet(links);
};
