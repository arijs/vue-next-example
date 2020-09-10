!function(global) { global.Page.map['user/details'] = {
	template: null,
	props: ['id'],
	setup: function() {
		return {
			users: global.users,
			usersLoad: global.usersLoad
		};
	}
}; }(_app$);
