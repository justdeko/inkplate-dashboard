import * as ical from 'node-ical';
import { icalUrls } from '../config';
import { CalendarEvent } from '../interfaces';
import { getTime } from '../util';

async function fetchAndGroupUpcomingEvents(): Promise<Map<string, CalendarEvent[]>> {
    const eventsMap: Map<string, CalendarEvent[]> = new Map();
    try {
        const allEvents: CalendarEvent[] = [];
        for (const icalUrl of icalUrls) {
            const data = await ical.async.fromURL(icalUrl);
            const currentTime = new Date();
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const event = data[key];
                    if (event.type === 'VEVENT') {
                        const eventDate = new Date(event.start);
                        const eventEndDate = new Date(event.end);
                        if (eventEndDate >= currentTime) { // Check if event is in the future
                            const calendarEvent: CalendarEvent = {
                                time: eventDate,
                                endTime: eventEndDate,
                                title: event.summary || ''
                            };

                            allEvents.push(calendarEvent);
                        }
                    }
                }
            }
        }
        // Sort all events by start time
        allEvents.sort((a, b) => a.time.getTime() - b.time.getTime());
        const events = allEvents.slice(0, 5); // TODO: fix ui so no slicing needed
        // Group sorted events into the map by date
        events.forEach(event => {
            let eventDateString: string;
            const today = new Date();
            const tomorrow = new Date(today)
            tomorrow.setDate(today.getDate() + 1);
            if (event.time.toDateString() === today.toDateString()) {
                eventDateString = 'Today';
            } else if (event.time.toDateString() === tomorrow.toDateString()) {
                eventDateString = 'Tomorrow';
            } else {
                eventDateString = event.time.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
            }
            if (!eventsMap.has(eventDateString)) {
                eventsMap.set(eventDateString, []);
            }
            eventsMap.get(eventDateString)?.push(event);
        });
    } catch (error) {
        console.error('Error fetching or parsing iCal data:', error);
    }
    return eventsMap;
}

export async function getEventHtml(): Promise<string> {
    const noEvents = `<div class="no-events">No events found</div>`;
    const eventsMap = await fetchAndGroupUpcomingEvents();
    const eventsList = Array.from(eventsMap.keys())
    if (eventsList.length === 0) return noEvents;
    return eventsList.slice(0,4).map(key => {
        const eventBodies = eventsMap.get(key).map(event => `
        <div class="event-group-body">
            <div class="event-group-time">${getEventTime(event.time, event.endTime)}</div>
            <div class="event-group-title">${event.title}</div>
        </div>`
        ).join('')
        return `
        <div class="event-group">
            <div class="event-group-date">${key}</div>
            ${eventBodies}
        </div>`
    }).join('');
}


function getEventTime(start: Date, end: Date) {
    const hours = (Math.abs(end.valueOf() - start.valueOf()) / 3600000)
    if (hours == 24) return "Whole Day";
    else if (hours > 24) return `${getTime(start)} - ${getTime(end)}, ${end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
    else return `${getTime(start)} - ${getTime(end)}`;
}