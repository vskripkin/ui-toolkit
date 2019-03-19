import isNumeric from './isNumeric.js';

export default function (value)
{
	return isNumeric(value) && Math.floor(value) === value;
};
