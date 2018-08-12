/* to define width of scrollbar */
;(function ($, _, undefined)
{
	'use strict';

	// TODO пересчитать ширину после изменения масштаба страницы

	_.globalScrollbar = {
		prop: 'margin',
		side: 'right',

		_hidden: false,
		_width: 0,
		_prevOverflow: '',
		_prevMargin: '',

		_num: 0,

		hide: function (_fCallback)
		{
			this._num++;

			if (this._hidden)
			{
				return false;
			}

			this._hidden = true;

			var nHTML = document.documentElement,
				sProp = this.prop ? (this.prop + '-') : '';

			this._prevOverflow = nHTML.style.overflow;
			this._prevMargin = nHTML.style[sProp + this.side];

			nHTML.style.overflow = 'hidden';
			nHTML.style[sProp + this.side] = this._width + 'px';

			if (_.isFunction(_fCallback))
			{
				_fCallback(this._width, this.side, this.prop);
			}
			else
			{
				var anNeedOffset = document.querySelectorAll('.js-scrollbar-offset');

				_.forEach(anNeedOffset, function (_nElem)
				{
					var sDataProp = _nElem.getAttribute('data-offset-prop');

					if (sDataProp === 'true')
					{
						_nElem.style[this.side] = this._width + 'px';
					}
					else if (sDataProp)
					{
						_nElem.style[sDataProp + '-' + this.side] = this._width + 'px';
					}
					else
					{
						_nElem.style[sProp + this.side] = this._width + 'px';
					}
				},
				this);
			}
		},
		restore: function (_fCallback, _bRightNow)
		{
			this._num--;

			if (!this._hidden || (this._num > 0 && !_bRightNow))
			{
				return false;
			}

			var sProp = this.prop ? (this.prop + '-') : '';

			this._hidden = false;

			document.documentElement.style.overflow = this._prevOverflow;
			document.documentElement.style[sProp + this.side] = this._prevMargin;

			this._prevOverflow = '';
			this._prevMargin = '';

			if (_.isFunction(_fCallback))
			{
				_fCallback(this._width, this.side, this.prop);
			}
			else
			{
				var anNeedOffset = document.querySelectorAll('.js-scrollbar-offset');

				_.forEach(anNeedOffset, function (_nElem)
				{
					var sDataProp = _nElem.getAttribute('data-offset-prop');

					if (sDataProp === 'true')
					{
						_nElem.style[this.side] = '';
					}
					else if (sDataProp)
					{
						_nElem.style[sDataProp + '-' + this.side] = '';
					}
					else
					{
						_nElem.style[sProp + this.side] = '';
					}
				},
				this);
			}
		},

		_set: function (_nFiredElem, _ID)
		{
			var that = this;

			setTimeout(function ()
			{
				that.set(_nFiredElem, _ID);
			}, 0);
		},
		set: function (_nFiredElem, _ID)
		{
			var nWrp =  _nFiredElem.parentElement ||
						_nFiredElem.parentNode ||
						document.getElementById(_ID) ||
						document.querySelector('#' + _ID) ||
						window[_ID];

			if (!nWrp || !nWrp.offsetWidth)
			{
				this._set.apply(this, arguments);
				return;
			}

			var nInr =  nWrp.firstElementChild ||
						nWrp.firstChild ||
						nWrp.children.item(0);

			this._width = nWrp.offsetWidth - nInr.offsetWidth;
			this.side = document.documentElement.getAttribute('dir') === 'rtl' ? 'left' : 'right';

			if (this._hide)
			{
				this._hide(this._hideCallback);

				this.hide = this._hide;
				this._hide = null;
				this._hideCallback = null;
			}

			if (nWrp.parentElement || nWrp.parentNode)
			{
				(nWrp.parentElement || nWrp.parentNode).removeChild(nWrp);
			}
			else
			{
				nWrp.outerHTML = '';
			}

			nWrp = nInr = _nFiredElem = null;
		}
	};

	(function ()
	{
		_.globalScrollbar._hide = _.globalScrollbar.hide;

		_.globalScrollbar.hide = function (_fCallback)
		{
			if (_fCallback)
			{
				this._hideCallback = _fCallback;
			}

			var ID = _.randomStr(),
				STYLE_WRP = 'position: absolute !important;' +
							'top:     -150px  !important;'  +
							'left:    -150px  !important;' +
							'width:    100px  !important;' +
							'height:   100px  !important;' +
							'overflow: scroll !important;',

				STYLE_INR = 'display: block !important;' +
							'width:   100%  !important;' +
							'height:  20px  !important;',

				nDivWrp = document.createElement('div'),
				nDivInr = document.createElement('div');

			nDivWrp.id = ID;
			nDivWrp.setAttribute('style', STYLE_WRP);
			nDivInr.setAttribute('style', STYLE_INR);

			nDivWrp.appendChild(nDivInr);
			document.body.appendChild(nDivWrp);

			_.globalScrollbar.set(nDivInr, ID);
		};
	})();
})(window.jQuery, window._);
