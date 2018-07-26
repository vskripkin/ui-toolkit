/* run callback if event was fired not on descendants */
;(function ($, _, undefined)
{
	'use strict';

	var jWindow = $(window),
		oElemEventIDs = {},
		oAllEvents = {},

		eventHandler = function (e)
		{
			var sEventID = e.handleObj.namespace;

			if (!sEventID)
			{
				return false;
			}

			var nTarget = e.target,
				oEvent = oAllEvents[sEventID],
				nElem = oEvent && oEvent.elem;

			if (nElem && nElem !== nTarget && !nElem.contains(nTarget))
			{
				_.offOthers(oEvent);

				if (document.documentElement.contains(nElem))
				{
					oEvent.callback(e);
				}
			}
		},

		offOthersEvent = function (_oEvent, _sElemID, _aElemEvents)
		{
			var sEventID = _oEvent.id,
				sElemID = _sElemID || _oEvent.elem.getAttribute('data-js-id'),
				aElemEvents = _aElemEvents || oElemEventIDs[sElemID],
				index = aElemEvents.indexOf(sEventID);

			aElemEvents.splice(index, 1);
			delete oAllEvents[sEventID];

			jWindow.off(_oEvent.name + '.' + sEventID);

			return true;
		};

	_.onOthers = function (_sEvents, _nElem, _fCallback)
	{
		if (!_.isString(_sEvents) || !_.isElement(_nElem) || !_.isFunction(_fCallback))
		{
			return false;
		}

		var sElemID = _nElem.getAttribute('data-js-id'),
			aElemEventIDs = oElemEventIDs[sElemID],
			oEventsMap = {};

		if (!_.isUndefined(aElemEventIDs))
		{
			var sEventID, oEvent, i, L;

			for (i = 0, L = aElemEventIDs.length; i < L; i++)
			{
				sEventID = aElemEventIDs[i];
				oEvent = oAllEvents[sEventID];

				if (_sEvents.indexOf(oEvent.name) > -1 && oEvent.callback === _fCallback)
				{
					_sEvents = _sEvents.replace(new RegExp('(' + oEvent.name + ')', 'g'), '');
				}
			}
		}

		_sEvents = _.cleanStr(_sEvents);

		if (_sEvents.length === 0)
		{
			return false;
		}

		if (!sElemID)
		{
			sElemID = _.randomStr();
			_nElem.setAttribute('data-js-id', sElemID);
		}

		if (!(aElemEventIDs = oElemEventIDs[sElemID]))
		{
			aElemEventIDs = oElemEventIDs[sElemID] = [];
		}

		_.forEach(_sEvents.split(' '), function (_sEvent)
		{
			var sEventID = _.randomStr();

			aElemEventIDs.push(sEventID);

			oAllEvents[sEventID] = {
				id: sEventID,
				elem: _nElem,
				name: _sEvent,
				callback: _fCallback
			};

			oEventsMap[_sEvent + '.' + sEventID] = eventHandler;
		});

		//if it was inited on some event, the event should be fired on window first
		setTimeout(function ()
		{
			jWindow.on(oEventsMap);
		}, 0);

		return true;
	};

	_.offOthers = function (_xEvents, _nElem, _fCallback)
	{
		var sElemID = null;

		if (!_.isString(_xEvents))
		{
			sElemID = _xEvents.elem.getAttribute('data-js-id');
			offOthersEvent(_xEvents, sElemID);
		}
		else
		{
			sElemID = _nElem.getAttribute('data-js-id');

			if (sElemID === null)
			{
				return false;
			}

			var sEvents = _.cleanStr(_xEvents),
				aElemEventIDs = oElemEventIDs[sElemID],
				oEvent, i, L;

			if (!_.isUndefined(_fCallback))
			{
				for (i = 0, L = aElemEventIDs.length; i < L; i++)
				{
					oEvent = oAllEvents[aElemEventIDs[i]];

					if (sEvents.indexOf(oEvent.name) > -1 && oEvent.callback === _fCallback)
					{
						offOthersEvent(oEvent, sElemID, aElemEventIDs);
						break;
					}
				}
			}
			else if (!_.isUndefined(sEvents))
			{
				aElemEventIDs && aElemEventIDs.filter(function (_sEventID)
				{
					return sEvents.indexOf(oAllEvents[_sEventID].name) > -1;
				})
				.forEach(function (_sEventID)
				{
					offOthersEvent(oAllEvents[_sEventID], sElemID, aElemEventIDs);
				});
			}
			else
			{
				while (aElemEventIDs.length)
				{
					offOthersEvent(oAllEvents[aElemEventIDs[0]], sElemID, aElemEventIDs);
				}
			}
		}

		if (oElemEventIDs[sElemID] && oElemEventIDs[sElemID].length === 0)
		{
			delete oElemEventIDs[sElemID];
		}

		return true;
	};
})(jQuery, window._);
