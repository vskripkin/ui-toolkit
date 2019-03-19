import isFunction from './isFunction.js';

export default function (obj)
{
	return obj === Object(obj) && !Array.isArray(obj) || isFunction(obj);
};
