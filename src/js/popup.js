// <reference path="global-scrollbar.js" />

;(function ($, _, undefined)
{
	'use strict';

	var TYPE = 'popup',

		Class = {
			container: 'ui-popup',
			container_visible: 'ui-popup--visible',
			wrapper: 'ui-popup__wrapper',
			wrapper_visible: 'ui-popup__wrapper--visible',
			content: 'ui-popup__content',
			inner: 'ui-popup__content-inner',
			title: 'ui-popup__content-title',
			text: 'ui-popup__content-text',
			actions: 'ui-popup__content-actions',
			close: 'ui-popup__close js-close',

			js_ok: '.js-ok',
			js_cancel: '.js-cancel',
			js_close: '.js-close'
		},

		sTransitionEnd = _.support.transition.end,
		request_frame = window.requestAnimationFrame || function (_func)
		{
			return setTimeout(_func, 1000/60);
		},

		__cont = {
			get: function ()
			{
				return this.__div || this.listenEscape() && (this.__div = this.create());
			},
			append: function (_nDiv)
			{
				this.get().appendChild(_nDiv);
			},
			create: function ()
			{
				var nDiv = document.createElement('div');

				nDiv.id = 'ui-popup-container';
				nDiv.style.display = 'none';
				nDiv.className = Class.container;

				$(nDiv)
					.on('click', this._onClick)
					.on('click', Class.js_close, this._onClickClose);

				document.body.appendChild(nDiv);

				return nDiv;
			},
			listenEscape: function ()
			{
				var iTimeout = null;

				window.addEventListener('keydown', function (e)
				{
					if (iTimeout) return;

					iTimeout = setTimeout(function ()
					{
						iTimeout = null;
					}, 100);

					// 27 = кнопка Escape
					if (e.which !== 27) return;

					var nActive = document.activeElement,
						sTagName = nActive && nActive.tagName.toLowerCase();

					if (sTagName === 'input' || sTagName === 'select' || sTagName === 'textarea')
					{
						nActive.blur();
						return;
					}

					__cont._onEscape(e);
				}, true);

				return true;
			},

			show: function ()
			{
				var nCont = __cont.get();

				nCont.style.display = 'block';
				_.globalScrollbar.hide();

				setTimeout(function ()
				{
					// fix transitionend event for hidden tab
					nCont.offsetHeight;
					nCont.offsetWidth;

					nCont.classList.add(Class.container_visible);
				}, 0);
			},
			hide: function ()
			{
				var nCont = __cont.get();

				nCont.addEventListener(sTransitionEnd, __cont._onTransitionend, {passive: true});

				setTimeout(function ()
				{
					// fix transitionend event for hidden tab
					nCont.offsetHeight;
					nCont.offsetWidth;

					nCont.classList.remove(Class.container_visible);

					setTimeout(function ()
					{
						if (parseFloat(getComputedStyle(nCont).opacity) < 0.1)
						{
							__cont._onTransitionend({target: nCont});
						}
					}, 0);
				}, 0);
			},
			_onTransitionend: function on_transitionend (e)
			{
				var nCont = __cont.get();

				if (e.target === nCont)
				{
					nCont.style.display = 'none';
					nCont.removeEventListener(sTransitionEnd, on_transitionend, {passive: true});
					_.globalScrollbar.restore();
				}
			},

			_onEscape: function (e)
			{
				__cont.onEscape(e);
			},
			_onClick: function (e)
			{
				if (e.target === this)
				{
					__cont.onClick(e);
				}
			},
			_onClickClose: function (e)
			{
				__cont.onClickClose(e);
			},

			onEscape: _.noop,
			onClick: _.noop,
			onClickClose: _.noop
		},
		__queue = (function (Q)
		{
			Q = [];

			Q.onAdd =
			Q.onRemove = _.noop;

			Q.add = function (_oPopup)
			{
				if (Q.length)
				{
					Q.last().hide();
				}

				Q.push(_oPopup);
				Q.onAdd();
			};
			Q.remove = function (_oPopup)
			{
				var index = Q.indexOf(_oPopup);

				if (index === -1) return;

				Q.splice(index, 1);

				if (Q.length)
				{
					Q.last().show();
				}

				Q.onRemove();
			};
			Q.last = function ()
			{
				return Q[Q.length - 1];
			};

			return Q;
		})(),
		__history = (function ()
		{
			var H = {},
				HH = {},
				iLength = 0,
				bFromEvent = false,
				bFromJS = false;

			HH.on =
			HH.off =
			HH.clear =
			HH.push =
			HH.pop =
			HH.onPopstate = _.noop;

			if (!('pushState' in window.history))
			{
				return HH;
			}

			H.onPopstate = _.noop;

			H.on = HH.on = function ()
			{
				__history = H;
			};
			H.off = HH.off = function ()
			{
				__history = HH;
			};

			H.clear = function ()
			{
				bFromEvent = bFromJS = false;
				window.history.pushState('', document.title, window.location.href);
			};
			H.push = function ()
			{
				iLength++;
				window.history.pushState('', document.title, window.location.href);
			};
			H.pop = function ()
			{
				iLength--;

				if (!bFromEvent)
				{
					bFromJS = true;
					window.history.back();
				}
				else
				{
					bFromEvent = false;

					if (!iLength)
					{
						H.clear();
					}
				}
			};

			window.addEventListener('popstate', function ()
			{
				if (!bFromJS)
				{
					if (!iLength) return;

					bFromEvent = true;
					__history.onPopstate();
				}
				else
				{
					bFromJS = false;

					if (!iLength)
					{
						H.clear();
					}
				}
			});

			return H;
		})(),

		__ctrl = (function (__cont, __queue, __history)
		{
			__cont.onEscape = function ()
			{
				__queue.length && __queue.last().close('esc');
			};
			__cont.onClick = function (e)
			{
				__queue.length && __queue.last().close('bg');
			};
			__cont.onClickClose = function (e)
			{
				__queue.length && __queue.last().close('btn');
			};

			__history.onPopstate = function ()
			{
				__queue.length && __queue.last().close('history');
			};

			__queue.onAdd = function ()
			{
				if (__queue.length === 1)
				{
					__cont.show();
				}

				__history.push();
			};
			__queue.onRemove = function ()
			{
				if (!__queue.length)
				{
					__cont.hide();
				}

				__history.pop();
			};
		})(__cont, __queue, __history),

		Popup;

	window.Popup = Popup = function (_options)
	{
		this.options =
		this.dom     =
		this.timeout =
		this.state   = null;

		return this.init(_options);
	};

	Popup.getTitle = function (_xContent, _options)
	{
		switch (true)
		{
			case _.isArray(_xContent):         return _xContent.shift();  break;
			case _.isFunction(_xContent):      return _xContent('title'); break;
			case _xContent && _xContent.title: return _xContent.title;    break;
		}

		return _options.title || false;
	};
	Popup.getContent = function (_xContent, _options)
	{
		switch (true)
		{
			case _.isNode(_xContent):            return _xContent;            break;
			case _.isString(_xContent):          return _xContent;            break;
			case _.isNumeric(_xContent):         return _xContent;            break;
			case _.isFunction(_xContent):        return _xContent('content'); break;
			case _.isArray(_xContent):           return _xContent.join(' ');  break;
			case _xContent && _xContent.content: return _xContent.content;    break;
		}

		return '&nbsp;';
	};
	Popup.history = function (_bON)
	{
		_bON ? __history.on() : __history.off();
	};
	Popup.open = function (_xContent, _options)
	{
		var oPopup = new Popup(_options);

		oPopup.setContent(_xContent);
		oPopup.open();

		return oPopup;
	};

	$.popup = Popup.open;

	Popup.DEFAULTS = {
		className: '',
		closesign: '&#10005;',
		closebtn: true,
		modal: false,
		escape: true,
		delay: {
			open: 0,
			close: 0
		},

		beforeOpen: undefined,
		afterOpen: undefined,
		beforeClose: undefined,
		afterClose: undefined,
		beforeSetContent: undefined,
		afterSetContent: undefined
	};

	Popup.prototype = {
		constructor: Popup,
		type: TYPE,

		init: function (_options)
		{
			this.options = $.extend(true, {}, Popup.DEFAULTS, _options);

			var sHTML = '<div class="' + Class.wrapper + ' ' + this.options.className + '" style="display: none;">' +
							'<div class="' + Class.content + '"></div>' +
						'</div>',
				nDiv = document.createElement('div');

			nDiv.insertAdjacentHTML('afterbegin', sHTML);

			this.dom = {
				wrapper: nDiv.querySelector('.' + Class.wrapper),
				content: nDiv.querySelector('.' + Class.content),
				inner: null,
				close: null
			};

			if (!this.options.modal)
			{
				this.dom.wrapper._jQ().on('click', this.onBgClick.bind(this));
			}

			__cont.append(this.dom.wrapper);

			return this;
		},
		onBgClick: function (e)
		{
			if (e.target === this.dom.wrapper)
			{
				this.close();
			}
		},

		setContent: function (_xContent)
		{
			this.dom.content._jQ().html('');

			if (this.options.beforeSetContent)
			{
				this.options.beforeSetContent.call(this);
			}

			this.dom.content.insertAdjacentHTML('afterbegin', '<div class="' + Class.inner + '"></div>');
			this.dom.inner = this.dom.content.firstElementChild;

			var xTitle = this.getTitle(_xContent),
				xContent = this.getContent(_xContent),
				nDiv;

			if (xTitle)
			{
				nDiv = document.createElement('div');
				nDiv.className = Class.title;

				if (_.isNode(xTitle))
				{
					nDiv.appendChild(xTitle);
				}
				else
				{
					nDiv.insertAdjacentHTML('afterbegin', xTitle);
				}

				this.dom.inner.appendChild(nDiv);
			}

			if (xContent)
			{
				nDiv = document.createElement('div');
				nDiv.className = Class.text;

				if (_.isNode(xContent))
				{
					nDiv.appendChild(xContent);
				}
				else
				{
					nDiv.insertAdjacentHTML('afterbegin', xContent);
				}

				this.dom.inner.appendChild(nDiv);
			}

			if (this.options.closebtn)
			{
				if (this.dom.close === null)
				{
					this.dom.wrapper.insertAdjacentHTML('beforeend',
						'<button type="button">' + this.options.closesign + '</button>');
					this.dom.close = this.dom.wrapper.lastElementChild;

					var oClassList = this.dom.close.classList;

					_.forEach(Class.close.split(' '), function (_sClassName)
					{
						oClassList.add(_sClassName);
					});
				}

				this.dom.content.appendChild(this.dom.close);
			}

			if (this.options.afterSetContent)
			{
				this.options.afterSetContent.call(this);
			}
		},
		getTitle: function (_xContent)
		{
			return Popup.getTitle(_xContent, this.options);
		},
		getContent: function (_xContent)
		{
			return Popup.getContent(_xContent, this.options);
		},

		show: function ()
		{
			var nWrapper = this.dom.wrapper;

			nWrapper.style.display = 'block';
			nWrapper.style.pointerEvents = 'auto';

			request_frame(function ()
			{
				nWrapper.classList.add(Class.wrapper_visible);
			});
		},
		hide: function ()
		{
			var nWrapper = this.dom.wrapper;

			nWrapper.addEventListener(sTransitionEnd, function on_transitionend (e)
			{
				if (e.target === this)
				{
					this.style.display = 'none';
					this.removeEventListener(sTransitionEnd, on_transitionend, {passive: true});
				}
			}, {passive: true});

			// fix transtionend event for hidden tab
			nWrapper.offsetWidth;
			nWrapper.offsetHeight;

			nWrapper.style.pointerEvents = 'none';
			nWrapper.classList.remove(Class.wrapper_visible);
		},

		open: function ()
		{
			this.state = 'opening';
			__queue.add(this);

			if (this.timeout)
			{
				clearTimeout(this.timeout);
			}

			var that = this;
			this.timeout = setTimeout(function()
			{
				that.timeout = null;

				if (that.state === 'opening')
				{
					that._open();
				}
			}, this.options.delay.open);
		},
		_open: function ()
		{
			this.state = 'opened';

			if (this.options.beforeOpen)
			{
				this.options.beforeOpen.call(this);
			}

			var that = this,
				nWrapper = this.dom.wrapper;

			nWrapper.style.display = 'block';

			var that = this;

			request_frame(function ()
			{
				// fix transtionend event for hidden tab
				nWrapper.offsetWidth;
				nWrapper.offsetHeight;

				nWrapper.classList.add(Class.wrapper_visible);

				if (that.options.afterOpen)
				{
					that.options.afterOpen.call(that);
				}
			});

			return true;
		},

		close: function (_sWho)
		{
			if (_sWho === 'bg' && this.options.modal) return;
			if (_sWho === 'esc' && !this.options.escape) return;

			this.state = 'closing';

			if (this.timeout)
			{
				clearTimeout(this.timeout);
			}

			var that = this;
			this.timeout = setTimeout(function()
			{
				that.timeout = null;

				if (that.state === 'closing')
				{
					that._close();
				}

				__queue.remove(that);
			}, this.options.delay.close);

			return true;
		},
		_close: function ()
		{
			if (this.timeout)
			{
				clearTimeout(this.timeout);
				this.timeout = null;
			}

			if (this.options.beforeClose)
			{
				this.options.beforeClose.call(this);
			}

			var that = this,
				nWrapper = this.dom.wrapper;

			nWrapper.addEventListener(sTransitionEnd, function on_transitionend (e)
			{
				if (e.target === this)
				{
					that.state = 'closed';

					if (that.options.afterClose)
					{
						that.options.afterClose.call(that);
					}

					this.removeEventListener(sTransitionEnd, on_transitionend, {passive: true});
					this._jQ().remove();
				}
			}, {passive: true});

			// fix transtionend event for hidden tab
			nWrapper.offsetWidth;
			nWrapper.offsetHeight;

			nWrapper.style.pointerEvents = 'none';
			nWrapper.classList.remove(Class.wrapper_visible);

			return true;
		}
	};

	//Dialog, Alert, Confirm
	(function ()
	{
		var TYPE = 'dialog',
			Dialog;

		window.Dialog = Dialog = function (_xContent, _options)
		{
			this.buttons =
			this.options = null;

			return this.init(_xContent, _options);
		};

		Dialog.getTitle = function (_xContent, _options)
		{
			return Popup.getTitle(_xContent, _options);
		};
		Dialog.getContent = function (_xContent, _options)
		{
			return Popup.getContent(_xContent, _options);
		};
		Dialog.open = function (_xContent, _options)
		{
			var oDialog = new Dialog(_options);

			oDialog.setContent(_xContent);
			oDialog.open();

			return oDialog;
		};

		$.dialog = Dialog.open;

		Dialog.DEFAULTS = {
			popup: {
				modal: false,
				closebtn: true,
				escape: true
			},
			button: {
				markup: '<button type="button"></button>',
				className: 'btn',
				closing: true,
				callback: false,
				focus: false
			},

			OK: 'OK',
			Cancel: 'Cancel',
			titleMarkup: '<p></p>',
			actionsMarkup: '<div></div>',

			afterSetContent: undefined
		};

		Dialog.prototype = {
			constructor: Dialog,
			type: TYPE,

			init: function (_options)
			{
				this.options = this.getOptions(_options);
				this.options.popup.className += ' ' + this.type;

				this.popup = new Popup(this.options.popup);

				return this;
			},
			getOptions: function (_options)
			{
				var options = $.extend(true, {}, Dialog.DEFAULTS, _options),
					xButtons = options.buttons,
					oButton;

				options.buttons = [];

				if (_.isArray(xButtons))
				{
					while (oButton = xButtons.shift())
					{
						options.buttons.push($.extend(true, {}, Dialog.DEFAULTS.button, oButton));
					}
				}
				else if (!!xButtons)
				{
					options.buttons.push($.extend(true, {}, Dialog.DEFAULTS.button, xButtons));
				}

				return options;
			},

			setContent: function (_xContent)
			{
				var oPopupDom = this.popup.dom;

				this.popup.setContent(_xContent);

				if (this.options.buttons.length)
				{
					this.buttons = [];

					var aButtons = this.options.buttons,
						oButton, nButton, oClassList, i, L;

					oPopupDom.content.insertAdjacentHTML('beforeend', this.options.actionsMarkup);
					oPopupDom.actions = oPopupDom.content.lastElementChild;
					oPopupDom.actions.classList.add(Class.actions);

					for (i = 0, L = aButtons.length; i < L; i++)
					{
						oButton = aButtons[i];
						oPopupDom.actions.insertAdjacentHTML('beforeend', oButton.markup);

						nButton = oPopupDom.actions.lastElementChild;
						nButton.innerHTML = oButton.text;

						oClassList = nButton.classList;

						if (oButton.className)
						{
							_.forEach(oButton.className.split(' '), function (_sClassName)
							{
								oClassList.add(_sClassName);
							});
						}
						if (oButton.class_js)
						{
							oClassList.add(oButton.class_js);
						}
						if (oButton.closing)
						{
							oClassList.add(Class.js_close.slice(1));
						}
						if (oButton.callback)
						{
							nButton._jQ().on('click', oButton.callback.bind(this));
						}
						if (oButton.focus)
						{
							nButton.focus();
						}

						this.buttons.push(nButton);
					}
				}

				if (this.options.afterSetContent)
				{
					this.options.afterSetContent.call(this);
				}
			},

			open: function ()
			{
				this.popup.open();
			},
			close: function ()
			{
				this.popup.close();
			}
		};

		window._alert = function (_xContent, _options)
		{
			_options || (_options = {});

			if (_.isMobile)
			{
				var xTitle = Dialog.getTitle(_xContent, _options),
					xContent = Dialog.getContent(_xContent, _options),
					sConnect = xTitle.toString() && xContent.toString() ? ': ' : '';

				alert((xTitle && xTitle.toString() || '') + sConnect +
					(xContent && (xContent.innerHTML || xContent.toString()) || ''));

				_options.callback && _options.callback();

				return null;
			}

			var settings = {
					buttons: {
						text: Dialog.DEFAULTS.OK,
						class_js: Class.js_ok.slice(1),
						className: 'btn btn-primary',
						focus: true
					},
					popup: {
						className: TYPE + '--alert',
						beforeClose: _options.callback
					}
				};

			Dialog.open(_xContent, $.extend(true, settings, _options));
		};
		window._confirm = function (_xContent, _options)
		{
			_options || (_options = {});

			if (_.isMobile)
			{
				var xTitle = Dialog.getTitle(_xContent, _options),
					xContent = Dialog.getContent(_xContent, _options).toString(),
					sConnect = xTitle.toString() && xContent.toString() ? ': ' : '',

					bConfirmed = confirm((xTitle ? xTitle.toString() : '') + sConnect +
						(xContent && (xContent.innerHTML || xContent.toString()) || ''));

				if (bConfirmed)
				{
					_options.confirmed && _options.confirmed();
				}
				else
				{
					_options.rejected && _options.rejected();
				}

				return null;
			}

			var settings = {
					buttons: [
						{
							text: Dialog.DEFAULTS.OK,
							class_js: Class.js_ok.slice(1),
							className: 'btn btn-primary',
							focus: true,
							callback: _options.confirmed
						},
						{
							text: Dialog.DEFAULTS.Cancel,
							class_js: Class.js_cancel.slice(1),
							className: 'btn btn-default',
							callback: _options.rejected
						}
					],
					popup: {
						className: TYPE + '--confirm',
						modal: true,
						escape: false,
						closebtn: false
					}
				};

			Dialog.open(_xContent, $.extend(true, settings, _options));
		};
	})();
})(jQuery, window._);
