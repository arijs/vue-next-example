
function AjaxError(message, xhr, error) {
	this.name = 'AjaxError';
	this.message = message;
	this.xhr = xhr;
	this.error = error;
	this.stack = (new Error()).stack;
}
AjaxError.prototype = new Error;
AjaxError.prototype.constructor = AjaxError;

function loadScript(url, cb) {
	var script = document.createElement('script');
	var head = document.getElementsByTagName('head')[0];
	var done = false;
	script.addEventListener('load', function() {
		if (done) {
			console.log('load script too late: ' + url);
			return;
		}
		done = true;
		cb();
	});
	script.addEventListener('error', function(err) {
		if (done) {
			console.log('error script too late: ' + url);
			return;
		}
		done = true;
		cb(err);
	})
	setTimeout(function() {
		if (done) return;
		cb(new Error('load script timeout: '+url));
	}, 30000);
	script.src = url;
	head.appendChild(script);
}

function loadStylesheet(url, cb) {
	var link = document.createElement('link');
	var head = document.getElementsByTagName('head')[0];
	var done = false;
	link.setAttribute('rel', 'stylesheet');
	link.addEventListener('load', function() {
		if (done) {
			console.log('load stylesheet too late: ' + url);
			return;
		}
		done = true;
		cb();
	});
	link.addEventListener('error', function(err) {
		if (done) {
			console.log('error stylesheet too late: ' + url);
			return;
		}
		done = true;
		cb(err);
	})
	setTimeout(function() {
		if (done) return;
		cb(new Error('load stylesheet timeout: '+url));
	}, 30000);
	link.href = url;
	head.appendChild(link);
}

function getRespType(resp) {
	return resp.req.getResponseHeader("Content-Type");
}

function loadAjaxParseType(resp) {
	var tmap = loadAjax.types;
	var hop = Object.prototype.hasOwnProperty;
	for (var k in tmap) {
		if (hop.call(tmap, k)) {
			var type = tmap[k];
			if (type.test(resp)) {
				type.parse(resp);
				return;
			}
		}
	}
}

function loadAjaxParseExpectType(resp) {
	var type = resp.opt.type;
	if (type) {
		if (type.test(resp)) {
			type.parse(resp);
		} else {
			var tl = type.tl || loadAjaxMessages['error-unexpected-type'];
			resp.errorParse = new AjaxError(tl.title, resp.req, {message: tl.message});
		}
	} else {
		loadAjaxParseType(resp);
	}
}

function loadAjaxParseValidate(resp) {
	var validate = resp.opt.validate;
	if (validate instanceof Function) {
		var err = validate(resp);
		if (err) {
			var tl = loadAjaxMessages['error-validate'];
			if (!err.title) err.title = tl.title;
			if (!err.message) err.message = tl.message;
			resp.errorApp = new AjaxError(err.title, resp.req, err);
		}
	}
}

function loadAjaxParseDefault(resp) {
	loadAjaxParseExpectType(resp);
	loadAjaxParseValidate(resp);
	resp.error = resp.errorApp
		|| resp.errorNet
		|| resp.errorServer
		|| resp.errorParse;
}

function loadAjaxFinish(resp, deferred) {
	var cb = resp.opt.cb;
	if (cb instanceof Function) cb(resp);
	if (resp.error) deferred.reject(resp);
	else deferred.resolve(resp);
}

function loadAjax(opt) {
	var req = new XMLHttpRequest;
	var head = opt.headers;
	var hc = head && head.length || 0;
	var parse = opt.parse || loadAjaxParseDefault;
	var deferred = {};
	var promise = new Promise(function(resolve, reject) {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});
	var resp = {
		loading: true,
		errorNet: null,
		errorParse: null,
		errorServer: null,
		errorApp: null,
		error: null,
		data: null,
		req: req,
		opt: opt,
		promise: promise
	};
	req.addEventListener('load', function() {
		var tl = loadAjaxMessages['error-server'];
		resp.loading = false;
		resp.data = req.responseText;
		if (req.status < 200 || req.status >= 300) {
			var tlVars = {
				code: req.status,
				statusText: req.statusText
			};
			resp.errorServer = new AjaxError(
				printf(tl.title, tlVars),
				req,
				{ message: printf(tl.message, tlVars) }
			);
		}
		Promise.resolve(parse(resp)).then(function() {
			loadAjaxFinish(resp, deferred);
		});
	});
	req.addEventListener('error', function() {
		var tl = loadAjaxMessages['error-net'];
		resp.loading = false;
		resp.errorNet = new AjaxError(tl.title, req, tl);
		Promise.resolve(parse(resp)).then(function() {
			loadAjaxFinish(resp, deferred);
		});
	});
	req.open(opt.method || 'GET', opt.url);
	for (var i = 0; i < hc; i++) {
		var h = head[i];
		h && h.name && req.setRequestHeader(h.name, h.value);
	}
	req.send(opt.body);
	return promise;
};

function loadAjaxRespHeaders(req) {
	req = req.getAllResponseHeaders();
	var mat, rh = /(.*?):\s*(.*)/g, map = {};
	while (mat = rh.exec(hs)) {
		map[mat[1]] = mat[2];
	}
	return map;
}

loadAjax.types = {
	json: {
		test: function(resp) {
			return /^\s*application\/(json|javascript)\b/i.test(getRespType(resp));
		},
		parse: function (resp) {
			try {
				resp.data = JSON.parse(resp.data);
			} catch (e) {
				var tl = loadAjaxMessages['error-parse'];
				var tlVars = {
					error: e.message
				};
				resp.errorParse = new AjaxError(tl.title, resp.req, {message: printf(tl.message, tlVars)});
			}
		}
	},
	html: {
		test: function(resp) {
			return /^\s*text\/html\b/i.test(getRespType(resp));
		},
		parse: nop
	}
};

var loadAjaxMessages = {
	"error-net": {
		"title": "Erro de rede",
		"message": "Não foi possível conectar ao servidor. Por favor verifique sua conexão e tente novamente."
	},
	"error-parse": {
		"title": "Erro",
		"message": "Os dados enviados pelo servidor estão corrompidos"
	},
	"error-server": {
		"title": "Erro HTTP {a:code}",
		"message": "{b:statusText}"
	},
	"error-unexpected-type": {
		"title": "Erro",
		"message": "Os dados enviados pelo servidor não estão no formato esperado"
	},
	"error-validate": {
		"title": "Erro de validação",
		"message": "Os dados enviados pelo servidor são inválidos"
	}
};
