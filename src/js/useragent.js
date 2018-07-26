/* to define device is mobile */
;(function ($, _, undefined)
{
	'use strict';

	var sUserAgent = window.navigator.userAgent || window.navigator.vendor || window.opera,
		isIOS = /iPhone|iPad|iPod/i.test(sUserAgent),
		isAndroid = /Android/i.test(sUserAgent),
		isMobile = /webOS|BlackBerry|IEMobile|Opera Mini/i.test(sUserAgent);

	_.isMobile = isIOS || isAndroid || isMobile;
	_.isAndroid = isAndroid;
	_.isIOS = isIOS;
	_.isTouchable = ('ontouchstart' in window) ||
		(window.DocumentTouch && document instanceof DocumentTouch) ||
		window.navigator.maxTouchPoints;

	_.isIE = !!(document.all && document.compatMode) || window.navigator.msPointerEnabled;
})(jQuery, window._);
