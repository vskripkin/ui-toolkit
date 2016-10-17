(function ()
{
	'use strict';

	var TYPE = 'toast',

		nContainer = (function ()
		{
			var sContId = 'toast-container';

			if (document.readyState === 'loading' || document.readyState === 'uninitialized')
			{
				document.write('<div id="' + sContId + '"></div>');
				return document.getElementById(sContId);
			}
			else
			{
				var nDiv = document.createElement('div');
					nDiv.id = sContId;

				document.body.appendChild(nDiv);

				return nDiv;
			}
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

			this.options = $.extend(true, {}, Toast.DEFAULTS, _options);
			this.toast = _createToast.call(this, _sMessage, this.options.class);
			this._timeleft = this.options.lifetime;
			this.playing = false;
			this._onWH = { waiting: false };
			this._onWV = { waiting: false };

			nContainer.appendChild(this.toast);

			if (_.isMobile)
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
				this.toast._jQ().on('click', '.js-close', this.hide.bind(this));
			}

			this.toast.style.marginBottom = (-1 * (this.toast.offsetHeight + 10)) + 'px';

			var that = this;
			setTimeout(function ()
			{
				that.toast.classList.add('is-visible');
			}, 0);

			this.start();

			if (_.isFunction(this.options.onInit))
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

				if (_.isWindowHidden)
				{
					this._onWindowHidden();
				}
				else
				{
					this._timer = setTimeout(this.hide.bind(this), this._timeleft);

					if (this._onWH.waiting)
					{
						_.offWindowHidden(this._onWH.f);
					}

					this._onWH = _.onWindowHidden(this._onWindowHidden.bind(this));
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
				_.offWindowHidden(this._onWH.f);
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
				_.offWindowVisible(this._onWV.f);
			}

			this._onWV = _.onWindowVisible(this.start.bind(this));

			return true;
		},

		hide: function (_bForced)
		{
			if (!_bForced && _.isWindowHidden)
			{
				return this._onWindowHidden(500);
			}

			var that = this;

			this.stop();

			this.toast._jQ().on('transitionend', function (e)
			{
				if (e.target === this)
				{
					that.toast._jQ().off('transitionend');
					that.destroy();
				}
			});

			this.toast.classList.add('is-hiding');
			this.toast.style.marginTop = (-1 * this.toast.offsetHeight) + 'px';

			return true;
		},

		destroy: function ()
		{
			this.destroyed = true;

			if (_.isFunction(this.options.onDestroy))
			{
				this.options.onDestroy();
			}

			if (this._onWH.waiting)
			{
				_.offWindowHidden(this._onWH.f);
			}
			if (this._onWV.waiting)
			{
				_.offWindowVisible(this._onWV.f);
			}

			if (this._hammer)
			{
				this._hammer.off('pan', this._onPan);
				this._hammer.off('panend', this._onPanEnd);
				this._hammer.off('tap', this._onTap);
				this._hammer.destroy();
			}

			this.toast._jQ().remove();

			return true;
		}
	};

	$[TYPE] = function (_sMessage, _options)
	{
		return new Toast(_sMessage, _options);
	};

	var _createToast = function (_xMessage, _sClass)
	{
		var nToast = document.createElement('div');
			nToast.className = 'toast' + (_sClass ? ' ' + _sClass: '');

		if (_.isString(_xMessage))
		{
			nToast.insertAdjacentHTML('beforeend', _xMessage);
		}
		else
		{
			if (_xMessage instanceof jQuery)
			{
				_xMessage = _xMessage.get(0);
			}

			nToast.appendChild(_xMessage);
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

		nToast.style[_.prefix.css + 'transform'] = 'translateX(' + iDeltaX + 'px)';
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
				nToast.style[_.prefix.css + 'transform'] = 'translateX(0px)';
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

})();