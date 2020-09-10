var loadAjax = require('./ajax');

module.exports = function loadScript(url, cb, ctx, before, after) {
	ctx = ctx || {};
	var ctxKeys = [];
	var ctxValues = [];
	var hop = Object.prototype.hasOwnProperty;
	for (var k in ctx) {
		if (hop.call(ctx, k)) {
			ctxKeys.push(k);
			ctxValues.push(ctx[k]);
		}
	}
	loadAjax({
		url: url,
		cb: function(resp) {
			var {error, data} = resp;
			if (error) return cb.call(resp, error);
			try {
				data = (before || '') + data + (after || '');
				ctxKeys.push(data);
				var fn = Function.apply(undefined, ctxKeys);
				resp.execCtx = ctx;
				resp.execResult = fn.apply(ctx, ctxValues);
			} catch (e) {
				error = e;
				resp.error = e;
			}
			cb.call(resp, error, data);
		}
	});
}
