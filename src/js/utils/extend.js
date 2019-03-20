import isPlainObject from './isPlainObject.js';


export default function extend (_oTarget)
{
	var options, name, src, copy, copyIsArray, clone,
		args = arguments,
		i = 1,
		length = args.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof _oTarget === 'boolean')
	{
		deep = _oTarget;

		// Skip the boolean and the target
		_oTarget = args[i] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if (typeof _oTarget !== 'object' && typeof _oTarget !== 'function')
	{
		_oTarget = {};
	}


	for (; i < length; i++)
	{
		// Only deal with non-null/undefined values
		if ((options = args[i]) == null) continue;


		// Extend the base object
		for (name in options)
		{
			copy = options[name];

			// Prevent never-ending loop
			if (_oTarget === copy) continue;


			// Recurse if we're merging plain objects or arrays
			if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy))))
			{
				src = _oTarget[name];

				// Ensure proper type for the source value
				if (copyIsArray && !Array.isArray(src))
				{
					clone = [];
				}
				else if (!copyIsArray && !isPlainObject(src))
				{
					clone = {};
				}
				else
				{
					clone = src;
				}

				copyIsArray = false;

				// Never move original objects, clone them
				_oTarget[name] = extend(deep, clone, copy);
			}
			// Don't bring in undefined values
			else if (typeof copy !== 'undefined')
			{
				_oTarget[name] = copy;
			}
		}
	}

	// Return the modified object
	return _oTarget;
};
