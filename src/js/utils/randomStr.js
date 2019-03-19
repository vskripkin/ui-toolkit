export default function ()
{
	return '_' + parseInt((Math.random() * 1e8).toString().replace('.','')).toString(36);
};
