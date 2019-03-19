import isBro from '../isBrowser.js';

if (isBro && !('pageYOffset' in window))
{
	Object.defineProperty(window, 'pageYOffset', {
		get: function ()
		{
			return document.documentElement.scrollTop;
		}
	});
}
