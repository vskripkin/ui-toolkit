/* define supported features */
;(function ($, _, undefined)
{
	'use strict';

	_.support = {
		transition: {},
		animation: {}
	};

	if (_.prefix.lowercase === 'webkit')
	{
		_.support.transition.end = 'webkitTransitionEnd';
		_.support.animation.end = 'webkitAnimationEnd';
	}
	else
	{
		_.support.transition.end = 'transitionend';
		_.support.animation.end = 'animationend';
	}
})(jQuery, _);
