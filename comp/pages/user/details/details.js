!function(compMap) { compMap['pages/user/details'] = {
	template: null,
	props: ['id'],
	data: function() {
		return {
			users: compMap._users
		};
	}
}; }(AppComp);
