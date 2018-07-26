;(function ($, _, undefined)
{
	'use strict';

	var TYPE = 'selectbox',
		ACTIVE = false,
		Class = {
			under: '__under',
			above: '__above',
			opened: '__opened',
			input: '__textfield',
			value: '__value',
			placeholder: '__placeholder',
			addon: '__addon',
			arrow: '__arrow'
		},

		Selectbox = function (_nElem, _options)
		{
			this.options     =
			this.dropdown    =
			this.filterTimer =
			this.select      = undefined;

			this.init(_nElem, _options);
		};

	Selectbox.DEFAULTS = {
		id: false,
		fixed: false,
		filter: false,
		zIndex: 50,
		width: false,
		maxWidth: false,
		units: false,
		unitsAlign: 'right',
		nested: false,
		placeholder: false,
		copyAttr: false,
		copyLabel: false,
		altText: false,
		parent: false,
		offset: 0,
		dropdownAlign: 'start',
		showSelectedIndex: false,
		arrow: '<i class="material-icons">arrow_drop_down</i>',

		classes: {
			select: '',
			list: '',
			attr: '__with-attr',
			label: '__with-label',

			select_common: 'selectbox',
			list_common: 'selectbox-options'
		}
	};

	Selectbox.prototype =
	{
		constructor: Selectbox,
		type: TYPE,

		init: function (_select, _options)
		{
			this.select = _select;
			this.options = _getOptions.call(this, _options);
			this.options.multiple = _select.multiple;
			this.options.placeholder = this.options.placeholder || this.select.getAttribute('placeholder');
			this.id = this.options.id || TYPE + (Math.random() * 1e7).toFixed(0) + '_' + (Math.random() * 1e7).toFixed(0);

			var that = this, sEvents, jTemplate;

			if (_.isMobile)
			{
				_select.style.setProperty('display', 'block', 'important');

				jTemplate = $('<div class="' + this.classes.select + '" id="' + this.id + '">')
							.html('<input class="' + Class.input + '" type="text" readonly="readonly" autocomplete="off">' +
								  '<span  class="' + Class.value + '"></span>' +
								  '<span  class="' + Class.arrow +'">' + this.options.arrow + '</span>')
							.insertAfter(this.select)
							.append(this.select);
			}
			else
			{
				_select.style.setProperty('display', 'none', 'important');

				sEvents = 'mousedown.' + TYPE + ' keydown.' + TYPE + ' change.' + TYPE + (this.options.filter ? ' keyup.' + TYPE : '');
				jTemplate = $('<div class="' + this.classes.select + '" id="' + this.id + '">')
							.html('<input class="' + Class.input + '" type="text" readonly="readonly" autocomplete="off">' +
								  '<span class="' + Class.value +'"></span>' +
								  '<span class="' + Class.arrow + '">' + this.options.arrow + '</span>')
							.insertAfter(this.select)
							.on(sEvents, _selectboxHandler.bind(this));
			}

			this.$ = {
				container : jTemplate,
				valueCont : jTemplate.find('.' + Class.value).get(0),
				input : jTemplate.find('.' + Class.input).get(0),

				wasSelected: [-1],
				open : false,
				shift : undefined,

				value : (function (_sText, _nOption)
				{
					if (this.options.filter && this.$.open)
					{
						this.$.input.value = _sText;
					}
					else
					{
						if (this.options.copyAttr)
						{
							var Attrs = this.options.copyAttr, i = Attrs.length, sAttr;

							if (_nOption && _nOption.selected)
							{
								while (i--)
								{
									sAttr = _nOption.getAttribute(Attrs[i]);
									if (sAttr !== null) this.$.valueCont.setAttribute(Attrs[i], sAttr);
								}
							}
							else
							{
								while (i--) this.$.valueCont.removeAttribute(Attrs[i]);
							}
						}
						if (this.options.altText && _nOption)
						{
							var sAltText = _nOption.getAttribute(this.options.altText);
							if (sAltText !== null) _sText = sAltText;
						}

						this.$.valueCont.innerHTML = _sText;
						return this;
					}
				}).bind(this)
			};

			this.options.dropdown.input = this.$.input;
			this.options.dropdown.placeTo.target = jTemplate;
			this.dropdown = $.getDropdown(this.options.dropdown);

			this.$.input[TYPE] = this;

			if (this.options.copyLabel)
			{
				var sLabelValue = _select.getAttribute(this.options.copyLabel);

				if (sLabelValue === null)
				{
					this.options.copyLabel = false;
					this.$.container.removeClass(this.classes.label);
				}
				else
				{
					this.$.valueCont.setAttribute(this.options.copyLabel, sLabelValue);
				}
			}
			if (this.options.units)
			{
				$('<span class="' + Class.addon + ' __' + this.options.unitsAlign + '">'
					+ this.options.units + '</span>').insertAfter(this.$.input);
			}
			if (this.options.width) this.$.container.width(this.options.width);
			if (this.options.placeholder)
			{
				this.$.value(this.options.placeholder);
				this.$.valueCont.classList.add(Class.placeholder);
				this.select.selectedIndex = -1;
			}
			else this.refreshValue();

			if (this.select.getAttribute('tabindex'))
			{
				this.$.input.setAttribute('tabindex', this.select.getAttribute('tabindex'));
			}
			if (this.select.getAttribute('autofocus'))
			{
				this.setFocus();
			}

			_select._jQ()
				.on('refresh.' + TYPE + ' change.' + TYPE, function (e, _bIsTriggeredByUser, _bStop)
				{
					that.dropdown.update(_getSelected.call(that));
					that.refreshValue(e, _bIsTriggeredByUser, _bStop);
				})
				// in case if focus is set by JS on select node
				.on('focus.' + TYPE, this.setFocus.bind(this));
		},

		refreshValue : function (e, _bIsTriggeredByUser, _bStop)
		{
			if (_bStop) return true;

			var iSelected = !!_bIsTriggeredByUser ? this.dropdown.getLastSelected() : this.select.selectedIndex,
				bNotSelected = iSelected === -1;

			if (bNotSelected && !!this.options.placeholder)
			{
				this.dropdown.setSelected(iSelected);
				this.select.selectedIndex = iSelected;
				this.$.value(this.options.placeholder);
				this.$.valueCont.classList.add(Class.placeholder);
			}
			else
			{
				iSelected = bNotSelected ? 0 : iSelected;

				if (bNotSelected) this.select.selectedIndex = iSelected;

				var sValue = this.select.options[iSelected] && this.select.options[iSelected].text || '';
				if (this.options.showSelectedIndex) sValue = (iSelected + 1) + '. ' + sValue;

				this.dropdown.setSelected(iSelected);
				this.$.value(sValue, this.select.options[iSelected]);
				this.$.valueCont.classList.remove(Class.placeholder);
			}
		},

		setFocus: function ()
		{
			_.isMobile ? this.select.focus() : this.$.input.focus();
		},

		show: function ()
		{
			if (ACTIVE) ACTIVE.hide();

			ACTIVE = this;

			this.$.open = true;
			this.dropdown.show();
			this.$.container.addClass(Class.opened);

			if (this.options.filter)
			{
				this.$.input.style.zIndex = 3;
				this.$.input.removeAttribute('readonly');
			}

			this.$.wasSelected = _getSelected.call(this);
		},

		hide: function (_bSilent)
		{
			if (this.$.open)
			{
				this.$.open = false;

				if (this.options.filter)
				{
					this.$.input.style.zIndex = 1;
					this.$.input.setAttribute('readonly', 'readonly');
				}

				this.$.container.removeClass(Class.opened + ' ' + Class.above + ' ' + Class.under);
				this.dropdown.hide();
				this.refreshValue();

				ACTIVE = false;

				if (this.isChanged()) this.select._jQ().trigger('change', [true, true]);
			}
		},

		isChanged: function ()
		{
			if (this.dropdown.getLastSelected() === -1)
			{
				return false;
			}

			var bIsChanged = false,
				aWasSelected = this.$.wasSelected,
				anSelectedOptions = _getSelected.call(this);

			if (aWasSelected.length !== anSelectedOptions.length)
			{
				bIsChanged = true;
			}
			else
			{
				_.forEach(anSelectedOptions, function (_nOption)
				{
					if (aWasSelected.indexOf(_nOption) === -1)
					{
						bIsChanged = true;
					}
				});
			}

			return bIsChanged;
		},

		reset: function ()
		{
			var iDefaultSelected = -1;

			if (!this.options.placeholder)
			{
				var anOptions = this.select.options,
					iLength = anOptions.length,
					i;

				for (i = 0; i < iLength; i++)
				{
					if (anOptions[i].defaultSelected)
					{
						iDefaultSelected = i;
						break;
					}
				}

				if (iDefaultSelected === -1) iDefaultSelected = 0;
			}

			this.dropdown.reset(iDefaultSelected);
			this.select.selectedIndex = iDefaultSelected;

			this.$.open ? this.hide() : this.refreshValue();

			return true;
		},

		isDisabled : function ()
		{
			return this.select.disabled;
		},

		destroy : function ()
		{
			this.dropdown.destroy();
			this.hide();
			this.$.container.remove();
			delete this.select[TYPE];
		}
	};


 /* SELECTBOX PLUGIN DEFINITION
  * ========================= */

	$.fn.selectbox = function ( options )
	{
		return this.each(function ()
		{
			if (this.tagName.toLowerCase() !== 'select') return false;

			var data = this[TYPE];

			if (!data && (typeof options == 'object' || !options))
			{
				this[TYPE] = new Selectbox(this, options);
			}
			else if (typeof options == 'string') data[options]();
		});
	};

	$.fn.selectbox.Constructor = Selectbox;

	$.fn.removeSelectbox = function ( options )
	{
		return this.each(function ()
		{
			_.forEach(this.querySelectorAll('select'), function (_nSelect)
			{
				if (_nSelect[TYPE])
				{
					_nSelect[TYPE].destroy();
				}
			});
		});
	};

	var _getOptions = function (_options)
		{
			var oOptions = $.extend(true, {}, Selectbox.DEFAULTS, _options, this.select._jQ().data()),
				that = this,
				sCommonClass, sClass;

			this.classes = oOptions.classes;
			delete oOptions.classes;

			this.classes.select += ' ' + this.classes.select_common;
			this.classes.list += ' ' + this.classes.list_common;
			if (oOptions.copyAttr)
			{
				oOptions.copyAttr = oOptions.copyAttr.split(' ');
				this.classes.select += ' ' + this.classes.attr;
			}
			if (oOptions.copyLabel)
			{
				this.classes.select += ' ' + this.classes.label;
			}
			this.classes.select = this.classes.select.trim();
			this.classes.list = this.classes.list.trim();

			oOptions.dropdown = {
				nested: oOptions.nested,
				copyAttr: oOptions.copyAttr,
				items: this.select,
				multiple: oOptions.multiple,
				filter: oOptions.filter,
				checkChanges: true,

				onInit: _addDropdownHandler.bind(this),
				onSelect: _onSelect.bind(this),
				onUnselect: _onUnselect.bind(this),

				isActive: function ()
				{
					return that.$.open;
				},

				classes: {
					list_common: this.classes.list,
					attr: this.classes.attr
				},
				placeTo: {
					checkPos: function ()
					{
						var oBounds = this.target.getBoundingClientRect();
						return (!this.currentBounds ||
								 this.currentBounds.top  !== Math.round(oBounds.top) ||
								 this.currentBounds.left !== Math.round(oBounds.left));
					},
					checkInterval: 800,
					location: [
						{
							condition: function (_oParams)
							{
								if (_oParams.spaceUnder >= 100 || _oParams.spaceUnder >= _oParams.spaceAbove)
								{
									//under
									var iMaxHeight = (_oParams.spaceUnder <= 400) ? _oParams.spaceUnder - 20 : 400;

									this.placed.style.zIndex = that.options.zIndex;
									this.placed.style.maxHeight = iMaxHeight + 'px';

									return true;
								}

								return false;
							},
							whenTRUE: function (_oParams)
							{
								this.placed.classList.add(Class.under);
								that.$.container.addClass(Class.under);
							},
							whenFALSE: function ()
							{
								this.placed.classList.remove(Class.under);
								that.$.container.removeClass(Class.under);
							},
							includeMargin: false,
							position:      'bottom',
							align:         oOptions.dropdownAlign,
							side:          'out',
							minWidth:      true,
							maxWidth:      oOptions.maxWidth,
							offset:        oOptions.offset,
							parent:        oOptions.parent,
							fixed:         oOptions.fixed,
							props: {
								ver:       'top',
								hor:       'left'
							}
						},
						{
							condition: function (_oParams)
							{
								if (_oParams.spaceUnder < 100 || _oParams.spaceUnder < _oParams.spaceAbove)
								{
									//above
									var iMaxHeight = (_oParams.spaceAbove <= 400) ? _oParams.spaceAbove - 20 : 400;

									this.placed.style.zIndex = that.options.zIndex;
									this.placed.style.maxHeight = iMaxHeight + 'px';

									return true;
								}

								return false;
							},
							whenTRUE: function (_oParams)
							{
								this.placed.classList.add(Class.above);
								that.$.container.addClass(Class.above);
							},
							whenFALSE: function ()
							{
								this.placed.classList.remove(Class.above);
								that.$.container.removeClass(Class.above);
							},
							includeMargin: false,
							position:      'top',
							align:         'start',
							side:          'out',
							minWidth:      true,
							maxWidth:      oOptions.maxWidth,
							offset:        oOptions.offset,
							parent:        oOptions.parent,
							fixed:         oOptions.fixed,
							props: {
								ver:       'top',
								hor:       'left'
							}
						}
					]
				}
			};
			delete oOptions.parent;
			delete oOptions.fixed;

			return oOptions;
		},

		_onSelect = function (_index)
		{
			this.select.options[_index].selected = true;
		},

		_onUnselect = function (_index)
		{
			this.select.options[_index].selected = false;
		},

		_addDropdownHandler = function (_oDropdown)
		{
			_oDropdown.addClickHandler(_dropdownHandler.bind(this));
		},

		_selectboxHandler = function (e, _bStop)
		{
			if (_bStop) return true;

			if (this.isDisabled())
			{
				this.hide();
				if (e.keyCode !== 9) this.setFocus();
				return false;
			}

			switch (e.type)
			{
				case 'mousedown' :
					e.stopPropagation();

					if (this.options.filter && !e.target.classList.contains(Class.arrow))
					{
						if (!this.$.open)
						{
							this.show();
							this.setFocus();
						}
					}
					else
					{
						e.preventDefault();
						this.setFocus();
						this.$.open ? this.hide() : this.show();
					}

					this.$.container.trigger('mousedown', [true]);

					break;

				case 'keydown' :
					switch (e.keyCode)
					{
						case 27: // esc
							this.hide();
							break;
						case  9: // tab
						case 13: // enter
							if (e.keyCode == 13) e.preventDefault();
							if (this.select.multiple)
							{
								if (this.$.open) this.hide();
							}
							else if (this.$.open)
							{
								if (this.dropdown.getLastSelected() > -1)
								{
									e.type = 'click';
									_dropdownHandler.call(this, e);
								}
								else this.hide();
							}
							break;
						case 38: // up
						case 40: // down
							e.preventDefault();
							e.stopPropagation();
							if (this.$.open) _onKeyDown.call(this, e, e.keyCode === 38 ? 'up' : 'down');
							else this.show();
							break;
					}
					break;

				case 'keyup':
					if (this.options.filter && (e.keyCode < 9 || e.keyCode > 45))
					{
						var that = this;

						if (this.filterTimer) clearTimeout(this.filterTimer);
						this.filterTimer = setTimeout(function ()
						{
							that.dropdown.filter(that.$.input.value.trim());
						}, 250);
					}
					break;

				case 'change' :
					e.stopPropagation();
					break;
			}
		},

		_onKeyDown = function (e, _sDirection)
		{
			if (this.select.multiple)
			{
				if (!e.shiftKey)
				{
					delete this.$.shift;
					this.dropdown.unselectAll();
					var iNewSelected = this.dropdown.selectNext(_sDirection);
					if (!this.dropdown.isSelected(iNewSelected)) this.dropdown.select(iNewSelected);
				}
				else
				{
					if (this.dropdown.getLastSelected() < 0)
					{
						delete this.$.shift;
						this.dropdown.select(0);
					}
					else
					{
						if (typeof this.$.shift === 'undefined')
						{
							this.$.shift = {
								start : this.dropdown.getLastSelected(),
								end : this.dropdown.selectNext(_sDirection),
								direction : _sDirection
							};

							if (this.$.shift.start === 0 && this.$.shift.start === this.$.shift.end) this.$.shift.direction = 'down';
							else if (this.$.shift.start === this.dropdown.getLength('filtered') - 1 && this.$.shift.start === this.$.shift.end) this.$.shift.direction = 'up';
						}
						else
						{
							if (_sDirection !== this.$.shift.direction) this.dropdown.unselect(this.$.shift.end);
							this.$.shift.end = this.dropdown.selectNext(_sDirection);
							if (this.$.shift.start === this.$.shift.end) delete this.$.shift;
						}
					}
				}
			}
			else
			{
				this.dropdown.unselectAll();
				var iNewSelected = this.dropdown.selectNext(_sDirection);
				if (!this.dropdown.isSelected(iNewSelected)) this.dropdown.select(iNewSelected);
			}

			this.refreshValue(e, true);
		},

		_dropdownHandler = function (e)
		{
			if (e.keyCode !== 9) this.setFocus();
			if (e.type === 'contextmenu') e.preventDefault();

			var iLastSelected = this.dropdown.getLastSelected(),
				iNewSelected = typeof e.currentTarget.index !== 'undefined' ? e.currentTarget.index : iLastSelected,
				i;

			if (this.select.multiple)
			{
				if (!e.ctrlKey && !e.shiftKey)
				{
					delete this.$.shift;
					this.dropdown.unselectAll();
					this.dropdown.select(iNewSelected);
				}
				else if (e.ctrlKey && !e.shiftKey)
				{
					var xResult = this.dropdown.toggle(iNewSelected);

					if (typeof this.$.shift !== 'undefined')
					{
						var sDirection = this.$.shift.direction,
							iStart = this.$.shift.start,
							iEnd = this.$.shift.end;

						if (!_.isInteger(xResult))
						{
							if (!this.dropdown.isSelected(iStart))
							{
								this.$.shift.start = sDirection === 'down' ? (iStart + 1) : (iStart - 1);
							}
							if (!this.dropdown.isSelected(iEnd))
							{
								this.$.shift.end = sDirection === 'down' ? (iEnd - 1) : (iEnd + 1);
							}

							this.dropdown.setLastSelected(this.$.shift.end);
							if (this.$.shift.start === this.$.shift.end) delete this.$.shift;
						}
						else
						{
							if (sDirection === 'down')
							{
								if (iStart - 1 === xResult)
								{
									this.$.shift.start = xResult;
									this.dropdown.setLastSelected(iLastSelected);
								}
								if (iEnd + 1 === xResult) this.$.shift.end = xResult;
							}
							else
							{
								if (iStart + 1 === xResult)
								{
									this.$.shift.start = xResult;
									this.dropdown.setLastSelected(iLastSelected);
								}
								if (iEnd - 1 === xResult) this.$.shift.end = xResult;
							}
						}
					}

					if (this.dropdown.getLength('selected') === 0) this.dropdown.setLastSelected(-1);
				}
				else if (e.shiftKey)
				{
					if (this.dropdown.getLastSelected() < 0)
					{
						delete this.$.shift;
						this.dropdown.select(iNewSelected);
					}
					else
					{
						if (typeof this.$.shift === 'undefined')
						{
							this.$.shift = {
								start : iLastSelected,
								end : iNewSelected,
								direction : (iNewSelected > iLastSelected ? 'down' : 'up')
							};
						}
						else
						{
							var iStart = this.$.shift.start,
								iEnd = this.$.shift.end,
								sDirection = this.$.shift.direction;

							if (sDirection === 'down')
							{
								switch (true)
								{
									case iNewSelected < iStart:
										for (i = iStart + 1; i <= iEnd; i++) this.dropdown.unselect(i);

										this.$.shift = {
											start : iStart,
											end : iNewSelected,
											direction : 'up'
										};
										break;

									case iNewSelected === iStart:
										for (i = iStart + 1; i <= iEnd; i++) this.dropdown.unselect(i);
										delete this.$.shift;
										break;

									case iNewSelected < iEnd:
										for (i = iNewSelected + 1; i <= iEnd; i++) this.dropdown.unselect(i);
										this.$.shift.end = iNewSelected;
										break;

									default:
										this.$.shift.end = iNewSelected;
										break;
								}
							}
							else
							{
								switch (true)
								{
									case iNewSelected > iStart:
										for (i = iStart - 1; i >= iEnd; i--) this.dropdown.unselect(i);

										this.$.shift = {
											start : iStart,
											end : iNewSelected,
											direction : 'down'
										};
										break;

									case iNewSelected === iStart:
										for (i = iStart - 1; i >= iEnd; i--) this.dropdown.unselect(i);
										delete this.$.shift;
										break;

									case iNewSelected > iEnd:
										for (i = iNewSelected - 1; i >= iEnd; i--) this.dropdown.unselect(i);
										this.$.shift.end = iNewSelected;
										break;

									default:
										this.$.shift.end = iNewSelected;
										break;
								}
							}
						}

						if (typeof this.$.shift !== 'undefined')
						{
							if (this.$.shift.direction === 'down')
							{
								for (i = this.$.shift.start; i <= this.$.shift.end; i++) this.dropdown.select(i);
							}
							else
							{
								for (i = this.$.shift.start; i >= this.$.shift.end; i--) this.dropdown.select(i);
							}
						}
						else this.dropdown.select(iNewSelected);
					}
				}
			}
			else
			{
				this.dropdown.unselectAll();
				this.dropdown.select(iNewSelected);
			}

			if (this.select.multiple)
			{
				if (!e.ctrlKey && !e.shiftKey) this.hide();
			}
			else this.hide();
		},

		_getSelected = function ()
		{
			var aSelected = [];

			if (this.select.multiple)
			{
				_.forEach(this.select.options, function (_nElem)
				{
					if (_nElem.selected) aSelected.push(_nElem.index);
				});
			}
			else
			{
				aSelected.push(this.select.selectedIndex);
			}

			return aSelected;
		},

		_closeOtherSelects = function (_sExceptThisId)
		{
			if (ACTIVE && ACTIVE.id.toString() !== _sExceptThisId)
			{
				ACTIVE.hide();
			}
		};

	$(window).on('mousedown.closeOtherSelects', function (e)
	{
		_closeOtherSelects(e.target.id);
	})
	.on('reset', function (e)
	{
		var nForm = false,
			nElems = false,
			i;

		if (e.target.tagName.toLowerCase() === 'form')
		{
			nForm = e.target;
		}
		else
		{
			nForm = e.target.form || e.target._form;
		}

		if (!nForm) return;

		nElems = nForm.elements || nForm._elements;

		if (!nElems) return;

		setTimeout(function ()
		{
			for (i = nElems.length; i--;)
			{
				var el = nElems[i];

				if (el.tagName.toLowerCase() === 'select' && !!el._selectbox)
				{
					el._selectbox.reset();
				}
			}
		}, 10);
	});
}(jQuery, window._));
