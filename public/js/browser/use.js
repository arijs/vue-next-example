!function(global) {

global.log = function() {
	return console.log.apply(console, arguments);
};

global.routeFromServer = window.location.pathname;

var pageLoading = Vue.ref(false);
global.pageLoading = pageLoading;

global.loadPageComps = function(comps, pageName) {
	pageLoading.value = true;
	loadCompList(comps, global.resolveUserCompLoader, function(state) {
		// console.log(pageName+' comps loaded', state);
		pageLoading.value = false;
	});
};

global.useDocumentMeta = (function() {
	var base = global.docMetaDefault;
	var metaDesc = document.querySelector('meta[name=description');
	if (!metaDesc) {
		metaDesc = document.createElement('meta');
		metaDesc.setAttribute('name', 'description');
		metaDesc.setAttribute('content', base.description);
		document.querySelector('head').appendChild(metaDesc);
	}
	return function useDocumentMeta(optDoc) {
		function trigger(opt) {
			optDoc = opt;
			document.title = opt && opt.title || base.title;
			metaDesc.setAttribute('content', opt && opt.description || base.description);
			if (!opt) return;
			var pathCurrent = window.location.pathname;
			var pathInitial = global.routeFromServer;
			if (null != pathInitial) {
				if (pathInitial === pathCurrent) {
					console.log('# First page rendered by router from navigation, loaded from server', pathCurrent);
					global.routeFromServer = null; // from here we get it from Router
					global.trackingPageView(pathCurrent, document.title); // send it to datalayer as well
				} else {
					console.error('# First page rendered by router is not the same captured in app initialization', {
						current: pathCurrent,
						initial: pathInitial
					});
					global.trackingPageView(pathCurrent, document.title);
				}
			} else {
				global.trackingPageView(pathCurrent, document.title);
			}
		}
		Vue.onMounted(function() {
			trigger(optDoc);
		});
		Vue.onUnmounted(function() {
			trigger();
		});
		return trigger;
	}
})();

global.trackingPageView = function(path, title) {
	var obj = {
		event: 'customPageView',
		pagePath: path,
		pageTitle: title
	};
	console.log('customPageView', obj);
	// example
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push(obj);
};

global.pointerDrag = pointerDrag;

if ('object' === typeof VueRouter) {
	global.getHistoryState = function() {
		return window.history.state;
	};

	global.routerHistory = VueRouter.createWebHistory('/');

	global.getRouteWithModal = function(router) {
		var historyState = Vue.computed(function() {
			return router.currentRoute.value.fullPath && global.getHistoryState();
		});
		var routeWithModal = Vue.computed(function() {
			var bgView = historyState.value.bgView;
			var rwm;
			if (bgView) {
				rwm = router.resolve(bgView);
			} else {
				rwm = router.currentRoute.value;
			}
			return rwm;
		});
		return routeWithModal;
	};
}

}(_app$);
