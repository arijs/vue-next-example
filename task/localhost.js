/*eslint no-console:0*/

var path = require('path');
var express = require('express');

var app = express();

var port = process.argv[2] || 8070;
var pathStatic = path.resolve(__dirname, '../public');
var pathFallback = '/';

app.use(express.static(pathStatic));

if (pathFallback) {
	app.use(function(req, res, next) {
		req.url = pathFallback;
		// next();
		app.handle(req, res, next);
	});
}

app.listen(port, function() {
	console.log('Server running on port ' + port);
});
