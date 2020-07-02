
var extend = (function() {

var hop = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

function extendCustom(method, sourceProps, target) {
	if (!(method instanceof Function)) {
		method = propertyOverwrite;
	}
	var argc = arguments.length;
	for (var i = 3; i < argc; i++) {
		var source = arguments[i];
		var props = sourceProps || source;
		for (var k in props) {
			if (hop.call(source, k)) {
				method(k, target, source);
			} else if (sourceProps) {
				method(k, target, sourceProps);
			}
		}
	}
	return target;
}

function fnExtendCustom(method, sourceProps) {
	return function extend() {
		var args = slice.call(arguments);
		args.unshift(method, sourceProps);
		return extendCustom.apply(this, args);
	}
}

function fnPropertyExtend(subExtend) {
	propertyExtend.setSubExtend = setSubExtend;
	return propertyExtend;
	function setSubExtend(se) { subExtend = se; }
	function propertyExtend(key, target, source) {
		var sk = source[key];
		var tk = target[key];
		var so = sk && 'object' === typeof sk;
		var to = tk && 'object' === typeof tk;
		var spo = so ? Object.getPrototypeOf(sk) === Object.prototype : false;
		var tpo = to ? Object.getPrototypeOf(tk) === Object.prototype : false;
		if (spo && tpo) {
			subExtend(key, target, source, propertyExtend);
		} else {
			target[key] = sk;
		}
	}
}

function propertyOverwrite(key, target, source) {
	target[key] = source[key];
}
function propertyNewOnly(key, target, source) {
	if (hop.call(target, key)) {
		throw new Error('Objeto já contem uma propriedade '+key+': '+String(target[key]).substr(0, 32));
	}
	target[key] = source[key];
}
function propertyHopOnly(key, target, source) {
	if (hop.call(target, key)) {
		target[key] = source[key];
	}
}
var propertyObjectModify = fnPropertyExtend(function(key, target, source, propertyObjectModify) {
	target[key] = extendCustom(propertyObjectModify, target[key], source[key]);
});
var propertyObjectCreate = fnPropertyExtend(function(key, target, source, propertyObjectCreate) {
	target[key] = extendCustom(propertyObjectCreate, {}, target[key], source[key]);
});

var extend = fnExtendCustom(propertyOverwrite);
var extendNewOnly = fnExtendCustom(propertyNewOnly);
var extendHopOnly = fnExtendCustom(propertyHopOnly);
var extendDeep = fnExtendCustom(propertyObjectModify);
var extendMerge = fnExtendCustom(propertyObjectCreate);

extendNewOnly(extend, {
	newOnly: extendNewOnly,
	hopOnly: extendHopOnly,
	deep: extendDeep,
	merge: extendMerge,
	custom: extendCustom,
	fnExtendCustom: fnExtendCustom,
	fnPropertyExtend: fnPropertyExtend,
	propertyOverwrite: propertyOverwrite,
	propertyNewOnly: propertyNewOnly,
	propertyHopOnly: propertyHopOnly,
	propertyObjectModify: propertyObjectModify,
	propertyObjectCreate: propertyObjectCreate
});

return extend;

})();

function nop(){}

function debounce(fn, wait) {
	function cancel() {
		_iv && clearTimeout(_iv);
		_iv = null;
		waiting = false;
	}
	function fire() {
		waiting = false;
		fn();
	}
	function trigger() {
		cancel();
		waiting = true;
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
	trigger.cancel = cancel;
	trigger.customWait = customWait;
	trigger.isWaiting = isWaiting;
	return trigger;
}

function throttle(fn, wait) {
	function cancel() {
		_iv && clearTimeout(_iv);
		_iv = null;
		waiting = false;
	}
	function fire() {
		waiting = false;
		fn();
	}
	function trigger() {
		if (waiting) return;
		waiting = true;
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
	trigger.cancel = cancel;
	trigger.customWait = customWait;
	trigger.isWaiting = isWaiting;
	return trigger;
}

function callListeners(list, args, context) {
	for (var i = 0, ii = list.length; i < ii; i++) {
		list[i].apply(context, args);
	}
}
