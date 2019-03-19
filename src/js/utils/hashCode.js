export default function (_str)
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
