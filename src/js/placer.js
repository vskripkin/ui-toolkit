import globalScrollbar from './helpers/globalScrollbar.js';

import extend     from './utils/extend.js';
import random_str from './utils/randomStr.js';
import is_array   from './utils/isArray.js';
import is_string  from './utils/isString.js';
import is_object  from './utils/isObject.js';
import is_boolean from './utils/isBoolean.js';


let TYPE = 'placer',

	Placer = function (element, options)
	{
		this.options       =
		this.styleDefault  =
		this.lastLoc       =
		this.timer         = undefined;

		if (element)
		{
			options.placed = element;
		}

		return this.init(options);
	};

export default Placer;


Placer.DEFAULTS = {
	/*
	-------------------------
	placed: jQuery || HTMLElement || CSS Selector String,
	target: jQuery || HTMLElement || CSS Selector String,
	location: {},
	-------------------------
	*/

	checkPos: false, // function to check if position should be updated
	checkInterval: 1000,
	update: false
};
Placer.LOC = {
	/*
	condition: f(){} // return true or false, if true - params will be applied
	whenFALSE: f(){}
	whenTRUE:  f(){}
	*/
	position: 'top', // bottom, left, right
	align: 'start',  // center, end
	side: 'out',     // in
	parent: 'body',
	offsetParent: false,
	fixed: false,
	width: false, // true или число
	height: false,
	minWidth: false,
	maxWidth: false,
	minHeight: false,
	maxHeight: false,
	priority: 0,
	includeMargin: true,
	offset: {
		ver: 0,
		hor: 0
	},
	props: {
		ver: 'top',
		hor: 'left'
	}
};
Placer.STYLES = [
	'margin-top',
	'margin-bottom',
	'margin-right',
	'margin-left',
	'width',
	'height',
	'min-width',
	'min-height',
	'position'
];

Placer.placeTo = function (_nElem, options)
{
	options || (options = {});


	var plugin = _nElem['_' + TYPE];

	if (options.update && typeof plugin !== 'undefined')
	{
		plugin.destroy();
		plugin = undefined;
	}

	if (typeof plugin === 'undefined')
	{
		_nElem['_' + TYPE] = new Placer(_nElem, options);
	}
	else if (is_string(options))
	{
		plugin[options]();
	}
	else
	{
		plugin.set();
	}
};


Placer.prototype =
{
	constructor: Placer,
	type: TYPE,


	init: function (_options)
	{
		this.options = _options = _getOptions.call(this, _options);
		this.placed = _options.placed;
		this.target = _options.target;

		_saveDefaultStyle.call(this);

		this.start();

		return this;
	},

	start: function ()
	{
		if (this.options.checkPos)
		{
			var that = this,
				check_pos = this.options.checkPos;

			this.stop();
			this.timer = setInterval(function ()
			{
				if (check_pos.call(that))
				{
					_restoreDefaultStyle.call(that);
					that.set();
				}
			},
			this.options.checkInterval);
		}

		this.set();
	},
	stop: function ()
	{
		if (this.timer)
		{
			clearInterval(this.timer);
		}
		if (this.lastLoc && this.lastLoc.whenFALSE)
		{
			this.lastLoc.whenFALSE.call(this);
		}

		this.lastLoc = undefined;
		_restoreDefaultStyle.call(this);
	},

	set: function ()
	{
		var aLocations = this.options.location,
			oParams, oLoc, oNewLoc, i, L;

		for (i = 0, L = aLocations.length; i < L; i++)
		{
			oLoc = aLocations[i];

			if (typeof oLoc.condition !== 'undefined')
			{
				if (typeof oParams === 'undefined')
				{
					oParams = _getMainParams.call(this, oLoc);
				}

				if (oLoc.condition.call(this, oParams))
				{
					oNewLoc = oLoc;
					break;
				}
			}
			else
			{
				oNewLoc = oLoc;
				break;
			}
		}


		if (!this.lastLoc || this.lastLoc.id !== oNewLoc.id)
		{
			if (this.lastLoc && this.lastLoc.whenFALSE)
			{
				this.lastLoc.whenFALSE.call(this);
			}


			this.lastLoc = oNewLoc;

			if (oNewLoc.whenTRUE)
			{
				oNewLoc.whenTRUE.call(this, oParams);
			}
		}

		_applyLocation.call(this, oNewLoc);
	},

	destroy : function ()
	{
		this.stop();
		delete this.options.placed['_' + TYPE];
	}
};


