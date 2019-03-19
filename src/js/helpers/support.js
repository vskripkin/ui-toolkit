/* define supported features */

import broPrefix from './broPrefix.js';

var support = {
		transition: {},
		animation:  {}
	};

if (broPrefix.lowercase === 'webkit')
{
	support.transition.end = 'webkitTransitionEnd';
	support.animation.end  = 'webkitAnimationEnd';
}
else
{
	support.transition.end = 'transitionend';
	support.animation.end  = 'animationend';
}

export default support;
