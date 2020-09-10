var loadAjax = require('./ajax');

module.exports = function loadStyle(url, cb) {
	loadAjax({
		url: url,
		cb: function(resp) {
			var {error, data} = resp;
			cb.call(resp, error, data);
		}
	});
};
