!function(global) {

function errorsThatCannotValidate(resp) {
	return resp.errorNet || resp.errorParse;
}

function serviceValidate(resp) {
	if (errorsThatCannotValidate(resp)) return null;
	var data = resp.data;
	var ds = data && data.success;
	var dd = data && data.data;
	var de = data && data.errors;
	var sm = services.messages;
	if (ds) {
		if (!dd && !de) de = sm["response-empty"];
	} else {
		if (!dd && !de) de = sm["response-not-success"];
	}
	return de ? { title: sm["generic-title"], message: de } : null;
}

function serviceValidateEmpty(resp) {
	var data = resp.data;
	var sm = services.messages;
	return data ? null : sm["response-empty"];
}

var services = global.services = {
	messages: {
		"generic-title": "Erro",
		"response-empty": "Resposta vazia do servidor",
		"response-not-success": "A solicitação falhou"
	},
	// host: 'http://localhost:8080/',
	host: '/api/',
	xhrFields: {
		withCredentials: true
	},
	initialState: null,

	getUsersLista: function () {
		return loadAjax({
			url: services.host+'users.json',
			type: loadAjax.types.json,
			xhrFields: services.xhrFields,
			validate: serviceValidate
		});
	}

};

}(_app$);
