/* get Date from ISO format
 * http://stackoverflow.com/questions/8266710/javascript-date-parse-difference-in-chrome-and-other-browsers
 */
;(function ($, _, undefined)
{
	'use strict';

	_.dateFromISO = (function ()
	{
		var sTestISO = '2011-11-24T09:00:27+0200',
			iDateISO = Date.parse(sTestISO); // Chrome

		if (iDateISO === 1322118027000)
		{
			return function (_sDate)
			{
				return new Date(Date.parse(_sDate));
			};
		}

		// JS 1.8 gecko
		var noOffset = function (_sDate)
			{
				var aDate = _sDate.slice(0,-5).split(/\D/).map(function (_sValue)
					{
						return parseInt(_sValue, 10) || 0;
					});

				aDate[1] -= 1;

				var oDate = new Date(Date.UTC.apply(Date, aDate)),
					sOffsetString = _sDate.slice(-5),
					iOffset = parseInt(sOffsetString, 10) / 100;

				if (sOffsetString.slice(0, 1) === '+')
				{
					iOffset *= -1;
				}

				oDate.setHours(oDate.getHours() + iOffset);
				return oDate;
			};

		if (noOffset(sTestISO).getTime() === 1322118027000)
		{
			return noOffset;
		}

		// kennebec@SO + QTax@SO
		return function (_sDate)
		{
			var rxDate = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/,
				// rxDate = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d{4}))?$/,
				aDate = rxDate.exec(_sDate) || [],
				oDate;

			if (aDate[1])
			{
				oDate = aDate[1].split(/\D/).map(function (_sValue)
				{
					return parseInt(_sValue, 10) || 0;
				});

				oDate[1] -= 1;
				oDate = new Date(Date.UTC.apply(Date, oDate));

				if (!oDate.getDate())
				{
					return NaN;
				}

				if (aDate[5])
				{
					var iTimeZone = parseInt(aDate[5], 10) / 100 * 60;

					if (aDate[6])
					{
						iTimeZone += parseInt(aDate[6], 10);
					}

					if (aDate[4] === '+')
					{
						iTimeZone *= -1;
					}

					if (iTimeZone)
					{
						oDate.setUTCMinutes(oDate.getUTCMinutes()+ iTimeZone);
					}
				}

				return oDate;
			}

			return NaN;
		};
	})();
})(jQuery, window._);
