
function pointerDrag() {
	var dragItem;
	var listening = false;
	var listeningEl;
	var api = {
		setDragObject: function(obj) {
			dragItem = obj;
		},
		getEventPos: function(ev) {
			var x, y;
			var touch = ev.touches && ev.touches[0]
				|| ev.changedTouches && ev.changedTouches[0];
			if (touch) {
				x = touch.pageX;
				y = touch.pageY;
			} else {
				x = ev.pageX;
				y = ev.pageY;
			}
			return { x: x, y: y };
		},
		dragMove: function (ev) {
			if (dragItem) dragItem.fnMove(api.getEventPos(ev), ev);
		},
		dragEnd: function (ev) {
			if (dragItem) dragItem.fnEnd(api.getEventPos(ev), ev);
			dragItem = void 0;
		},
		listenerAdd: function (el) {
			if (listening) {
				api.listenerRemove(listeningEl);
			}
			listening = true;
			listeningEl = el;
			var dragMove = api.dragMove;
			var dragEnd = api.dragEnd;
			el = el || document.documentElement;
			el.addEventListener('touchmove', dragMove, false);
			el.addEventListener('mousemove', dragMove, false);
			el.addEventListener('touchend', dragEnd, false);
			el.addEventListener('mouseup', dragEnd, false);
		},
		listenerRemove: function() {
			var el = listeningEl;
			listening = false;
			listeningEl = undefined;
			var dragMove = api.dragMove;
			var dragEnd = api.dragEnd;
			el = el || document.documentElement;
			el.removeEventListener('touchmove', dragMove, false);
			el.removeEventListener('mousemove', dragMove, false);
			el.removeEventListener('touchend', dragEnd, false);
			el.removeEventListener('mouseup', dragEnd, false);
		}
	};
	return api;
}