let _getOptions = function (_options)
	{
		var options = extend({}, Placer.DEFAULTS, _options),
			aPossibleParent = [
				window,
				document,
				document.documentElement,
				document.body,
				'body',
				'html',
				undefined,
				true,
				false
			],

			aLoc = options.location,
			oLoc, nParent, nOffsetParent, i, L;


		// if jQuery object
		if (options.placed && options.placed.get)
		{
			options.placed = options.placed.get(0);
		}
		else if (is_string(options.placed))
		{
			options.placed = document.querySelector(options.placed);
		}

		// if jQuery object
		if (options.target && options.target.get)
		{
			options.target = options.target.get(0);
		}
		else if (is_string(options.target))
		{
			options.target = document.querySelector(options.target);
		}


		if (!is_array(aLoc))
		{
			aLoc = options.location = [options.location];
		}
		if (aLoc.length > 1)
		{
			aLoc.sort(function (a, b)
			{
				return (b.priority || 0) - (a.priority || 0);
			});
		}


		for (i = 0, L = aLoc.length; i < L; i++)
		{
			oLoc = aLoc[i] = extend(true, {}, Placer.LOC, aLoc[i]);

			oLoc.id = random_str();
			oLoc.tries = 0;

			if (is_object(oLoc.offset))
			{
				oLoc.offset = {
					ver: parseInt(oLoc.offset.ver) || 0,
					hor: parseInt(oLoc.offset.hor) || 0
				}
			}
			else
			{
				oLoc.offset = {
					ver: parseInt(oLoc.offset) || 0,
					hor: parseInt(oLoc.offset) || 0
				}
			}


			nParent = oLoc.parent;

			// if jQuery object
			if (nParent && nParent.get)
			{
				nParent = nParent.get(0);
			}

			if (aPossibleParent.indexOf(nParent) > -1)
			{
				nParent = document.body;
			}
			else if (is_string(nParent))
			{
				nParent = document.querySelector(nParent);
			}

			oLoc.parent = nParent;


			nOffsetParent = oLoc.offsetParent;

			if (!nOffsetParent)
			{
				if (window.getComputedStyle(nParent).position === 'static')
				{
					if (nParent.offsetParent !== null)
					{
						nOffsetParent = nParent.offsetParent;
					}
					else
					{
						if (window.getComputedStyle(document.body).position === 'static')
						{
							nOffsetParent = document.documentElement;
						}
						else
						{
							nOffsetParent = document.body;
						}
					}
				}
				else
				{
					nOffsetParent = nParent;
				}
			}
			// if jQuery object
			else if (nOffsetParent && nOffsetParent.get)
			{
				nOffsetParent = nOffsetParent.get(0);
			}
			else if (is_string(nOffsetParent))
			{
				nOffsetParent = document.querySelector(nOffsetParent);
			}

			oLoc.offsetParent = nOffsetParent;


			if (oLoc.width > 0)
			{
				oLoc.width = Math.round(oLoc.width) + 'px';
			}
			else if (!is_boolean(oLoc.width))
			{
				oLoc.width = false;
			}


			if (oLoc.height > 0)
			{
				oLoc.height = Math.round(oLoc.height) + 'px';
			}
			else if (!is_boolean(oLoc.height))
			{
				oLoc.height = false;
			}
		}

		return options;
	},

	_saveDefaultStyle = function ()
	{
		this.styleDefault = {};


		var oPlacedStyle  = this.placed.style,
			oDefaultStyle = this.styleDefault,
			aWantedStyles = Placer.STYLES,
			sProp, i, L;

		for (i = 0, L = aWantedStyles.length; i < L; i++)
		{
			sProp = aWantedStyles[i];

			oDefaultStyle[sProp] = {};
			oDefaultStyle[sProp].value = oPlacedStyle.getPropertyValue(sProp);
			oDefaultStyle[sProp].priority = oPlacedStyle.getPropertyPriority(sProp);
		}
	},
	_restoreDefaultStyle = function ()
	{
		var oPlacedStyle = this.placed.style,
			oDefaultStyle = this.styleDefault,
			sProp, oValue;

		for (sProp in oDefaultStyle)
		{
			oValue = oDefaultStyle[sProp];

			oPlacedStyle.setProperty(sProp, oValue.value, oValue.priority);
		}
	},

	_getMainParams = function (_oLoc)
	{
		var oTargetBounds = this.target.getBoundingClientRect(),
			oOffsetBounds,

			//clientWidth and clientHeight return a value of viewable part of documentElement
			iWinWidth  = document.documentElement.clientWidth,
			iWinHeight = document.documentElement.clientHeight,
			iExtraV    = 0,
			iExtraH    = 0,
			sVerProp   = _oLoc.props.ver,
			sHorProp   = _oLoc.props.hor;


		if (_oLoc.includeMargin)
		{
			var sOppVerProp = sVerProp === 'top'  ? 'bottom' : 'top',
				sOppHorProp = sHorProp === 'left' ? 'right'  : 'left',
				oPlacedCSS = window.getComputedStyle(this.placed);

			iExtraV -= Math.round(parseInt(oPlacedCSS['margin-' + sOppVerProp])) || 0;
			iExtraH -= Math.round(parseInt(oPlacedCSS['margin-' + sOppHorProp])) || 0;
		}


		if (!_oLoc.fixed)
		{
			var oOffsetCss = window.getComputedStyle(_oLoc.offsetParent);

			oOffsetBounds = extend({}, _oLoc.offsetParent.getBoundingClientRect());
			oOffsetBounds.top  += (sVerProp === 'top'  ? 1 : -1 ) * parseInt(oOffsetCss['border-' + sVerProp + '-width']);
			oOffsetBounds.left += (sHorProp === 'left' ? 1 : -1 ) * parseInt(oOffsetCss['border-' + sHorProp + '-width']);

			oOffsetBounds.top    = Math.round(oOffsetBounds.top);
			oOffsetBounds.left   = Math.round(oOffsetBounds.left);
			oOffsetBounds.right  = Math.round(oOffsetBounds.right);
			oOffsetBounds.bottom = Math.round(oOffsetBounds.bottom);
		}
		else
		{
			oOffsetBounds = {
				width: iWinWidth,
				height: iWinHeight,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			};
		}


		return {
			target: {
				width:  oTargetBounds.width,
				height: oTargetBounds.height,
				top:    Math.round(oTargetBounds.top),
				left:   Math.round(oTargetBounds.left),
				right:  Math.round(oTargetBounds.right),
				bottom: Math.round(oTargetBounds.bottom)
			},
			placed: {
				width:  Math.round(this.placed.offsetWidth),
				height: Math.round(this.placed.offsetHeight),
			},
			winWidth:   iWinWidth,
			winHeight:  iWinHeight,
			spaceAbove: Math.round(oTargetBounds.top),
			spaceLeft:  Math.round(oTargetBounds.top),
			spaceRight: iWinWidth  - Math.round(oTargetBounds.right),
			spaceUnder: iWinHeight - Math.round(oTargetBounds.bottom),

			offsetParent: oOffsetBounds,
			extraV : iExtraV,
			extraH : iExtraH
		};
	},
	_applyLocation = function (_oLocation, _oParams, _oSign)
	{
		if (typeof _oParams === 'undefined')
		{
			this.placed.style.setProperty('position', (_oLocation.fixed ? 'fixed' : 'absolute'), 'important');
			this.placed.style.setProperty('top', 'auto', 'important');
			this.placed.style.setProperty('left', 'auto', 'important');
			this.placed.style.setProperty('bottom', '100%', 'important');
			this.placed.style.setProperty('right', '100%', 'important');

			if (this.placed.parentNode === null || _oLocation.parent !== this.placed.parentNode)
			{
				_oLocation.parent.appendChild(this.placed);
			}
			if (_oLocation.width)
			{
				if (is_boolean(_oLocation.width))
				{
					this.placed.style.setProperty('width', this.target.offsetWidth + 'px', 'important');
				}
				else
				{
					this.placed.style.setProperty('width', _oLocation.width, 'important');
				}
			}
			if (_oLocation.height)
			{
				if (is_boolean(_oLocation.height))
				{
					this.placed.style.setProperty('height', this.target.offsetHeight + 'px', 'important');
				}
				else
				{
					this.placed.style.setProperty('height', _oLocation.height, 'important');
				}
			}
			if (_oLocation.minWidth)
			{
				if (is_boolean(_oLocation.minWidth))
				{
					this.placed.style.setProperty('min-width', this.target.offsetWidth + 'px', 'important');
				}
				else
				{
					this.placed.style.setProperty('min-width', _oLocation.minWidth + 'px', 'important');
				}
			}
			if (_oLocation.maxWidth)
			{
				if (is_boolean(_oLocation.maxWidth))
				{
					this.placed.style.setProperty('max-width', this.target.offsetWidth + 'px', 'important');
				}
				else
				{
					this.placed.style.setProperty('max-width', _oLocation.maxWidth + 'px', 'important');
				}
			}
			if (_oLocation.minHeight)
			{
				if (is_boolean(_oLocation.minHeight))
				{
					this.placed.style.setProperty('min-height', this.target.offsetHeight + 'px', 'important');
				}
				else
				{
					this.placed.style.setProperty('min-height', _oLocation.minHeight + 'px', 'important');
				}
			}
			if (_oLocation.maxHeight)
			{
				if (is_boolean(_oLocation.maxHeight))
				{
					this.placed.style.setProperty('max-height', this.target.offsetHeight + 'px', 'important');
				}
				else
				{
					this.placed.style.setProperty('max-height', _oLocation.maxHeight + 'px', 'important');
				}
			}
			if (!_oLocation.includeMargin)
			{
				this.placed.style.setProperty('margin', 0, 'important');
			}
		}


		var sVerProp = _oLocation.props.ver,
			sHorProp = _oLocation.props.hor,

			oParams = _oParams || _getMainParams.call(this, _oLocation),
			oSign = _oSign || _oPossibleLocations[_oLocation.align]
												 [_oLocation.side]
												 [_oLocation.position].call(this, _oLocation.props),
			oPosition = {},
			sProp;

		oPosition[sVerProp] = oSign.ver.tt * oParams.target.top
										+ oSign.ver.th * oParams.target.height
										+ oSign.ver.ot * oParams.offsetParent.top
										+ oSign.ver.oh * oParams.offsetParent.height
										+ oSign.ver.ph * oParams.placed.height
										+ oSign.ver.ov * _oLocation.offset.ver
										+ oParams.extraV;

		oPosition[sHorProp] = oSign.hor.tl * oParams.target.left
										+ oSign.hor.tw * oParams.target.width
										+ oSign.hor.ol * oParams.offsetParent.left
										+ oSign.hor.ow * oParams.offsetParent.width
										+ oSign.hor.pw * oParams.placed.width
										+ oSign.hor.oh * _oLocation.offset.hor
										+ oParams.extraH;


		this.placed.style.setProperty('bottom', 'auto', 'important');
		this.placed.style.setProperty('right',  'auto', 'important');


		for (sProp in oPosition)
		{
			this.placed.style.setProperty(sProp, Math.round(oPosition[sProp]) + 'px', 'important');
		}


		// check to see if placing in new offset caused the placed element to resize itself
		if (_oLocation.tries < 10)
		{
			_oLocation.tries++;

			var iPlacedWidth = Math.round(this.placed.offsetWidth),
				iPlacedHeight = Math.round(this.placed.offsetHeight);

			if (Math.abs(iPlacedWidth - oParams.placed.width) > 1 || Math.abs(iPlacedHeight - oParams.placed.height) > 1)
			{
				oParams.placed = {
					width: iPlacedWidth,
					height: iPlacedHeight
				};

				_applyLocation.call(this, _oLocation, oParams, oSign);

				return false;
			}
		}
		else
		{
			_oLocation.tries = 0;
		}


		var oPlacedBound = this.placed.getBoundingClientRect(),
			sFixedSide = _getHorFixedSide(_oLocation),
			iNewValue = 0,

			iBoundLeft  = oPlacedBound.left,
			iBoundRight = oPlacedBound.right,
			iLeftLimit = 5,
			iRightLimit = window.innerWidth - globalScrollbar.width() - 5;

		if (sFixedSide === 'left' && iBoundRight > iRightLimit)
		{
			var iFixRight = iBoundRight - iRightLimit,
				iFreeLeft = iBoundLeft - iLeftLimit;

			if (sHorProp === 'left')
			{
				iNewValue = oPosition.left;

				if (iFixRight > iFreeLeft)
				{
					iNewValue -= iFreeLeft;
				}
				else
				{
					iNewValue -= iFixRight;
				}
			}
			else
			{
				iNewValue = oPosition.right;

				if (iFixRight > iFreeLeft)
				{
					iNewValue += iFreeLeft;
				}
				else
				{
					iNewValue += iFixRight;
				}
			}

			this.placed.style.setProperty(sHorProp, Math.round(iNewValue) + 'px', 'important');
		}
		else if (sFixedSide === 'right' && iBoundLeft < 0)
		{
			var iFixLeft = -1 * iBoundLeft + iLeftLimit,
				iFreeRight = iRightLimit - iBoundRight;

			if (sHorProp === 'left')
			{
				iNewValue = oPosition.right;

				if (iFixLeft > iFreeRight)
				{
					iNewValue += iFreeRight;
				}
				else
				{
					iNewValue += iFixLeft;
				}
			}
			else
			{
				iNewValue = oPosition.right;

				if (iFixLeft > iFreeRight)
				{
					iNewValue -= iFreeRight;
				}
				else
				{
					iNewValue -= iFixLeft;
				}
			}

			this.placed.style.setProperty(sHorProp, Math.round(iNewValue) + 'px', 'important');
		}


		this.currentBounds = oParams.target;
		// this.placed._jQ().trigger('placed');

		return true;
	},

	_getHorFixedSide = function (_oLoc)
	{
		var sAlign = _oLoc.align,
			sSide = _oLoc.side,
			sPosition = _oLoc.position;

		if (sPosition === 'top' || sPosition === 'bottom')
		{
			if (sAlign === 'start')  return 'left';
			if (sAlign === 'center') return 'center';
			if (sAlign === 'end')    return 'right';
		}

		if (sAlign === 'center' && sPosition === 'center') return 'center';

		if (sSide === 'out' && sPosition === 'left')  return 'right';
		if (sSide === 'in'  && sPosition === 'right') return 'right';

		return 'left';
	},


	_oPossibleLocations = {
		start: {
			'in': {
				top: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				bottom: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				left: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				right: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				}
			},
			out: {
				top: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				bottom: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				left: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				right: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				}
			}
		},
		center: {
			'in': {
				top: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:    1,
							tw:  0.5,
							ol:   -1,
							ow:    0,
							pw: -0.5,
							oh:    1
						};
					}
					else
					{
						res.hor = {
							tl:   -1,
							tw: -0.5,
							ol:    1,
							ow:    1,
							pw: -0.5,
							oh:   -1
						};
					}

					return res;
				},
				bottom: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:    1,
							tw:  0.5,
							ol:   -1,
							ow:    0,
							pw: -0.5,
							oh:    1
						};
					}
					else
					{
						res.hor = {
							tl:   -1,
							tw: -0.5,
							ol:    1,
							ow:    1,
							pw: -0.5,
							oh:   -1
						};
					}

					return res;
				},
				left: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:    1,
							th:  0.5,
							ot:   -1,
							oh:    0,
							ph: -0.5,
							ov:    1
						};
					}
					else
					{
						res.ver = {
							tt:   -1,
							th: -0.5,
							ot:    1,
							oh:    1,
							ph: -0.5,
							ov:   -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				right: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:    1,
							th:  0.5,
							ot:   -1,
							oh:    0,
							ph: -0.5,
							ov:    1
						};
					}
					else
					{
						res.ver = {
							tt:   -1,
							th: -0.5,
							ot:    1,
							oh:    1,
							ph: -0.5,
							ov:   -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				center: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:    1,
							th:  0.5,
							ot:   -1,
							oh:    0,
							ph: -0.5,
							ov:    1
						};
					}
					else
					{
						res.ver = {
							tt:   -1,
							th: -0.5,
							ot:    1,
							oh:    1,
							ph: -0.5,
							ov:   -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:    1,
							tw:  0.5,
							ol:   -1,
							ow:    0,
							pw: -0.5,
							oh:    1
						};
					}
					else
					{
						res.hor = {
							tl:   -1,
							tw: -0.5,
							ol:    1,
							ow:    1,
							pw: -0.5,
							oh:   -1
						};
					}

					return res;
				}
			},
			out: {
				top: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:    1,
							tw:  0.5,
							ol:   -1,
							ow:    0,
							pw: -0.5,
							oh:    1
						};
					}
					else
					{
						res.hor = {
							tl:   -1,
							tw: -0.5,
							ol:    1,
							ow:    1,
							pw: -0.5,
							oh:   -1
						};
					}

					return res;
				},
				bottom: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:    1,
							tw:  0.5,
							ol:   -1,
							ow:    0,
							pw: -0.5,
							oh:    1
						};
					}
					else
					{
						res.hor = {
							tl:   -1,
							tw: -0.5,
							ol:    1,
							ow:    1,
							pw: -0.5,
							oh:   -1
						};
					}

					return res;
				},
				left: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:    1,
							th:  0.5,
							ot:   -1,
							oh:    0,
							ph: -0.5,
							ov:    1
						};
					}
					else
					{
						res.ver = {
							tt:   -1,
							th: -0.5,
							ot:    1,
							oh:    1,
							ph: -0.5,
							ov:   -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				right: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:    1,
							th:  0.5,
							ot:   -1,
							oh:    0,
							ph: -0.5,
							ov:    1
						};
					}
					else
					{
						res.ver = {
							tt:   -1,
							th: -0.5,
							ot:    1,
							oh:    1,
							ph: -0.5,
							ov:   -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				center: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:    1,
							th:  0.5,
							ot:   -1,
							oh:    0,
							ph: -0.5,
							ov:    1
						};
					}
					else
					{
						res.ver = {
							tt:   -1,
							th: -0.5,
							ot:    1,
							oh:    1,
							ph: -0.5,
							ov:   -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:    1,
							tw:  0.5,
							ol:   -1,
							ow:    0,
							pw: -0.5,
							oh:    1
						};
					}
					else
					{
						res.hor = {
							tl:   -1,
							tw: -0.5,
							ol:    1,
							ow:    1,
							pw: -0.5,
							oh:   -1
						};
					}

					return res;
				}
			}
		},
		end: {
			'in': {
				top: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				bottom: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				left: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				},
				right: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				}
			},
			out: {
				top: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  0,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th:  0,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				bottom: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph:  0,
							ov:  1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph: -1,
							ov: -1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				left: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  0,
							ol: -1,
							ow:  0,
							pw: -1,
							oh: -1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw:  0,
							ol:  1,
							ow:  1,
							pw:  0,
							oh:  1
						};
					}

					return res;
				},
				right: function (_oProps)
				{
					var res = {};

					if (_oProps.ver === 'top')
					{
						res.ver = {
							tt:  1,
							th:  1,
							ot: -1,
							oh:  0,
							ph: -1,
							ov: -1
						};
					}
					else
					{
						res.ver = {
							tt: -1,
							th: -1,
							ot:  1,
							oh:  1,
							ph:  0,
							ov:  1
						};
					}

					if (_oProps.hor === 'left')
					{
						res.hor = {
							tl:  1,
							tw:  1,
							ol: -1,
							ow:  0,
							pw:  0,
							oh:  1
						};
					}
					else
					{
						res.hor = {
							tl: -1,
							tw: -1,
							ol:  1,
							ow:  1,
							pw: -1,
							oh: -1
						};
					}

					return res;
				}
			}
		}
	};
