import $ from 'jquery';


if ($.Deferred)
{
	$.Resolved = $.Deferred().resolve();
	$.Rejected = $.Deferred().reject();

	$.isDeferred = function (_xDefer)
	{
		return !!(_xDefer && _xDefer.promise && _xDefer.state);
	};
	$.isFired = function (_jDefer)
	{
		return _jDefer && _jDefer.state() !== 'pending';
	};
	$.isResolved = function (_jDefer)
	{
		return _jDefer && _jDefer.state() === 'resolved';
	};
	$.isRejected = function (_jDefer)
	{
		return _jDefer && _jDefer.state() === 'rejected';
	};
}


if ($.fn)
{
	let init = $.fn.init;

	$.fn.init = function (selector)
	{
		if (selector && selector.nodeType || selector.$ === $)
		{
			return selector.__jQ || (selector.__jQ = init.apply(this, arguments));
		}

		return init.apply(this, arguments);
	};
}