function useDrag(name, apiDrag) {
	// function fnLimit(min, max, val) {
	// 	return Math.max(min, Math.min(max, val));
	// }
	var fnMod = function(i, mod) {
		if (!mod) {
			console.warn('PointerDrag: mod não deveria ser zero');
		}
		return mod ? ((i % mod) + mod) % mod : 0;
	};
	var fnPosMod = function(pos) {
		return fnMod(pos, obj.widthList);
	};
	var fnCalcPosIndex = function(pos) {
		var sum = 0;
		var ipos = fnPosMod(-pos);
		var index, posFrameLeft, posFrameCenter, fCenter;
		forEach(obj.elList, function(el, i) {
			if (!el) {
				console.error('PointerDrag: Reference to elList lost', obj.elList, i);
				return this._break;
			}
			var width = el.offsetWidth;
			var res = sum + width;
			if (sum <= ipos && ipos < res) {
				index = i;
				fCenter = 0.5 * width;
				posFrameLeft = ipos - sum;
				posFrameCenter = fCenter - posFrameLeft;
				return this._break;
			}
			sum = res;
		});
		return {
			frameCenter: fCenter,
			index: index,
			posFrameLeft: posFrameLeft,
			posFrameCenter: posFrameCenter,
			posLeft: sum,
			posCenter: sum + fCenter
		};
	};
	var fnPosLog = throttle(function(calc, obj) {
		console.log('fnPos', calc, obj);
	}, 500);
	var fnCalcPosFrame = function(inputPos) {
		var pos = fnPosMod(inputPos);
		var fcalc = fnCalcPosIndex(pos);
		var findex = fcalc.index;
		if (null == findex) {
			console.error('PointerDrag: index could not be found', fcalc);
			return;
		}
		// var fpLeft = fcalc.posFrameLeft;
		var fpCenter = fcalc.posFrameCenter;
		var vwCenter = obj.elFrame.offsetWidth * 0.5;
		var elist = obj.elList;
		var flist = obj.frames;
		var fcount = flist.length;
		var fcenter = flist[findex];
		var elCenter = elist[findex];
		var left = [];
		var right = [];
		var leftCount = 0;
		var rightCount = 0;
		var leftSum = 0;
		var rightSum = 0;
		var i, f, el, fc, so;
		var sideGet = [];
		var centerPos = fpCenter - vwCenter;
		var frames = [{
			center: centerPos,
			el: elCenter,
			frame: fcenter,
			index: findex
		}];
		var firstIndex = findex;
		var lastIndex = findex;
		// elCenter.style.left = centerPos+'px';
		for (;;) {
			if (fcount <= leftCount + rightCount + 1) break;
			if (leftSum <= rightSum) {
				i = fnMod(findex - 1 - leftCount, fcount);
				f = flist[i];
				el = elist[i];
				leftSum += f.prev;
				fc = centerPos-leftSum;
				left.unshift(so = {
					center: fc,
					el: el,
					frame: f,
					index: i,
					leftSum: leftSum
				});
				frames.unshift(so);
				// el.style.left = fc+'px';
				sideGet.push({
					index: i,
					side: 'left',
					count: leftCount,
					from: findex,
					obj: so
				});
				firstIndex = i;
				leftCount++;
			} else {
				i = fnMod(findex + 1 + rightCount, fcount);
				f = flist[i];
				el = elist[i];
				rightSum += f.next;
				fc = centerPos+rightSum;
				right.push(so = {
					center: fc,
					el: el,
					frame: f,
					index: i,
					rightSum: rightSum
				});
				frames.push(so);
				// el.style.left = fc+'px';
				sideGet.push({
					index: i,
					side: 'right',
					count: rightCount,
					from: findex,
					obj: so
				});
				lastIndex = i;
				rightCount++;
			}
		}
		return {
			calc: fcalc,
			center: {
				el: elCenter,
				frame: fcenter
			},
			centerIndex: findex,
			centerIndexFirst: firstIndex,
			centerIndexLast: lastIndex,
			centerPos: vwCenter-fpCenter,
			frames: frames,
			left: left,
			leftCount: leftCount,
			leftSum: leftSum,
			posInput: inputPos,
			posOutput: pos,
			right: right,
			rightCount: rightCount,
			rightSum: rightSum,
			sideGet: sideGet,
			viewCenter: vwCenter
		};
	};
	var fnPosClosestFrame = function(pos) {
		var sorted = pos.frames.slice().sort(function(a, b) {
			return Math.abs(a.center) - Math.abs(b.center);
		});
		return sorted;
	};
	var fnPosRoundFrame = function(pos, returnInfo) {
		var target = fnCalcPosFrame(pos);
		var sorted = fnPosClosestFrame(target);
		var targetPos = target.posOutput - sorted[0].center;
		return returnInfo
			? {
				target: target,
				sorted: sorted,
				pos: targetPos
			}
			: targetPos;
	};
	var fnAnimateToPos = function(targetPos, resetTime) {
		var pos = obj.pos;
		if (targetPos === pos) return;
		var stop = false;
		var time = 750;
		fnAutoStop();
		fnAnimStop();
		fnAnimStop = function() { stop = true; };
		animate(pos, targetPos, time, easing.cubic, easing.out, function(val, pos) {
			if (!stop) fnPos(val);
			var last = pos >= time || stop;
			if (last) fnAutoReset(resetTime);
			return last;
		});
	};
	var fnAnimatePrev = function() {
		var frameCurrent = obj.frames[obj.frameIndex];
		var target = obj.pos + frameCurrent.prev;
		fnAnimateToPos(target, true);
	};
	var fnAnimateNext = function() {
		var frameCurrent = obj.frames[obj.frameIndex];
		var target = obj.pos - frameCurrent.next;
		fnAnimateToPos(target, true);
	};
	var fnPosApply = function(pos) {
		var flist = pos.frames;
		var fc = flist.length;
		obj.pos = pos.posOutput;
		obj.frameIndex = pos.centerIndex;
		for (var i = 0; i < fc; i++) {
			var fi = flist[i];
			fi.el.style.left = fi.center+'px';
		}
	};
	var fnPos = function(srcPos) {
		if (!obj.elFrame.parentNode) {
			if (obj.fnGetElements instanceof Function) {
				obj.fnGetElements();
			}
		}
		if (!obj.elFrame.parentNode) {
			console.warn('PointerDrag: elFrame is removed from dom');
		}
		var pos = fnCalcPosFrame(srcPos);
		if (!pos) {
			console.error('PointerDrag: pos could not be found', srcPos, obj);
			return;
		}
		fnPosApply(pos);
		if (obj.debug) fnPosLog(pos);
	};
	var fnInit = function(elFrame, elList, elPageWidth, inputPos, debug, fnGetElements) {
		obj.debug = Boolean(debug);
		obj.pos = fnPosMod(inputPos || 0);
		obj.fnGetElements = fnGetElements;
		fnResize(elFrame, elList, elPageWidth, inputPos);
	};
	var fnResize = function(elFrame, elList, elPageWidth, inputPos) {
		fnAnimStop();
		fnAutoReset();
		var resize = fnCalcFrameLengths(elFrame, elList, elPageWidth);
		var posRound = fnPosRoundFrame(obj.pos, true);
		if (obj.debug) {
			console.log('pointerDrag::resize - result', {
				frames: obj.frames,
				index: obj.frameIndex,
				inputPos: inputPos,
				pos: obj.pos,
				posRound: posRound,
				widthFrame: obj.widthFrame,
				widthFramePage: obj.widthFramePage,
				widthList: obj.widthList,
				resize: resize
			});
		}
		fnPos(posRound.pos);
	};
	var fnCalcFrameLengths = function(elFrame, elList, elPageWidth, usePos) {
		var index = -1;
		var wf = elFrame.offsetWidth;
		var wl = forEach(elList, 0, function(el) {
			this.result += el.offsetWidth;
		});
		var fcount = elList.length;
		var frames = [];
		var left = [];
		var leftSum = 0;
		var right = [];
		var rightSum = 0;
		var pos = obj.pos;
		var posFrameLeft, posFrameCenter;
		var ws = forEach(elList, 0, function(el, i) {
			var sum = this.result;
			var width = el.offsetWidth;
			var res = sum + width;
			var l2, ls, r1, rs;
			// l1 = width;
			l2 = elList[(i+1)%fcount].offsetWidth;
			ls = (width + l2) * 0.5;
			r1 = elList[(fcount+i-1)%fcount].offsetWidth;
			// r2 = width;
			rs = (r1 + width) * 0.5;
			if (usePos) {
				if (res <= pos) {
					left.push([ls, [width*0.5, width], [l2*0.5, l2]]);
					leftSum += ls;
				} else if (sum <= pos && pos < res) {
					index = i;
					posFrameLeft = pos - sum;
					posFrameCenter = posFrameLeft - 0.5 * width;
				} else if (pos < sum) {
					right.push([rs, [r1*0.5, r1], [width*0.5, width]]);
					rightSum += rs;
				}
			}
			frames.push({
				width: width,
				widthNext: l2,
				widthPrev: r1,
				next: ls,
				prev: rs
			});
			this.result = res;
		});
		obj.widthFrame = wf;
		obj.widthList = wl;
		obj.widthFramePage = elPageWidth.offsetWidth;
		obj.frames = frames;
		obj.frameIndex = index;
		obj.elFrame = elFrame;
		obj.elList = elList;
		return {
			left: left,
			leftSum: leftSum,
			right: right,
			rightSum: rightSum,
			widthSum: ws,
			posFrameLeft: posFrameLeft,
			posFrameCenter: posFrameCenter,
		};
	};
	var fnStart = function(ev, elFrame, elList) {
		fnAnimStop();
		fnAutoStop();
		obj.timeStart = new Date();
		ev = apiDrag.getEventPos(ev);
		obj.active = true;
		obj.start = ev.x;
		obj.posStart = obj.pos;
		obj.widthFrame = elFrame.offsetWidth;
		// obj.pos = elList.offsetLeft;
		// obj.widthList = elList.offsetWidth;
		obj.widthList = forEach(elList, 0, function(el) {
			this.result += el.offsetWidth;
		});
		obj.elList = elList;
		apiDrag.setDragObject(dragObject);
		apiDrag.listenerAdd();
	};
	var fnMove = function(ev) {
		if (!obj.active) return;
		var p = ev.x - obj.start;
		obj.lastPos = p;
		fnPos(obj.posStart + p);
	};
	var fnEnd = function() {
		obj.active = false;
		obj.timeEnd = new Date();
		obj.timeDuration = obj.timeEnd.getTime() - obj.timeStart.getTime();
		var wf = obj.widthFrame;
		var wfp = obj.widthFramePage;
		var move = obj.lastPos;
		var rmove = move / wf;
		var tmove = rmove;
		var msign = tmove < 0 ? -1 : +1;
		tmove *= msign;
		var mmod = tmove * wf / wfp;
		var amove = (0.125 <= mmod && mmod < 0.75) ? 0.5*msign : 0;
		tmove *= msign;
		tmove += amove;
		var pos = obj.pos;
		var posMove = amove * wf;
		var posTarget = pos + posMove;
		var posRound = fnPosRoundFrame(posTarget, true);
		if (obj.debug) {
			console.log('pointerDrag::fnEnd move:', move, rmove, amove, tmove, tmove*wf, mmod, '/', wf, wfp, '/', pos, posMove, posTarget, posRound);
		}
		apiDrag.listenerRemove();
		fnAnimateToPos(posRound.pos);
	};
	var fnAutoSlide = function(timeWait, timeAnim, timeManual) {
		var _iv;
		var auto = {
			reset: reset,
			stop: function() { fnAutoStop(); }
		};
		obj.autoSlide = auto;
		fnAutoStop();
		fnAutoStop = clear;
		fnAutoReset = reset;
		return auto;
		function clear() {
			_iv && clearTimeout(_iv);
		}
		function reset(time) {
			fnAutoStop();
			clear();
			if (true === time) time = timeManual;
			if (null == time || +time !== time) time = timeWait;
			if (time > 0) {
				_iv = setTimeout(next, time);
			}
		}
		function next() {
			var pos = obj.pos;
			var target = pos - obj.frames[obj.frameIndex].next;
			var sigStop = false;
			fnAutoStop();
			fnAutoStop = function() { sigStop = true; clear(); };
			animate(pos, target, timeAnim, easing.cubic, easing.out, function(val, pos) {
				if (!sigStop) fnPos(val);
				var last = pos >= timeAnim;
				if (last) reset();
				return last || sigStop;
			});
		}
	};
	var fnAnimStop = function(){};
	var fnAutoStop = function(){};
	var fnAutoReset = function(){};
	var obj = {
		debug: false,
		active: false,
		start: 0,
		startIndex: 0,
		posStart: 0,
		pos: 0,
		posSel: 0,
		widthFrame: 1,
		widthList: 1,
		widthFramePage: 1,
		elFrame: null,
		elList: null,
		frames: null,
		frameIndex: null,
		posFrameLeft: null,
		posFrameCenter: null,
		timeStart: null,
		timeEnd: null,
		timeDuration: null,
		autoSlide: null
	};
	var dragObject = {
		fnMove: fnMove,
		fnEnd: fnEnd
	};
	return {
		fnStart: fnStart,
		fnInit: fnInit,
		fnInitialized: function() {
			return Boolean(obj.elFrame);
		},
		fnResize: fnResize,
		fnAutoSlide: fnAutoSlide,
		fnAnimatePrev: fnAnimatePrev,
		fnAnimateNext: fnAnimateNext
	};
}

