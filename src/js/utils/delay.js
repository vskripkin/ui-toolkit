export default function (_func, _iWait)
{
	let args = Array.prototype.slice.call(arguments, 2);

	return setTimeout(Function.prototype.apply.bind(_func, null, args), _iWait);
};
