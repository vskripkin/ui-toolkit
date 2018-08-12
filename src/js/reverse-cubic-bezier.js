/* rotate cubic-bezier curve on 180 degrees  */
;(function ($, _, undefined)
{
	'use strict';

	_.reverseCubicBezier = function (_aCurve)
	{
		var iMaxX = Math.max(_aCurve[0].x, _aCurve[1].x, 1),
			iMaxY = Math.max(_aCurve[0].y, _aCurve[1].y, 1),
			rotate180deg = function (_oPoint)
			{
				var iHX = iMaxX/2,
					iHY = iMaxY/2;

				return {
					x: iHX - (_oPoint.x - iHX),
					y: iHY - (_oPoint.y - iHY)
				};
			},
			aRotatedCurve = _aCurve.map(rotate180deg).reverse();

		return aRotatedCurve;
	};
})(window.jQuery, window._);
