!function(global) { global.Page.map['user/details'] = {
	template: null,
	props: ['id'],
	setup: function(props) {
		var users = global.users;
		users.load();
		// global.log(' // page/user/details: after users.load()', {
		// 	loading: users.loading.value,
		// 	error: users.error.value,
		// 	lista: users.lista.value
		// });
		return {
			usersLoading: users.loading,
			usersError: users.error,
			userData: users.getByIndex(props.id),
			usersLoad: users.reload,
			getErrorMessage: global.getErrorMessage
		};
	}
}; }(_app$);
