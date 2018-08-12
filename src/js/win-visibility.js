/* to define window is active */
;(function ($, _, undefined)
{
	'use strict';

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
		eMap = {
			focus: false,
			focusin: false,
			pageshow: false,
			blur: true,
			focusout: true,
			pagehide: true
		},
		onChange = function (e)
		{
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
	else if ('onfocusin' in document)
	{
		if (document.addEventListener)
		{
			document.addEventListener('focusin', onChange);
			document.addEventListener('focusout', onChange);
		}
		else if (document.attachEvent)
		{
			document.attachEvent('onfocusin', onChange);
			document.attachEvent('onfocusout', onChange);
		}
	}
	// All others:
	else
	{
		if (window.addEventListener)
		{
			window.addEventListener('focus', onChange);
			window.addEventListener('blur', onChange);
		}
		else if (window.attachEvent)
		{
			window.attachEvent('onfocus', onChange);
			window.attachEvent('onblur', onChange);
		}
	}
})(window.jQuery, window._);
