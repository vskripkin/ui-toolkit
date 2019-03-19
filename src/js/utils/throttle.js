export default function (_func, _iWait, _options)
{
	_options || (_options = {});

	var iPrevious = 0,
		iTimeout, xResult, context, args,

		later = function ()
		{
			iPrevious = _options.leading === false ? 0 : Date.now();
			iTimeout = null;

			xResult = _func.apply(context, args);

			if (!iTimeout)
			{
				context = args = null;
			}
		},
		throttled = function ()
		{
			var iNow = Date.now();

			if (!iPrevious && _options.leading === false)
			{
				iPrevious = iNow;
			}


			var iRemaining = _iWait - (iNow - iPrevious);

			context = this;
			args = arguments;

			if (iRemaining <= 0 || iRemaining > _iWait)
			{
				if (iTimeout)
				{
					clearTimeout(iTimeout);
					iTimeout = null;
				}

				iPrevious = iNow;
				xResult = _func.apply(context, args);

				if (!iTimeout)
				{
					context = args = null;
				}
			}
			else if (!iTimeout && _options.trailing !== false)
			{
				iTimeout = setTimeout(later, iRemaining);
			}

			return xResult;
		};

	throttled.cancel = function ()
	{
		clearTimeout(iTimeout);

		iPrevious = 0;
		iTimeout = context = args = null;
	};

	return throttled;
};
