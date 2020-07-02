
function printf(str, vars, mods, cbError, debug) {
	if (debug) debugger;
	return printfFillList(
		printfParse(str),
		dictionary(vars),
		dictionary(mods),
		cbError
	);
}

function printfParse(str) {
	var re = /\{\s*(?:([^{}]+?)(?:\s*\{([^{}]*)\})?\s*:)?\s*([^{}]+?)\s*\}/i;
	var parsed = [], m;
	// while (m = re.exec(str)) {
	while (m = re.exec(str)) {
		if (m.index > 0) parsed.push({text: String(str).substr(0, m.index)});
		m[2] = m[2] && queryParse(m[2]);
		parsed.push({ text: m[0], mod: m[1], params: m[2], key: m[3] });
		str = String(str).substr(m.index + m[0].length);
	}
	if (str.length) parsed.push({text: str});
	return parsed;
}

function printfFillList(list, vars, mods, cbError) {
	var c = list.length;
	var out = '';
	for (var i = 0; i < c; i++) {
		out += printfFill(list[i], vars, mods, cbError);
	}
	return out;
}

function printfFill(parsed, vars, mods, cbError) {
	var key = parsed.key;
	var value = parsed.text;
	if (!(cbError instanceof Function)) {
		cbError = console.log;
	}
	if (key) {
		var mod = parsed.mod, fn;
		if (mod) {
			if (mods.has(mod)) {
				fn = mods.get(mod);
			} else {
				cbError(new Error(
					'printf: Custom formatter '+
					JSON.stringify(mod)+
					' not found in mods'
				));
			}
		}
		if (vars.has(key)) {
			value = vars.get(key);
		} else {
			cbError(new Error(
				'printf: Property '+
				JSON.stringify(key)+
				' not found in vars'
			));
			value = '';
		}
		return fn
			? fn(value, parsed.params, key, vars, mods) || ''
			: value;
	} else {
		return value;
	}
}

function dictionary(dict) {
	var hop = Object.prototype.hasOwnProperty;
	return {
		has: function(key) { return dict ? hop.call(dict, key) : false },
		get: function(key) { return dict ? dict[key] : void 0 }
	};
}

function printfJoin(value, params) {
	value = value instanceof Array
		? value : (value ? [value] : []);
	return value.join(params && params.glue || '');
}

function printfNr(value, params) {
	params || (params = {});
	return ''.concat(
		params.before || '',
		number_format(value, params.dlen, params.dsep, params.gsep, params.glen),
		params.after || ''
	);
}
