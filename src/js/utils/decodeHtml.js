let nTextarea;

export default function (html)
{
	nTextarea || (nTextarea = document.createElement('textarea'));
	nTextarea.innerHTML = html;

	return nTextarea.value;
};
