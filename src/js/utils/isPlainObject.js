export default function (obj)
{
	var proto, Ctor;

	// Detect obvious negatives
	// Use toString instead of jQuery.type to catch host objects
	if (!obj || Object.prototype.toString.call(obj) !== '[object Object]')
	{
		return false;
	}

	proto = Object.getPrototypeOf(obj);

	// Objects with no prototype (e.g., `Object.create( null )`) are plain
	if (!proto)
	{
		return true;
	}

	// Objects with prototype are plain if they were constructed by a global Object function
	Ctor = Object.hasOwnProperty.call(proto, 'constructor') && proto.constructor;

	return typeof Ctor === 'function' && Ctor === Object;
};
