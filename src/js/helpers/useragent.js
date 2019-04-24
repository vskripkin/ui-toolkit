import isBro from '../isBrowser.js';


var isAndroid = null,
	isIOS = null,
	isMobile = null,
	isTouchable = null,
	isIE = null;

if (isBro)
{
	var sUserAgent = window.navigator.userAgent || window.navigator.vendor || window.opera;

	isAndroid = /Android.+Mobi(le)?/i.test(sUserAgent);
	isIOS = /iPhone|iPad|iPod/i.test(sUserAgent);
	isMobile = isAndroid || isIOS || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(sUserAgent);
	isTouchable = ('ontouchstart' in window) || window.navigator.maxTouchPoints;
	isIE = !!(document.all && document.compatMode) || window.navigator.msPointerEnabled;
}

export default {
	isAndroid: isAndroid,
	isIOS: isIOS,
	isMobile: isMobile,
	isTouchable: isTouchable,
	isIE: isIE
};
