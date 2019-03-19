import isBro from '../isBrowser.js';


export default {
	prop: 'margin',
	side: 'right',
	selector: '.js-scrollbar-offset',

	_hidden: false,
	_width: 0,
	_prevOverflow: '',
	_prevMargin: '',

	_num: 0,

	_first: true,

	hide: function (_callback)
	{
		if (!isBro) return;


		if (this._first)
		{
			this.prop = this.prop ? (this.prop + '-') : '';
			this._first = false;
		}

		this._num++;

		if (this._hidden)
		{
			return false;
		}

		this._hidden = true;


		var nHTML = document.documentElement,
			iWidth = this.width(),
			sProp = this.prop,
			sSide = this.side;

		this._width = iWidth;
		this._prevOverflow = nHTML.style.overflow;
		this._prevMargin = nHTML.style[sProp + sSide];

		nHTML.style.overflow = 'hidden';
		nHTML.style[sProp + sSide] = iWidth + 'px';


		var anNeedOffset = document.querySelectorAll(this.selector),
			nElem, sDataProp,
			i, L;

		for (i = 0, L = anNeedOffset.length; i < L; i++)
		{
			nElem = anNeedOffset[i];
			sDataProp = nElem.getAttribute('data-offset-prop');

			if (sDataProp === 'true')
			{
				nElem.style[sSide] = iWidth + 'px';
			}
			else if (sDataProp)
			{
				nElem.style[sDataProp + '-' + sSide] = iWidth + 'px';
			}
			else
			{
				nElem.style[sProp + sSide] = iWidth + 'px';
			}
		}


		if (_callback)
		{
			_callback(iWidth, sSide, sProp);
		}
	},
	restore: function (_callback, _bRightNow)
	{
		if (!isBro) return;


		this._num--;

		if (!this._hidden || (this._num > 0 && !_bRightNow))
		{
			return false;
		}

		this._hidden = false;


		var sProp = this.prop,
			sSide = this.side,
			nHTML = document.documentElement;

		nHTML.style.overflow = this._prevOverflow;
		nHTML.style[sProp + sSide] = this._prevMargin;

		this._prevOverflow = '';
		this._prevMargin = '';


		var anNeedOffset = document.querySelectorAll(this.selector),
			nElem, sDataProp,
			i, L;

		for (i = 0, L = anNeedOffset.length; i < L; i++)
		{
			nElem = anNeedOffset[i];
			sDataProp = nElem.getAttribute('data-offset-prop');

			if (sDataProp === 'true')
			{
				nElem.style[sSide] = '';
			}
			else if (sDataProp)
			{
				nElem.style[sDataProp + '-' + sSide] = '';
			}
			else
			{
				nElem.style[sProp + sSide] = '';
			}
		}


		if (_callback)
		{
			_callback(this._width, sSide, sProp);
		}
	},
	width: function ()
	{
		if (!isBro) return 0;

		return Math.round(window.innerWidth - document.documentElement.clientWidth);
	}
};
