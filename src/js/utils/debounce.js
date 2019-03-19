import delay from './delay.js';

export default function (_func, _iWait, _bImmediate)
{
	var iTimeout, xResult,

		later = function (_context, _args)
		{
			iTimeout = null;

			if (_args)
			{
				xResult = _func.apply(_context, _args);
			}
		},
		debounced = function ()
		{
			if (iTimeout)
			{
				clearTimeout(iTimeout);
			}

			if (_bImmediate)
			{
				var bCallNow = !iTimeout;

				iTimeout = setTimeout(later, _iWait);

				if (bCallNow)
				{
					xResult = _func.apply(this, arguments);
				}
			}
			else
			{
				iTimeout = delay(later, _iWait, this, Array.prototype.slice.call(arguments));
			}

			return xResult;
		};

	debounced.cancel = function ()
	{
		clearTimeout(iTimeout);
		iTimeout = null;
	};

	return debounced;
};
