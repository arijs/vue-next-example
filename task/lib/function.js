
exports.nop = function nop(){}

exports.forEach = function forEach(list, cb, result) {
	var _break = 1 << 0;
	var _remove = 1 << 1;
	var count = list.length;
	var i;
	if (result instanceof Function && !(cb instanceof Function)) {
		result = [result, cb];
		cb = result[0];
		result = result[1];
	}
	var ctx = {
		_break: _break,
		_remove: _remove,
		result: result,
		count: list.length,
		i: 0
	};
	var ret;
	for ( ; ctx.i < ctx.count; ctx.i++ ) {
		ret = cb.call(ctx, list[ctx.i], ctx.i, list);
		if (_remove & ret) {
			list.splice(ctx.i, 1);
			ctx.i--;
			ctx.count--;
		}
		if (_break & ret) {
			break;
		}
	}
	return ctx.result;
}

exports.forEachProperty = function forEachProperty(obj, cb) {
	var _break = 1 << 0;
	var i = 0;
	var ctx = {
		_break: _break
	};
	var ret;
	for ( var k in obj ) {
		if ( !hop.call(obj, k) ) continue;
		ret = cb.call(ctx, obj[k], k, i);
		if (_break & ret) {
			break;
		}
		i++;
	}
}

exports.debounce = function debounce(fn, wait) {
	function cancel() {
		_iv && clearTimeout(_iv);
		_iv = null;
		waiting = false;
	}
	function fire() {
		waiting = false;
		fn.apply(self, args);
	}
	function trigger() {
		cancel();
		waiting = true;
		self = this;
		args = arguments;
		_iv = setTimeout(fire, wait);
	}
	function customWait(wait) {
		cancel();
		waiting = true;
		_iv = setTimeout(fn, wait);
	}
	function isWaiting() {
		return waiting;
	}
	var _iv;
	var waiting = false;
	var self, args;
	trigger.cancel = cancel;
	trigger.customWait = customWait;
	trigger.isWaiting = isWaiting;
	return trigger;
}

exports.throttle = function throttle(fn, wait) {
	function cancel() {
		_iv && clearTimeout(_iv);
		_iv = null;
		waiting = false;
	}
	function fire() {
		waiting = false;
		fn.apply(self, args);
	}
	function trigger() {
		if (waiting) return;
		waiting = true;
		self = this;
		args = arguments;
		_iv = setTimeout(fire, wait);
	}
	function customWait(wait) {
		if (waiting) cancel();
		waiting = true;
		_iv = setTimeout(fire, wait);
	}
	function isWaiting() {
		return waiting;
	}
	var _iv;
	var waiting = false;
	var self, args;
	trigger.cancel = cancel;
	trigger.customWait = customWait;
	trigger.isWaiting = isWaiting;
	return trigger;
}

exports.callListeners = function callListeners(list, args, context) {
	for (var i = 0, ii = list.length; i < ii; i++) {
		list[i].apply(context, args);
	}
}
