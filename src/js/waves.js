import Placer from './placer.js';

import {isMobile} from './helpers/useragent.js';
import {css as sCssPrefix} from './helpers/broPrefix.js';

import is_string  from './utils/isString.js';
import is_numeric from './utils/isNumeric.js';
import is_element from './utils/isElement.js';
import random_str from './utils/randomStr.js';


var TYPE = 'wave',

	DEFAULTS = {
		delay: 50,

		duration: {
			opacity: 150,
			transform: 300
		},
		timing: {
			opacity: 'cubic-bezier(0.4,0,0.2,1)',
			transform: 'cubic-bezier(0.4,0,0.2,1)'
		}
	},

	_getElements = function (_xNodes)
	{
		if (is_string(_xNodes))
		{
			return document.querySelectorAll(_xNodes);
		}
		else if (is_element(_xNodes))
		{
			return [_xNodes];
		}
		else if (_xNodes.length)
		{
			return _xNodes;
		}

		return [];
	},
	_getWavesElement = function (e)
	{
		if (!TouchHandler.allowEvent(e))
		{
			return null;
		}

		var nElem = null,
			nTarget = e.target || e.srcElement;

		while (nTarget.parentElement)
		{
			if (nTarget.getAttribute('data-wave'))
			{
				nElem = nTarget;
				break;
			}
			nTarget = nTarget.parentElement;
		}

		return nElem;
	},
	_placeWave = function (_nWave, _nTarget)
	{
		var sTargerName = _nTarget.tagName.toLowerCase();

		if (!/^(input|img)$/.test(sTargerName))
		{
			_nTarget.appendChild(_nWave);
			return;
		}

		if (!_nTarget.getAttribute('data-wave-id'))
		{
			_nTarget.setAttribute('data-wave-id', random_str());
		}

		_nWave.classList.add(_nTarget.getAttribute('data-wave-id'));

		var oStyle = window.getComputedStyle(_nTarget);

		new Placer(null, {
			target: _nTarget,
			placed: _nWave,
			location: {
				position: 'top',
				align: 'start',
				side: 'in',
				parent: _nTarget.parentElement,
				fixed: oStyle.position === 'fixed',
				width: true,
				height: true,
				includeMargin: false
			}
		});
	},
	_startWave = function(e)
	{
		var nElem = _getWavesElement(e);

		if (nElem === null)
		{
			return false;
		}

		if (nElem.disabled || nElem.getAttribute('disabled') || nElem.classList.contains('disabled'))
		{
			return false;
		}

		TouchHandler.registerEvent(e);

		if (e.type === 'touchstart' && Effect.delay)
		{
			var bHidden = false,
				iTimer = setTimeout(function ()
				{
					iTimer = null;
					Effect.show(e, nElem);
				}, Effect.delay),

				/**
				 * stop wave if a touch is moving,
				 * because it's not a "click" on a button,
				 * it is "scrolling" a page
				 */
				touchMove = function(_oMoveEvent)
				{
					if (iTimer)
					{
						clearTimeout(iTimer);
						iTimer = null;
					}
					hideEffect(_oMoveEvent);

					removeListeners(nElem);
				},
				hideEffect = function(_oHideEvent)
				{
					if (iTimer)
					{
						clearTimeout(iTimer);
						iTimer = null;
						bHidden = true;
					}

					if (!bHidden)
					{
						bHidden = true;
						Effect.hide(_oHideEvent, nElem);
					}

					removeListeners(nElem);
				},

				removeListeners = function(_nElem)
				{
					_nElem.removeEventListener('touchmove', touchMove);
					_nElem.removeEventListener('touchend', hideEffect);
					_nElem.removeEventListener('touchcancel', hideEffect);
				};

			nElem.addEventListener('touchmove', touchMove, false);
			nElem.addEventListener('touchend', hideEffect, false);
			nElem.addEventListener('touchcancel', hideEffect, false);
		}
		else
		{
			Effect.show(e, nElem);

			if (isMobile)
			{
				nElem.addEventListener('touchend', Effect.hide, false);
				nElem.addEventListener('touchcancel', Effect.hide, false);
			}

			nElem.addEventListener('mouseup', Effect.hide, false);
			nElem.addEventListener('mouseleave', Effect.hide, false);
		}
	},
	_stopWave = function (e, _nWave)
	{
		if (!_nWave)
		{
			return;
		}

		_nWave.classList.remove('wave-running');

		var iDiff = Date.now() - _nWave[TYPE + '_start'],
			iLeftDuration = _nWave[TYPE + '_duration'] - iDiff,
			iDelay = 350 - iDiff;

		if (iDelay < 0 || iDelay > 150 || e.type === 'mousemove')
		{
			iDelay = 150;
		}

		iLeftDuration = iLeftDuration - iDelay;

		if (iLeftDuration < 150)
		{
			iLeftDuration = 150;
		}

		setTimeout(function()
		{
			_nWave.style.opacity = 0;
			_nWave.style[sCssPrefix + 'transition-duration'] = iLeftDuration + 'ms';

			setTimeout(function()
			{
				if (_nWave.parentElement)
				{
					_nWave.parentElement.removeChild(_nWave);
				}
			}, iLeftDuration);
		}, iDelay);
	},
	_setStyle = function (_nElem, _oStyle)
	{
		var oElemStyleProp = _nElem.style;

		for (var sProp in _oStyle)
		{
			if (_oStyle.hasOwnProperty(sProp))
			{
				oElemStyleProp[sProp] = _oStyle[sProp];
			}
		}
	},

	nWaveSample = (function ()
	{
		var nDiv = document.createElement('div'),
			oStyle = {
				position: 'absolute',
				zIndex: 1000000,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				overflow: 'hidden',
				pointerEvents: 'none',
				borderRadius: 'inherit',
				color: 'inherit',
				opacity: 0,
				willChange: 'opacity',
				'-webkit-tap-highlight-color': 'transparent'
			};

		oStyle[sCssPrefix + 'transition-property'] = 'opacity';
		oStyle[sCssPrefix + 'transition-duration'] = DEFAULTS.duration.opacity + 'ms';
		oStyle[sCssPrefix + 'transition-timing-function'] = DEFAULTS.timing.opacity;
		oStyle[sCssPrefix + 'user-select'] = 'none';

		_setStyle(nDiv, oStyle);
		nDiv.className = 'wave-wrp wave-running';

		return nDiv;
	})(),
	nWaveInnerSample = (function ()
	{
		var nDiv = document.createElement('div'),
			oStyle = {
				position: 'absolute',
				borderRadius: '50%',
				color: 'inherit',
				background: 'currentColor',
				opacity: 0.16,
				willChange: 'transform'
			};

		oStyle[sCssPrefix + 'transition-property'] = 'transform';
		oStyle[sCssPrefix + 'transition-duration'] = DEFAULTS.duration.transform + 'ms';
		oStyle[sCssPrefix + 'transition-timing-function'] = DEFAULTS.timing.transform;
		oStyle[sCssPrefix + 'transform'] = 'scale(0.2)';

		_setStyle(nDiv, oStyle);
		nDiv.className = 'wave';

		return nDiv;
	})(),

	Waves = {
		init: function(_options)
		{
			if (Waves.__inited) return;

			Waves.__inited = true;


			_options || (_options = {});

			if (typeof _options.delay !== 'undefined')
			{
				Effect.delay = _options.delay;
			}
			if (typeof _options.duration !== 'undefined')
			{
				_options.duration.opacity && (Effect.duration.opacity = _options.duration.opacity);
				_options.duration.transform && (Effect.duration.transform = _options.duration.transform);
			}
			if (typeof _options.timing !== 'undefined')
			{
				if (_options.timing.opacity)
				{
					nWaveSample.style[sCssPrefix + 'transition-timing-function'] = _options.timing.opacity;
				}
				if (_options.timing.transform)
				{
					nWaveInnerSample.style[sCssPrefix + 'transition-timing-function'] = _options.timing.transform;
				}
			}

			if (isMobile)
			{
				window.addEventListener('touchstart', _startWave, true);
				window.addEventListener('touchcancel', TouchHandler.registerEvent, true);
				window.addEventListener('touchend', TouchHandler.registerEvent, true);
			}

			window.addEventListener('mousedown', _startWave, true);
		},

		start: function(_xNodes, _options)
		{
			_options || (_options = {});
			_options.position || (_options.position = false);
			is_numeric(_options.wait) && _options.wait > 0 || (_options.wait = 0);

			var aElems = _getElements(_xNodes);

			if (aElems.length)
			{
				var oMousedown = {
						type: 'mousedown',
						button: 1
					},
					nElem, oPos, oBounds;

				for (var i = 0, L = aElems.length; i < L; i++)
				{
					nElem = aElems[i];

					oPos = _options.position || {
						x: nElem.clientWidth / 2,
						y: nElem.clientHeight / 2
					};

					oBounds = nElem.getBoundingClientRect();

					oMousedown.clientX = oBounds.left + oPos.x;
					oMousedown.clientY = oBounds.top  + oPos.y;

					Effect.show(oMousedown, nElem);

					(function (_nElem)
					{
						setTimeout(function()
						{
							Effect.hide({
								type: 'mouseup',
								button: 1
							}, _nElem);
						},
						_options.wait);
					})(nElem);
				}
			}
		},

		stop: function(_xNodes)
		{
			var aElems = _getElements(_xNodes);

			var oMouseup = {
					type: 'mouseup',
					button: 1
				};

			for (var i = 0, L = aElems.length; i < L; i++)
			{
				Effect.hide(oMouseup, aElems[i]);
			}
		}
	},

	Effect = {
		delay: DEFAULTS.delay,
		duration: DEFAULTS.duration,

		show: function(e, _nElem)
		{
			if (e.button === 2)
			{
				return false;
			}

			_nElem || (_nElem = this);

			var oBounds = _nElem.getBoundingClientRect(),
				iTop, iLeft;

			if (_nElem.getAttribute('data-wave') === 'center')
			{
				iTop  = _nElem.clientHeight / 2;
				iLeft = _nElem.clientWidth  / 2;
			}
			else
			{
				if('touches' in e && e.touches.length)
				{
					iTop  = (e.touches[0].clientY - oBounds.top);
					iLeft = (e.touches[0].clientX - oBounds.left);
				}
				else
				{
					iTop  = (e.clientY - oBounds.top);
					iLeft = (e.clientX - oBounds.left);
				}

				iTop < 0  && (iTop  = oBounds.top  + _nElem.clientHeight / 2);
				iLeft < 0 && (iLeft = oBounds.left + _nElem.clientWidth  / 2);
			}

			var iX = ((oBounds.width  - iLeft) > iLeft) ? (oBounds.width  - iLeft) : iLeft,
				iY = ((oBounds.height - iTop)  > iTop)  ? (oBounds.height - iTop)  : iTop,
				iRadius = Math.sqrt(iX * iX + iY * iY),

				oStyle = {
					width:  iRadius * 2 + 'px',
					height: iRadius * 2 + 'px',
					top:    iTop  - iRadius + 'px',
					left:   iLeft - iRadius + 'px'
				},

				nWaveElem  = nWaveSample.cloneNode(),
				nWaveInner = nWaveInnerSample.cloneNode(),

				iOpDuration = e.type === 'mousemove' ? 2500 : Effect.duration.opacity,
				iTrDuration = e.type === 'mousemove' ? 2500 : Effect.duration.transform;

			nWaveElem.style[sCssPrefix + 'transition-duration'] = iOpDuration + 'ms';
			oStyle[sCssPrefix + 'transition-duration'] = iTrDuration + 'ms';

			_setStyle(nWaveInner, oStyle);

			nWaveElem.appendChild(nWaveInner);
			_placeWave(nWaveElem, _nElem);

			nWaveElem[TYPE + '_start'] = Date.now();
			nWaveElem[TYPE + '_duration'] = iOpDuration;

			setTimeout(function ()
			{
				nWaveElem.style.opacity = 1;
				nWaveInner.style[sCssPrefix + 'transform'] = 'scale(1)';
			}, 0);
		},

		hide: function(e, _nElem)
		{
			_nElem || (_nElem = this);

			var sTagName = _nElem.tagName.toLowerCase(),
				aWaves;

			if (/^(input|img)$/.test(sTagName))
			{
				aWaves = _nElem.parentElement.querySelectorAll('.wave-running.' + _nElem.getAttribute('data-wave-id'));
			}
			else
			{
				aWaves = _nElem.querySelectorAll('.wave-running');
			}

			for (var i = 0, L = aWaves.length; i < L; i++)
			{
				_stopWave(e, aWaves[i]);
			}

			if (isMobile)
			{
				_nElem.removeEventListener('touchend', Effect.hide);
				_nElem.removeEventListener('touchcancel', Effect.hide);
			}

			_nElem.removeEventListener('mouseup', Effect.hide);
			_nElem.removeEventListener('mouseleave', Effect.hide);
		}
	},

	TouchHandler = {
		touches: 0,

		allowEvent: function(e)
		{
			var bAllow = true;

			if (this.touches && /^(mousedown|mousemove)$/.test(e.type))
			{
				bAllow = false;
			}

			return bAllow;
		},
		registerEvent: function(e)
		{
			var sType = e.type;

			if (sType === 'touchstart')
			{
				this.touches += 1;
			}
			else if (/^(touchend|touchcancel)$/.test(sType))
			{
				setTimeout(function()
				{
					if (TouchHandler.touches)
					{
						TouchHandler.touches -= 1;
					}
				}, 500);
			}
		}
	};


export default Waves;
