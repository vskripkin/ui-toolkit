(function ($, _, undefined)
{
	'use strict';

	_.isNode = function (obj)
	{
		return obj && typeof obj.nodeType === 'number' && typeof obj.nodeName === 'string';
	};
	_.isNumeric = function (value)
	{
		return !_.isString(value) && _.isFinite(value);
	};
	_.isInteger = function(value)
	{
		return _.isNumeric(value) && Math.floor(value) === value;
	};

	_.randomStr = function ()
	{
		return '_' + parseInt((Math.random() * 1e8).toString().replace('.','')).toString(36);
	};
	_.decodeHtml = function (html)
	{
		var txt = document.createElement('textarea');
			txt.innerHTML = html;

		return txt.value;
	};
	_.unduplicate = function (text)
	{
		//     _.isString(text) && text.replace(/(\S+)(?=.*\1)/g, '');
		return _.isString(text) && text.replace(/(\b\w+\b)(?=.*\b\1\b)/g, '');
	};
	_.cleanStr = function (text)
	{
		return _.isString(text) && _.unduplicate(text).replace(/\s{2,}/g, ' ').trim();
	};

	Element.prototype._jQ = function ()
	{
		return this.__jQ || (this.__jQ = $(this));
	};

	/* to define window is active */
	(function(_)
	{
		_.isWindowHidden = false;

		var aWhenVisible = [],
			aWhenHidden  = [],
			_runCallbacks = function (_aCallbacks)
			{
				while (_aCallbacks.length)
				{
					var fCallback = _aCallbacks.shift();

					fCallback.onWinVisChange.waiting = false;
					fCallback.onWinVisChange = null;

					if (_.isFunction(fCallback))
					{
						fCallback();
					}
				}
			},
			_onCallback  = function (_fCallback, _aCallbacks)
			{
				_aCallbacks.push(_fCallback);
				_fCallback.onWinVisChange = {
					waiting: true,
					f: _fCallback
				};

				return _fCallback.onWinVisChange;
			},
			_offCallback = function (_fCallback, _aCallbacks)
			{
				var i = _aCallbacks.indexOf(_fCallback);

				if (i > -1)
				{
					_aCallbacks.splice(i, 1);

					_fCallback.onWinVisChange.waiting = false;
					_fCallback.onWinVisChange = null;
				}

				return true;
			};

		_.onWindowVisible = function (_fCallback)
		{
			return  _onCallback(_fCallback, aWhenVisible);
		};
		_.offWindowVisible = function (_fCallback)
		{
			return _offCallback(_fCallback, aWhenVisible);
		};

		_.onWindowHidden = function (_fCallback)
		{
			return  _onCallback(_fCallback, aWhenHidden);
		};
		_.offWindowHidden = function (_fCallback)
		{
			return _offCallback(_fCallback, aWhenHidden);
		};

		var hidden = 'hidden',
			onChange = function (e)
			{
				var eMap = {
					focus: false,
					focusin: false,
					pageshow: false,
					blur: true,
					focusout: true,
					pagehide: true
				};

				e = e || window.event;

				if (e.type in eMap)
				{
					_.isWindowHidden = eMap[e.type];
				}
				else
				{
					_.isWindowHidden = this[hidden];
				}

				if (_.isWindowHidden)
				{
					_runCallbacks(aWhenHidden);
				}
				else
				{
					_runCallbacks(aWhenVisible);
				}
			};

		// Standards:
		if (hidden in document) document.addEventListener('visibilitychange', onChange);
		else if ((hidden = 'mozHidden') in document) document.addEventListener('mozvisibilitychange', onChange);
		else if ((hidden = 'webkitHidden') in document) document.addEventListener('webkitvisibilitychange', onChange);
		else if ((hidden = 'msHidden') in document) document.addEventListener('msvisibilitychange', onChange);
		// IE 9 and lower:
		else if ('onfocusin' in document) document.onfocusin = document.onfocusout = onChange;
		// All others:
		else window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onChange;
	})(_);

	/* to define device is mobile */
	(function (_)
	{
		var sUserAgent = window.navigator.userAgent || window.navigator.vendor || window.opera,
			isIOS = /iPhone|iPad|iPod/i.test(sUserAgent),
			isAndroid = /Android/i.test(sUserAgent),
			isMobile = /webOS|BlackBerry|IEMobile|Opera Mini/i.test(sUserAgent);

		_.isMobile = isIOS || isAndroid || isMobile;
		_.isAndroid = isAndroid;
		_.isIOS = isIOS;
	})(_);

	/* to define width of scrollbar */
	(function ()
	{
		_.globalScrollbar = {
			prop: 'margin',
			side: 'right',

			_hidden: false,
			_width: 0,
			_prevOverflow: '',
			_prevMargin: '',

			_num: 0,

			hide: function (_fCallback)
			{
				this._num++;

				if (this._hidden)
				{
					return false;
				}

				this._hidden = true;

				var nHTML = document.documentElement,
					sProp = this.prop ? (this.prop + '-') : '';

				this._prevOverflow = nHTML.style.overflow;
				this._prevMargin = nHTML.style[sProp + this.side];

				nHTML.style.overflow = 'hidden';
				nHTML.style[sProp + this.side] = this._width + 'px';

				if (_.isFunction(_fCallback))
				{
					_fCallback(this._width, this.side, this.prop);
				}
				else
				{
					var anNeedOffset = document.querySelectorAll('.js-scrollbar-offset');

					_.forEach(anNeedOffset, function (_nElem)
					{
						var sDataProp = _nElem.getAttribute('data-offset-prop');

						if (sDataProp === 'true')
						{
							_nElem.style[this.side] = this._width + 'px';
						}
						else if (sDataProp)
						{
							_nElem.style[sDataProp + '-' + this.side] = this._width + 'px';
						}
						else
						{
							_nElem.style[sProp + this.side] = this._width + 'px';
						}
					},
					this);
				}
			},
			restore: function (_fCallback, _bRightNow)
			{
				this._num--;

				if (!this._hidden || (this._num > 0 && !_bRightNow))
				{
					return false;
				}

				var sProp = this.prop ? (this.prop + '-') : '';

				this._hidden = false;

				document.documentElement.style.overflow = this._prevOverflow;
				document.documentElement.style[sProp + this.side] = this._prevMargin;

				this._prevOverflow = '';
				this._prevMargin = '';

				if (_.isFunction(_fCallback))
				{
					_fCallback(this._width, this.side, this.prop);
				}
				else
				{
					var anNeedOffset = document.querySelectorAll('.js-scrollbar-offset');

					_.forEach(anNeedOffset, function (_nElem)
					{
						var sDataProp = _nElem.getAttribute('data-offset-prop');

						if (sDataProp === 'true')
						{
							_nElem.style[this.side] = '';
						}
						else if (sDataProp)
						{
							_nElem.style[sDataProp + '-' + this.side] = '';
						}
						else
						{
							_nElem.style[sProp + this.side] = '';
						}
					},
					this);
				}
			},

			_set: function (_nFiredImg, _ID)
			{
				var that = this;

				setTimeout(function ()
				{
					that.set(_nFiredImg, _ID);
				}, 0);
			},
			set: function (_nFiredImg, _ID, _sRun, _fCallback)
			{
				var nWrp =  _nFiredImg.parentElement ||
							_nFiredImg.parentNode ||
							document.getElementById(_ID) ||
							document.querySelector('#' + _ID) ||
							window[_ID],
					nWrpParent = nWrp &&
								(nWrp.parentElement ||
								 nWrp.parentNode);

				if (!nWrp || !nWrp.offsetWidth)
				{
					this.__hide = this.hide;
					this.hide = this.set.bind(this, _nFiredImg, _ID, 'hide');
					return;
				}

				var nInr =  nWrp.firstElementChild ||
							nWrp.firstChild ||
							nWrp.children.item(0);

				this._width = nWrp.offsetWidth - nInr.offsetWidth;
				this.side = document.documentElement.getAttribute('dir') === 'rtl' ? 'left' : 'right';

				if (this.__hide)
				{
					this.hide = this.__hide;
					this.__hide = null;

					if (_sRun === 'hide')
					{
						this.hide(_fCallback);
					}
				}

				if (nWrpParent)
				{
					nWrpParent.removeChild(nWrp);
				}
				else
				{
					nWrp.outerHTML = '';
				}

				nWrp = nWrpParent = nInr = _nFiredImg = null;
			}
		};

		(function ()
		{
			var ID = _.randomStr(),
				STYLE_WRP = 'position: absolute !important;' + 
							'top: -100px !important;'  + 
							'left: -100px !important;' + 
							'width: 100px !important;' + 
							'height: 50px !important;' + 
							'overflow: scroll !important;',
				STYLE_INR = 'display: block !important;' + 
							'width: 100% !important;' + 
							'height: 20px !important;',
				STYLE_IMG = 'position: absolute !important;' + 
							'top: -1px;' + 
							'left: -1px;',
				IMG_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

			document.write(
				'<div id="' + ID + '" style="' + STYLE_WRP +'">' + 
					'<div style="' + STYLE_INR +'"></div>' + 
					'<img src="' + IMG_SRC +'" onload="_.globalScrollbar._set(this, \'' + ID + '\')" style="' + STYLE_IMG + '" />' + 
				'</div>');
		})();
	})();

	/* to define browser prefix */
	(function ()
	{
		var cssStyleDeclerationToArray = function (_oStyles)
			{
				var Arr;

				try
				{
					Arr = Array.prototype.slice.call(_oStyles);
				}
				catch (e)
				{
					Arr = [];

					for (var i = 0, L = _oStyles.length; i < L; i++)
					{
						Arr.push(_oStyles.item(i));
					}
				}

				return Arr;
			},

			oStyles = window.getComputedStyle(document.documentElement, '') ||
					  window.getComputedStyle(document.createElement('div'), ''),
			sPre = (
				cssStyleDeclerationToArray(oStyles).join('').match(/-(moz|ms|webkit)-/) ||
				(oStyles.OLink === '' && ['', 'o']) ||
				(oStyles.cssText || '').match(/-(moz|ms|webkit)-/) ||
				Object.keys(oStyles).join(',').match(/,(moz|ms|webkit)(?=[A-Z])/) ||
				['', '']
			)[1],
			sDom = ('Webkit|Moz|ms|O').match(new RegExp('(' + sPre + ')', 'i'))[1];

		_.prefix =  {
			dom: sDom,
			css: sPre ? '-' + sPre + '-' : sPre,
			js: sPre,
			lowercase: sPre
		};
	})();

	/* colored console logging */
	(function ()
	{
		var Console = window.console || {},
			OriginalLog = 'log' in Console ? Console.log : function () {},
			OriginalTrace = 'trace' in Console ? Console.trace : OriginalLog,
			OriginalGroupCollapsed = 'groupCollapsed' in Console ? Console.groupCollapsed : OriginalLog,
			OriginalGroupEnd = 'groupEnd' in Console ? Console.groupEnd : function (){};

		/**
		 * Example input:
		 *	{
		 *		action: {
		 *			css: ['color: #247EB2; background: #F1F1F1; font-weight: bold; text-transform: uppercase;',
		 *				  'color: #247EB2; background: #F1F1F1;'],
		 *			build: function (_aMessages)
		 *			{
		 *				return ['%c[%s]%c %s', this.css[0], _aMessages.shift(), this.css[1]].concat(_aMessages);
		 *			}
		 *		}
		 *	}
		 */
		_.console = function (_oRequests, _options)
		{
			var that = this,
				sName;

			this.debug(_options.debug);

			for (sName in _oRequests)
			{
				(function (_sName, _oParam)
				{
					that[_sName] = function ()
					{
						var aMessages = Array.prototype.slice.call(arguments),
							aArguments = that[_sName].build(aMessages);

						return this.build(aArguments, that[_sName].trace);
					};

					that[_sName].build = _oParam.build;
					that[_sName].css = _oParam.css;
					that[_sName].trace = _oParam.trace;

				})(sName, _oRequests[sName]);
			}

			return this;
		};

		_.console.prototype = {
			_debug: true,

			log: function ()
			{
				if (!this._debug)
				{
					return function (){};
				}

				var aMessages = Array.prototype.slice.call(arguments);

				aMessages.unshift(Console);

				return Function.prototype.bind.apply(OriginalLog, aMessages);
			},
			error: function ()
			{
				if (!this._debug)
				{
					return function (){};
				}

				var aMessages = Array.prototype.slice.call(arguments);

				aMessages.unshift(Console);

				return Function.prototype.bind.apply(Console.error, aMessages);
			},
			warn: function ()
			{
				if (!this._debug)
				{
					return function (){};
				}

				var aMessages = Array.prototype.slice.call(arguments);

				aMessages.unshift(Console);

				return Function.prototype.bind.apply(Console.warn, aMessages);
			},

			build: function (_aArguments, _bTrace)
			{
				if (!this._debug)
				{
					return function (){};
				}

				_aArguments.unshift(Console);

				if (_bTrace)
				{
					return function ()
					{
						Function.prototype.bind.apply(OriginalGroupCollapsed, _aArguments)();
						OriginalTrace.call(Console, 'stack');
						OriginalGroupEnd.call(Console);
					};
				}

				return Function.prototype.bind.apply(OriginalLog, _aArguments);
			},

			debug: function (_bOn)
			{
				if (_bOn)
				{
					this._debug = true;
				}
				else
				{
					this._debug = false;
				}
			}
		};
	})();

	/* run callback if event was fired not on descendants */
	(function ()
	{
		var jWindow = $(window),
			oElemEventIDs = {},
			oAllEvents = {},

			eventHandler = function (e)
			{
				var sEventID = e.handleObj.namespace;

				if (!sEventID)
				{
					return false;
				}

				var nTarget = e.target,
					oEvent = oAllEvents[sEventID],
					nElem = oEvent && oEvent.elem;

				if (nElem && nElem !== nTarget && !nElem.contains(nTarget))
				{
					_.offOthers(oEvent)

					if (nElem.offsetParent !== null)
					{
						oEvent.callback(e);
					}
				}
			},

			offOthersEvent = function (_oEvent, _sElemID, _aElemEvents)
			{
				var sEventID = _oEvent.id,
					sElemID = _sElemID || _oEvent.elem.getAttribute('data-js-id'),
					aElemEvents = _aElemEvents || oElemEventIDs[sElemID],
					index = aElemEvents.indexOf(sEventID);

				aElemEvents.splice(index, 1);
				delete oAllEvents[sEventID];

				jWindow.off(_oEvent.name + '.' + sEventID);

				return true;
			};

		_.onOthers = function (_sEvents, _nElem, _fCallback)
		{
			if (!_.isString(_sEvents) || !_.isElement(_nElem) || !_.isFunction(_fCallback))
			{
				return false;
			}

			var sElemID = _nElem.getAttribute('data-js-id'),
				aElemEventIDs = oElemEventIDs[sElemID],
				oEventsMap = {};

			if (!_.isUndefined(aElemEventIDs))
			{
				var sEventID, oEvent, i, L;

				for (i = 0, L = aElemEventIDs.length; i < L; i++)
				{
					sEventID = aElemEventIDs[i];
					oEvent = oAllEvents[sEventID];

					if (_sEvents.indexOf(oEvent.name) > -1 && oEvent.callback === _fCallback)
					{
						_sEvents = _sEvents.replace(new RegExp('(' + oEvent.name + ')', 'g'), '');
					}
				}
			}

			_sEvents = _.cleanStr(_sEvents);

			if (_sEvents.length === 0)
			{
				return false;
			}

			if (!sElemID)
			{
				sElemID = _.randomStr();
				_nElem.setAttribute('data-js-id', sElemID);
			}

			if (!(aElemEventIDs = oElemEventIDs[sElemID]))
			{
				aElemEventIDs = oElemEventIDs[sElemID] = [];
			}

			_sEvents.split(' ').forEach(function (_sEvent)
			{
				var sEventID = _.randomStr();

				aElemEventIDs.push(sEventID);

				oAllEvents[sEventID] = {
					id: sEventID,
					elem: _nElem,
					name: _sEvent,
					callback: _fCallback
				};

				oEventsMap[_sEvent + '.' + sEventID] = eventHandler;
			});

			//if it was inited on some event, the event should be fired on window first
			setTimeout(function ()
			{
				jWindow.on(oEventsMap);
			}, 0);

			return true;
		};

		_.offOthers = function (_xEvents, _nElem, _fCallback)
		{
			var sElemID = null;

			if (!_.isString(_xEvents))
			{
				sElemID = _xEvents.elem.getAttribute('data-js-id');
				offOthersEvent(_xEvents, sElemID);
			}
			else
			{
				sElemID = _nElem.getAttribute('data-js-id');

				if (sElemID === null)
				{
					return false;
				}

				var sEvents = _.cleanStr(_xEvents),
					aElemEventIDs = oElemEventIDs[sElemID],
					oEvent, i, L;

				if (!_.isUndefined(_fCallback))
				{
					for (i = 0, L = aElemEventIDs.length; i < L; i++)
					{
						oEvent = oAllEvents[aElemEventIDs[i]];

						if (sEvents.indexOf(oEvent.name) > -1 && oEvent.callback === _fCallback)
						{
							offOthersEvent(oEvent, sElemID, aElemEventIDs);
							break;
						}
					}
				}
				else if (!_.isUndefined(sEvents))
				{
					aElemEventIDs && aElemEventIDs.filter(function (_sEventID)
					{
						return sEvents.indexOf(oAllEvents[_sEventID].name) > -1;
					})
					.forEach(function (_sEventID)
					{
						offOthersEvent(oAllEvents[_sEventID], sElemID, aElemEventIDs);
					});
				}
				else
				{
					while (aElemEventIDs.length)
					{
						offOthersEvent(oAllEvents[aElemEventIDs[0]], sElemID, aElemEventIDs);
					}
				}
			}

			if (oElemEventIDs[sElemID] && oElemEventIDs[sElemID].length === 0)
			{
				delete oElemEventIDs[sElemID];
			}

			return true;
		};
	})();

	/* get Date from ISO format
	 * http://stackoverflow.com/questions/8266710/javascript-date-parse-difference-in-chrome-and-other-browsers
	 */
	(function ()
	{
		_.dateFromISO = (function ()
		{
			var sTestISO = '2011-11-24T09:00:27+0200',
				iDateISO = Date.parse(sTestISO); // Chrome

			if (iDateISO === 1322118027000)
			{
				return function(_sDate)
				{
					return new Date(Date.parse(_sDate));
				}
			}

			// JS 1.8 gecko
			var noOffset = function(_sDate)
				{
					var aDate = _sDate.slice(0,-5).split(/\D/).map(function (_sValue)
						{
							return parseInt(_sValue, 10) || 0;
						});

					aDate[1] -= 1;

					var oDate = new Date(Date.UTC.apply(Date, aDate)),
						sOffsetString = _sDate.slice(-5),
						iOffset = parseInt(sOffsetString, 10) / 100;

					if (sOffsetString.slice(0, 1) === '+')
					{
						iOffset *= -1;
					}

					oDate.setHours(oDate.getHours() + iOffset);
					return oDate;
				};

			if (noOffset(sTestISO).getTime() === 1322118027000)
			{
				return noOffset;
			}

			// kennebec@SO + QTax@SO
			return function(_sDate)
			{
				var rxDate = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/,
					// rxDate = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d{4}))?$/,
					aDate = rxDate.exec(_sDate) || [],
					oDate;

				if (aDate[1])
				{
					oDate = aDate[1].split(/\D/).map(function (_sValue)
					{
						return parseInt(_sValue, 10) || 0;
					});

					oDate[1] -= 1;
					oDate = new Date(Date.UTC.apply(Date, oDate));

					if (!oDate.getDate())
					{
						return NaN;
					}

					if (aDate[5])
					{
						var iTimeZone = parseInt(aDate[5], 10) / 100 * 60;

						if (aDate[6])
						{
							iTimeZone += parseInt(aDate[6], 10);
						}

						if (aDate[4] === '+')
						{
							iTimeZone *= -1;
						}

						if (iTimeZone)
						{
							oDate.setUTCMinutes(oDate.getUTCMinutes()+ iTimeZone);
						}
					}

					return oDate;
				}

				return NaN;
			}
		})();
	})();

	/* resize iframe on window.resize */
	(function ()
	{
		_.iframeHeight = function (_nIframe)
		{
			if (_nIframe.offsetWidth !== 0)
			{
				if (_.isUndefined(_nIframe._heightRatio))
				{
					_nIframe._heightRatio = _nIframe.height / _nIframe.width;
					_nIframe.style.width = '100%';
				}

				_nIframe.height = _nIframe.offsetWidth * _nIframe._heightRatio;
			}
		};
		_.iframeHeightFix = function ()
		{
			_.forEach(document.querySelectorAll('iframe:not(.do-not-resize)'), function (_nIframe)
			{
				_.iframeHeight(_nIframe);
			});
		};
	})();

	/* rotate cubic-bezier curve on 180 degrees  */
	(function ()
	{
		_.reverseCubicBezier = function (_aCurve)
		{
			var iMaxX = Math.max(_aCurve[0].x, _aCurve[1].x, 1),
				iMaxY = Math.max(_aCurve[0].y, _aCurve[1].y, 1),
				rotate180deg = function (_oPoint)
				{
					var iHX = iMaxX/2,
						iHY = iMaxY/2;

					return {
						x: iHX - (_oPoint.x - iHX),
						y: iHY - (_oPoint.y - iHY)
					};
				},
				aRotatedCurve = _aCurve.map(rotate180deg).reverse();

			return aRotatedCurve;
		};
	})();

	/* cross-browser method to set scrollTop */
	(function ()
	{
		if (!('pageYOffset' in window))
		{
			Object.defineProperty(window, 'pageYOffset', {
				get: function()
				{
					return document.documentElement.scrollTop;
				}
			});
		}

		_.scrollTop = function (_iValue)
		{
			if (!_.isUndefined(_iValue))
			{
				if (document.scrollingElement)
				{
					document.scrollingElement.scrollTop = _iValue;
				}
				else
				{
					document.documentElement.scrollTop = _iValue;
					document.body && (document.body.scrollTop = _iValue);
				}
			}

			return window.pageYOffset;
		};
	})();

	/* check window width */
	(function ()
	{
		_.media = function (_oSizes)
		{
			for (var sSize in _oSizes)
			{
				_.media[sSize] = _oSizes[sSize];
			}
		};

		_.media.small = function ()
		{
			return window.innerWidth <= this.SMALL;
		};
		_.media.mediumUp = function ()
		{
			return window.innerWidth > this.SMALL;
		};
		_.media.mediumOnly = function ()
		{
			var w = window.innerWidth;

			return w > this.SMALL && w <= this.MEDIUM;
		};
		_.media.largeUp = function ()
		{
			return window.innerWidth > this.MEDIUM;
		};
		_.media.largeOnly = function ()
		{
			var w = window.innerWidth;

			return w > this.MEDIUM && w <= this.LARGE;
		};
		_.media.xlargeUp = function ()
		{
			return window.innerWidth > this.LARGE;
		};
		_.media.xlargeOnly = function ()
		{
			var w = window.innerWidth;

			return w > this.LARGE && w <= this.XLARGE;
		};
		_.media.xxlarge = function ()
		{
			return window.innerWidth > this.XLARGE;
		};
	})();

	(function ()
	{
		var oActiveDropdown = false;

		window.initDropdown = function (_xTogglers, _xCont)
		{
			var jCont = _xCont ? (_xCont instanceof jQuery ? _xCont : $(_xCont)) : false;

			(function (_jCont)
			{
				var jTogglers = _xTogglers instanceof jQuery ? _xTogglers : $(_xTogglers);

				if (jTogglers.length)
				{
					var jCont = _jCont || jTogglers.get(0).parentNode.parentNode._jQ(),
						jList = jCont.children().filter('ul');

					jTogglers.click(function ()
					{
						var $this = this._jQ();

						if (jCont.hasClass('open'))
						{
							jCont.removeClass('open above under');
							jList.removeClass('above under');
							oActiveDropdown = false;
						}
						else
						{
							if (this.hasAttribute('disabled')) return false;

							jCont.addClass('open').css('visibility', 'hidden');

							var oContOffset = jCont.offset(),
								iContHeight = jCont.outerHeight(),
								iWinHeight = window.innerHeight,
								iWinScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
								iListHeight = jList.outerHeight(),
								iLeftSpaceAbove = oContOffset.top - iWinScroll,
								iLeftSpaceUnder = iWinHeight + iWinScroll - oContOffset.top - iContHeight;

							if (iLeftSpaceUnder >= iListHeight || (iLeftSpaceAbove < iListHeight && iLeftSpaceUnder >= iLeftSpaceAbove))
							{
								jList.addClass('under');
								jCont.addClass('under');
							}
							else
							{
								jList.addClass('above');
								jCont.addClass('above');
							}

							jCont.addClass('open').css('visibility', 'visible');
							oActiveDropdown = $this;
						}
					});
					jList.on('click', 'li', function ()
					{
						oActiveDropdown.click();
					});
				}
			})(jCont);
		};

		$(window).on('reset', function (e)
		{
			var nForm = false, nElems = false, i;

			if (e.target.tagName.toLowerCase() == 'form') nForm = e.target;
			else nForm = e.target.form || e.target._form;

			if (!nForm) return true;

			nElems = nForm.elements || nForm._elements;

			if (!nElems) return true;

			setTimeout(function ()
			{
				for (i = nElems.length; i--;)
				{
					var el = nElems[i];

					el.tagName.toLowerCase() == 'select' && !!el._selectbox && el._selectbox.reset();
				}
			}, 10);
		});
	})();

})(jQuery, _);