import Hammer from 'hammerjs';

import broPrefix  from './helpers/broPrefix.js';
import winVis     from './helpers/winVisibility.js';
import {isMobile} from './helpers/useragent.js';

import extend      from './utils/extend.js';
import is_string   from './utils/isString.js';
import is_function from './utils/isFunction.js';


var TYPE = 'toast',

	nContainer = (function ()
	{
		var sContId = 'toast-container',
			create_container = function ()
			{
				var nDiv = document.createElement('div');

				nDiv.id = sContId;
				nDiv.className = 'js-scrollbar-offset';
				document.body.appendChild(nDiv);

				return nDiv;
			};

		if (document.readyState === 'loading' || document.readyState === 'uninitialized')
		{
			document.write('<div id="' + sContId + '" class="js-scrollbar-offset"></div>');
		}
		else
		{
			create_container();
		}

		return {
			appendChild: function (_nToast)
			{
				nContainer = document.getElementById(sContId);

				if (!nContainer)
				{
					nContainer = create_container();
				}

				nContainer.appendChild(_nToast);
			}
		};
	})(),

	iActivationDistance = 100,

	Toast = function (_sMessage, _options)
	{
		this.options    =
		this.toast      =
		this.playing    =
		this.destroyed  =

		this._timestart =
		this._timeleft  =
		this._timer     =
		this._hammer    =
		this._onPan     =
		this._onPanEnd  =
		this._onTap     =
		this._onWH      =
		this._onWV      = null;

		return this.init(_sMessage, _options);
	};


export default Toast;


Toast.DEFAULTS = {
	class: '',
	lifetime: 5000,

	onInit: undefined,
	onDestroy: undefined
};

Toast.prototype =
{
	constructor: Toast,
	type: TYPE,

	init: function (_sMessage, _options)
	{
		if (!_sMessage)
		{
			return false;
		}

		this.options = extend(true, {}, Toast.DEFAULTS, _options);
		this.toast = _createToast.call(this, _sMessage, this.options.class);
		this._timeleft = this.options.lifetime;
		this.playing = false;
		this._onWH = { waiting: false };
		this._onWV = { waiting: false };

		var nToast = this.toast,
			oToastClassList = nToast.classList;

		oToastClassList.add('is-preparing');
		nContainer.appendChild(nToast);
		nToast.style.marginBottom = (-1 * nToast.scrollHeight) + 'px';
		nToast.style.height = nToast.scrollHeight + 'px';

		setTimeout(function ()
		{
			oToastClassList.remove('is-preparing');
			nToast.style.height = 'auto';

			setTimeout(function ()
			{
				oToastClassList.add('is-visible');
				nToast.style.marginBottom = '0px';

				oToastClassList = nToast = null;
			}, 1000/60);
		}, 1000/60);

		if (isMobile)
		{
			this._onPan    =    _onPan.bind(this);
			this._onPanEnd = _onPanEnd.bind(this);
			this._onTap    =    _onTap.bind(this);

			this._hammer = new Hammer(this.toast);
			this._hammer.on('pan',    this._onPan);
			this._hammer.on('panend', this._onPanEnd);
			this._hammer.on('tap',    this._onTap);
		}
		else
		{
			var that = this;

			nToast.addEventListener('click', function (e)
			{
				var nTarget = e.target;

				if (!nTarget.classList.contains('js-close'))
				{
					nTarget = nTarget.closest('.js-close');

					if (!nTarget || !nToast.contains(nTarget)) return;
				}

				that.hide(e);
			}, false);
		}

		this.start();

		if (is_function(this.options.onInit))
		{
			this.options.onInit();
		}

		return this;
	},

	start: function ()
	{
		if (this.playing)
		{
			return false;
		}

		if (this._timeleft > 0)
		{
			this.playing = true;
			this._timestart = Date.now();

			if (winVis.isHidden())
			{
				this._onWindowHidden();
			}
			else
			{
				this._timer = setTimeout(this.hide.bind(this), this._timeleft);

				if (this._onWH.waiting)
				{
					winVis.offHidden(this._onWH.callback);
				}

				this._onWH = winVis.onHidden(this._onWindowHidden.bind(this));
			}

			return true;
		}
		else
		{
			return this.hide();
		}
	},

	stop: function ()
	{
		if (this.destroyed || !this.playing)
		{
			return false;
		}

		this.playing = false;

		if (this._timer)
		{
			clearTimeout(this._timer);
			this._timer = null;
		}

		var iTimePassed = Date.now() - this._timestart,
			iTimeLeft   = this._timeleft - iTimePassed;

		if (iTimeLeft < 0)
		{
			iTimeLeft = 0;
		}

		this._timeleft = iTimeLeft;

		if (this._onWH.waiting)
		{
			winVis.offHidden(this._onWH.callback);
		}

		return true;
	},

	_onWindowHidden: function (_iTimeLeft)
	{
		this.stop();

		if (_iTimeLeft)
		{
			this._timeleft = _iTimeLeft;
		}

		if (this._timeleft < 3000)
		{
			this._timeleft += 1000;
		}

		if (this._onWV.waiting)
		{
			winVis.offVisible(this._onWV.callback);
		}

		this._onWV = winVis.onVisible(this.start.bind(this));

		return true;
	},

	hide: function (_bForced)
	{
		if (!_bForced && winVis.isHidden())
		{
			return this._onWindowHidden(500);
		}

		var that = this;

		this.stop();

		this.toast.addEventListener('transitionend', function on_transitionend (e)
		{
			if (e.target === this)
			{
				that.toast.removeEventListener('transitionend',
					on_transitionend, {passive: true, capture: false});
				that.destroy();
			}
		}, {passive: true, capture: false});

		this.toast.classList.add('is-hiding');
		this.toast.style.marginTop = (-1 * this.toast.offsetHeight) + 'px';

		return true;
	},

	destroy: function ()
	{
		this.destroyed = true;

		if (is_function(this.options.onDestroy))
		{
			this.options.onDestroy();
		}

		if (this._onWH.waiting)
		{
			winVis.offHidden(this._onWH.callback);
		}
		if (this._onWV.waiting)
		{
			winVis.offVisible(this._onWV.callback);
		}

		if (this._hammer)
		{
			this._hammer.off('pan', this._onPan);
			this._hammer.off('panend', this._onPanEnd);
			this._hammer.off('tap', this._onTap);
			this._hammer.destroy();
		}

		if (this.toast.parentElement)
		{
			this.toast.parentElement.removeChild(this.toast);
		}

		return true;
	}
};


