!function(global) {

global.docMetaDefault = {
	title: 'Vue Next (v3) example',
	description: 'Project scaffolding template for a Single Page Application using Vue 3 components without any build tool during development'
};

var objStr = {}.toString();
global.getErrorMessage = function(err) {
	if ('string' === typeof err) return err;
	else if ('object' === typeof err) {
		if (err instanceof Object) {
			var errStr = err.toString();
			if (errStr === objStr) return JSON.stringify(err);
			else return errStr;
		}
		else return JSON.stringify(err);
	}
	else return typeof err;
};

global.initUsers = function () {
	var users = global.users;
	if (users) return users;
	global.users = users = {
		lista: Vue.ref(),
		loading: Vue.ref(false),
		error: Vue.ref(),
		getByIndex: function(index) {
			return Vue.computed(function() {
				var lista = users.lista.value;
				return lista instanceof Array ? lista[index] : undefined;
			});
		},
		getAll: function() {
			return Vue.computed(function() {
				return users.lista.value;
			});
		},
		load: function() {
			console.log(' // init users: load init');
			if (users.lista.value instanceof Array) return;
			var initial = global.services.initialState;
			initial = initial && initial.users;
			if (initial) {
				return onLoadUsers(initial);
			} else {
				return users.reload();
			}
		},
		reload: function() {
			console.log(' // init users: reload init');
			users.loading.value = true;
			users.lista.value = undefined;
			users.error.value = undefined;
			var promise = global.services.getUsersLista()
				.then(onLoadUsersSuccess);
			promise.catch(onLoadUsersError);
			return promise;
		}
	};

	return users;

	function onLoadUsers(resp) {
		console.log(' // init users: onLoadUsers init');
		if (resp.error) {
			onLoadUsersError(resp);
			return Promise.reject(resp);
		}
		else if (resp.data) {
			onLoadUsersSuccess(resp);
			return Promise.resolve(resp);
		}
		else {
			resp.error = new Error('User data not found');
			onLoadUsersError(resp);
			return Promise.reject(resp);
		}
	}
	function onLoadUsersSuccess(resp) {
		console.log(' // init users: onLoadUsersSuccess init');
		var data = resp.data;
		users.loading.value = false;
		users.lista.value = data && data.data || [];
	}
	function onLoadUsersError(resp) {
		console.log(' // init users: onLoadUsersError init');
		var error = resp.error;
		console.error('Error when loading users list', error);
		users.loading.value = false;
		users.error.value = error;
	}
};

global.initUsers();

}(_app$);
