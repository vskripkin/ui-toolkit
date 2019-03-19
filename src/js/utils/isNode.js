export default function (a)
{
	return a && typeof a.nodeType === 'number' && typeof a.nodeName === 'string';
};
