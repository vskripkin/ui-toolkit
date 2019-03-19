import isBro from '../isBrowser.js';
import {isIE} from './useragent.js';


var noop = function () {},
	isDebug = true,

	OrigConsole = isBro && window.console || {},
	OriginalLog = 'log' in OrigConsole ? OrigConsole.log : noop,
	OriginalWarn = 'warn' in OrigConsole ? OrigConsole.warn : OriginalLog,
	OriginalError = 'error' in OrigConsole ? OrigConsole.error : OriginalLog,
	OriginalTrace = 'trace' in OrigConsole ? OrigConsole.trace : OriginalLog,
	OriginalGroupCollapsed = 'groupCollapsed' in OrigConsole ? OrigConsole.groupCollapsed : OriginalLog,
	OriginalGroupEnd = 'groupEnd' in OrigConsole ? OrigConsole.groupEnd : noop;


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

export default class Console
{
	constructor (_isDebug, _oMethods)
	{
		for (var sName in _oMethods)
		{
			if (!isBro)
			{
				this[sName] = noop;
				continue;
			}


			this[sName] = (function (_oMethod)
			{
				return function ()
				{
					var aMessages = Array.prototype.slice.call(arguments),
						aFormattedMsg = isIE ? aMessages : _oMethod.format(aMessages);

					if (_oMethod.indent && aFormattedMsg[0])
					{
						aFormattedMsg[0] = this._getIndent(_oMethod.indent) + aFormattedMsg[0];
					}

					return this._produceFunc(aFormattedMsg, _oMethod.trace);
				};
			})(_oMethods[sName]);
		}

		this.indent = Console.indent || '    ';
		this.debug(isBro ? _isDebug : false);

		return this;
	}

	static debug (_isDebug)
	{
		if (typeof _isDebug === 'undefined')
		{
			return isDebug;
		}

		return (isDebug = _isDebug);
	}

	debug (_isDebug)
	{
		return this.constructor.debug(_isDebug);
	}


	log ()
	{
		if (!this.debug())
		{
			return noop;
		}

		var aMessages = Array.prototype.slice.call(arguments);

		aMessages.unshift(OrigConsole);

		return Function.prototype.bind.apply(OriginalLog, aMessages);
	}

	warn ()
	{
		if (!this.debug())
		{
			return noop;
		}

		var aMessages = Array.prototype.slice.call(arguments);

		aMessages.unshift(OrigConsole);

		return Function.prototype.bind.apply(OriginalWarn, aMessages);
	}

	error ()
	{
		if (!this.debug())
		{
			return noop;
		}

		var aMessages = Array.prototype.slice.call(arguments);

		aMessages.unshift(OrigConsole);

		return Function.prototype.bind.apply(OriginalError, aMessages);
	}

	_produceFunc (_args, _bTrace)
	{
		if (!this.debug())
		{
			return noop;
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
	}

	_getIndent (_iIndent)
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
