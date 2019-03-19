import isBro from '../isBrowser.js';

if (isBro && typeof window.CustomEvent !== 'function')
{
	function CustomEvent (_sEvent, _options)
	{
		_options = _options || {
			bubbles: false,
			cancelable: false,
			detail: undefined
		};

		var oEvent = document.createEvent('CustomEvent');

		oEvent.initCustomEvent(_sEvent,
				_options.bubbles,
				_options.cancelable,
				_options.detail);

		return oEvent;
	};

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;
}
