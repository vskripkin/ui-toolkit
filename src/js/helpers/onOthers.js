/* run callback if event was fired not on descendants */

import isString    from '../utils/isString.js';
import random_str  from '../utils/randomStr.js';
import clean_str   from '../utils/cleanStr.js';
import unduplicate from '../utils/unduplicate.js';


export default {
	onOthers:  on_others,
	offOthers: off_others
};


var oElemEventIDs = {},
	oAllEvents = {},

	event_handler = function (_sEventID, e)
	{
		if (!isString(_sEventID)) return;


		var nTarget = e.target,
			oEvent = oAllEvents[_sEventID],
			nElem = oEvent && oEvent.elem;

		if (nElem && nElem !== nTarget && !nElem.contains(nTarget))
		{
			off_others_event(oEvent);

			if (document.documentElement.contains(nElem))
			{
				oEvent.callback(e);
			}
		}
	},
	off_others_event = function (_oEvent, _sElemID, _aElemEventIDs)
	{
		var sElemID = _sElemID || _oEvent.elem.getAttribute('data-js-id'),
			aElemEventIDs = _aElemEventIDs || oElemEventIDs[sElemID],

			sEventID = _oEvent.id,
			index = aElemEventIDs.indexOf(sEventID);

		delete oAllEvents[sEventID];
		aElemEventIDs.splice(index, 1);

		if (aElemEventIDs.length === 0)
		{
			delete oElemEventIDs[sElemID];
		}

		window.removeEventListener(_oEvent.name, _oEvent.handler, false);

		return true;
	};


function on_others (_sEvents, _nElem, _callback)
{
	var aEvents = clean_str(unduplicate(_sEvents)).split(' '),
		i, L;


	var sElemID = _nElem.getAttribute('data-js-id'),
		aElemEventIDs = oElemEventIDs[sElemID];

	if (aElemEventIDs)
	{
		var sEventID, oEvent;

		for (i = 0, L = aElemEventIDs.length; i < L; i++)
		{
			sEventID = aElemEventIDs[i];
			oEvent = oAllEvents[sEventID];

			if (aEvents.indexOf(oEvent.name) > -1 && oEvent.callback === _callback)
			{
				aEvents = aEvents.splice(aEvents.indexOf(oEvent.name), 1);
			}
		}
	}

	if (aEvents.length === 0) return false;


	if (!sElemID)
	{
		sElemID = random_str();
		_nElem.setAttribute('data-js-id', sElemID);
	}

	if (!(aElemEventIDs = oElemEventIDs[sElemID]))
	{
		aElemEventIDs = oElemEventIDs[sElemID] = [];
	}


	var oEventsMap = {},
		sEvent, sEventID, handler;

	for (i = 0, L = aEvents.length; i < L; i++)
	{
		sEvent = aEvents[i];

		sEventID = random_str();
		handler = event_handler.bind(null, sEventID);

		aElemEventIDs.push(sEventID);

		oAllEvents[sEventID] = {
			id: sEventID,
			elem: _nElem,
			name: sEvent,
			handler: handler,
			callback: _callback
		};

		oEventsMap[sEvent] = handler;
	}

	// if it was inited on some event, the event should be fired on window first
	setTimeout(function ()
	{
		for (var sEvent in oEventsMap)
		{
			window.addEventListener(sEvent, oEventsMap[sEvent], false);
		}
	}, 10);

	return true;
};

function off_others (_sEvents, _nElem, _callback)
{
	var sElemID = _nElem.getAttribute('data-js-id'),
		aElemEventIDs = oElemEventIDs[sElemID];

	if (!sElemID || !aElemEventIDs) return false;


	if (_sEvents)
	{
		var aEvents = clean_str(unduplicate(_sEvents)).split(' '),
			aElemEventIDsCopy = aElemEventIDs.slice(),
			oEvent, i, L;

		for (i = 0, L = aElemEventIDs.length; i < L; i++)
		{
			oEvent = oAllEvents[aElemEventIDsCopy[i]];

			if (aEvents.indexOf(oEvent.name) > -1 && (!_callback || oEvent.callback === _callback))
			{
				off_others_event(oEvent, sElemID, aElemEventIDs);
			}
		}
	}
	else
	{
		while (aElemEventIDs.length)
		{
			off_others_event(oAllEvents[aElemEventIDs[0]], sElemID, aElemEventIDs);
		}
	}


	return true;
};
