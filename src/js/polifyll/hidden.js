import isBro from '../isBrowser.js';

if (isBro && document.documentElement.hidden === undefined)
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
