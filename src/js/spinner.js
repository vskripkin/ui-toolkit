(function ($, _)
{
	'use strict';

	var TYPE = 'spinner',

		Spinner = function (_nElem, _options)
		{
			return this.init(_nElem, _options);
		};

	Spinner.DEFAULTS = {
		step: 1,
		float: 0,
		default: 1,
		editable: false,
		min: Number.NEGATIVE_INFINITY,
		max: Number.POSITIVE_INFINITY
	};

	Spinner.prototype =
	{
		constructor: Spinner,
		type: TYPE,

		init: function (_nElem, _options)
		{
			this.input = _nElem.querySelector('input');

			if (this.input === null)
			{
				return undefined;
			}

			this.element = _nElem;
			this.options = $.extend({}, Spinner.DEFAULTS, _options, _nElem._jQ().data());
			this.input.value = this.options.default;

			if (!this.options.editable)
			{
				this.input.setAttribute('readonly', 'readonly');
			}

			this.incBtn = $('<span class="inc">');
			this.decBtn = $('<span class="dec">');

			this.btnWrp = $('<div class="btn_wrp">')
							.append(this.incBtn)
							.append(this.decBtn)
							.appendTo(this.element);

			this.incBtn.on('mousedown.' + this.type, this.inc.bind(this));
			this.decBtn.on('mousedown.' + this.type, this.dec.bind(this));

			return this;
		},

		inc: function (e)
		{
			e.stopPropagation();
			e.preventDefault();

			var iValue = parseFloat((parseFloat(this.input.value) + this.options.step).toFixed(this.options.float));
			if (iValue <= this.options.max)
			{
				this.input.value = iValue;
				this.input._jQ.trigger('change');
			}
		},
		dec: function (e)
		{
			e.stopPropagation();
			e.preventDefault();

			var iValue = parseFloat((parseFloat(this.input.value) - this.options.step).toFixed(this.options.float));
			if (iValue >= this.options.min)
			{
				this.input.value = iValue;
				this.input._jQ.trigger('change');
			}
		},

		destroy: function ()
		{
			this.incBtn.off().remove();
			this.decBtn.off().remove();
			this.btnWrp.remove();

			if (!this.options.editable)
			{
				this.input.removeAttribute('readonly');
			}

			delete this['_' + this.type];
		}
	};

	$.fn.spinner = function ( options )
	{
		options || (options = {});

		return this.each(function ()
		{
			var plugin = this['_' + TYPE];

			if (_.isObject(options))
			{
				if (plugin)
				{
					plugin.destroy();
				}
				this['_' + TYPE] = new Spinner(this, options);
			}
			else if (_.isString(options) && options in plugin)
			{
				plugin[options]();
			}
		});
	}

	$.fn.spinner.Constructor = Spinner;

}(jQuery, _));
