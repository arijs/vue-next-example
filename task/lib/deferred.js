var {callListeners} = require('./function');

exports.deferred = deferred;
function deferred(ref) {
	var listeners = [];
	var ctx, args;
	var obj = {
		ref: ref,
		then: then,
		done: done,
		nevermind: nevermind,
		clear: clear
	};
	return obj;
	function then(fn) {
		if (args) {
			fn.apply(ctx, args);
		} else {
			listeners.push(fn);
		}
		return obj;
	}
	function done() {
		ctx = this;
		args = arguments;
		callListeners(listeners, args, ctx);
		listeners = null;
		return obj;
	}
	function nevermind(fn) {
		var i = 0, c = listeners.length;
		for (;i<c;i++) {
			if (listeners[i] === fn) {
				listeners.splice(i, 1);
				return i;
			}
		}
		return -1;
	}
	function clear() {
		listeners = [];
		ctx = args = void 0;
		return obj;
	}
}

exports.deferredPromise = deferredPromise;
function deferredPromise(ref) {
	var success = deferred(ref);
	var failure = deferred(ref);
	var promise = {
		then: function() {
			success.then.apply(this, arguments);
			return promise;
		},
		catch: function() {
			failure.then.apply(this, arguments);
			return promise;
		},
		unthen: success.nevermind,
		uncatch: failure.nevermind
	}
	return {
		resolve: success.done,
		reject: failure.done,
		promise: promise,
		success: success,
		failure: failure,
		clear: clear
	};
	function clear() {
		success.clear();
		failure.clear();
	}
}
