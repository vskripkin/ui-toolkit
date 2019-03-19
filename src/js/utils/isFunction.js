export default function (func)
{
	return typeof func === 'function' || false; // && typeof func.nodeType !== 'number'
};
