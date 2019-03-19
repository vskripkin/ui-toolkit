import isType        from './isType.js';

import extend     from './extend.js';
import forEach    from './forEach.js';
import hashCode   from './hashCode.js';
import randomStr  from './randomStr.js';
import decodeHtml from './decodeHtml.js';
import cleantStr  from './cleantStr.js';

import delay    from './delay.js';
import throttle from './throttle.js';
import debounce from './debounce.js';


export default {
	...isType,

	extend,
	forEach,
	hashCode,
	randomStr,
	decodeHtml,
	cleantStr,

	delay,
	throttle,
	debounce,

	noop: function () {}
};
