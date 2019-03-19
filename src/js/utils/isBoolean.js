export default function (a)
{
	return a === true || a === false || Object.prototype.toString.call(a) === '[object Boolean]';
};
