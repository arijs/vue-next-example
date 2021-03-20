!function(global) {

function nop() {}

var pointerDrag = {};
global.pointerDrag = function() {
	return pointerDrag;
};

global.loadPageComps = function() {};


var docMeta;
global.useDocumentMeta = function(dm = {}) {
	var base = global.docMetaDefault;
	dm.title = dm.title || base.title;
	dm.description = dm.description || base.description;
	docMeta = dm;
};

global.getDocMeta = function() { return docMeta; };

if ('object' === typeof VueRouter) {
	var historyState = {};
	global.getHistoryState = function() {
		return historyState;
	};
	global.routerHistory = VueRouter.createMemoryHistory();

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

	global.useHeaderTransparent = function (router, src) {
		var rwm = global.getRouteWithModal(router);
		return Vue.computed(function() {
			var htt = rwm.value.meta.headerTopTransparent;
			return htt;
		});
	};
}

global.initDrag = function() {};

global.useSlides = function() {
	return {
		carFrame: Vue.ref(),
		carList: Vue.ref(),
		carPageWidth: Vue.ref(),
		drag: Vue.ref({
			fnStart: nop,
			fnAnimatePrev: nop,
			fnAnimateNext: nop
		})
	};
};

}(_app$);
