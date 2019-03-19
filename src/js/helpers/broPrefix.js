import isBro from '../isBrowser.js';


var sPre = '',
	sDom = '';

if (isBro)
{
	var cssStyleDeclerationToArray = function (_oStyles)
		{
			var Arr;

			try
			{
				Arr = Array.apply(null, _oStyles);
			}
			catch (e)
			{
				Arr = [];
				_oStyles || (_oStyles = {});

				for (var i = 0, L = _oStyles.length; i < L; i++)
				{
					Arr.push(_oStyles.item(i));
				}
			}

			return Arr;
		},

		oStyles = window.getComputedStyle(document.documentElement, '') ||
				  window.getComputedStyle(document.createElement('div'), '');

	sPre = (
		cssStyleDeclerationToArray(oStyles).join('').match(/-(moz|ms|webkit)-/) ||
		(oStyles.cssText || '').match(/-(moz|ms|webkit)-/) ||
		Object.keys(oStyles).join(',').match(/,(moz|ms|webkit)(?=[A-Z])/) ||
		['', '']
	)[1];

	sDom = ('Webkit|Moz|ms').match(new RegExp('(' + sPre + ')', 'i'))[1];
}

export default {
	dom: sDom,
	css: sPre ? '-' + sPre + '-' : sPre,
	js: sPre,
	lowercase: sPre
};
