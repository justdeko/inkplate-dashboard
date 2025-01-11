#pragma once

// WiFi SSID
#define WIFI_SSID "wifi_name_here" 
// WiFi Password
#define WIFI_PASSWORD "wifi_password_here"
// The base url to request the image from
// Make sure this has "http://" or "https://" at the beginning and ends with a slash
#define BASE_URL "base_url_here"
// time zone, specified in WorldTimeAPI. If you want to find your timezone, visit http://worldtimeapi.org/api/timezone
#define TIMEZONE "Europe/Berlin"
// the refresh interval during the day (in minutes)
#define REFRESH_INTERVAL_DAY 40L
// the refresh interval during the night (in minutes)
#define REFRESH_INTERVAL_NIGHT 120L
// start and end times (hour, 0-23) of the night
#define NIGHT_START 1
#define NIGHT_END 5
// generic definition to check that config exists
#define CONFIG_SET