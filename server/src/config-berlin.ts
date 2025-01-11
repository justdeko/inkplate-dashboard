import { TransportConfig, WeatherConfig } from './interfaces';

// the stops you want to search for (https://v6.bvg.transport.rest/getting-started.html#1-search-for-stops on how to find stops)
export const transportConfig: TransportConfig = {
    stops: [
        {
            id: '900003201',
            includeLines: ['s9', 's3', 's7', 's1', 're2', '142'],
            excludeDestinations: []
        }
    ],
    linePrioList: ['s7']
};

export const customContent = {
    enabled: false,
    title: "Custom Content",
    // the url to fetch the custom content from
    url: "https://justinjackson.ca/words.html",
};

// the weather you want to show data for
export const weatherConfig: WeatherConfig = {
    "latitude": 52.52,
    "longitude": 13.4,
    inlineSunriseSunset: false 
};
// the calendar ical url to fetch events from
export const icalUrls = ["https://calendar.google.com/calendar/ical/en.german%23holiday%40group.v.calendar.google.com/public/basic.ics"]

export const newsFeedUrl = "https://time.com/feed/";
// battery voltage
export const BATTERY_HIGH = 3.8
export const BATTERY_MID = 3.6
export const BATTERY_LOW = 3.25