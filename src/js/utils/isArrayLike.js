export default function (a)
{
	if (typeof a === 'function' || a && a === a.window)
	{
		return false;
	}

	var L = !!a && 'length' in a && a.length;

	return Array.isArray(a) || L === 0 || typeof L === 'number' && L > 0 && (L - 1) in a;
};
