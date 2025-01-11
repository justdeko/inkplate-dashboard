import { TransportConfig, WeatherConfig } from './interfaces';

// the stops you want to search for (https://v6.bvg.transport.rest/getting-started.html#1-search-for-stops on how to find stops and their ids)
export const transportConfig: TransportConfig = {
    stops: [
        {
            id: 'someId',
            includeLines: ['lineA'],
            excludeDestinations: ['destinationA']
        },
        {
            id: 'someId2',
            includeLines: ['lineA', 'lineB', 'lineC'],
            excludeDestinations: ['destinationA', 'destinationB']
        }
    ],
    // the priority list of lines to show, these lines will appear at the top of the list
    linePrioList: ['lineA', 'lineC']
};

// whether to show custom content in the side pane with title and url to fetch the content from
export const customContent = {
    enabled: false,
    title: "Custom Content Title",
    // the url to fetch the custom content from
    url: "https://url-to-custom-content-here",
};

// weather location and whether to show the sunset and sunrise inlined
export const weatherConfig: WeatherConfig = {
    "latitude": 52.52,
    "longitude": 13.41,
    inlineSunriseSunset: false 
};

// the calendar ics url to fetch events from
export const icalUrls = ["https://url-to-ical-file-here.ics", "another-url.ics"];
// the news feed rss url
export const newsFeedUrl = "https://some-rss-feed.com/rss.xml";
/**
 * The battery voltage thresholds based on which the level is displayed.
 * Make sure to base these on the discharge curve of your battery,
 * meaning a battery quickly loses in voltage, stays around the nominal voltage,
 * then quickly loses voltage again until the cutoff value.
 */
export const BATTERY_HIGH = 3.8
export const BATTERY_MID = 3.6
export const BATTERY_LOW = 3.25