var _createToast = function (_xMessage, _sClass)
{
	var nToast = document.createElement('div'),
		nToastInner = document.createElement('div');

	nToast.className = 'toast' + (_sClass ? ' ' + _sClass: '');
	nToastInner.className = 'toast-inner';

	nToast.appendChild(nToastInner);

	if (is_string(_xMessage))
	{
		nToastInner.insertAdjacentHTML('beforeend', _xMessage);
	}
	else
	{
		if (_xMessage instanceof jQuery)
		{
			_xMessage = _xMessage.get(0);
		}

		nToastInner.appendChild(_xMessage);
	}

	return nToast;
},

_onPan = function (e)
{
	this.stop();

	var nToast = this.toast,
		iDeltaX = e.deltaX,
		iOpacityPercent = 1 - Math.abs(iDeltaX / iActivationDistance);

	if (iOpacityPercent < 0)
	{
		iOpacityPercent = 0;
	}
	if (!nToast.classList.contains('is-panning'))
	{
		nToast.classList.add('is-panning');
	}

	nToast.style[broPrefix.css + 'transform'] = 'translateX(' + iDeltaX + 'px)';
	nToast.style.opacity = iOpacityPercent;
},

_onPanEnd = function (e)
{
	var that = this,
		nToast = this.toast,
		iDeltaX = e.deltaX;

	nToast.classList.remove('is-panning');

	setTimeout(function ()
	{
		// If toast dragged past activation point
		if (Math.abs(iDeltaX) > iActivationDistance)
		{
			that.hide();
		}
		else
		{
			nToast.style[broPrefix.css + 'transform'] = 'translateX(0px)';
			nToast.style.opacity = '';

			that.start();
		}
	}, 0);
},

_onTap = function (e)
{
	if (e.target.classList.contains('js-close'))
	{
		this.hide();
	}
};
