var loadAjax = require('./loaders/ajax');

var host = 'api/';

module.exports = {
	getUsers: function(params) {
		loadAjax({
			url: host+'users.json',
			json: true,
			cb: params.cb
		});
	}
};
