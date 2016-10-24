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
		var userAgent = window.navigator.userAgent || window.navigator.vendor || window.opera;
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(userAgent))
		{
			_.isMobile = true;
		}
		else
		{
			_.isMobile = false;
		}
	})(_);

	/* to define width of scrollbar */
	(function ()
	{
		_.globalScrollbar = {
			_hidden: false,
			_prop: 'margin',
			_side: 'right',
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

				var nHTML = document.documentElement;

				this._prevOverflow = nHTML.style.overflow;
				this._prevMargin = nHTML.style[this._prop + '-' + this._side];

				nHTML.style.overflow = 'hidden';
				nHTML.style[this._prop + '-' + this._side] = this._width + 'px';

				if (_.isFunction(_fCallback))
				{
					_fCallback(this._width, this._side, this._prop);
				}
				else
				{
					var anNeedOffset = document.querySelectorAll('.js-scrollbar-offset');

					_.forEach(anNeedOffset, function (_nElem)
					{
						_nElem.style['border-' + this._side] = this._width + 'px solid transparent';
						_nElem.style[this._side] = this._width + 'px';
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

				this._hidden = false;

				document.documentElement.style.overflow = this._prevOverflow;
				document.documentElement.style[this._prop + '-' + this._side] = this._prevMargin;

				this._prevOverflow = '';
				this._prevMargin = '';

				if (_.isFunction(_fCallback))
				{
					_fCallback(this._width, this._side, this._prop);
				}
				else
				{
					var anNeedOffset = document.querySelectorAll('.js-scrollbar-offset');

					_.forEach(anNeedOffset, function (_nElem)
					{
						_nElem.style['border-' + this._side] = '';
						_nElem.style[this._side] = '';
					},
					this);
				}
			}
		};

		(function ()
		{
			var sId = _.randomStr(),
				sStyle = 'position: absolute;' + 
						'top: -100px;'  + 
						'left: -100px;' + 
						'width: 100px;' + 
						'height: 50px;' + 
						'overflow: scroll;',
				nDiv;

			document.write('<div id="' + sId +'" style="' + sStyle +'"></div>');

			nDiv = document.getElementById(sId);

			_.globalScrollbar._width = nDiv.offsetWidth - nDiv.clientWidth;
			_.globalScrollbar._side = document.documentElement.getAttribute('dir') === 'rtl' ? 'left' : 'right';

			nDiv.parentNode.removeChild(nDiv);
		})();
	})();

	/* to define browser prefix */
	(function ()
	{
		var oStyles = window.getComputedStyle(document.documentElement, ''),
			sPref = (Array.prototype.slice.call(oStyles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
			)[1],
			sDom = ('WebKit|Moz|MS|O').match(new RegExp('(' + sPref + ')', 'i'))[1];

		_.prefix =  {
			dom: sDom,
			lowercase: sPref,
			css: '-' + sPref + '-',
			js: sPref[0].toUpperCase() + sPref.substr(1)
		};
	})();

	/* colored console logging */
	(function ()
	{
		var Console = window.console,
			OriginalLog = Console.log,
			OriginalTrace = 'trace' in Console ? Console.trace : OriginalLog;

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

				return Function.prototype.bind.apply(_bTrace ? OriginalTrace : OriginalLog, _aArguments);
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
			oElemEventIds = {},
			oAllEvents = {},

			eventHandler = function (e)
			{
				var nTarget = e.target,
					sEventId = e.handleObj.namespace,
					oEvent = oAllEvents[sEventId],
					nElem = oEvent.elem;

				if (nElem !== nTarget && !nElem.contains(nTarget))
				{
					_.offOthers(oEvent)

					if (nElem.offsetParent !== null)
					{
						oEvent.callback(e);
					}
				}
			},

			offOthersEvent = function (_oEvent, _sElemId, _aElemEvents)
			{
				var sEventId = _oEvent.id,
					sElemId = _sElemId || _oEvent.elem.getAttribute('data-js-id'),
					aElemEvents = _aElemEvents || oElemEventIds[sElemId],
					index = aElemEvents.indexOf(sEventId);

				aElemEvents.splice(index, 1);
				delete oAllEvents[sEventId];

				jWindow.off(_oEvent.name + '.' + sEventId);

				return true;
			};

		_.onOthers = function (_sEvents, _nElem, _fCallback)
		{
			if (!_.isElement(_nElem) || !_.isString(_sEvents) || !_.isFunction(_fCallback))
			{
				return false;
			}

			var sElemId = _nElem.getAttribute('data-js-id'),
				aElemEventIds = oElemEventIds[sElemId],
				oEventsMap = {};

			if (!_.isUndefined(aElemEventIds))
			{
				var sEventId, oEvent, i, L;

				for (i = 0, L = aElemEventIds.length; i < L; i++)
				{
					sEventId = aElemEventIds[i];
					oEvent = oAllEvents[sEventId];

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

			if (sElemId === null)
			{
				sElemId = _.randomStr();
				_nElem.setAttribute('data-js-id', sElemId);
			}

			aElemEventIds = oElemEventIds[sElemId];

			if (_.isUndefined(aElemEventIds))
			{
				aElemEventIds = oElemEventIds[sElemId] = [];
			}

			_sEvents.split(' ').forEach(function (_sEvent)
			{
				var sEventId = _.randomStr();

				aElemEventIds.push(sEventId);

				oAllEvents[sEventId] = {
					id: sEventId,
					elem: _nElem,
					name: _sEvent,
					callback: _fCallback
				};

				oEventsMap[_sEvent + '.' + sEventId] = eventHandler;
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
			var sElemId = null;

			if (!_.isString(_xEvents))
			{
				sElemId = _xEvents.elem.getAttribute('data-js-id');
				offOthersEvent(_xEvents, sElemId);
			}
			else
			{
				sElemId = _nElem.getAttribute('data-js-id');

				if (sElemId === null)
				{
					return false;
				}

				var sEvents = _.cleanStr(_xEvents),
					aElemEventIds = oElemEventIds[sElemId],
					oEvent, i, L;

				if (!_.isUndefined(_fCallback))
				{
					for (i = 0, L = aElemEventIds.length; i < L; i++)
					{
						oEvent = oAllEvents[aElemEventIds[i]];

						if (sEvents.indexOf(oEvent.name) > -1 && oEvent.callback === _fCallback)
						{
							offOthersEvent(oEvent, sElemId, aElemEventIds);
							break;
						}
					}
				}
				else if (!_.isUndefined(sEvents))
				{
					aElemEventIds && aElemEventIds.filter(function (_sEventId)
					{
						return sEvents.indexOf(oAllEvents[_sEventId].name) > -1;
					})
					.forEach(function (_sEventId)
					{
						offOthersEvent(oAllEvents[_sEventId], sElemId, aElemEventIds);
					});
				}
				else
				{
					while (aElemEventIds.length)
					{
						offOthersEvent(oAllEvents[aElemEventIds[0]], sElemId, aElemEventIds);
					}
				}
			}

			if (oElemEventIds[sElemId] && oElemEventIds[sElemId].length === 0)
			{
				delete oElemEventIds[sElemId];
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
					document.body.scrollTop = _iValue;
				}
			}

			return window.pageYOffset;
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