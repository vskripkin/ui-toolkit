/* resize iframe on window.resize */
;(function ($, _, undefined)
{
	'use strict';

	_.iframeHeight = function (_nIframe)
	{
		var iWidth = _nIframe.offsetWidth,
			iHeight = _nIframe.offsetHeight,
			iRatio = _nIframe._heightRatio;

		if (!iWidth || !iHeight) return;

		if (!iRatio)
		{
			_nIframe._heightRatio = iRatio = iHeight / iWidth;
			_nIframe.style.maxWidth = '100%';
		}

		_nIframe.style.height = (iWidth * iRatio) + 'px';
	};
	_.iframeHeightFix = function ()
	{
		_.forEach(document.querySelectorAll('iframe:not(.do-not-resize)'), _.iframeHeight);
	};
})(jQuery, window._);
