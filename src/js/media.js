/* check window width */
;(function ($, _, undefined)
{
	'use strict';

	_.media = function (_oSizes)
	{
		for (var sSize in _oSizes)
		{
			_.media[sSize] = _oSizes[sSize];
		}
	};

	// TODO use window.matchMedia
	_.media.small_ic = function ()
	{
		return window.innerWidth <= this.SMALL_IC;
	};

	_.media.small = function ()
	{
		return window.innerWidth < this.MEDIUM;
	};

	_.media.mediumUp = function ()
	{
		return window.innerWidth >= this.MEDIUM;
	};
	_.media.mediumDown = function ()
	{
		return window.innerWidth < this.LARGE;
	};
	_.media.mediumOnly = function ()
	{
		var w = window.innerWidth;

		return w >= this.MEDIUM && w < this.LARGE;
	};

	_.media.largeUp = function ()
	{
		return window.innerWidth >= this.LARGE;
	};
	_.media.largeDown = function ()
	{
		return window.innerWidth < this.XLARGE;
	};
	_.media.largeOnly = function ()
	{
		var w = window.innerWidth;

		return w >= this.LARGE && w < this.XLARGE;
	};

	_.media.xlargeUp = function ()
	{
		return window.innerWidth >= this.XLARGE;
	};
	_.media.xlargeDown = function ()
	{
		return window.innerWidth < this.XXLARGE;
	};
	_.media.xlargeOnly = function ()
	{
		var w = window.innerWidth;

		return w >= this.XLARGE && w < this.XXLARGE;
	};

	_.media.xxlarge = function ()
	{
		return window.innerWidth >= this.XXLARGE;
	};
})(window.jQuery, window._);
