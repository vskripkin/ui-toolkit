// <reference path="../../bower_components/jquery/dist/jquery.js" />
// <reference path="../../bower_components/underscore/underscore.js" />
// <reference path="../../bower_components/hammerjs/hammer.js" />

// <reference path="./prism.js" />

// <reference path="../../src/js/ui.js" />


$(document).ready(function ()
{
	var oActiveLink = $('#sidebar a.active'),
		oActiveBlock = $(oActiveLink.attr('href') + '-block').show(),
		jWindow = $(window).on('hashchange', function(e)
		{
			var sKey = window.location.hash;

			oActiveLink.removeClass('active');
			oActiveLink = $('[href="' + sKey + '"]').addClass('active');

			oActiveBlock.hide();
			oActiveBlock = $(sKey + '-block').show();
		});

	if (window.location.hash != '')
	{
		jWindow.trigger('hashchange');
	}

	Waves.init();
});
