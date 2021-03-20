!function(global) { global.Page.map['home-no-router'] = {
	template: null,
	setup: function() {
		var users = global.users;
		var modal = Vue.ref();
		var userId = Vue.ref();
		Vue.watchEffect(function() {
			var el = modal.value;
			if (!el) return;
			var show = userId.value;
			console.log('show modal?', show);
			if (null == show) {
				if (el.close) el.close();
				else el.removeAttribute('open');
			} else {
				if (el.show) el.show();
				else el.setAttribute('open', '');
			}
		});
		users.load();
		global.log(' // page/home: after users.load()', {
			loading: users.loading.value,
			error: users.error.value,
			lista: users.lista.value
		});
		return {
			modal: modal,
			showUserModal: showUserModal,
			closeUserModal: closeUserModal,
			userId: userId,
			usersLoading: users.loading,
			usersError: users.error,
			usersLista: users.getAll(),
			usersLoad: users.reload,
			getErrorMessage: global.getErrorMessage
		};
		function showUserModal(id) {
			userId.value = id;
		}
		function closeUserModal() {
			userId.value = undefined;
		}
	}
}; }(_app$);
