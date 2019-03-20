import './polifyll/CustomEvent.js';

import {isTouchable} from './helpers/useragent.js';
import support       from './helpers/support.js';

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
const sTransitionEnd = support.transition.end;

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
	message: '', // string|function
	type: 'info',
	trigger: 'hover focus', // string|{show:string, hide:string}
	triggerer: 'target', // target|self|both

	once: false,
	visible: false,
	animation: true,

	delay: 0,
	close: 0,

	no_arrow: false,
	close_btn: false, // string

	selector: false,
	show_at_selected: false,

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
	noop: function () {},

	init: function (_nElem, _options)
	{
		this._afterHide = this._afterHide.bind(this);
		this._onTrsnEndHide = this._onTrsnEndHide.bind(this);

		this.options      =
		this.isHidden     =
		this.timeout      =
		this.closeTimeout =
		this.eventTargets =
		this.element      =
		this.target       = null;


		this.element = _nElem;
		this.target  = _nElem.__resolveTarget && _nElem.__resolveTarget() || _nElem;
		this.options = this.getOptions(_nElem, _options);

		this.placeTo = {
			target: this.target,
			location: this.options.location
		};

		this.isHidden = true;
		this.eventTargets = [];

		var options = this.options;


		this.wrapper = (function ()
		{
			var nDiv = document.createElement('div');

			nDiv.className = TYPE + '_' + 'wrp';
			nDiv.style.position = options.location.fixed ? 'fixed' : 'absolute';
			nDiv.style.zIndex = 10000000;

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

			nDiv.innerHTML = this.getCloseBtn() + this.getMessage();

			return nDiv;
		})
		.call(this);

		this.wrapper.appendChild(this.template);


		var xTrigger = options.trigger,
			sTriggerer = options.triggerer,
			sTriggererShow = is_string(sTriggerer) ? sTriggerer : sTriggerer.show,
			sTriggererHide = is_string(sTriggerer) ? sTriggerer : sTriggerer.hide;

		if (xTrigger && (xTrigger.show || xTrigger.hide))
		{
			var sTriggers = '',
				sTriggersShow = xTrigger.show,
				sTriggersHide = xTrigger.hide;

			if (sTriggersShow)
			{
				sTriggers += ' ' + sTriggersShow;

				if (sTriggererShow === 'both' || sTriggererShow === 'self')
				{
					this._setupTriggers(this.template, sTriggersShow, 'show');
				}
				if (sTriggererShow === 'both' || sTriggererShow === 'target')
				{
					this._setupTriggers(this.target, sTriggersShow, 'show');
				}
			}

			if (sTriggersHide)
			{
				sTriggers += ' ' + sTriggersHide;

				if (sTriggererHide === 'both' || sTriggererHide === 'self')
				{
					this._setupTriggers(this.template, sTriggersHide, 'hide');
				}
				if (sTriggererHide === 'both' || sTriggererHide === 'target')
				{
					this._setupTriggers(this.target, sTriggersHide, 'hide');
				}
			}

			options.trigger = sTriggers;
		}
		else if (xTrigger)
		{
			if (sTriggerer === 'both' || sTriggerer === 'self')
			{
				this._setupTriggers(this.template, xTrigger);
			}
			if (sTriggerer === 'both' || sTriggerer === 'target')
			{
				this._setupTriggers(this.target, xTrigger);
			}
		}


		if (this.template.querySelector('.js-close') !== null)
		{
			this._attachEvent(this.template, 'click', '.js-close', this.hide.bind(this));
		}

		if (options.visible)
		{
			this.show();
		}

		return this;
	},
	destroy: function ()
	{
		this.wrapper.placer && this.wrapper.placer.destroy();
		this.timeout && clearTimeout(this.timeout);
		this.closeTimeout && clearTimeout(this.closeTimeout);

		this._removeEvents();

		delete this.element['_' + TYPE];


		this.destroy =
		this.show =
		this._show =
		this.toggle = this.noop;

		this.hide();
	},

	getOptions: function (_nElem, _options)
	{
		var oData;

		try
		{
			oData = JSON.parse(_nElem.getAttribute('data-' + TYPE));
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
	getMessage: function ()
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
	getCloseBtn: function ()
	{
		if (this.options.close_btn)
		{
			return this.options.close_btn;
		}


		var xTrigger = this.options.trigger,
			sTriggerHide = xTrigger.hide || xTrigger,

			xTriggerer = this.options.triggerer,
			sTriggererHide = xTriggerer.hide || xTriggerer,

			bSelf = sTriggererHide === 'self' || sTriggererHide === 'both';

		if (bSelf && sTriggerHide.indexOf('click') > -1)
		{
			return '<span class="js-close close"></span>';
		}

		return '';
	},


	showtouch: function (e)
	{
		this.show(e, 'showtouch');
	},

	toggle: function (e)
	{
		this.isHidden ? this.show(e) : this.hide(e);
	},

	show: function (e, _sActionType)
	{
		var bShowAtSelected = this.options.selector && this.options.show_at_selected;

		if (bShowAtSelected && e && e.currentTarget !== e.delegateTarget)
		{
			if (this.target !== e.currentTarget)
			{
				this.isHidden = true;
			}

			this.target = e.currentTarget;
			this.placeTo.update = true;

			this.template.innerHTML = this.getCloseBtn() + this.getMessage();
			this.placeTo.target = this.target;
		}
		else
		{
			this.placeTo.update = false;
		}


		if (!this.isHidden) return false;

		this.isHidden = false;

		if (this.options.animation)
		{
			this.template.removeEventListener(sTransitionEnd, this._onTrsnEndHide, false);
		}


		if (this.timeout)
		{
			clearTimeout(this.timeout);
		}

		var that = this;

		this.timeout = setTimeout(function ()
		{
			if (!that.isHidden)
			{
				that._show(_sActionType);
			}
		}, this.options.delay.show);
	},
	_show: function (_sActionType)
	{
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

		this.element.dispatchEvent(new CustomEvent(TYPE + '-show'));
		this.template.dispatchEvent(new CustomEvent(TYPE + '-show'));


		var iClose = this.options.close;

		if (iClose === 0 && _sActionType === 'showtouch')
		{
			iClose = 1.5;
		}

		if (iClose > 0)
		{
			this.closeTimeout = setTimeout(this.hide.bind(this), iClose * 1000);
		}

		return true;
	},

	hide: function (e)
	{
		if (this.isHidden) return false;


		var xTrigger = this.options.trigger,
			bHideOnBlur = is_string(xTrigger) ?
				xTrigger.indexOf('focus') > -1 :
				xTrigger.hide.indexOf('blur') > -1;

		/* if element is still in focus and its tooltip should be closed on blur - do nothing */
		if (e && e.type.toLowerCase() !== 'blur' && bHideOnBlur && document.activeElement === this.target)
		{
			return false;
		}


		this.isHidden = true;


		if (this.timeout)
		{
			clearTimeout(this.timeout);
		}

		var that = this;

		this.timeout = setTimeout(function ()
		{
			if (that.isHidden)
			{
				that._hide();
			}
		}, this.options.delay.hide);
	},
	_hide: function ()
	{
		if (this.options.animation)
		{
			this.template.addEventListener(sTransitionEnd, this._onTrsnEndHide, false);
		}
		else
		{
			this._afterHide();
		}

		this.template.classList.remove('in');
		this.template.classList.add('out');

		return this;
	},
	_onTrsnEndHide: function ()
	{
		this.template.removeEventListener(sTransitionEnd, this._onTrsnEndHide, false);

		if (this.isHidden)
		{
			this._afterHide();
		}
	},
	_afterHide: function ()
	{
		if (this.wrapper.parentElement)
		{
			this.wrapper.parentElement.removeChild(this.wrapper);
		}

		this.element.dispatchEvent(new CustomEvent(TYPE + '-hide'));
		this.template.dispatchEvent(new CustomEvent(TYPE + '-hide'));

		if (this.options.once)
		{
			this.destroy();
		}
	},


	_setupTriggers: function (_nTarget, _sTriggers, _sAction)
	{
		var aTriggers = _sTriggers.split(' '),
			sEventIn, sEventOut, sEvent,
			i, L;

		for (i = 0, L = aTriggers.length; i < L; i++)
		{
			sEvent = aTriggers[i];

			if (isTouchable &&
				(sEvent === 'hover' || sEvent === 'mouseenter') && (!_sAction || _sAction === 'show'))
			{
				this._attachEvent(_nTarget, 'touchstart', this.options.selector, this.showtouch.bind(this));
			}
			else if (_sAction)
			{
				this._attachEvent(_nTarget, sEvent, this.options.selector, this[_sAction].bind(this));
			}
			else if (sEvent === 'hover' || sEvent === 'focus')
			{
				sEventIn  = sEvent === 'hover' ? 'mouseenter' : 'focus';
				sEventOut = sEvent === 'hover' ? 'mouseleave' : 'blur';

				this._attachEvent(_nTarget, sEventIn,  this.options.selector, this.show.bind(this));
				this._attachEvent(_nTarget, sEventOut, this.options.selector, this.hide.bind(this));
			}
			else
			{
				this._attachEvent(_nTarget, sEvent, this.options.selector, this.toggle.bind(this));
			}
		}
	},

	_attachEvent: function (_nTarget, _sEvent, _sSelector, _callback)
	{
		if (_sSelector)
		{
			var handler = this._onSelectorMatch(_sSelector, _callback);

			_nTarget.addEventListener(_sEvent, handler, false);

			this.eventTargets.push([_nTarget, _sEvent, handler]);
		}
		else
		{
			_nTarget.addEventListener(_sEvent, _callback, false);

			this.eventTargets.push([_nTarget, _sEvent, _callback]);
		}
	},
	_removeEvents: function ()
	{
		for_each(this.eventTargets, function (_oData)
		{
			_oData[0].removeEventListener(_oData[1], _oData[2], false);
		});

		this.eventTargets.length = 0;
	},

	_onSelectorMatch: function (_sSelector, _callback)
	{
		return function (e)
		{
			e.delegateTarget = this;

			var nTarget = e.target,
				aTargets = this.querySelectorAll(_sSelector);

			if (aTargets.indexOf(nTarget) > -1)
			{
				e.currentTarget = nTarget;

				_callback(e);
			}
			else
			{
				for (var i = 0, L = aTargets.length; i < L; i++)
				{
					if (aTargets[i].contains(nTarget))
					{
						e.currentTarget = aTargets[i];

						_callback(e);
						break;
					}
				}
			}
		};
	}
};
