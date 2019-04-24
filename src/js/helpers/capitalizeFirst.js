export default function capitalizeFirst (_str, _bNormalize)
{
	return _str.charAt(0).toUpperCase() + (_bNormalize ? _str.slice(1).toLowerCase() : _str.slice(1));
};
