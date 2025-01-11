// departure-related interfaces
export interface Departure {
    direction: string;
    lineName: string;
    lineId: string;
    when: string;
    mode: string;
}

export interface DepartureLine {
    direction: string;
    lineName: string;
    lineId: string;
    when: string[];
    mode: string;
}

export interface Stop {
    id: string;
    includeLines: string[];
    excludeDestinations: string[];
}

export interface TransportConfig {
    stops: Stop[];
    linePrioList: string[];
}

// weather-related interfaces
export interface WeatherConfig {
    latitude: number;
    longitude: number;
    inlineSunriseSunset: boolean;
 }

export interface WeatherPoint {
    temp: number;
    precipitation: number;
    icon: string;
    time: Date;
    hasMinutes: boolean;
}

export interface WeatherData {
    weatherPoints: WeatherPoint[];
    sunrise: Date;
    sunset: Date;
}

export interface WeatherResponse {
    weatherHtml: string;
    sunrise: Date;
    sunset: Date;
}

// calendar-related interfaces
export interface CalendarEvent {
    time: Date;
    endTime: Date;
    title: string;
}

// news-related interfaces
export interface NewsItem {
    title: string;
    imageUrl: string;
}