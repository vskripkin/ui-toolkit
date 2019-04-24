import is_element from '../utils/isElement.js';
import random_str from '../utils/randomStr.js';

export default function (_xObj)
{
	_xObj || (_xObj = {});

	var bIsElement = is_element(_xObj),
		ID = bIsElement ?
				_xObj.getAttribute('data-cid') :
				_xObj.cid;

	if (!ID)
	{
		ID = random_str();

		if (bIsElement)
		{
			_xObj.setAttribute('data-cid', ID);
		}
		else
		{
			Object.defineProperty(_xObj, 'cid', {
				value: ID,
				writable: true,
				configurable: true,
				enumerable: false
			});
		}
	}

	return ID;
};
