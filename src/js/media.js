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
	_.media.small = function ()
	{
		return window.innerWidth <= this.SMALL;
	};
	_.media.mediumUp = function ()
	{
		return window.innerWidth > this.SMALL;
	};
	_.media.mediumOnly = function ()
	{
		var w = window.innerWidth;

		return w > this.SMALL && w <= this.MEDIUM;
	};
	_.media.largeUp = function ()
	{
		return window.innerWidth > this.MEDIUM;
	};
	_.media.largeOnly = function ()
	{
		var w = window.innerWidth;

		return w > this.MEDIUM && w <= this.LARGE;
	};
	_.media.xlargeUp = function ()
	{
		return window.innerWidth > this.LARGE;
	};
	_.media.xlargeOnly = function ()
	{
		var w = window.innerWidth;

		return w > this.LARGE && w <= this.XLARGE;
	};
	_.media.xxlarge = function ()
	{
		return window.innerWidth > this.XLARGE;
	};
})(jQuery, window._);
