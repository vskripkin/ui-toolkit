// return true if value is NaN

export default function (value)
{
	return typeof value === 'number' && value !== +value;
};
