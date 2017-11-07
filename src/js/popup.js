(function ($, _, undefined)
{
	'use strict';

	var Popup,

		Class = {
			container: 'ui-popup',
			container_visible: 'ui-popup--visible',
			wrapper: 'ui-popup__wrapper',
			wrapper_visible: 'ui-popup__wrapper--visible',
			content: 'ui-popup__content',
			inner: 'ui-popup__content-inner',
			title: 'ui-popup__content-title',
			actions: 'ui-popup__content-actions',
			close: 'ui-popup__close js-close',

			js_ok: '.js-ok',
			js_cancel: '.js-cancel',
			js_close: '.js-close'
		},

		_getTitleHTML = function (_xContent)
		{
			switch (true)
			{
				case _.isArray(_xContent):         return _xContent.shift();  break;
				case _.isFunction(_xContent):      return _xContent('title'); break;
				case _xContent && _xContent.title: return _xContent.title;    break;
			}

			return false;
		},

		_getContent = function (_xContent)
		{
			switch (true)
			{
				case _.isNode(_xContent):            return _xContent;            break;
				case _.isString(_xContent):          return _xContent;            break;
				case _.isFunction(_xContent):        return _xContent('content'); break;
				case _.isArray(_xContent):           return _xContent.join(' ');  break;
				case _xContent && _xContent.content: return _xContent.content;    break;
				case !_.isNaN(_xContent):            return _xContent;            break;
			}

			return '';
		};

	//Popup Base
	(function ()
	{
		var TYPE = 'popup',
			aQueue = [],
			iAnimTimeout = 1000/60,
			jWindow = $(window),
			sTransitionEnd = _.support.transition.end,

			nContainer = (function createContainer ()
			{
				var ID = 'ui-popup-container',
					nDiv,

					setup = function (_nDiv)
					{
						_nDiv.style.display = 'none';
						_nDiv.className = Class.container;

						$(_nDiv).on('click', function (e)
						{
							if (e.target === this)
							{
								_clickOnCont();
							}
						})
						.on('click', Class.js_close, function ()
						{
							if (aQueue.length)
							{
								aQueue[aQueue.length - 1].close();
							}
						});
					};

				if (document.readyState === 'loading' || document.readyState === 'uninitialized')
				{
					document.write('<div id="' + ID + '"></div>');
					nDiv =  document.getElementById(ID) ||
							document.querySelector('#' + ID) ||
							window[ID];
				}
				else if (document.body)
				{
					nDiv = document.createElement('div');
					nDiv.id = ID;

					document.body.appendChild(nDiv);
				}

				if (nDiv)
				{
					setup(nDiv);
				}
				else
				{
					$(function ()
					{
						var nDiv =  document.getElementById(ID) ||
									document.querySelector('#' + ID) ||
									window[ID];

						if (nDiv)
						{
							nContainer = nDiv;
							setup(nDiv);
						}
						else
						{
							createContainer();
						}
					});
				}

				return nDiv;
			})(),
			_clickOnCont = function ()
			{
				if (aQueue.length === 0)
				{
					return true;
				}

				var oPopup = aQueue[aQueue.length - 1];

				if (oPopup.options.closeOnBgClick)
				{
					oPopup.close();
				}
			},

			_addToQueue = function ()
			{
				var iNum = aQueue.length;

				if (iNum === 0)
				{
					_showCont();
				}
				else
				{
					_hidePopup.call(aQueue[iNum - 1]);
				}

				aQueue.push(this);
			},
			_removeFromQueue = function ()
			{
				var iNum = aQueue.length;

				if (aQueue[iNum - 1] === this)
				{
					aQueue.pop();
				}
				else
				{
					var index = aQueue.indexOf(this);

					if (index === -1)
					{
						return false;
					}

					aQueue.splice(index, 1);
				}

				iNum -= 1;

				if (iNum === 0)
				{
					_hideCont();
				}
				else
				{
					_showPopup.call(aQueue[iNum - 1]);
				}

				return true;
			},

			_showCont = function ()
			{
				jWindow.trigger(TYPE + ':show');

				nContainer.style.display = 'block';
				_.globalScrollbar.hide();

				setTimeout(function ()
				{
					// fix transitionend event for hidden tab
					nContainer.offsetHeight;
					nContainer.offsetWidth;

					nContainer.classList.add(Class.container_visible);
				}, 0);
			},
			_hideCont = function ()
			{
				jWindow.trigger(TYPE + ':hide');

				nContainer.addEventListener(sTransitionEnd, __hideContOnTransitionend, {passive: true});

				setTimeout(function ()
				{
					// fix transitionend event for hidden tab
					nContainer.offsetHeight;
					nContainer.offsetWidth;

					nContainer.classList.remove(Class.container_visible);

					setTimeout(function ()
					{
						if (parseFloat(getComputedStyle(nContainer).opacity) < 0.1)
						{
							__hideContOnTransitionend({target: nContainer});
						}
					}, 0);
				}, 0);
			},
			__hideContOnTransitionend = (function (e)
			{
				if (e.target === this)
				{
					if (aQueue.length === 0)
					{
						this.style.display = 'none';
					}

					this.removeEventListener(sTransitionEnd, __hideContOnTransitionend, {passive: true});
					_.globalScrollbar.restore();
				}
			}).bind(nContainer),

			_showPopup = function ()
			{
				var nWrapper = this.dom.wrapper;

				nWrapper.style.display = 'block';
				nWrapper.style.pointerEvents = 'auto';

				setTimeout(function ()
				{
					nWrapper.classList.add(Class.wrapper_visible);
				}, iAnimTimeout);
			},
			_hidePopup = function ()
			{
				var nWrapper = this.dom.wrapper;

				nWrapper._jQ().on(sTransitionEnd, function (e)
				{
					if (e.target === this)
					{
						this.style.display = 'none';
						this._jQ().off(sTransitionEnd);
					}
				});

				// fix transtionend event for hidden tab
				nWrapper.offsetWidth;
				nWrapper.offsetHeight;

				nWrapper.style.pointerEvents = 'none';
				nWrapper.classList.remove(Class.wrapper_visible);
			},

			_open = function ()
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

				setTimeout(function ()
				{
					nWrapper.classList.add(Class.wrapper_visible);

					if (that.options.afterOpen)
					{
						that.options.afterOpen.call(that);
					}
				}, iAnimTimeout);

				return true;
			},

			_close = function ()
			{
				if (this.timeout)
				{
					clearTimeout(this.timeout);
					this.timeout = null;
				}

				if (_.isFunction(this.options.beforeClose))
				{
					this.options.beforeClose.call(this);
				}

				var that = this,
					nWrapper = this.dom.wrapper;

				nWrapper._jQ().on(sTransitionEnd, function (e)
				{
					if (e.target === this)
					{
						that.state = 'closed';

						if (that.options.afterClose)
						{
							that.options.afterClose.call(that);
						}

						this._jQ().off(sTransitionEnd).remove();
					}
				});

				// fix transtionend event for hidden tab
				nWrapper.offsetWidth;
				nWrapper.offsetHeight;

				nWrapper.style.pointerEvents = 'none';
				nWrapper.classList.remove(Class.wrapper_visible);

				return true;
			};

		Popup = function (_options)
		{
			this.options =
			this.dom     =
			this.timeout =
			this.state   = null;

			return this.init(_options);
		};

		Popup.DEFAULTS = {
			className: '',
			closeMarkup: '<button type="button">&#10005;</button>',
			delay: {
				open: 0,
				close: 0,
				remove: 0
			},
			closeOnBgClick: true,
			showCloseBtn: true,
			closeBtnInside: true,
			enableEscapeKey: true,

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

				var that = this,
					sHTML = '<div class="' + Class.wrapper + ' ' + this.options.className + '" style="display: none;">' +
								'<div class="' + Class.content + '"></div>' +
							'</div>',
					nCont = document.createElement('div');

				nCont.insertAdjacentHTML('afterbegin', sHTML);

				this.dom = {
					wrapper: nCont.querySelector('.' + Class.wrapper),
					content: nCont.querySelector('.' + Class.content),
					inner: null,
					close: null
				};

				if (this.options.closeOnBgClick)
				{
					this.dom.wrapper._jQ().on('click', this.onBgClick.bind(this));
				}

				nContainer.appendChild(this.dom.wrapper);

				return this;
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

				var xTitle = _getTitleHTML(_xContent) || this.options.title,
					xContent = _getContent(_xContent);

				if (xTitle)
				{
					var nDiv = document.createElement('div');

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

				if (_.isNode(xContent))
				{
					this.dom.inner.appendChild(xContent);
				}
				else
				{
					this.dom.inner.insertAdjacentHTML('beforeend', xContent);
				}

				if (this.options.showCloseBtn)
				{
					if (this.dom.close === null)
					{
						this.dom.wrapper.insertAdjacentHTML('beforeend', this.options.closeMarkup);
						this.dom.close = this.dom.wrapper.lastElementChild;

						var oClassList = this.dom.close.classList;

						_.forEach(Class.close.split(' '), function (_sClassName)
						{
							oClassList.add(_sClassName);
						});
					}

					if (this.options.closeBtnInside)
					{
						this.dom.content.appendChild(this.dom.close);
					}
				}

				if (this.options.afterSetContent)
				{
					this.options.afterSetContent.call(this);
				}
			},

			onBgClick: function (e)
			{
				if (e.target === this.dom.wrapper)
				{
					this.close();
				}
			},

			open: function ()
			{
				this.state = 'opening';
				_addToQueue.call(this);

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
						_open.call(that);
					}
				}, this.options.delay.open);
			},

			close: function ()
			{
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
						_close.call(that);
					}

					_removeFromQueue.call(that);
				}, this.options.delay.close);

				return true;
			}
		};

		$.popup = function (_xContent, _options)
		{
			var oPopup = new Popup(_options);

			oPopup.setContent(_xContent);
			oPopup.open();

			return oPopup;
		};

		$.popup.DEFAULTS = Popup.DEFAULTS;
		$.popup.Constructor = Popup;
	})();

	//Dialog, Alert, Confirm
	(function ()
	{
		var TYPE = 'dialog',

		_getOptions = function (_options)
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

		Dialog = function (_xContent, _options)
		{
			this.buttons =
			this.options = null;

			return this.init(_xContent, _options);
		};

		Dialog.DEFAULTS = {
			popup: {
				closeOnBgClick: true,
				showCloseBtn: true,
				closeBtnInside: true,
				enableEscapeKey: true
			},
			button: {
				markup: '<button type="button"></button>',
				className: 'btn',
				closeOnClick: true,
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
				this.options = _getOptions(_options);
				this.options.popup.className += ' ' + this.type;

				this.popup = new Popup(this.options.popup);

				return this;
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
						if (oButton.closeOnClick)
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

		$.dialog = function (_xContent, _options)
		{
			var oDialog = new Dialog(_options);

			oDialog.setContent(_xContent);
			oDialog.open();

			return oDialog;
		};

		$.dialog.DEFAULTS = Dialog.DEFAULTS;
		$.dialog.Constructor = Dialog;

		window._alert = function (_xContent, _options)
		{
			_options || (_options = {});

			if (_.isMobile)
			{
				var sTitleHTML = _getTitleHTML(_xContent),
					sContentHTML = _getContent(_xContent).toString(),
					sConnect = sTitleHTML && sContentHTML ? ': ' : '';

				alert((sTitleHTML ? sTitleHTML : '') +
						sConnect +
						(sContentHTML && (sContentHTML.outerHTML || sContentHTML) || ''));

				if (_options.callback)
				{
					_options.callback();
				}

				return null;
			}

			var options = {
					buttons: {
						text: Dialog.DEFAULTS.OK,
						class_js: Class.js_ok.slice(1),
						className: 'btn btn-primary',
						focus: true
					},
					popup: {
						className: TYPE + '--alert'
					}
				};

			$.extend(true, options, _options);

			$.dialog(_xContent, options);
		};
		window._confirm = function (_xContent, _options)
		{
			_options || (_options = {});

			if (_.isMobile)
			{
				var sTitleHTML = _getTitleHTML(_xContent),
					sContentHTML = _getContent(_xContent).toString(),
					sConnect = sTitleHTML && sContentHTML ? ': ' : '',
					bConfirmed = confirm((sTitleHTML ? sTitleHTML : '') +
								sConnect +
								(sContentHTML && (sContentHTML.outerHTML || sContentHTML) || ''));

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

			var options = {
					buttons: [
						{
							text: Dialog.DEFAULTS.OK,
							class_js: Class.js_ok.slice(1),
							className: 'btn btn-primary',
							focus: true
						},
						{
							text: Dialog.DEFAULTS.Cancel,
							class_js: Class.js_cancel.slice(1),
							className: 'btn btn-default'
						}
					],
					popup: {
						className: TYPE + '--confirm',
						closeOnBgClick: false,
						enableEscapeKey: false,
						showCloseBtn: false
					}
				};

			$.extend(true, options, _options);

			$.dialog(_xContent, options);
		};
	})();

})(jQuery, _);
