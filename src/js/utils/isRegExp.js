export default function (a)
{
	return Object.prototype.toString.call(a) === '[object RegExp]';
};
