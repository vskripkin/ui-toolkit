import isArrayLike from './isArrayLike.js';

export default function (obj, iteratee, context)
{
	var i, L;

	if (isArrayLike(obj))
	{
		for (i = 0, L = obj.length; i < L; i++)
		{
			iteratee.call(context, obj[i], i, obj);
		}
	}
	else
	{
		var keys = Object.keys(obj);

		for (i = 0, L = keys.length; i < L; i++)
		{
			iteratee.call(context, obj[keys[i]], keys[i], obj);
		}
	}

	return obj;
};
