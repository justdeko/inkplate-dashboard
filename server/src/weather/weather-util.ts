import { weatherConfig } from "../config";

/**
 * Get the next sunrise or sunset based on the current time
 * @param values sunrise or sunset values
 * @param now current time
 * @returns the next sunrise or sunset date
 */
export function getNextSunriseSunsets(values: bigint[], now: Date): Date {
    for (let i = 0; i < values.length; i++) {
        if (values[i] > BigInt(now.getTime() / 1000)) {
            return new Date(Number(values[i]) * 1000);
        }
    }
    return new Date(Number(values[0]) * 1000);
}

/**
 * Get the sunrise or sunset weather code if the hour of the date is the same hour as the sunrise or sunset
 * @param time 
 * @param sunrise 
 * @param sunset 
 */
export function getIsSunriseOrSunset(time: Date, sunrise: Date, sunset: Date): number | null {
    if (!weatherConfig.inlineSunriseSunset) return null;
    if (time.getHours() === sunrise.getHours()) {
        return 998;
    }
    if (time.getHours() === sunset.getHours()) {
        return 999;
    }
    return null;
}


/**
 * Function that maps WMO weather codes to a corresponding icon.
 * A table can be found here: https://open-meteo.com/en/docs (scroll to the bottom)
 * @param weatherCode the weather code to find the icon for
 * @param isDay whether it is day (function returns a day or a night icon correspondingly)
 * @returns a string representing the corresponding weather-icons icon
 */
export function mapWeatherCodeToIcon(weatherCode: number, isDay: boolean): string {
    const dayIcons: { [key: number]: string } = {
        0: 'wi wi-day-sunny',
        1: 'wi wi-day-sunny-overcast',
        2: 'wi wi-day-cloudy',
        3: 'wi wi-cloudy',
        45: 'wi wi-fog',
        51: 'wi wi-day-showers',
        53: 'wi wi-day-rain',
        55: 'wi wi-rain',
        56: 'wi wi-sleet',
        61: 'wi wi-day-showers',
        63: 'wi wi-day-rain',
        65: 'wi wi-rain',
        71: 'wi wi-day-snow',
        73: 'wi wi-day-snow',
        75: 'wi wi-snow',
        77: 'wi wi-day-snow',
        80: 'wi wi-day-showers',
        81: 'wi wi-day-rain',
        82: 'wi wi-rain',
        85: 'wi wi-day-snow',
        86: 'wi wi-snow',
        95: 'wi wi-day-thunderstorm',
        96: 'wi wi-thunderstorm',
        99: 'wi wi-thunderstorm',
        // sunrise and sunset
        998: 'wi wi-sunrise',
        999: 'wi wi-sunset',
    };

    const nightIcons: { [key: number]: string } = {
        ...dayIcons,
        0: 'wi wi-night-clear',
        1: 'wi wi-night-partly-cloudy',
        2: 'wi wi-night-alt-cloudy',
        3: 'wi wi-cloudy',
        45: 'wi wi-night-fog',
        51: 'wi wi-night-showers',
        53: 'wi wi-night-alt-showers',
        55: 'wi wi-night-alt-showers',
        56: 'wi wi-sleet',
        61: 'wi wi-night-showers',
        63: 'wi wi-night-alt-showers',
        65: 'wi wi-night-alt-rain',
        71: 'wi wi-night-snow',
        73: 'wi wi-night-alt-snow',
        75: 'wi wi-night-alt-snow',
        77: 'wi wi-night-alt-snow',
        80: 'wi wi-night-showers',
        81: 'wi wi-night-alt-showers',
        82: 'wi wi-night-alt-rain',
        85: 'wi wi-night-snow',
        86: 'wi wi-night-alt-snow',
        95: 'wi wi-night-alt-thunderstorm',
        96: 'wi wi-thunderstorm',
        99: 'wi wi-thunderstorm',
        // sunrise and sunset
        998: 'wi wi-sunrise',
        999: 'wi wi-sunset',
    };

    const icons = isDay ? dayIcons : nightIcons;

    return icons[weatherCode] || 'wi wi-na';
}