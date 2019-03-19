export default function (text)
{
	//     _.isString(text) && text.replace(/(\S+)(?=.*\1)/g, '');
	return  String(text).replace(/(\b\w*[A-Za-z]\w+\b)(?=.*\b\1\b)/g, '').trim()
						.replace(/(\b\w+[A-Za-z]\w*\b)(?=.*\b\1\b)/g, '').trim();
};
