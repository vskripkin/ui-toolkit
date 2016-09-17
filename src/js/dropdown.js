(function ($, undefined)
{
	'use strict';

	var TYPE = 'dropdown',
		CASH = {},

		Class = {
			label: '__label',
			opened: '__opened',
			fixed: '__fixed',
			option: '__option',
			selected: '__selected',
			ignore: '__ignore',
			nested: '__with-nested',
			has_nested: '__has-nested',
			in_optgroup: '__in-optgroup'
		},

		Dropdown = function (_options)
		{
			this.method    =
			this.currHTML  =
			this.options   =
			this.placer    =
			this.scrollTop =
			this.timer     = undefined;

			return this.init(_options);
		};

	Dropdown.DEFAULTS = {
		id: false,
		nested: false,
		copyAttr: false,
		builder: false,
		items: false,
		selected: false,
		checkChanges: false,

		onInit: false,
		onSelect: function (){},
		onUnselect: function (){},
		onDestroy: function (){},
		onShow: function (){},
		onHide: function (){},

		input: false,
		minLength: 3,
		filter: false,
		autocomplete: false,

		classes: {
			list: '',
			list_common: 'options for_selectbox'
		}
	};

	Dropdown.prototype =
	{
		constructor: Dropdown,
		type: TYPE,

		init: function (_options)
		{
			this.scrollTop = 0;
			this.options = $.extend(true, {}, Dropdown.DEFAULTS, _options);

			if (this.options.isActive) this.isActive = this.options.isActive;

			if (this.options.filter) this.method = 'filter';
			else if (this.options.autocomplete) this.method = 'autocomplete';

			this.classes = this.options.classes;
			delete this.options.classes;
			this.classes.list += ' ' + this.classes.list_common;
			if (this.options.copyAttr)
			{
				if (_.isString(this.options.copyAttr)) this.options.copyAttr = this.options.copyAttr.split(' ');
				this.classes.list += ' ' + this.classes.attr;
			}
			if (this.options.nested) this.classes.list += ' ' + Class.nested;
			if (this.options.fixed)  this.classes.list += ' ' + Class.fixed;
			this.classes.list = this.classes.list.trim();

			this.dropdown = document.createElement('ul');
			this.dropdown.className = this.classes.list;

			this.dropdown._jQ().on('mousedown.' + TYPE, function (e)
			{
				e.preventDefault();
				e.stopPropagation();
				return false;
			});

			this.$ = {
				options : false,
				length: 0,

				query: '',
				filtered: [],
				filteredLength: 0,

				lastSelected: -1,
				selected : {},
				selectedLength: 0,

				open: false
			};

			if (typeof this.options.placeTo.placed === 'undefined') this.options.placeTo.placed = this.dropdown;
			if (this.options.onInit) this.options.onInit(this);

			return this;
		},

		addClickHandler: function (_fHandler)
		{
			this.dropdown._jQ().on('click', '.' + Class.option, _fHandler);
		},

		destroy : function ()
		{
			this.options.onDestroy();
			if (typeof this.placer !== 'undefined') this.placer.destroy();
			this.hide();
			this.dropdown._jQ().off().remove();
		},

		update: function (_xNewSelected)
		{
			var options = this.options,
				ID = options.id,
				bHtmlMayBeChanged = options.checkChanges,
				bNeedHtmlUpdate = !this.currHTML,
				sItemsString = bHtmlMayBeChanged ? (options.items.innerHTML || options.items).toString().replace(/\s/g, '') : true;

			if (typeof this.currHTML === 'undefined' || !this.currHTML)
			{
				if (!ID)
				{
					for (var _id in CASH)
					{
						if (CASH[_id].items === options.items) options.id = ID = _id;
					}
				}

				if (typeof CASH[ID] !== 'undefined')
				{
					if (bHtmlMayBeChanged)
					{
						if (CASH[ID].itemsString === sItemsString) this.currHTML = CASH[ID].html;
					}
					else
					{
						this.currHTML = CASH[ID].html;
					}
				}
			}
			else if (bHtmlMayBeChanged)
			{
				if (CASH[ID].itemsString === sItemsString)
				{
					if (CASH[ID].html !== this.currHTML)
					{
						bNeedHtmlUpdate = true;
						this.currHTML = CASH[ID].html;
					}
				}
				else
				{
					bNeedHtmlUpdate = true;
					delete this.currHTML;
				}
			}

			if (bNeedHtmlUpdate)
			{
				if (!this.currHTML)
				{
					this.currHTML = _parseHTMLColl.call(this, Array.isArray(options.items) ? options.items : options.items.childNodes);
					if (!ID) options.id = ID = '_' + (Math.random() * 1e7).toFixed(0);

					CASH[ID] = {
						items: options.items,
						itemsString: sItemsString,
						html: this.currHTML
					};
				}

				this.dropdown.innerHTML = this.currHTML;
				this.$.options = this.dropdown.querySelectorAll('.' + Class.option);
				this.$.length = this.$.filteredLength = this.$.options.length;

				this.$.filtered = [];
				var aFiltered = this.$.filtered;
				this.$.options.forEach(function (nElem, i)
				{
					nElem.index = i;
					aFiltered[i] = true;
				});

				if (this.options.selected)
				{
					this.setSelected(this.options.selected, true);
					delete this.options.selected;
				}
			}

			if (typeof this.method !== 'undefined' && _.isString(this.$.query)) this[this.method](this.$.query);

			if (typeof _xNewSelected !== 'undefined')
			{
				this.setSelected(_xNewSelected, bNeedHtmlUpdate);
			}
			else if (bNeedHtmlUpdate)
			{
				this.setSelected(this.$.selected, bNeedHtmlUpdate);
			}
		},

		reset: function (_xNewSelected)
		{
			this.hide();

			this.$.query = undefined;
			this.$.lastSelected = -1;
			this.$.selected = {};
			this.$.selectedLength = 0;

			delete this.currHTML;

			this.update(_xNewSelected);
		},

		show: function (_xNewSelected)
		{
			this.$.open = true;
			this.update(_xNewSelected);

			if (this.$.filteredLength === 0 || !this.isActive()) return false;

			this.dropdown.style.display = 'block';
			this.dropdown.style.visibility = 'hidden';
			this.dropdown.classList.add(Class.opened);

			if (typeof this.placer === 'undefined') this.placer = $.placer(this.options.placeTo);
			else this.placer.start();

			this.dropdown.scrollTop = this.scrollTop;
			this.dropdown.style.visibility = 'visible';

			this.options.onShow();
		},

		hide: function (e)
		{
			if (this.$.open)
			{
				this.$.open = false;
				this.placer.stop();
				this.scrollTop = this.dropdown.scrollTop;
				if (this.dropdown.parentNode) this.dropdown.parentNode.removeChild(this.dropdown);
				this.dropdown.classList.remove(Class.opened);
				this.dropdown.style.display = 'none';
				clearInterval(this.timer);
				this.options.onHide();
			}
		},

		isOpened: function ()
		{
			return this.$.open;
		},

		isActive: function ()
		{
			return true;
		},

		filter: function (_sText)
		{
			var sText = _sText.trim().toLowerCase();
			this.$.query = sText;

			if (!sText) return this.clearFilter();

			if (!this.$.options) this.update();

			var that = this,
				aSelected = this.$.selected,
				anOptions = this.$.options,
				aFiltered = this.$.filtered,
				iFilteredLength = this.$.filteredLength,
				iLastSelected = this.getLastSelected();

			anOptions.forEach(function (nOption, i)
			{
				if (nOption['textContent' || 'innerText'].toLowerCase().indexOf(sText) === -1)
				{
					anOptions[i].style.display = 'none';
					if (aFiltered[i]) iFilteredLength--;
					aFiltered[i] = false;

					if (typeof aSelected[i] !== 'undefined') _unselectOption.call(that, i);
					if (i === iLastSelected) iLastSelected = -1;
				}
				else
				{
					anOptions[i].style.display = 'block';
					if (!aFiltered[i]) iFilteredLength++;
					aFiltered[i] = true;
				}
			});

			this.$.filteredLength = iFilteredLength;
			this.setLastSelected(iLastSelected);

			if (iFilteredLength <= 0) this.hide();
			else if (!this.isOpened())
			{
				var oSelectbox = this.options.items[SF.plugin.selectbox];

				if (typeof oSelectbox === 'undefined' || oSelectbox.$.open)
				{
					this.show();
				}
			}
		},

		clearFilter: function ()
		{
			this.$.query = undefined;

			if (!this.$.options) this.update();

			var anOptions = this.$.options,
				aFiltered = this.$.filtered;

			anOptions.forEach(function (nOption, i)
			{
				anOptions[i].style.display = 'block';
				aFiltered[i] = true;
			});

			this.$.filteredLength = this.$.filtered.length;
			if (!this.isOpened())
			{
				var oSelectbox = this.options.items[SF.plugin.selectbox];

				if (typeof oSelectbox === 'undefined' || oSelectbox.$.open)
				{
					this.show();
				}
			}
		},

		autocomplete: function (_sText)
		{

		},

		select: function (_xIndex, _sDir)
		{
			return _selectOptions.call(this, _xIndex, _sDir);
		},

		unselect: function (_xIndex)
		{
			return _unselectOptions.call(this, _xIndex);
		},

		unselectAll: function ()
		{
			return _unselectOptions.call(this, this.$.selected);
		},

		toggle: function (_xIndex)
		{
			return _toggleOptions.call(this, _xIndex);
		},

		selectNext: function (_sDir)
		{
			return (_sDir === 'down') ? this.selectDown() : this.selectUp();
		},

		selectPrev: function (_sDir)
		{
			return (_sDir === 'up') ? this.selectDown() : this.selectUp();
		},

		unselectNext: function (_sDir)
		{
			return (_sDir === 'down') ? this.unselectDown() : this.unselectUp();
		},

		unselectPrev: function (_sDir)
		{
			return (_sDir === 'up') ? this.unselectDown() : this.unselectUp();
		},

		selectDown: function ()
		{
			var iDown = this.$.lastSelected;

			if (iDown < this.$.options.length - 1) iDown++;

			return _selectOption.call(this, iDown, 'down');
		},

		unselectDown: function ()
		{
			var iDown = this.$.lastSelected;

			if (iDown < this.$.options.length - 1) iDown++;

			return _unselectOption.call(this, iDown);
		},

		selectUp: function ()
		{
			var iUp = this.$.lastSelected - 1;

			if (iUp < 0) iUp = 0;

			return _selectOption.call(this, iUp, 'up');
		},

		unselectUp: function ()
		{
			var iUp = this.$.lastSelected - 1;

			if (iUp < 0) iUp = 0;

			return _unselectOption.call(this, iUp);
		},

		getSelected: function ()
		{
			return this.$.selected;
		},

		isSelected: function (_index)
		{
			return this.$.selected[_index];
		},

		setSelected: function (_xSelected, _bDontUnselect)
		{
			if (typeof this.currHTML === 'undefined')
			{
				if (Number.isInteger(_xSelected))
				{
					this.$.selected = {};
					this.$.selectedLength = 0;

					if (_xSelected > -1)
					{
						this.$.selected[_xSelected] = true;
						this.$.selectedLength = 1;
					}
				}
				else if (Array.isArray(_xSelected))
				{
					var iLength = _xSelected.length, i;

					this.$.selected = {};
					this.$.selectedLength = iLength;
					for (i = 0; i < iLength; i++) this.$.selected[_xSelected[i]] = true;
				}
				else
				{
					this.$.selected = _xSelected;
					this.$.selectedLength = 0;

					for (var index in _xSelected) this.$.selectedLength++;
				}
			}
			else
			{
				if (!_bDontUnselect) this.unselectAll();
				else
				{
					this.$.selected = {};
					this.$.selectedLength = 0;
				}

				this.select(_xSelected);
			}
		},

		getLastSelected: function ()
		{
			return this.$.lastSelected;
		},

		setLastSelected: function (index)
		{
			this.$.lastSelected = index;
		},

		getLength: function (_sOf)
		{
			return (_sOf === 'filtered' ? this.$.filteredLength : (_sOf === 'selected' ? this.$.selectedLength : this.$.length));
		},

		getValue: function (index)
		{
			if (typeof this.$.options[index] === 'undefined') return undefined;

			return (this.$.options[index].textContent || $.options[index].innerText);
		},

		getOptions: function (_bFiltered)
		{
			if (_bFiltered)
			{
				var aFiltered = this.$.filtered,
					options = [],
					index;

				for (index in aFiltered) if (aFiltered[index]) options.push(index);

				return options;
			}

			return this.$.options;
		}
	};


/* DROPDOWN PLUGIN DEFINITION
 * ========================= */

	$.getDropdown = function ( options )
	{
		return new Dropdown( options );
	};

	$.setupFilter = function (_xInput, _oDropdown, _fFilter, _iTimeout, _fOnValue)
	{
		var jInput = _xInput instanceof $ ? _xInput : $(_xInput),
			iTimeout = _iTimeout || 250,
			fFilter = _fFilter || function (_sValue, _fCallback)
			{
				this.filter(_sValue);
				if (typeof _fCallback !== 'undefined') _fCallback.call(this);
			};

		jInput.attr('autocomplete', 'off')
		.on('keydown', function (e)
		{
			if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();

			// esc
			if (e.keyCode === 27)
			{
				_oDropdown.hide();
			}
			//up down
			else if (e.keyCode === 38 || e.keyCode === 40)
			{
				e.preventDefault();
				if (_oDropdown.isOpened())
				{
					var sDir = e.keyCode == 38 ? 'up' : 'down',
						iLastSelected = _oDropdown.getLastSelected(),
						iNewSelected = _oDropdown.selectNext(sDir),
						sNewValue;

					if (Number.isInteger(iNewSelected) && iLastSelected !== iNewSelected)
					{
						_oDropdown.unselect(iLastSelected);
						sNewValue = _oDropdown.getValue(iNewSelected);
					}

					if (typeof sNewValue !== 'undefined') this.value = sNewValue;
				}
			}
		})
		.on('keyup', function (e)
		{
			var sValue = this.value.trim(),
				bNotShort = sValue.length >= _oDropdown.options.minLength;

			if (!bNotShort && _oDropdown.isOpened()) _oDropdown.hide();
			if (this.filterTimer) clearTimeout(this.filterTimer);

			//tab enter
			if (e.keyCode === 9 || e.keyCode === 13)
			{
				if (_oDropdown.isOpened())
				{
					var sNewValue = _oDropdown.getValue(_oDropdown.getLastSelected());
					if (typeof sNewValue !== 'undefined') this.value = sNewValue;

					_oDropdown.hide();
				}
				else if (e.keyCode === 13 &&
						typeof this._defaultValue !== 'undefined' &&
						this.value.trim() !== this._defaultValue
					)
				{
					this._jQ().change();
				}
			}
			else if (e.keyCode < 9 || e.keyCode > 45)
			{
				if (!_oDropdown.isOpened())
				{
					if (bNotShort)
					{
						fFilter.call(_oDropdown, sValue, function ()
						{
							if (this.getLength('filtered') > 0 && this.isActive()) this.show();
						});
					}
				}
				else
				{
					this.filterTimer = setTimeout(function ()
					{
						fFilter.call(_oDropdown, sValue);
					}, iTimeout);
				}
			}
		})
		.on('blur', function ()
		{
			_oDropdown.hide();
		});

		_oDropdown.dropdown._jQ().on('click', '.option', function (e)
		{
			var nTarget = e.currentTarget,
				iIndex = nTarget.index,
				sValue = _oDropdown.getValue(iIndex);

			(jInput.val || jInput.html).call(jInput, sValue);
			_oDropdown.hide();

			if (typeof _fOnValue !== 'undefined') _fOnValue.call(_oDropdown, jInput, sValue);
		});

		_oDropdown.dropdown.style.maxHegith = '400px';
	};
	$.setupDropdown = function (_xInput, _oDropdown, _fOnValue)
	{
		var jInput = _xInput instanceof $ ? _xInput : $(_xInput);

		jInput.attr('autocomplete', 'off')
		.on('keydown', function (e)
		{
			if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();

			// esc
			if (e.keyCode === 27)
			{
				_oDropdown.hide();
			}
			//up down
			else if (e.keyCode === 38 || e.keyCode === 40)
			{
				e.preventDefault();
				if (_oDropdown.isOpened())
				{
					var sDir = e.keyCode == 38 ? 'up' : 'down',
						iLastSelected = _oDropdown.getLastSelected(),
						iNewSelected = _oDropdown.selectNext(sDir),
						sNewValue;

					if (Number.isInteger(iNewSelected) && iLastSelected !== iNewSelected)
					{
						_oDropdown.unselect(iLastSelected);
						sNewValue = _oDropdown.getValue(iNewSelected);
					}

					if (typeof sNewValue !== 'undefined') this.value = sNewValue;
				}
			}
			//tab enter
			else if (e.keyCode === 9 || e.keyCode === 13)
			{
				if (_oDropdown.isOpened())
				{
					var nOption = _oDropdown.$.options[_oDropdown.getLastSelected()];

					if (nOption)
					{
						nOption._jQ().click();
					}
				}
				else if (e.keyCode === 13 &&
						typeof this._defaultValue !== 'undefined' &&
						this.value.trim() !== this._defaultValue
					)
				{
					this._jQ().change();
				}
			}
		})
		.on('blur', function ()
		{
			_oDropdown.hide();
		});

		_oDropdown.dropdown._jQ().on('click', '.option', function (e)
		{
			var nTarget = e.currentTarget,
				iIndex = nTarget.index,
				sValue = _oDropdown.getValue(iIndex);

			(jInput.val || jInput.html).call(jInput, sValue);
			_oDropdown.hide();

			if (typeof _fOnValue !== 'undefined') _fOnValue.call(_oDropdown, jInput, nTarget, sValue);
		});

		_oDropdown.dropdown.style.maxHegith = '400px';
	};

	var _parseHTMLColl = function ( nColl, _sClass )
		{
			var HTML = '',
				attrs = '',
				options = this.options,
				iLength = nColl.length,
				i = 0,
				j = 0,
				nElem,
				sTag,
				sClass = _sClass || '',

				getContent = options.builder || (function (_nElem, _sTag)
				{
					var sText = (_nElem.nodeValue || _nElem.label || _nElem.textContent || _nElem.innerText || '').trim();
					return (sText.length === 0 ? '' : ('<span>' + sText + '</span>'));
				});


			for (; i < iLength; i++)
			{
				nElem = nColl[i];

				if (nElem.nodeType === 1)
				{
					attrs = '';
					nElem = nColl[i];
					sTag = nElem.tagName.toLowerCase();

					if (options.copyAttr)
					{
						for (j = options.copyAttr.length; j--;) attrs += ' ' + options.copyAttr[j] + '="' + nElem.getAttribute(options.copyAttr[j]) + '"';
					}

					switch (sTag)
					{
						case 'option':
							HTML += '<li' + attrs + ' class="' + Class.option + ' ' + sClass + '">' +
										_parseHTMLColl.call(this, nElem.childNodes) +
									'</li>';
							break;
						case 'optgroup':
							if (options.nested)
							{
								HTML += '<li' + attrs + ' class="' + Class.label + ' ' + Class.ignore + ' ' + Class.has_nested + '">' +
										getContent.call(this, nElem, sTag, i, attrs, Class) +
										'<ul>' + _parseHTMLColl.call(this, nElem.childNodes) + '</ul>' +
									'</li>';
							}
							else
							{
								HTML += '<li' + attrs + ' class="' + Class.label + ' '  + Class.ignore + '">' +
											getContent.call(this, nElem, sTag, i, attrs, Class) +
										'</li>' +
										_parseHTMLColl.call(this, nElem.childNodes, Class.in_optgroup);
							}
							break;

						case 'li':
							var _class = (nElem.querySelector('ul') !== null ?
									Class.ignore + ' ' + (options.nested ? Class.has_nested : 'bold') :
									Class.option + ' ' + sClass).trim();

							HTML += '<li' + attrs + ' class="' + _class + '">' + _parseHTMLColl.call(this, nElem.childNodes) + '</li>';
							break;
						case 'ul':
							if (options.nested)
							{
								HTML += '<ul>' + _parseHTMLColl.call(this, nElem.childNodes) + '</ul>';
							}
							else
							{
								HTML += '</li>' + _parseHTMLColl.call(this, nElem.childNodes, Class.in_optgroup) + '<li>';
							}
							break;

						default:
							console.log(nElem);
							HTML += _parseHTMLColl.call(this, nElem.childNodes);
							break;
					}
				}
				else if (nElem.nodeType === 3)
				{
					HTML += getContent.call(this, nElem, sTag, i, attrs, Class);
				}
				else
				{
					HTML += '<li' + attrs + ' class="' + Class.option + ' ' + sClass + '">' + nElem + '</li>';
				}
			}

			return HTML.replace(/(<li><\/li>)/g,'');
		},

		_selectOption = function (_index, _sDir)
		{
			var index = _index;

			if      (_sDir === 'up')   while (!this.$.filtered[index] && index >= 0)            index--;
			else if (_sDir === 'down') while (!this.$.filtered[index] && index < this.$.length) index++;

			if (index < 0 || index >= this.$.length) return this.$.lastSelected;

			if (typeof this.$.selected[index] === 'undefined')
			{
				this.$.options[index].classList.add(Class.selected);
				this.options.onSelect(index);

				this.$.selected[index] = true;
				this.$.selectedLength++;
			}

			this.$.lastSelected = index;

			return index;
		},

		_selectOptions = function (_xSelected, _sDir)
		{
			if (Number.isInteger(_xSelected))
			{
				return _selectOption.call(this, _xSelected, _sDir);
			}
			else if (Array.isArray(_xSelected))
			{
				var aIndexes = [],
					iNum = _xSelected.length,
					i;

				for (i = 0; i < iNum; i++) aIndexes.push(_selectOption.call(this, _xSelected[i], _sDir));

				return aIndexes;
			}
			else
			{
				var aIndexes = [], index;

				for (index in _xSelected) aIndexes.push(_selectOption.call(this, parseInt(index), _sDir));

				return aIndexes;
			}
		},

		_unselectOption = function (index)
		{
			if (index === -1) return false;

			var aSelected = this.$.selected,
				bWasSelected = typeof aSelected[index] !== 'undefined';

			if (bWasSelected)
			{
				this.$.options[index].classList.remove(Class.selected);
				this.options.onUnselect(index);

				delete aSelected[index];
				this.$.selectedLength--;
			}

			return bWasSelected;
		},

		_unselectOptions = function (_xSelected)
		{
			if (Number.isInteger(_xSelected))
			{
				return _unselectOption.call(this, _xSelected);
			}
			else if (Array.isArray(_xSelected))
			{
				var abWasSelected = [],
					iNum = _xSelected.length,
					i;

				for (i = 0; i < iNum; i++) abWasSelected.push(_unselectOption.call(this, _xSelected[i]));

				return abWasSelected;
			}
			else
			{
				var abWasSelected = [], index;

				for (index in _xSelected) abWasSelected.push(_unselectOption.call(this, parseInt(index)));

				return abWasSelected;
			}
		},

		_toggleOption = function (index)
		{
			return typeof this.$.selected[index] === 'undefined' ? _selectOption.call(this, index) : _unselectOption.call(this, index);
		},

		_toggleOptions = function (_xSelected)
		{
			if (Number.isInteger(_xSelected)) return _toggleOption.call(this, _xSelected);
			else if (Array.isArray(_xSelected))
			{
				var aResult = [],
					iNum = _xSelected.length,
					i;

				for (i = 0; i < iNum; i++) aResult.push(_toggleOption.call(this, _xSelected[i]));

				return aResult;
			}
			else
			{
				var aResult = [], index;

				for (index in _xSelected) aResult.push(_toggleOption.call(this, parseInt(index)));

				return aResult;
			}
		};

}(jQuery));