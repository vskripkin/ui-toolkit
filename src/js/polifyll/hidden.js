import isBro from '../isBrowser.js';
import isUndefined from '../utils/isUndefined.js';

if (isBro && isUndefined(document.documentElement.hidden))
{
	Object.defineProperty(Element.prototype, 'hidden', {
		set: function (_bHidden)
		{
			_bHidden ? this.setAttribute('hidden', true) : this.removeAttribute('hidden');
		},
		get: function ()
		{
			return !!this.getAttribute('hidden');
		}
	});
}
