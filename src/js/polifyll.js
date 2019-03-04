;(function ()
{
	if (document.documentElement.hidden === undefined)
	{
		Object.defineProperty(Element.prototype, 'hidden', {
			set: function (_bHidden)
			{
				_bHidden ? this.setAttribute('hidden', true) : this.removeAttribute('hidden');
			},
			get: function ()
			{
				return this.getAttribute('hidden');
			}
		});
	}


	if (typeof window.CustomEvent !== 'function')
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
})();
