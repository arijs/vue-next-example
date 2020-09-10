var loadScript = require('./script');

module.exports = function loadScriptQueue(queue, cb) {
	var next;
	while (queue.length && !next) {
		next = queue.shift();
	}
	if (next) {
		loadScript(next.url, function(err) {
			var item = this;
			if (next.cb instanceof Function) err = next.cb(err);
			if (err) {
				cb(err, [item]);
			} else {
				loadScriptQueue(queue, function(err, subItems) {
					if (subItems) subItems.unshift(item);
					else subItems = [item];
					cb(err, subItems);
				});
			}
		}, next.ctx);
	} else {
		cb();
	}
}
