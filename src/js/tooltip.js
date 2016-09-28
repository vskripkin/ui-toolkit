(function ($, undefined)
{
	'use strict';

	var TYPE = 'tooltip',

		Tooltip = function (_nElem, _options)
		{
			this.options      =
			this.isHidden     =
			this.timeout      =
			this.closeTimeout =
			this.hoverState   =
			this.eventTargets =
			this.element      =
			this.target       = null

			return this.init(_nElem, _options);
		};

	Tooltip.DEFAULTS = {
		animation: true,
		trigger: 'hover focus',
		message: '',
		delay: 0,
		type: 'info',
		visible: false,
		close: 0,
		closeBtn: false,
		destroy: false,
		selector: false,
		delegate_target: true,
		no_arrow: false,
		self: false,

		location: {
			position: 'top',
			align: 'center',
			side: 'out',
			offset: 0,
			parent: 'body',
			width: false,
			maxWidth: false,
			fixed: false,
			includeMargin: true,
			props: {
				ver: 'bottom',
				hor: 'right'
			}
		}
	};

	Tooltip.prototype =
	{
		constructor: Tooltip,
		type: TYPE,

		init: function (_nElem, _options)
		{
			this.element = _nElem;
			this.target  = _nElem;
			this.options = _getOptions.call(this, _options);

			var options = this.options,
				xTrigger = options.trigger;

			if (_nElem.tagName.toLowerCase() === 'select' && typeof _nElem._selectbox !== 'undefined')
			{
				this.target = _nElem._selectbox.node.input;
			}

			this.template = $('<div>').html(_getCloseBtn.call(this) + _getMessage.call(this))
				.addClass(  this.type + '_' + options.type + 
							' ' + ((options.location.side === 'in' || options.no_arrow) ? 'no' : options.location.align) + '_arrow' + 
							' ' + options.location.position + 
							(options.animation ? ' animation' : '') + 
							(options.location.fixed ? ' fixed' : '') + 
							(options.location.side === 'in' ? ' inset': ' outset'))
				.get(0);
			this.isHidden = true;
			this.eventTargets = [];

			options.close = parseFloat(parseFloat(options.close).toFixed(1)) || 0;
			options.delete = options.destroy ? 'remove' : 'detach';

			if (xTrigger)
			{
				if (xTrigger.show || xTrigger.hide)
				{
					var sTriggers = '',
						xSelf = options.self,
						bSelfShow = _.isString(xSelf) ? xSelf === 'show' : xSelf,
						bSelfHide = _.isString(xSelf) ? xSelf === 'hide' : xSelf;

					if (xTrigger.show)
					{
						sTriggers = sTriggers + ' ' + xTrigger.show;
						if (bSelfShow === 'both')
						{
							_setHandlers.call(this, this.template, xTrigger.show, 'show');
							_setHandlers.call(this, this.target, xTrigger.show, 'show');
						}
						else
						{
							_setHandlers.call(this, (bSelfShow ? this.template: this.target), xTrigger.show, 'show');
						}
					}
					if (xTrigger.hide)
					{
						sTriggers = sTriggers + ' ' + xTrigger.hide;
						if (bSelfShow === 'both')
						{
							_setHandlers.call(this, this.template, xTrigger.hide, 'hide');
							_setHandlers.call(this, this.target, xTrigger.hide, 'hide');
						}
						else
						{
							_setHandlers.call(this, (bSelfHide ? this.template: this.target), xTrigger.hide, 'hide');
						}
					}

					options.trigger = sTriggers;
				}
				else
				{
					if (options.self === 'both')
					{
						_setHandlers.call(this, this.template, xTrigger);
						_setHandlers.call(this, this.target, xTrigger);
					}
					else
					{
						_setHandlers.call(this, (options.self ? this.template: this.target), xTrigger);
					}
				}
			}

			if (this.template.querySelector('.close') !== null)
			{
				this.template._jQ().on('click.' + this.type, '.close', this.hide.bind(this));
			}

			if (options.visible)
			{
				this.show();
			}

			return this;
		},

		show: function (e)
		{
			if (this.options.selector && !this.options.delegate_target && e && e.currentTarget !== e.delegateTarget)
			{
				this.target = e.currentTarget;
				this.template.innerHTML = _getMessage.call(this) + _getCloseBtn.call(this);
				this.options.placeTo.update = true;
				this.options.placeTo.target = this.target;
			}
			else
			{
				this.options.placeTo.update = false;
			}

			if (_.isWindowHidden && !this.isHidden)
			{
				return false;
			}

			this.hoverState = 'in';

			if (this.timeout)
			{
				clearTimeout(this.timeout);
			}

			var that = this;

			this.timeout = setTimeout(function()
			{
				if (that.hoverState === 'in')
				{
					_show.call(that);
				}
			}, this.options.delay.show);
		},

		hide: function (e)
		{
			if (_.isWindowHidden && this.isHidden)
			{
				return false;
			}

			/* if element is still in focus and its tooltip should be closed on blur - do nothing */
			if (e &&
				e.type.toLowerCase() !== 'blur' &&
				((_.isString(this.options.trigger) && this.options.trigger.indexOf('focus') > -1) ||
				 (this.options.trigger.hide && this.options.trigger.hide.indexOf('blur') > -1)) &&
				document.activeElement === this.target)
			{
				return false;
			}

			this.hoverState = 'out';

			if (this.timeout)
			{
				clearTimeout(this.timeout);
			}

			var that = this;

			this.timeout = setTimeout(function()
			{
				if (that.hoverState === 'out')
				{
					that.options.destroy ? that.destroy() : _hide.call(that);
				}
			}, this.options.delay.hide);
		},

		toggle: function (e)
		{
			this.template.classList.contains('in') ? this.hide(e) : this.show(e);
		},

		destroy: function ()
		{
			this.hoverState = 'out';

			var nTip = this.template,
				that = this;

			this.template.placer && this.template.placer.destroy();
			this.timeout && clearTimeout(this.timeout);
			this.closeTimeout && clearTimeout(this.closeTimeout);

			_.forEach(this.eventTargets, function (_nTarget)
			{
				_nTarget._jQ().off('.' + that.type);
			});
			delete this.element['_' + TYPE];

			this.options.delete = 'remove';
			_hide.call(this);
		}
	};


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

	$.fn.tooltip = function ( options )
	{
		options || (options = {});

		return this.each(function ()
		{
			var plugin = this['_' + TYPE];

			if (_.isObject(options))
			{
				if (plugin)
				{
					plugin.destroy();
				}
				this['_' + TYPE] = new Tooltip(this, options);
			}
			else if (plugin && _.isString(options) && options in plugin)
			{
				plugin[options]();
			}
		});
	};

	$.fn.tooltip.Constructor = Tooltip;

	var _getOptions = function (_options)
		{
			var options = $.extend(true, {}, Tooltip.DEFAULTS, _options, this.element._jQ().data());

			if (_.isObject(options.delay))
			{
				options.delay = {
					show: parseInt(options.delay.show) || 0,
					hide: parseInt(options.delay.hide) || 50
				}
			}
			else
			{
				options.delay = {
					show: parseInt(options.delay) || 0,
					hide: parseInt(options.delay) || 50
				}
			}

			options.placeTo = {
				target: this.target,
				location: options.location
			};

			return options;
		},

		_getMessage = function ()
		{
			var xMessage = '',
				el = this.element,
				_xMessage = this.options.message;

			if (el.hasAttribute('title'))
			{
				el.setAttribute('data-tooltip-message', el.getAttribute('title'));
				el.removeAttribute('title');
			}

			xMessage = el.getAttribute('data-tooltip-message')
				|| (_.isFunction(_xMessage) ? (_xMessage.call(el) || '') : _xMessage);

			return xMessage;
		},

		_getCloseBtn = function ()
		{
			var xTrigger = this.options.trigger;

			return this.options.closeBtn || this.options.self && (_.isString(xTrigger) ? (xTrigger.indexOf('click') > -1) : (xTrigger.hide && xTrigger.hide.indexOf('click') > -1)) ? '<span class="close"></span>' : '';
		},

		_setHandlers = function (_nTarget, _aTriggers, _sAction)
		{
			this.eventTargets.push(_nTarget);

			var aTriggers = _aTriggers.split(' '),
				sAction = _sAction || 'toggle',
				sEventIn, sEventOut, sTrigger, i, L;

			for (i = 0, L = aTriggers.length; i < L; i++)
			{
				sTrigger = aTriggers[i];

				if (sTrigger === 'hover' || sTrigger === 'focus')
				{
					sEventIn  = sTrigger === 'hover' ? 'mouseenter' : 'focus';
					sEventOut = sTrigger === 'hover' ? 'mouseleave' : 'blur';
					_nTarget._jQ().on(sEventIn  + '.' + this.type, this.options.selector, this.show.bind(this));
					_nTarget._jQ().on(sEventOut + '.' + this.type, this.options.selector, this.hide.bind(this));
				}
				else
				{
					_nTarget._jQ().on(sTrigger + '.' + this.type, this.options.selector, this[sAction].bind(this));
				}
			}
		},

		_show = function ()
		{
			if (!this.isHidden)
			{
				return false;
			}

			this.isHidden = false;

			if (this.options.animation)
			{
				this.template._jQ().off('transitionend');
			}

			if (this.options.location.fixed)
			{
				this.template.style.maxWidth = 'none';
			}

			this.template._jQ().detach().placeTo(this.options.placeTo);
			this.template.classList.remove('out');
			this.template.classList.add('in');

			this.element._jQ().trigger('show');
			this.template._jQ().trigger('show');

			if (this.options.close > 0)
			{
				var that = this;

				this.closeTimeout = setTimeout(function ()
				{
					that[that.options.destroy ? 'destroy' : 'hide']();
				}, this.options.close * 1000);
			}

			return true;
		},

		_hide = function ()
		{
			var that = this,
				afterHide = function ()
				{
					that.template._jQ()[that.options.delete]();

					that.element._jQ().trigger('hide');
					that.template._jQ().trigger('hide');
				};

			if (this.isHidden)
			{
				afterHide();
			}
			else
			{
				if (this.options.animation)
				{
					this.template._jQ().one('transitionend', function ()
					{
						if (that.hoverState === 'out')
						{
							afterHide();
						}
					});
				}
				else
				{
					afterHide();
				}

				this.template.classList.remove('in');
				this.template.classList.add('out');
			}

			this.isHidden = true;

			return this;
		};

})(jQuery);