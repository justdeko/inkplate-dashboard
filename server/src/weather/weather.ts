import { fetchWeatherApi } from "openmeteo";
import { weatherConfig } from "../config";
import { WeatherData, WeatherPoint, WeatherResponse } from "../interfaces";
import { formatTime } from "../util";
import { getIsSunriseOrSunset, getNextSunriseSunsets, mapWeatherCodeToIcon } from "./weather-util";

const url = "https://api.open-meteo.com/v1/forecast";

const weatherParams = {
    "latitude": weatherConfig.latitude,
    "longitude": weatherConfig.longitude,
    "hourly": ["temperature_2m", "precipitation_probability", "weather_code"],
    "daily": ["sunrise", "sunset"],
    "forecast_days": 3,
};

async function getWeatherPoints(): Promise<WeatherData> {
    const responses = await fetchWeatherApi(url, weatherParams);
    const range = (start: number, stop: number, step: number) =>
        Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
    const response = responses[0];
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const hourly = response.hourly()!;
    const daily = response.daily()!;

    // from https://github.com/open-meteo/typescript/issues/3
    function sunToArray(index: number) {
        const array: bigint[] = [];
        const count = daily.variables(index)?.valuesInt64Length() as number;

        for (let i = 0; i < count; i++) {
            array.push(daily.variables(index)?.valuesInt64(i) as bigint);
        }

        return array;
    }

    const weatherData = {
        hourly: {
            time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
                (t) => new Date((t + utcOffsetSeconds) * 1000)
            ), // fix 2 hour offset
            temperature2m: hourly.variables(0)!.valuesArray()!,
            precipitationProbability: hourly.variables(1)!.valuesArray()!,
            weatherCode: hourly.variables(2)!.valuesArray()!,
        },
        daily: {
            time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
                (t) => new Date((t + utcOffsetSeconds) * 1000)
            ),
            sunrise: sunToArray(0),
            sunset: sunToArray(1),
        },
    };
    // comparison date, clear minutes so current hour is included
    let now = new Date()
    now.setMinutes(0, 0, 0);
    // iterate over weather date and create weather points
    let weatherPoints: WeatherPoint[] = [];
    let sunrise = getNextSunriseSunsets(weatherData.daily.sunrise, now);
    let sunset = getNextSunriseSunsets(weatherData.daily.sunset, now);
    for (let i = 0; i < weatherData.hourly.time.length && weatherPoints.length < 5; i++) {
        let hourly = weatherData.hourly;
        let time = hourly.time[i];
        if (time < now) continue;
        let isSunriseOrSunset = getIsSunriseOrSunset(time, sunrise, sunset);
        let weatherCode = isSunriseOrSunset || hourly.weatherCode[i];
        let weatherPoint: WeatherPoint = {
            temp: hourly.temperature2m[i],
            precipitation: hourly.precipitationProbability[i],
            icon: mapWeatherCodeToIcon(weatherCode, time.getHours() < 22 && time.getHours() > 6),
            time: time,
            hasMinutes: isSunriseOrSunset ? true : false,
        };
        if (isSunriseOrSunset) {
            if (isSunriseOrSunset === 998) { // Sunrise
                weatherPoint.time = new Date(sunrise.getTime());
            } else if (isSunriseOrSunset === 999) { // Sunset
                weatherPoint.time = new Date(sunset.getTime());
            }
        }
        weatherPoints.push(weatherPoint);
        i += 2 // skip two more hours
    }
    return {
        weatherPoints,
        sunrise,
        sunset,
    };
}

export async function getWeatherHtml(): Promise<WeatherResponse> {
    try {
        const { weatherPoints, sunrise, sunset } = await getWeatherPoints();
        let weatherHtml = weatherPoints.map(({ temp, precipitation, icon, time, hasMinutes }) => `
            <div class="weather-item">
              <div>${formatTime(time, hasMinutes)}</div>
              <div class="weather-icon">
                <i class="${icon}"></i>
              </div>
              <div class="weather-info">
                <div>${temp.toFixed(0)}°C | ${precipitation}%</div>
              </div>
            </div>
        `).join('');
        return {
            weatherHtml,
            sunrise,
            sunset,
        };
    } catch (error) {
        console.error('Error fetching weather', error);
        return {
            weatherHtml: `<div>Error fetching weather</div>`,
            sunrise: null,
            sunset: null,
        };
    }
}

export async function getSunriseSunsetHtml(sunrise: Date | null, sunset: Date | null): Promise<string> {
    if (weatherConfig.inlineSunriseSunset) return ``
    if (!sunrise || !sunset) return `<div>No sunrise/sunset data</div>`;
    const times = [formatTime(sunrise, true), formatTime(sunset, true)];
    return `
        <div class="sun-row">
        <i class="wi wi-sunrise"></i>
        <span>${times[0]}</span>
        </div>
        <div class="sun-row">
        <i class="wi wi-sunset"></i>
        <span>${times[1]}</span>
        </div>
    `;
}
