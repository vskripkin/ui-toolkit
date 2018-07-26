/* cross-browser method to set scrollTop */
;(function ($, _, undefined)
{
	'use strict';

	if (!('pageYOffset' in window))
	{
		Object.defineProperty(window, 'pageYOffset', {
			get: function()
			{
				return document.documentElement.scrollTop;
			}
		});
	}

	_.scrollTop = function (_iValue)
	{
		if (!_.isUndefined(_iValue))
		{
			if (window.scrollTo)
			{
				window.scrollTo(0, _iValue);
			}
			else if (document.scrollingElement)
			{
				document.scrollingElement.scrollTop = _iValue;
			}
			else
			{
				document.documentElement.scrollTop = _iValue;
				document.body && (document.body.scrollTop = _iValue);
			}
		}

		return window.pageYOffset ||
			(document.scrollingElement && document.scrollingElement.scrollTop) ||
			document.documentElement.scrollTop || 0;
	};
})(jQuery, window._);
