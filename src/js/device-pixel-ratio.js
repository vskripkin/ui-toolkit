/* https://gist.github.com/CezaryDanielNowak/9074032 */
;(window.devicePixelRatio = (function ()
{
	var isFirefox = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

	if (typeof window.devicePixelRatio !== 'undefined' && !isFirefox)
	{
		return window.devicePixelRatio;
	}

	if (window.matchMedia)
	{
		var mediaQuery = function (v, ov)
			{
				return '(-webkit-min-device-pixel-ratio: ' + v + '),' +
						'(min--moz-device-pixel-ratio: ' + v + '),' +
						'(-o-min-device-pixel-ratio: ' + ov + '),' +
						'(min-resolution: ' + v + 'dppx)';
			};

		if (window.matchMedia(mediaQuery('1.5', '3/2')).matches) return 1.5;
		if (window.matchMedia(mediaQuery('2', '2/1')).matches) return 2;
		if (window.matchMedia(mediaQuery('0.75', '3/4')).matches) return 0.7;
	}

	return 1;
})());
