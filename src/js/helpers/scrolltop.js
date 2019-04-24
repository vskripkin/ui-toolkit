/* cross-browser method to set scrollTop */

import isBro from '../isBrowser.js';
import '../polifyll/pageYOffset.js';

export default function scrollTop (_iValue)
{
	if (!isBro)
	{
		return 0;
	}

	if (_iValue || _iValue === 0)
	{
		if (window.scrollTo)
		{
			window.scrollTo(0, _iValue);
		}
		else if (document.scrollingElement)
		{
			document.scrollingElement.scrollTop = _iValue;
		}
		else
		{
			document.documentElement.scrollTop = _iValue;
			document.body && (document.body.scrollTop = _iValue);
		}
	}

	return window.pageYOffset ||
		(document.scrollingElement && document.scrollingElement.scrollTop) ||
		document.documentElement.scrollTop || 0;
};
