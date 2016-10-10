(function ($)
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
			closeCSS: 'ui-popup__close',
			closeJS: 'js-close'
		},

		_getContent = function (_xContent)
		{
			switch (true)
			{
				case _.isNode(_xContent):            return _xContent;            break;
				case _.isString(_xContent):          return _xContent;            break;
				case _.isFunction(_xContent):        return _xContent('content'); break;
				case _.isArray(_xContent):           return _xContent.join(' ');  break;
				case _xContent && _xContent.message: return _xContent.message;    break;
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

			nContainer = (function ()
			{
				var sContId = 'ui-popup-container',
					nDiv;

				if (document.readyState === 'loading' || document.readyState === 'uninitialized')
				{
					document.write('<div id="' + sContId + '"></div>');
					nDiv = document.getElementById(sContId);
				}
				else
				{
					nDiv = document.createElement('div');
					nDiv.id = sContId;

					document.body.appendChild(nDiv);
				}

				nDiv.style.display = 'none';
				nDiv.className = Class.container;

				$(nDiv).click(function (e)
				{
					if (e.target === this)
					{
						_clickOnCont();
					}
				})
				.on('click', '.' + Class.closeJS, function ()
				{
					if (aQueue.length)
					{
						aQueue[aQueue.length - 1].close();
					}
				});

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
				_.globalScrollbar.hide(Popup.callbacks.globalScrollbarHide);
				nContainer.style.display = 'block';

				setTimeout(function ()
				{
					nContainer.classList.add(Class.container_visible);
				}, 0);
			},
			_hideCont = function ()
			{
				nContainer._jQ().on('transitionend', function (e)
				{
					if (e.target === this)
					{
						this.style.display = 'none';
						this._jQ().off('transitionend');
						_.globalScrollbar.restore(Popup.callbacks.globalScrollbarRestore);
					}
				});

				setTimeout(function ()
				{
					nContainer.classList.remove(Class.container_visible);
				}, 0);
			},

			_showPopup = function ()
			{
				this.dom.wrapper.style.display = 'block';
				this.dom.wrapper.style.pointerEvents = 'auto';

				var that = this;
				setTimeout(function ()
				{
					that.dom.wrapper.classList.add(Class.wrapper_visible);
				}, iAnimTimeout);
			},
			_hidePopup = function ()
			{
				var that = this;
				this.dom.wrapper._jQ().on('transitionend', function (e)
				{
					if (e.target === this)
					{
						that.dom.wrapper.style.display = 'none';
						that.dom.wrapper._jQ().off('transitionend');
					}
				});

				this.dom.wrapper.style.pointerEvents = 'none';
				this.dom.wrapper.classList.remove(Class.wrapper_visible);
			},

			_open = function ()
			{
				this.state = 'opened';

				if (this.options.beforeOpen)
				{
					this.options.beforeOpen.call(this);
				}

				this.dom.wrapper.style.display = 'block';

				var that = this;
				setTimeout(function ()
				{
					that.dom.wrapper.classList.add(Class.wrapper_visible);

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

				if (this.options.beforeClose)
				{
					this.options.beforeClose.call(this);
				}

				var that = this;
				this.dom.wrapper._jQ().on('transitionend', function (e)
				{
					if (e.target === this)
					{
						that.state = 'closed';

						if (that.options.afterClose)
						{
							that.options.afterClose.call(that);
						}

						that.dom.wrapper._jQ().off('transitionend').remove();
					}
				});

				this.dom.wrapper.style.pointerEvents = 'none';
				this.dom.wrapper.classList.remove(Class.wrapper_visible);

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

		Popup.callbacks = {
			globalScrollbarHide: function (_iWidth, _sSide)
			{
				var nHeader = document.querySelector('header');
				if (nHeader !== null)
				{
					nHeader.style['border' + _sSide] = _iWidth + 'px solid transparent';
					nHeader.style[_sSide.toLowerCase()] = _iWidth + 'px';
				}
			},
			globalScrollbarRestore: function (_iWidth, _sSide)
			{
				var nHeader = document.querySelector('header');
				if (nHeader !== null)
				{
					nHeader.style['border' + _sSide] = '';
					nHeader.style[_sSide.toLowerCase()] = '';
				}
			}
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
				if (this.options.beforeSetContent)
				{
					this.options.beforeSetContent.call(this);
				}

				this.dom.content._jQ().html('');
				this.dom.content.insertAdjacentHTML('afterbegin', '<div class="' + Class.inner + '"></div>');
				this.dom.inner = this.dom.content.firstElementChild;

				var xContent = _getContent(_xContent);

				if (_.isNode(xContent))
				{
					this.dom.inner.appendChild(xContent);
				}
				else
				{
					this.dom.inner.insertAdjacentHTML('afterbegin', xContent);
				}

				if (this.options.showCloseBtn)
				{
					if (this.dom.close === null)
					{
						this.dom.wrapper.insertAdjacentHTML('beforeend', this.options.closeMarkup);
						this.dom.close = this.dom.wrapper.lastElementChild;

						var oClassList = this.dom.close.classList;
							oClassList.add(Class.closeJS);
							oClassList.add.apply(oClassList, Class.closeCSS.split(' '));
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
				//get title first, because _xContent may be an array, where [0] is title
				var sTitleHTML = _getTitleHTML(_xContent),
					oPopupDom = this.popup.dom;

				this.popup.setContent(_xContent);

				if (sTitleHTML)
				{
					oPopupDom.content.insertAdjacentHTML('afterbegin', sTitleHTML);
					oPopupDom.title = oPopupDom.content.firstElementChild;

					oPopupDom.title.classList.add(Class.title)
				}

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
							oClassList.add.apply(oClassList, oButton.className.split(' '));
						}
						if (oButton.closeOnClick)
						{
							oClassList.add(Class.closeJS);
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

		window._alert = function (_xContent, _fCallback, _sOk)
		{
			if (_.isMobile)
			{
				var sTitleHTML = _getTitleHTML(_xContent),
					sContentHTML = _getContent(_xContent).toString(),
					sConnect = sTitleHTML && sContentHTML ? ': ' : '';

				alert((sTitleHTML ? sTitleHTML : '') +
						sConnect +
						(sContentHTML && (sContentHTML.outerHTML || sContentHTML) || ''));

				if (_fCallback)
				{
					_fCallback();
				}

				return null;
			}

			$.dialog(_xContent, {
				buttons: {
					text: _sOk || Dialog.DEFAULTS.OK,
					className: 'js-ok btn btn-primary',
					focus: true,
				},
				popup: {
					className: TYPE + '--alert',
					beforeClose: _fCallback
				}
			});
		};
		window._confirm = function (_xContent, _fConfirmed, _fRejected, _sOk, _sCancel)
		{
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
					_fConfirmed();
				}
				else
				{
					_fRejected();
				}

				return null;
			}

			$.dialog(_xContent, {
				buttons: [
					{
						text: _sOk || Dialog.DEFAULTS.OK,
						className: 'js-ok btn btn-primary',
						focus: true,
						callback: _fConfirmed
					},
					{
						text: _sCancel || Dialog.DEFAULTS.Cancel,
						className: 'js-cancel btn btn-default',
						callback: _fRejected
					}
				],
				popup: {
					className: TYPE + '--confirm',
					closeOnBgClick: false,
					enableEscapeKey: false,
					showCloseBtn: false,
				}
			});
		};
	})();

})(jQuery);