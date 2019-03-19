import {isTouchable} from './helpers/useragent.js';

import is_function   from './utils/isFunction.js';
import is_object     from './utils/isObject.js';
import is_string     from './utils/isString.js';
import for_each      from './utils/forEach.js';
import extend        from './utils/extend.js';


export default function Tooltip (_nElem, _options)
{
	return this.init(_nElem, _options);
};


const TYPE = 'tooltip';

Tooltip.get = function (_nElem, _options)
{
	var plugin = _nElem['_' + TYPE];

	if (is_object(options))
	{
		if (plugin)
		{
			plugin.destroy();
		}

		_nElem['_' + TYPE] = plugin = new Tooltip(_nElem, options);
	}

	return plugin;
};

Tooltip.DEFAULTS = {
	animation: true,
	trigger: 'hover focus',
	triggerer: 'target', // target|self|both
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
	self: false, // true|false|show|hide|both

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
		this._afterHide = this._afterHide.bind(this);
		this._onTrsnEndHide = this._onTrsnEndHide.bind(this);

		this.options      =
		this.isHidden     =
		this.timeout      =
		this.closeTimeout =
		this.hoverState   =
		this.eventTargets =
		this.element      =
		this.target       = null;


		this.element = _nElem;
		this.target  = _nElem.__resolveTarget && _nElem.__resolveTarget() || _nElem;
		this.options = _getOptions.call(this, _options);

		this.placeTo = {
			target: this.target,
			location: this.options.location
		};

		var options = this.options;


		this.wrapper = (function ()
		{
			var nDiv = document.createElement('div');

			nDiv.className = TYPE + '_' + 'wrp';
			nDiv.style.position = options.location.fixed ? 'fixed' : 'absolute';
			nDiv.style.zIndex = 10000000

			return nDiv;
		})
		.call(this);

		this.template = (function ()
		{
			var nDiv = document.createElement('div');

			nDiv.className = TYPE + '_' + options.type + 
				' ' +  options.location.position + 
				' ' + (options.no_arrow ? 'no' : options.location.align) + '_arrow' + 
				' ' + (options.animation ? 'animation' : '') + 
				' ' + (options.location.fixed ? 'fixed' : '') + 
				' ' + (options.location.side === 'in' ? 'inset': 'outset');

			nDiv.innerHTML = _getCloseBtn.call(this) + _getMessage.call(this);

			return nDiv;
		})
		.call(this);

		this.wrapper.appendChild(this.template);


		this.isHidden = true;
		this.eventTargets = [];


		var xTrigger = options.trigger,
			xTriggerer = options.triggerer,
			sTriggererShow = is_string(xTriggerer) ? xTriggerer : xTriggerer.show,
			sTriggererHide = is_string(xTriggerer) ? xTriggerer : xTriggerer.hide;

		if (xTrigger && (xTrigger.show || xTrigger.hide))
		{
			var sTriggers = '';

			if (xTrigger.show)
			{
				sTriggers += ' ' + xTrigger.show;

				if (sTriggererShow === 'both' || sTriggererShow === 'self')
				{
					_setHandlers.call(this, this.template, xTrigger.show, 'show');
				}
				if (sTriggererShow === 'both' || sTriggererShow === 'target')
				{
					_setHandlers.call(this, this.target, xTrigger.show, 'show');
				}
			}

			if (xTrigger.hide)
			{
				sTriggers += ' ' + xTrigger.hide;

				if (sTriggererHide === 'both' || sTriggererHide === 'self')
				{
					_setHandlers.call(this, this.template, xTrigger.hide, 'hide');
				}
				if (sTriggererHide === 'both' || sTriggererHide === 'target')
				{
					_setHandlers.call(this, this.target, xTrigger.hide, 'hide');
				}
			}

			options.trigger = sTriggers;
		}
		else if (xTrigger)
		{
			if (sTriggererShow === 'both' || sTriggererShow === 'self')
			{
				_setHandlers.call(this, this.template, xTrigger);
			}
			if (sTriggererShow === 'both' || sTriggererShow === 'target')
			{
				_setHandlers.call(this, this.target, xTrigger);
			}
		}


		if (this.template.querySelector('.js-close') !== null)
		{
			this.template.addEventListener('click',
				_onSelectorMatch('.js-close', this.hide.bind(this)), false);
		}

		if (options.visible)
		{
			this.show();
		}

		return this;
	},
	destroy: function ()
	{
		this.hoverState = 'out';

		this.wrapper.placer && this.wrapper.placer.destroy();
		this.timeout && clearTimeout(this.timeout);
		this.closeTimeout && clearTimeout(this.closeTimeout);

		var that = this;

		for_each(this.eventTargets, function (_nTarget)
		{
			// TODO
			//_nTarget._jQ().off('.' + that.type);
		});
		delete this.element['_' + TYPE];

		_hide.call(this);
	},

	show: function (e)
	{
		if (this.options.selector && !this.options.delegate_target &&
			e && e.currentTarget !== e.delegateTarget)
		{
			this.target = e.currentTarget;
			this.template.innerHTML = _getCloseBtn.call(this) + _getMessage.call(this);
			this.placeTo.update = true;
			this.placeTo.target = this.target;
		}
		else
		{
			this.placeTo.update = false;
		}

		if (!this.isHidden) return false;


		this.hoverState = 'in';

		if (this.timeout)
		{
			clearTimeout(this.timeout);
		}

		var that = this;

		this.timeout = setTimeout(function ()
		{
			if (that.hoverState === 'in')
			{
				that._show();
			}
		}, this.options.delay.show);
	},
	hide: function (e)
	{
		if (this.isHidden)
		{
			return false;
		}

		/* if element is still in focus and its tooltip should be closed on blur - do nothing */
		if (e &&
			e.type.toLowerCase() !== 'blur' &&
			((is_string(this.options.trigger) && this.options.trigger.indexOf('focus') > -1) ||
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

		this.timeout = setTimeout(function ()
		{
			if (that.hoverState === 'out')
			{
				that.options.destroy ? that.destroy() : that._hide();
			}
		}, this.options.delay.hide);
	},
	toggle: function (e)
	{
		this.template.classList.contains('in') ? this.hide(e) : this.show(e);
	},

	_show: function ()
	{
		if (!this.isHidden) return false;


		this.isHidden = false;

		if (this.options.animation)
		{
			this.template.removeEventListener('transitionend', this._onTrsnEndHide, false);
		}

		if (this.options.location.fixed)
		{
			this.template.style.maxWidth = 'none';
		}

		if (this.wrapper.parentElement)
		{
			this.wrapper.parentElement.removeChild(this.wrapper);
		}

		Placer.placeTo(this.wrapper, this.placeTo);

		this.template.classList.remove('out');
		this.template.classList.add('in');

		// TODO
		//this.element._jQ().trigger( TYPE + '-show');
		//this.template._jQ().trigger(TYPE + '-show');

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
	_hide: function ()
	{
		var that = this;

		if (this.isHidden)
		{
			this._afterHide();
		}
		else
		{
			if (this.options.animation)
			{
				this.template.addEventListener('transitionend', this._onTrsnEndHide, false);
			}
			else
			{
				this._afterHide();
			}

			this.template.classList.remove('in');
			this.template.classList.add('out');
		}

		this.isHidden = true;

		return this;
	},

	_afterHide: function ()
	{
		if (this.wrapper.parentElement)
		{
			this.wrapper.parentElement.removeChild(this.wrapper);
		}

		// TODO
		//this.element._jQ().trigger( TYPE + '-hide');
		//this.template._jQ().trigger(TYPE + '-hide');
	},
	_onTrsnEndHide: function ()
	{
		this.template.removeEventListener('transitionend', this._onTrsnEndHide, false);

		if (this.hoverState === 'out')
		{
			this._afterHide();
		}
	}
};


var _getOptions = function (_options)
	{
		var oData;

		try
		{
			oData = JSON.parse(this.element.getAttribute('data-' + TYPE));
		}
		catch (e)
		{
			oData = {};
		};


		var options = extend(true, {}, Tooltip.DEFAULTS, _options, oData);

		if (is_object(options.delay))
		{
			options.delay = {
				show: parseInt(options.delay.show) || 0,
				hide: parseInt(options.delay.hide) || 50
			};
		}
		else
		{
			options.delay = {
				show: parseInt(options.delay) || 0,
				hide: parseInt(options.delay) || 50
			};
		}

		options.close = parseFloat(parseFloat(options.close).toFixed(1)) || 0;

		return options;
	},
	_getMessage = function ()
	{
		var sMessage = '',
			el = this.element;

		if (el.hasAttribute('title'))
		{
			el.setAttribute('data-' + TYPE + '-message', el.getAttribute('title'));
			el.removeAttribute('title');
		}


		sMessage = el.getAttribute('data-' + TYPE + '-message');

		if (!sMessage)
		{
			sMessage = this.options.message;

			if (is_function(sMessage))
			{
				sMessage = sMessage.call(el) || '';
			}
		}

		return sMessage;
	},
	_getCloseBtn = function ()
	{
		var xTrigger = this.options.trigger;

		return this.options.closeBtn || this.options.self &&
			(
				is_string(xTrigger) ?
					(xTrigger.indexOf('click') > -1) :
					(xTrigger.hide && xTrigger.hide.indexOf('click') > -1)
			)
			&& '<span class="js-close close"></span>'
			|| '';
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

				if (isTouchable && sEventIn === 'mouseenter')
				{
					this.options.close || (this.options.close = 1);

					_nTarget.addEventListener('touchstart',
						_onSelectorMatch(this.options.selector, this.show.bind(this)), false);
				}
				else
				{
					_nTarget.addEventListener(sEventIn,
						_onSelectorMatch(this.options.selector, this.show.bind(this)), false);

					_nTarget.addEventListener(sEventOut,
						_onSelectorMatch(this.options.selector, this.hide.bind(this)), false);
				}
			}
			else
			{
				_nTarget.addEventListener(sTrigger,
					_onSelectorMatch(this.options.selector, this[sAction].bind(this)), false);
			}
		}
	},

	_onSelectorMatch = function (_sSelector, _callback)
	{
		return function (e)
		{
			var nTarget = e.target,
				aTargets = this.querySelectorAll(_sSelector);

			if (aTargets.indexOf(nTarget) > -1)
			{
				_callback(e);
			}
			else
			{
				for (var i = 0, L = aTargets.length; i < L; i++)
				{
					if (aTargets[i].contains(nTarget))
					{
						_callback(e);
						break;
					}
				}
			}
		};
	};
