import _isUndefined from './isUndefined.js';
import _isString    from './isString.js';
import _isNumber    from './isNumber.js';
import _isRegExp    from './isRegExp.js';
import _isBoolean   from './isBoolean.js';

import _isPlainObject from './isPlainObject.js';
import _isObject      from './isObject.js';
import _isFunction    from './isFunction.js';
import _isArray       from './isArray.js';
import _isArrayLike   from './isArrayLike.js';

import _isFinite  from './isFinite.js';
import _isNumeric from './isNumeric.js';
import _isNaN     from './isNaN.js';
import _isInteger from './isInteger.js';

import _isElement from './isElement.js';
import _isNode    from './isNode.js';


export default {
	isUndefined: _isUndefined,
	isString:    _isString,
	isNumber:    _isNumber,
	isRegExp:    _isRegExp,
	isBoolean:   _isBoolean,

	isPlainObject: _isPlainObject,
	isObject:      _isObject,
	isFunction:    _isFunction,
	isArray:       _isArray,
	isArrayLike:   _isArrayLike,

	isFinite:  _isFinite,
	isNumeric: _isNumeric,
	isNaN:     _isNaN,
	isInteger: _isInteger,

	isElement: _isElement,
	isNode:    _isNode,
};
