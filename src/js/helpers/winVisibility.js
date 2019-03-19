import isBro from '../isBrowser.js';
import isFunction from '../utils/isFunction.js';


export default {
	isHidden:   is_win_hidden,

	onVisible:  on_win_visible,
	offVisible: off_win_visible,

	onHidden:   on_win_hidden,
	offHidden:  off_win_hidden
};


var isWindowHidden = false,
	aWhenVisible = [],
	aWhenHidden  = [],

	run_callbacks = function (_aCallbacks)
	{
		while (_aCallbacks.length)
		{
			var callback = _aCallbacks.shift();

			callback.onWinVisChange.waiting = false;
			callback.onWinVisChange = null;

			if (isFunction(callback))
			{
				callback();
			}
		}
	},
	on_callback  = function (_callback, _aCallbacks)
	{
		_aCallbacks.push(_callback);
		_callback.onWinVisChange = {
			waiting: true,
			callback: _callback
		};

		return _callback.onWinVisChange;
	},
	off_callback = function (_callback, _aCallbacks)
	{
		var i = _aCallbacks.indexOf(_callback);

		if (i > -1)
		{
			_aCallbacks.splice(i, 1);

			_callback.onWinVisChange.waiting = false;
			_callback.onWinVisChange = null;
		}

		return true;
	};


function is_win_hidden ()
{
	return isWindowHidden;
};

function on_win_hidden (_callback)
{
	return  on_callback(_callback, aWhenHidden);
};
function off_win_hidden (_callback)
{
	return off_callback(_callback, aWhenHidden);
};

function on_win_visible (_callback)
{
	return  on_callback(_callback, aWhenVisible);
};
function on_window_hidden (_callback)
{
	return off_callback(_callback, aWhenVisible);
};


if (isBro)
{
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
				isWindowHidden = eMap[e.type];
			}
			else
			{
				isWindowHidden = this[hidden];
			}

			if (isWindowHidden)
			{
				run_callbacks(aWhenHidden);
			}
			else
			{
				run_callbacks(aWhenVisible);
			}
		};

	// Standards:
	if (hidden in document)
	{
		document.addEventListener('visibilitychange', onChange);
	}
	else if ((hidden = 'mozHidden') in document)
	{
		document.addEventListener('mozvisibilitychange', onChange);
	}
	else if ((hidden = 'webkitHidden') in document)
	{
		document.addEventListener('webkitvisibilitychange', onChange);
	}
	else if ((hidden = 'msHidden') in document)
	{
		document.addEventListener('msvisibilitychange', onChange);
	}
	// All others:
	else
	{
		if (window.addEventListener)
		{
			window.addEventListener('focus', onChange);
			window.addEventListener('blur',  onChange);
		}
		else if (window.attachEvent)
		{
			window.attachEvent('onfocus', onChange);
			window.attachEvent('onblur',  onChange);
		}
	}
}
