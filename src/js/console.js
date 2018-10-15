/* colored console logging */
;(function ($, _, undefined)
{
	'use strict';

	var isDebug = true,
		OrigConsole = window.console || {},
		OriginalLog = 'log' in OrigConsole ? OrigConsole.log : _.noop,
		OriginalWarn = 'warn' in OrigConsole ? OrigConsole.warn : OriginalLog,
		OriginalError = 'error' in OrigConsole ? OrigConsole.error : OriginalLog,
		OriginalTrace = 'trace' in OrigConsole ? OrigConsole.trace : OriginalLog,
		OriginalGroupCollapsed = 'groupCollapsed' in OrigConsole ? OrigConsole.groupCollapsed : OriginalLog,
		OriginalGroupEnd = 'groupEnd' in OrigConsole ? OrigConsole.groupEnd : _.noop,

		Console;

	/**
	 * Example input:
	 *	{
	 *		action: {
	 *			css: ['color: #247EB2; background: #F1F1F1; font-weight: bold; text-transform: uppercase;',
	 *				  'color: #247EB2; background: #F1F1F1;'],
	 *			format: function (_aMessages)
	 *			{
	 *				return ['%c[%s]%c %s', this.css[0], _aMessages.shift(), this.css[1]].concat(_aMessages);
	 *			}
	 *		}
	 *	}
	 */
	_.Console = Console = function (_isDebug, _oMethods)
	{
		this.debug(_isDebug);

		for (var sName in _oMethods)
		{
			this[sName] = (function (_oMethod)
			{
				return function ()
				{
					var aMessages = Array.prototype.slice.call(arguments),
						aFormattedMsg = _.isIE ? aMessages : _oMethod.format(aMessages);

					if (_oMethod.indent && aFormattedMsg[0])
					{
						aFormattedMsg[0] = this._getIndent(_oMethod.indent) + aFormattedMsg[0];
					}

					return this._produceFunc(aFormattedMsg, _oMethod.trace);
				};
			})(_oMethods[sName]);
		}

		return this;
	};
	Console.debug = function (_isDebug)
	{
		if (_.isUndefined(_isDebug))
		{
			return isDebug;
		}

		return (isDebug = _isDebug);
	};

	Console.prototype = {
		constructor: Console,
		debug: Console.debug,
		indent: '    ',

		log: function ()
		{
			if (!this.debug())
			{
				return _.noop;
			}

			var aMessages = Array.prototype.slice.call(arguments);

			aMessages.unshift(OrigConsole);

			return Function.prototype.bind.apply(OriginalLog, aMessages);
		},
		warn: function ()
		{
			if (!this.debug())
			{
				return _.noop;
			}

			var aMessages = Array.prototype.slice.call(arguments);

			aMessages.unshift(OrigConsole);

			return Function.prototype.bind.apply(OriginalWarn, aMessages);
		},
		error: function ()
		{
			if (!this.debug())
			{
				return _.noop;
			}

			var aMessages = Array.prototype.slice.call(arguments);

			aMessages.unshift(OrigConsole);

			return Function.prototype.bind.apply(OriginalError, aMessages);
		},

		_produceFunc: function (_args, _bTrace)
		{
			if (!this.debug())
			{
				return _.noop;
			}

			_args.unshift(OrigConsole);

			if (_bTrace)
			{
				return function ()
				{
					Function.prototype.bind.apply(OriginalGroupCollapsed, _args)();

					if (arguments.length)
					{
						OriginalLog.call(OrigConsole, arguments);
					}

					OriginalTrace.call(OrigConsole, 'stack');
					OriginalGroupEnd.call(OrigConsole);
				};
			}

			return Function.prototype.bind.apply(OriginalLog, _args);
		},
		_getIndent: function (_iIndent)
		{
			var sIndent = this.indent,
				sResult = '';

			while (_iIndent--)
			{
				sResult += sIndent;
			}

			return sResult;
		}
	};
})(window.jQuery, window._);
