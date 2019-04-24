/* run callback if event was fired not on descendants */

import isArray     from '../utils/isArray.js';
import isString    from '../utils/isString.js';
import random_str  from '../utils/randomStr.js';
import clean_str   from '../utils/cleanStr.js';
import unduplicate from '../utils/unduplicate.js';

import get_obj_cid from '../helpers/getObjCid.js';


var oElemEventIDs = {},
	oAllEvents = {},

	event_handler = function (_sEventID, e)
	{
		if (!isString(_sEventID)) return;


		var nTarget = e.target,
			oEvent = oAllEvents[_sEventID],
			nElem = oEvent && oEvent.elem,
			anAlso = oEvent && oEvent.also,
			eIgnore = oEvent && oEvent.eignore;

		if (eIgnore === e || !nElem || nElem === nTarget || nElem.contains(nTarget)) return;

		if (anAlso)
		{
			for (var i = 0, L = anAlso.length; i < L; i++)
			{
				if (anAlso[i] === nTarget || anAlso[i].contains(nTarget)) return;
			}
		}


		off_others_event(oEvent);

		if (document.documentElement.contains(nElem))
		{
			oEvent.callback(e);
		}
	},
	off_others_event = function (_oEvent, _sElemCID, _aElemEventIDs)
	{
		var sElemCID = _sElemCID || get_obj_cid(_oEvent.elem),
			aElemEventIDs = _aElemEventIDs || oElemEventIDs[sElemCID],

			sEventID = _oEvent.id,
			index = aElemEventIDs.indexOf(sEventID);

		delete oAllEvents[sEventID];
		aElemEventIDs.splice(index, 1);

		if (aElemEventIDs.length === 0)
		{
			delete oElemEventIDs[sElemCID];
		}

		window.removeEventListener(_oEvent.name, _oEvent.handler, false);

		return true;
	};


export function on_others (_sEvents, _nElem, _callback, _anAlso, _eIgnore)
{
	if (_anAlso && !isArray(_anAlso))
	{
		_anAlso = [_anAlso];
	}


	var aEvents = clean_str(unduplicate(_sEvents)).split(' '),
		i, L;


	var sElemCID = get_obj_cid(_nElem),
		aElemEventIDs = oElemEventIDs[sElemCID];

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


	if (!(aElemEventIDs = oElemEventIDs[sElemCID]))
	{
		aElemEventIDs = oElemEventIDs[sElemCID] = [];
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
			also: _anAlso,
			// if it was inited on some event, the event should be ignored
			eignore: _eIgnore,
			name: sEvent,
			handler: handler,
			callback: _callback
		};

		oEventsMap[sEvent] = handler;
	}

	for (var sEvent in oEventsMap)
	{
		window.addEventListener(sEvent, oEventsMap[sEvent], false);
	}

	return true;
};

export function off_others (_sEvents, _nElem, _callback)
{
	var sElemCID = get_obj_cid(_nElem),
		aElemEventIDs = oElemEventIDs[sElemCID];

	if (!aElemEventIDs) return false;


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
				off_others_event(oEvent, sElemCID, aElemEventIDs);
			}
		}
	}
	else
	{
		while (aElemEventIDs.length)
		{
			off_others_event(oAllEvents[aElemEventIDs[0]], sElemCID, aElemEventIDs);
		}
	}


	return true;
};
