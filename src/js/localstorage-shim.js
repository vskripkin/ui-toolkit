;(function ()
{
	var shim = function ()
		{
			var oData = {};

			return {
				getItem: function (_sKey)
				{
					return String(_sKey) in oData ? oData[_sKey] : null;
				},
				setItem: function (_sKey, _xValue)
				{
					oData[_sKey] = String(_xValue);
				},
				removeItem: function (_sKey)
				{
					delete oData[_sKey];
				},
				clear: function ()
				{
					for (var sKey in oData)
					{
						delete oData[_sKey];
					}
				}
			};
		},
		is_corrupted = function ()
		{
			try
			{
				var sTest = '__LS-TEST__';

				window.localstorage.setItem(sTest, sTest);

				if (window.localstorage.getItem(sTest) !== sTest)
				{
					window.localstorage.removeItem(sTest);
					throw new Error();
				}

				window.localstorage.removeItem(sTest);

				return false;
			}
			catch (e)
			{
				return true;
			}
		},

		aFixes = [
			function (_oShim)
			{
				try
				{
					Object.setPrototypeOf(window.localStorage, _oShim);

					return true;
				}
				catch (e)
				{
					return false;
				}
			},
			function (_oShim)
			{
				try
				{
					window.localStorage.__proto__ = _oShim;

					return true;
				}
				catch (e)
				{
					return false;
				}
			},
			function (_oShim)
			{
				try
				{
					for (var sKey in _oShim)
					{
						Storage.prototype[sKey] = _oShim[sKey];
					}

					return true;
				}
				catch (e)
				{
					return false;
				}
			},
			function (_oShim)
			{
				try
				{
					delete window.localStorage;
					window.localStorage = window.localstorage = _oShim;

					return true;
				}
				catch (e)
				{
					return false;
				}
			},
			function (_oShim)
			{
				window.localstorage = _oShim;
			}
		],
		oShim;

	try
	{
		window.localstorage = window.localStorage;

		if (is_corrupted())
		{
			oShim = shim();

			while (aFixes.length)
			{
				if (aFixes.shift()(oShim) && !is_corrupted())
				{
					break;
				}
			}
		}
	}
	catch (e)
	{
		window.localstorage = oShim || shim();
	}

	oShim = null;
})();

// https://gist.github.com/engelfrost/fd707819658f72b42f55
// На случай если понадобится эмулировать событие change
