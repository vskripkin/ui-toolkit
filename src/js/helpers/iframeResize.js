/* resize iframe on window.resize */
import forEach from './forEach.js';

// TODO: padding-top: calc(100% / width * height)

export function iframeHeight (_nIframe)
{
	var iWidth = _nIframe.offsetWidth,
		iHeight = _nIframe.offsetHeight,
		iRatio = _nIframe._heightRatio;

	if (!iWidth || !iHeight) return;

	if (!iRatio)
	{
		_nIframe._heightRatio = iRatio = iHeight / iWidth;
		_nIframe.style.maxWidth = '100%';
	}

	_nIframe.style.height = (iWidth * iRatio) + 'px';
};

export function iframeHeightFix ()
{
	forEach(document.querySelectorAll('iframe:not(.do-not-resize)'), iframeHeight);
};