function makeDragCallFn(name, apiDrag, fnMove, fnGetStart) {
	// function fnLimit(min, max, val) {
	// 	return Math.max(min, Math.min(max, val));
	// }
	return {
		active: false,
		xstart: 0,
		xposStart: 0,
		xpos: 0,
		xmoveStart: 0,
		xmoveLast: 0,
		// xposSel: 0,
		ystart: 0,
		yposStart: 0,
		ypos: 0,
		ymoveStart: 0,
		ymoveLast: 0,
		// yposSel: 0,
		el: null,
		refStart: null,
		timeStart: null,
		timeEnd: null,
		timeDuration: null,
		fnPos: function(xpos, ypos) {
			this.xpos = xpos;
			this.ypos = ypos;
			fnMove.call(this);
		},
		fnStart: function(ev, el) {
			this.timeStart = new Date();
			ev = apiDrag.getEventPos(ev);
			this.active = true;
			this.xstart = ev.x;
			this.ystart = ev.y;
			this.xposStart = this.xpos;
			this.yposStart = this.ypos;
			this.el = el;
			var start = fnGetStart instanceof Function
				? fnGetStart.call(this, ev, el)
				: [0, 0];
			this.xpos = start[0];
			this.ypos = start[1];
			this.xmoveLast = 0;
			this.ymoveLast = 0;
			this.xmoveStart = 0;
			this.ymoveStart = 0;
			this.refStart = start.slice(2);
			// this.pos = elList.offsetLeft;
			apiDrag.setDragObject(this);
		},
		fnMove: function(ev) {
			if (!this.active) return;
			var px = ev.x - this.xstart;
			var py = ev.y - this.ystart;
			this.xmoveLast = px - this.xmoveStart;
			this.ymoveLast = py - this.ymoveStart;
			this.xmoveStart = px;
			this.ymoveStart = py;
			this.fnPos(this.xposStart + px, this.yposStart + py);
		},
		fnEnd: function(ev) {
			this.active = false;
		}
	};
}
