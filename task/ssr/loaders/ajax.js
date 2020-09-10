var fs = require('fs');
var nodePath = require('path');

module.exports = function loadAjax(opt) {
	fs.readFile(
		nodePath.resolve(__dirname, '../../../', opt.url),
		{ encoding: 'utf8' },
		function(err, data) {
			if (opt.json && !err) {
				try {
					data = JSON.parse(data);
				} catch (e) {
					err = e;
				}
			}
			opt.cb({
				error: err,
				data: data
			});
		}
	)
}
