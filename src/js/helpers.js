;(function ($, _, undefined)
{
	'use strict';

	var nTextarea = null,
		toString = Object.prototype.toString,
		restArguments = function (_func, _iStartIndex)
		{
			_iStartIndex = _iStartIndex == null ? _func.length - 1 : parseInt(_iStartIndex);

			return function ()
			{
				var args = arguments,
					index = 0,
					iLength = Math.max(args.length - _iStartIndex, 0),
					aRest = Array(iLength);

				for (; index < iLength; index++)
				{
					aRest[index] = args[index + _iStartIndex];
				}

				switch (_iStartIndex)
				{
					case 0: return _func.call(this, aRest);
					case 1: return _func.call(this, args[0], aRest);
					case 2: return _func.call(this, args[0], args[1], aRest);
				}

				var aArgs = Array(_iStartIndex + 1);

				for (index = 0; index < _iStartIndex; index++)
				{
					aArgs[index] = args[index];
				}

				aArgs[_iStartIndex] = aRest;

				return _func.apply(this, aArgs);
			};
		};

	_ || (_ = window._ = {
		noop: function () {},
		isArray: $.isArray,
		isObject: $.isPlainObject,
		restArguments: restArguments,

		throttle: function (_func, _iWait, options)
		{
			options || (options = {});

			var iPrevious = 0,
				iTimeout, xResult, context, args,

				later = function ()
				{
					iPrevious = options.leading === false ? 0 : Date.now();
					iTimeout = null;

					xResult = _func.apply(context, args);

					if (!iTimeout)
					{
						context = args = null;
					}
				},
				throttled = function ()
				{
					var iNow = Date.now();

					if (!iPrevious && options.leading === false)
					{
						iPrevious = iNow;
					}

					var iRemaining = _iWait - (iNow - iPrevious);

					context = this;
					args = arguments;

					if (iRemaining <= 0 || iRemaining > _iWait)
					{
						if (iTimeout)
						{
							clearTimeout(iTimeout);
							iTimeout = null;
						}

						iPrevious = iNow;
						xResult = _func.apply(context, args);

						if (!iTimeout)
						{
							context = args = null;
						}
					}
					else if (!iTimeout && options.trailing !== false)
					{
						iTimeout = setTimeout(later, iRemaining);
					}

					return xResult;
				};

			throttled.cancel = function ()
			{
				clearTimeout(iTimeout);

				iPrevious = 0;
				iTimeout = context = args = null;
			};

			return throttled;
		},
		debounce: function (_func, _iWait, _bImmediate)
		{
			var iTimeout, xResult,

				later = function(context, args)
				{
					iTimeout = null;

					if (args)
					{
						xResult = _func.apply(context, args);
					}
				},
				debounced = restArguments(function (args)
				{
					if (iTimeout)
					{
						clearTimeout(iTimeout);
					}

					if (_bImmediate)
					{
						var bCallNow = !iTimeout;

						iTimeout = setTimeout(later, _iWait);

						if (bCallNow)
						{
							xResult = _func.apply(this, args);
						}
					}
					else
					{
						iTimeout = _.delay(later, _iWait, this, args);
					}

					return xResult;
				});

			debounced.cancel = function()
			{
				clearTimeout(iTimeout);
				iTimeout = null;
			};

			return debounced;
		},
		delay: restArguments(function (_func, _iWait, args)
		{
			return setTimeout(Function.prototype.apply.bind(_func, null, args), _iWait);
		}),

		isUndefined: function (a)
		{
			return typeof a === 'undefined';
		},
		isString: function (a)
		{
			return toString.call(a) === '[object String]';
		},
		isNumber: function (a)
		{
			return toString.call(a) === '[object Number]';
		},
		isBoolean: function (a)
		{
			return a === true || a === false || toString.call(a) === '[object Boolean]';
		},
		isFinite: function (a)
		{
			return isFinite(a) && !isNaN(parseFloat(a));
		},
		isFunction: function (a)
		{
			return typeof a === 'function';
		},
		isElement: function (a)
		{
			return !!(a && a.nodeType === 1);
		},
		isNaN: function (a)
		{
			return _.isNumber(a) && a !== +a;
		},
		isArrayLike: function (obj)
		{
			if (_.isFunction(obj) || obj && obj === obj.window)
			{
				return false;
			}

			var L = !!obj && 'length' in obj && obj.length;

			return $.isArray(obj) || L === 0 || typeof L === 'number' && L > 0 && (L - 1) in obj;
		},
		forEach: function (obj, iteratee, context)
		{
			var i, L;

			if (_.isArrayLike(obj))
			{
				for (i = 0, L = obj.length; i < L; i++)
				{
					iteratee.call(context, obj[i], i, obj);
				}
			}
			else
			{
				var keys = Object.keys(obj);

				for (i = 0, L = keys.length; i < L; i++)
				{
					iteratee.call(context, obj[keys[i]], keys[i], obj);
				}
			}

			return obj;
		}
	});

	_.isNode = function (obj)
	{
		return obj && typeof obj.nodeType === 'number' && typeof obj.nodeName === 'string';
	};
	_.isNumeric = function (value)
	{
		return !_.isString(value) && _.isFinite(value);
	};
	_.isInteger = function(value)
	{
		return _.isNumeric(value) && Math.floor(value) === value;
	};

	_.randomStr = function ()
	{
		return '_' + parseInt((Math.random() * 1e8).toString().replace('.','')).toString(36);
	};
	_.decodeHtml = function (html)
	{
		nTextarea || (nTextarea = document.createElement('textarea'));
		nTextarea.innerHTML = html;

		return nTextarea.value;
	};
	_.unduplicate = function (text)
	{
		//     _.isString(text) && text.replace(/(\S+)(?=.*\1)/g, '');
		return _.isString(text) && text.replace(/(\b\w+\b)(?=.*\b\1\b)/g, '');
	};
	_.cleanStr = function (text)
	{
		return _.isString(text) && _.unduplicate(text).replace(/\s{2,}/g, ' ').trim();
	};

	_.hashCode = function (_str)
	{
		_str = String(_str);

		if (_str.length === 0) return '';

		var iHash = 0,
			iChar, i, L;

		for (i = 0, L = _str.length; i < L; i++)
		{
			iChar = _str.charCodeAt(i);
			iHash = (iHash << 5) - iHash + iChar;
			iHash = iHash & iHash; // Convert to 32bit integer
		}

		return parseInt(iHash.toString().replace('.', '')).toString(36).replace('-', '');
	};

	Element.prototype._jQ = function ()
	{
		return this.__jQ || (this.__jQ = $(this));
	};
})(jQuery, window._);
