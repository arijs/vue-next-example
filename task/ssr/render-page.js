var fs = require('fs');
var SXP = require('@arijs/stream-xml-parser');
var XMLParser = SXP.XMLParser;
var TreeBuilder = SXP.TreeBuilder;
var Printer = SXP.Printer;
// var treeRender = SXP.treeRender;
var elementDefault = SXP.elementDefault;

function getParser(id, elAdapter) {
	elAdapter = elAdapter || elementDefault();
	var tb = new TreeBuilder({
		element: elAdapter
	});
	var xp = new XMLParser(tb.parserEvent.bind(tb));

	return {
		write: xp.write.bind(xp),
		end: xp.end.bind(xp),
		getResult: function(src) {
			var err = tb.errors;
			var childCount = elAdapter.childCount(tb.root.tag);
			var tree = elAdapter.childrenGet(tb.root.tag);
			console.log('Done parsing tree '+id, err, 'Children: '+childCount);
			if (err instanceof Array && 0 === err.length) err = src = null;
			return {
				error: err,
				tree: tree,
				elAdapter: elAdapter,
				source: src
				// builder: tb,
				// parser: xp
			};
		}
	};
}

function parseFile(fpath, parser, cb) {
	var rs = fs.createReadStream(fpath, {
		encoding: 'utf8',
		highWaterMark: 1024
	});
	rs.on('end', function() {
		parser.end();
		cb(parser.getResult());
	});
	rs.on('data', function(data) {
		console.log('readFile data:', data);
		parser.write(data);
	});
	rs.on('error', function(err) {
		cb({error: [err]});
	});
}

function parseString(str, parser) {
	parser.write(str);
	parser.end();
	return parser.getResult(str);
}

function printTree(tree, elAdapter, customPrintTag, level) {
	var printer = new Printer();
	printer.elAdapter = elAdapter;
	if (customPrintTag instanceof Function) {
		var defaultPrintTag = printer.printTag.bind(printer);
		printer.printTag = function(node, level) {
			return customPrintTag(node, level, defaultPrintTag, printer);
		};
	}
	return printer.print(tree, level || 0);
}

module.exports = function renderPage(opt) {
	var parser = getParser('page');
	parseFile(opt.pageFile, parser, function(page) {
		if (page.error) {
			return opt.cb(page.error);
		}
		var repErrors = [];
		page = printTree(page.tree, page.elAdapter, customPrintTag, opt.indentLevel);
		if (!repErrors.length) repErrors = null;
		opt.cb(repErrors, page);
		function customPrintTag(node, level, printTag, printer) {
			var rep = opt.getReplacement(node, page.elAdapter);
			if (rep) {
				parser = getParser('component');
				var repName = rep.name;
				var repIndent = null == rep.indent ? level :
					+rep.indent === rep.indent ? rep.indent :
					rep.indent instanceof Function ? rep.indent(level) :
					level;
				rep = parseString(rep.text, parser);
				if (rep.error) {
					console.error('/*** Error parsing '+repName+' ***/');
					console.error(rep.source);
					repErrors.push({
						name: repName,
						error: rep.error
					});
					// return printTag(node, level);
				}
				rep = printTree(rep.tree, rep.elAdapter, null, repIndent);
				rep =
					printer.printIndent(level) +
					printer.printTagOpen(node) +
					printer.newLine +
					rep +
					printer.printIndent(level) +
					printer.printTagClose(node) +
					printer.newLine;
				return rep;
			} else {
				return printTag(node, level);
			}
		}
	})
};
