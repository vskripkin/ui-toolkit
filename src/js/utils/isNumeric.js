import _isString from './isString.js';
import _isFinite from './isFinite.js';

export default function (value)
{
	return !_isString(value) && _isFinite(value);
};
