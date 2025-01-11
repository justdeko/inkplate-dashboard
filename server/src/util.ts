import { BATTERY_HIGH, BATTERY_LOW, BATTERY_MID } from "./config";

export function getTime(time: Date) {
    return `${padTime(time.getHours())}:${padTime(time.getMinutes())}`
}

export function padTime(time: number): string {
    return ("0" + time).slice(-2);
}

/**
 * Format the time to a string, either with or without minutes
 * @param time the time to format
 * @param hasMinutes whether to include minutes in the time
 * @returns a string representing the time, either as HH or HH:MM
 */
export function formatTime(time: Date, hasMinutes: boolean): string {
    if (hasMinutes) {
        return getTime(time);
    } else {
        return padTime(time.getHours());
    }
}

/**
 * Returns a string representing the month and date in abbreviated form.
 * e.g. 2024-04-24 => Apr 24
 * @param date the date to convert
 */
export function getDateString(date: Date): string {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

export function getWeekDayString(date: Date): string {
    return date.toLocaleDateString('default', { weekday: 'long' });
}

export function getBatteryIcon(battery: string): string {
    switch (battery) {
        case 'high':
            return 'fa-battery-full';
        case 'mid':
            return 'fa-battery-half';
        case 'low':
            return 'fa-battery-quarter';
        case 'empty':
            return 'fa-battery-empty';
        default:
            return 'fa-question'; // battery status unknown, show question mark
    }
}
// get the battery level based on the current voltage of the battery
export function getBatteryLevel(voltage: number) {
    if (voltage >= BATTERY_HIGH)
    {
        return "high";
    }
    else if (voltage >= BATTERY_MID)
    {
        return "mid";
    }
    else if (voltage >= BATTERY_LOW)
    {
        return "low";
    }
    else
    {
        return "empty";
    }
}