;(function ($, undefined)
{
	'use strict';

	var TYPE = 'autosize',

		aCopyStyle = [
			'minWidth',
			'maxWidth',
			'minHeight',
			'maxHeight',
			'paddingTop',
			'paddingRight',
			'paddingBottom',
			'paddingLeft',
			'fontFamily',
			'fontSize',
			'fontWeight',
			'fontStyle',
			'lineHeight',
			'letterSpacing',
			'textTransform',
			'wordSpacing',
			'textIndent',
			'borderWidth',
			'borderStyle'
		],

		Autosize = function (_nElem, _options)
		{
			this.init(_nElem, _options);
		},
		AutosizeProxy = function (_nElem, _sSelector, _options)
		{
			this.init(_nElem, _sSelector, _options);
		};

	Autosize.DEFAULTS = {
		selector: '',
		placeholder: '',
		lineGap: '  ',
		heightGap: 0,
		lazy: false,
		minWidth: false,
		maxWidth: false,
		minHeight: false,
		maxHeight: false
	};

	AutosizeProxy.prototype = {
		init: function (_nElem, _sSelector, _options)
		{
			this.$el = $(_nElem);
			this.selector = _sSelector;
			this.options = $.extend({}, Autosize.DEFAULTS, _options);

			Autosize.massRefit(this.$el.find(_sSelector).toArray(), this.options);

			this.$el.on('focus.' + TYPE +'-proxy', _sSelector, this.setup.bind(this))
					.on('autosize.' + TYPE +'-proxy', _sSelector, this.refit.bind(this));
		},
		setup: function (e)
		{
			$(e.target).autosize(this.options);
		},
		refit: function (e)
		{
			Autosize.refit(this.getMirror(e.target), e.target, this.options);
		},
		getMirror: function (_nElem)
		{
			if (this.mirror && Autosize.getCont().contains(this.mirror))
			{
				return this.mirror;
			}

			return (this.mirror = Autosize.createMirror(_nElem, this.options));
		},
		destroy: function ()
		{
			if (this.__destroyed) return;

			this.__destroyed = true;

			this.$el.off('.' + TYPE +'-proxy');
			this.$el.find(this.selector).autosize('destroy');
			this.mirror.parentNode && this.mirror.parentNode.removeChild(this.mirror);

			delete this.el[TYPE + '-proxy'];
		}
	};

	Autosize.prototype =
	{
		constructor: Autosize,

		init: function(_nElem, _options)
		{
			this.el = _nElem;
			this.$el = $(_nElem);
			this.options = $.extend({}, Autosize.DEFAULTS, _options);

			if (this.options.lazy)
			{
				this.$el.one('focus', this.setup.bind(this));
			}
			else
			{
				this.setup();
			}
		},
		setup: function ()
		{
			var nElem = this.el,
				options = this.options;

			this.bTextarea = nElem.tagName.toLowerCase() === 'textarea';
			this.mirror = Autosize.createMirror(nElem, options);

			Autosize.refit(this.mirror, nElem, options);

			this.$el.on('input.' + TYPE + ' change.' + TYPE, this.onInput.bind(this));
		},
		onInput: function ()
		{
			if (this.bTextarea)
			{
				var nTxtArea = this.el,
					iStart = nTxtArea.selectionStart,
					iEnd = nTxtArea.selectionEnd;

				nTxtArea.value = nTxtArea.value.replace(/[ \t\v\f\r]{2}/g, ' \u00A0');
				nTxtArea.selectionStart = iStart;
				nTxtArea.selectionEnd = iEnd;
			}

			Autosize.updateSize(this.mirror, this.el, this.options);
		},
		destroy: function ()
		{
			if (this.__destroyed) return;

			this.__destroyed = true;

			this.$el.off('.' + TYPE);
			this.mirror.parentNode && this.mirror.parentNode.removeChild(this.mirror);

			delete this.el[TYPE];
		}
	};

	Autosize.getCont = function ()
	{
		if (Autosize.__cont)
		{
			return Autosize.__cont;
		}

		var nWrp = document.createElement('div'),
			nCont = document.createElement('div');

		nWrp.style.position = 'absolute';
		nWrp.style.top = 0;
		nWrp.style.left = 0;
		nWrp.style.zIndex = -1000;
		nWrp.style.visibility = 'hidden';
		nWrp.style.opacity = 0;
		nWrp.style.pointerEvents = 'none';
		nWrp.style.overflow = 'hidden';
		nWrp.style.width = '0px';
		nWrp.style.height = '0px';

		nCont.style.position = 'absolute';
		nCont.style.top = 0;
		nCont.style.left = 0;
		nCont.style.width = '10000px';

		nWrp.appendChild(nCont);
		document.body.appendChild(nWrp);

		return (Autosize.__cont = nCont);
	};
	Autosize.createMirror = function (_nElem, _options)
	{
		var nMirror = document.createElement('div'),
			oStyle = window.getComputedStyle(_nElem),
			i, L;

		for (i = 0, L = aCopyStyle.length; i < L; i++)
		{
			nMirror.style[aCopyStyle[i]] = oStyle[aCopyStyle[i]];
		}

		nMirror.style.position = 'absolute';
		nMirror.style.top = 0;
		nMirror.style.left = 0;
		nMirror.style.zIndex = -1000;
		nMirror.style.visibility = 'hidden';
		nMirror.style.opacity = 0;
		nMirror.style.pointerEvents = 'none';

		if (_nElem.tagName.toLowerCase() === 'textarea')
		{
			nMirror.style.whiteSpace = 'pre-wrap';
			nMirror.style.wordWrap = oStyle.wordWrap;
			nMirror.style.wordBreak = oStyle.wordBreak;
			nMirror.style.resize = 'none';
			nMirror.style.overflow = 'hidden';
			nMirror.style.overflowY = 'hidden';
			nMirror.style.setProperty('overflow-x', 'hidden', 'important');

			if (_options.heightGap)
			{
				nMirror.style.paddingBottom = (parseFloat(oStyle.paddingBottom) + _options.heightGap) + 'px';
			}
		}
		else
		{
			nMirror.style.whiteSpace = 'pre';
			nMirror.style.overflow = oStyle.overflow;
			nMirror.style.textOverflow = oStyle.textOverflow;
		}

		_options.minWidth && (nMirror.style.minWidth = _options.minWidth + (_options.minWidth > -1 ? 'px' : ''));
		_options.maxWidth && (nMirror.style.maxWidth = _options.maxWidth + (_options.maxWidth > -1 ? 'px' : ''));
		_options.minHeight && (nMirror.style.minHeight = _options.minHeight + (_options.minHeight > -1 ? 'px' : ''));
		_options.maxHeight && (nMirror.style.maxHeight = _options.maxHeight + (_options.maxHeight > -1 ? 'px' : ''));

		Autosize.getCont().appendChild(nMirror);

		return nMirror;
	};
	Autosize.massRefit = function (_aElems, _options)
	{
		if (!_aElems || !_aElems.length) return;

		var nMirror = Autosize.createMirror(_aElems[0], _options),
			i, L;

		for (i = 0, L = _aElems.length; i < L; i++)
		{
			Autosize.refit(nMirror, _aElems[i], _options);
		}

		nMirror.parentNode.removeChild(nMirror);
	};
	Autosize.refit = function (_nMirror, _nSource, _options)
	{
		if (_nSource.tagName.toLowerCase() === 'textarea')
		{
			_nSource.style.resize = 'none';
			_nSource.style.overflow = 'hidden';
			_nSource.style.overflowY = 'hidden';
			_nSource.style.setProperty('overflow-x', 'hidden', 'important');

			_nSource.value = _nSource.value.replace(/[ \t\v\f\r]{2}/g, ' \u00A0');
		}

		Autosize.updateSize(_nMirror, _nSource, _options);
	};
	Autosize.updateSize = function (_nMirror, _nSource, _options)
	{
		Autosize.setMirrorContent(_nMirror, _nSource, _options);

		var bTextarea = _nSource.tagName.toLowerCase() === 'textarea',
			oMirrorSize = Autosize.getMirrorSize(_nMirror, _nSource, bTextarea),
			iParentWidth;

		if (!bTextarea)
		{
			_nSource.style.width = oMirrorSize.width + 'px';

			iParentWidth = _nSource.parentNode.offsetWidth;
			if (_nSource.offsetWidth > iParentWidth)
			{
				_nSource.style.width = iParentWidth + 'px';
			}

			return;
		}

		_nSource.style.width = oMirrorSize.width + 'px';
		_nSource.style.height = oMirrorSize.height + 'px';

		iParentWidth = _nSource.parentNode.offsetWidth;
		if (_nSource.offsetWidth > iParentWidth)
		{
			_nSource.style.width = iParentWidth + 'px';
		}

		if (oMirrorSize.overflow)
		{
			Autosize.switchOverflow(_nMirror, _nSource, 'scroll');
		}
		else
		{
			Autosize.switchOverflow(_nMirror, _nSource, 'hidden');
		}
	};
	Autosize.setMirrorContent = function (_nMirror, _nSource, _options)
	{
		_nMirror.innerHTML = (_nSource.value ||
			_options.placeholder ||
			_nSource.getAttribute('placeholder') || ' \u00A0') + '\u200b';
	};
	Autosize.getMirrorSize = function (_nMirror, _nSource, _bTextarea)
	{
		if (!_bTextarea)
		{
			return {
				width: _nMirror.offsetWidth + 1
			};
		}

		return {
			width: _nMirror.offsetWidth + 1,
			height: _nMirror.offsetHeight + 1,
			overflow: _nMirror.scrollHeight > _nMirror.clientHeight
		};
	};
	Autosize.switchOverflow = function (_nMirror, _nSource, _sValue)
	{
		if (_nMirror.style.overflowY !== _sValue)
		{
			_nMirror.style.overflowY = _sValue;
			_nSource.style.overflowY = _sValue;
		}
	};

	$.fn.autosize = function (_options)
	{
		return this.each(function ()
		{
			var data = this[TYPE];

			if (!data)
			{
				this[TYPE] = new Autosize(this, _options);
			}
			else if (data && typeof _options === 'string')
			{
				data[_options]();
			}
		});
	};
	$.fn.autosize_proxy = function (_options)
	{
		return this.each(function ()
		{
			var data = this[TYPE + '-proxy'];

			if (!data)
			{
				this[TYPE + '-proxy'] = new AutosizeProxy(this, _options);
			}
			else if (data && typeof _options === 'string')
			{
				data[_options]();
			}
		});
	};
})(window.jQuery);
