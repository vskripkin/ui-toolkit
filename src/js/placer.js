(function ($, undefined)
{
	'use strict';

	var TYPE = 'placer',

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

	Placer.DEFAULTS = {
		/* required
		-------------------------
		placed: jQuery || HTMLElement || CSS Selector String,
		target: jQuery || HTMLElement || CSS Selector String,
		-------------------------
		*/
		common: {
		/*  return true or false, if true - params will be applied
			condition: f(){}
			whenFALSE: f(){}
			whenTRUE:  f(){}    */
			position: 'top', // bottom, left, right
			align: 'start',  // center, end
			side: 'out',     //'in'
			parent: 'body',
			offsetParent: false,
			fixed: false,
			width: false,
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
		},

		/* will overwrite specified common features
		   can be json object or array of json objects
		location: {},
		 */

		/* function to check if position should be updated */
		checkPos: false,
		checkInterval: 1000,
		update: false
	};

	Placer.prototype =
	{
		constructor: Placer,
		type: TYPE,

		init: function (_options)
		{
			this.options = _getOptions.call(this, _options);
			this.options.checkPos = this.options.checkPos || this.options.location.length > 1;

			_saveDefaultStyle.call(this);

			this.start();

			return this;
		},

		set: function ()
		{
			var aLocations = this.options.location,
				oParams, oLoc, oPrevLoc, oNewLoc, i, L;

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

		start: function ()
		{
			if (this.options.checkPos)
			{
				var fCheck = this.options.checkPos,
					that = this;

				this.stop();
				this.timer = setInterval(function ()
				{
					if (fCheck.call(that))
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

		destroy : function ()
		{
			this.stop();
			delete this.options.placed['_' + TYPE];
		}
	};


 /* PLACER PLUGIN DEFINITION
  * ========================= */

	$.fn.placeTo = function ( options )
	{
		options || (options = {});

		return this.each(function ()
		{
			var plugin = this['_' + TYPE];

			if (options.update && typeof plugin !== 'undefined')
			{
				plugin.destroy();
				plugin = undefined;
			}

			if (typeof plugin === 'undefined')
			{
				this['_' + TYPE] = new Placer(this, options);
			}
			else if (_.isString(options))
			{
				plugin[options]();
			}
			else if (_.isObject(options))
			{
				plugin.set();
			}
		});
	};

	$.fn.placeTo.Constructor = Placer;

	$.placer = function ( options )
	{
		return new Placer( false, options );
	};

	var _getOptions = function (_options)
		{
			var that = this,
				options = $.extend({}, Placer.DEFAULTS, _options),
				aPossibleValues =  [window,
									document,
									document.documentElement,
									document.body,
									$(window),
									$(document),
									document.documentElement._jQ(),
									document.body._jQ(),
									'body',
									'html',
									undefined,
									true,
									false];

			delete options.common;

			this.placed = (options.placed instanceof $ ? options.placed : $(options.placed)).get(0);
			this.target = (options.target instanceof $ ? options.target : $(options.target)).get(0);

			if (!_.isArray(options.location))
			{
				options.location = [options.location];
			}

			if (options.location.length > 1)
			{
				options.location.sort(function (a, b)
				{
					return (b.priority || 0) - (a.priority || 0);
				});
			}

			_.forEach(options.location, function (_oLoc, i)
			{
				options.location[i] = _oLoc = $.extend(true, {}, Placer.DEFAULTS.common, _oLoc);

				_oLoc.id = _.randomStr();
				_oLoc.tries = 0;

				if (_.isObject(_oLoc.offset))
				{
					_oLoc.offset = {
						ver: parseInt(_oLoc.offset.ver) || 0,
						hor: parseInt(_oLoc.offset.hor) || 0
					}
				}
				else
				{
					_oLoc.offset = {
						ver: parseInt(_oLoc.offset) || 0,
						hor: parseInt(_oLoc.offset) || 0
					}
				}

				if (_oLoc.position === 'center' && _oLoc.align === 'center')
				{
					_oLoc.includeMargin = false;
				}

				if (aPossibleValues.indexOf(_oLoc.parent) > -1)
				{
					_oLoc.parent = document.body;
				}
				_oLoc.parent = (_oLoc.parent instanceof $ ? _oLoc.parent : $(_oLoc.parent)).get(0);

				if (!_oLoc.offsetParent)
				{
					if (window.getComputedStyle(_oLoc.parent).position === 'static')
					{
						if (_oLoc.parent.offsetParent !== null)
						{
							_oLoc.offsetParent = _oLoc.parent.offsetParent;
						}
						else
						{
							if (window.getComputedStyle(document.body).position === 'static')
							{
								_oLoc.offsetParent  = document.documentElement;
							}
							else
							{
								_oLoc.offsetParent  = document.body;
							}
						}
					}
					else
					{
						_oLoc.offsetParent = _oLoc.parent;
					}
				}
				_oLoc.offsetParent = (_oLoc.offsetParent instanceof $ ? _oLoc.offsetParent : $(_oLoc.offsetParent)).get(0);

				if (parseInt(_oLoc.width) <= 0)
				{
					_oLoc.width = 'auto';
				}
				if (_.isNumeric(_oLoc.width) && _oLoc.width > 0)
				{
					_oLoc.width = Math.round(_oLoc.width) + 'px';
				}
				else if (!_.isBoolean(_oLoc.width))
				{
					_oLoc.width = false;
				}

				if (parseInt(_oLoc.height) <= 0)
				{
					_oLoc.height = 'auto';
				}
				if (_.isNumeric(_oLoc.height) && _oLoc.height > 0)
				{
					_oLoc.height = Math.round(_oLoc.height) + 'px';
				}
				else if (!_.isBoolean(_oLoc.height))
				{
					_oLoc.height = false;
				}
			});

			return options;
		},

		_saveDefaultStyle = function ()
		{
			this.styleDefault = {};

			var oPlacedStyle = this.placed.style,
				oStyleDefault = this.styleDefault;

			_.forEach(_aWantedStyles, function (_sProp)
			{
				oStyleDefault[_sProp] = {};
				oStyleDefault[_sProp].value = oPlacedStyle.getPropertyValue(_sProp);
				oStyleDefault[_sProp].priority = oPlacedStyle.getPropertyPriority(_sProp);
			});
		},

		_restoreDefaultStyle = function ()
		{
			var oPlacedStyle = this.placed.style;

			_.forEach(this.styleDefault, function (_oValue, _sProp)
			{
				oPlacedStyle.setProperty(_sProp, _oValue.value, _oValue.priority);
			});
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
				iExtraV -= _getMargin.call(this, _oOpposite[sVerProp]);
				iExtraH -= _getMargin.call(this, _oOpposite[sHorProp]);
			}

			if (!_oLoc.fixed)
			{
				var oOffsetCss = window.getComputedStyle(_oLoc.offsetParent);

				oOffsetBounds = _.clone(_oLoc.offsetParent.getBoundingClientRect());
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
				offsetParent: oOffsetBounds,
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
				extraV    : iExtraV,
				extraH    : iExtraH
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
					if (_.isBoolean(_oLocation.width))
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
					if (_.isBoolean(_oLocation.height))
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
					if (_.isBoolean(_oLocation.minWidth))
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
					if (_.isBoolean(_oLocation.maxWidth))
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
					if (_.isBoolean(_oLocation.minHeight))
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
					if (_.isBoolean(_oLocation.maxHeight))
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

			var oParams = _oParams || _getMainParams.call(this, _oLocation),
				oSign = _oSign || _oPossibleLocations[_oLocation.align]
													 [_oLocation.side]
													 [_oLocation.position].call(this, _oLocation.props),
				oPosition = {},
				sProp;

			oPosition[_oLocation.props.ver] = oSign.ver.tt * oParams.target.top
											+ oSign.ver.th * oParams.target.height
											+ oSign.ver.ot * oParams.offsetParent.top
											+ oSign.ver.oh * oParams.offsetParent.height
											+ oSign.ver.ph * oParams.placed.height
											+ oSign.ver.ov * _oLocation.offset.ver
											+ oParams.extraV;

			oPosition[_oLocation.props.hor] = oSign.hor.tl * oParams.target.left
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
				if (!isNaN(oPosition[sProp]))
				{
					oPosition[sProp] = Math.round(oPosition[sProp]) + 'px';
				}
				this.placed.style.setProperty(sProp, oPosition[sProp], 'important');
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

			this.currentBounds = oParams.target;
			this.placed._jQ().trigger('placed');
			return true;
		},

		_getMargin = function (_sSide)
		{
			var oPlacedStyle = window.getComputedStyle(this.placed);

			return Math.round(parseInt(oPlacedStyle['margin-' + _sSide])) || 0;
		},

		_aWantedStyles =   ['margin-top',
							'margin-bottom',
							'margin-right',
							'margin-left',
							'width',
							'height',
							'min-width',
							'min-height',
							'position'],

		_oOpposite = {
			top: 'bottom',
			bottom: 'top',
			left: 'right',
			right: 'left'
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

}(jQuery));