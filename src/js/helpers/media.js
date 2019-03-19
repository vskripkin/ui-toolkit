export default function media (_aSizes)
{
	var sUP, sDOWN, sONLY;

	for (let i = 0, L = _aSizes.length; i < L; i++)
	{
		let oSize = _aSizes[i],
			oNext = _aSizes[i + 1] || {};

		for (let sSize in oSize)
		{
			sUP = '(min-width: ' + oSize[sSize] + 'px)';

			media[sSize] = (function (_sUP)
			{
				return window.matchMedia(_sUP).matches;
			})
			.bind(this, sUP);


			for (let sNext in oNext)
			{
				sDOWN = '(max-width: ' + (oNext[sNext] - 0.1).toFixed(1) + 'px)';

				media[sSize + 'Down'] = (function (_sDOWN)
				{
					return window.matchMedia(_sDOWN).matches;
				})
				.bind(this, sDOWN);


				sONLY = sUP + ' and ' + sDOWN;

				media[sSize + 'Only'] = (function (_sONLY)
				{
					return window.matchMedia(_sONLY).matches;
				})
				.bind(this, sONLY);
			}
		}
	}


	var oFirst = _aSizes[0];

	for (let sSize in oFirst)
	{
		if (oFirst[sSize] === 0)
		{
			media[sSize] = media[sSize + 'Down'];
		}
	}
};
