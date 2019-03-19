export default function (text)
{
	return String(text).replace(/\s{2,}/g, ' ').trim();
};
