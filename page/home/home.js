!function(global) { global.Page.map['home'] = {
	template: null,
	setup: function() {
		var router = global.router;
		var users = global.users;
		var modal = Vue.ref();
		var route = VueRouter.useRoute();
		var historyState = Vue.computed(function() {
			return route.fullPath && window.history.state;
		});
		var userId = Vue.computed(function() {
			return route.params.id;
		});
		Vue.watchEffect(function() {
			var el = modal.value;
			if (!el) return;
			var show = historyState.value.bgView;
			console.log('show modal?', show);
			if (show) {
				if (el.show) el.show();
				else el.setAttribute('open', '');
			} else {
				if (el.close) el.close();
				else el.removeAttribute('open');
			}
		});
		return {
			modal: modal,
			historyState: historyState,
			showUserModal: showUserModal,
			closeUserModal: closeUserModal,
			userId: userId,
			users: users,
			usersLoad: global.usersLoad
		};
		function showUserModal(id) {
			// add backgroundView state to the location so we can render a different view from the one
			var bgView = router.currentRoute.value.fullPath;
			router.push({
				name: 'user',
				params: { id: String(id) },
				state: { bgView: bgView }
			});
		}
		function closeUserModal() {
			history.back();
		}
	}
}; }(_app$);
