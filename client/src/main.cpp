#include "main.h"

Inkplate display(INKPLATE_3BIT);
HTTPClient http;
WiFiClientSecure client;
JsonDocument doc;

void hibernate()
{
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_FAST_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_XTAL, ESP_PD_OPTION_OFF);
    esp_deep_sleep_start();
}

void setup()
{
    Serial.begin(115200);
    display.begin();
    display.clearDisplay();
    display.connectWiFi(WIFI_SSID, WIFI_PASSWORD, 23, true);
    Serial.println("WiFi OK!");

    // read battery levels
    double voltage = display.readBattery();
    Serial.printf("Battery: %.2fv", voltage);
    Serial.println();

    // make request to server
    client.setInsecure();
    client.setTimeout(300);
    client.setHandshakeTimeout(300);

    String url = BASE_URL;
    Serial.println(url);

    // create request body for battery level
    JsonDocument requestDoc;
    requestDoc["battery"] = voltage;
    String requestBody;
    serializeJson(requestDoc, requestBody);
    Serial.println(requestBody);

    // load image from url
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(60000);
    http.getStream().setTimeout(40);
    // begin image http request
    int httpCode = http.POST(requestBody);
    if (httpCode == 200)
    {
        // Get the response length and make sure it is not 0.
        int32_t len = http.getSize();
        if (len > 0)
        {
            if (!display.drawJpegFromWeb(http.getStreamPtr(), 0, 0, len))
            {
                Serial.println("Image open error");
            }
            else
            {
                display.display();
            }
        }
        else
        {
            Serial.println("Invalid response length");
        }
    }
    else
    {
        // TODO: log these errors via http
        Serial.println(http.getStream().getTimeout());
        Serial.println(http.getSize());
        Serial.println(http.errorToString(httpCode));
        Serial.println("HTTP error:");
        Serial.println(httpCode);
    }
    http.end();

    // get timezone to determine if long or short sleep
    bool useDay = true;
    String timeUrl = "http://worldtimeapi.org/api/timezone/";
    timeUrl.concat(TIMEZONE);
    if (http.begin(timeUrl))
    {
        if (http.GET() > 0)
        {
            deserializeJson(doc, http.getString());
            String time = doc["datetime"];
            Serial.println(time);
            char hour1 = time.charAt(11);
            char hour2 = time.charAt(12);
            Serial.println(hour1);
            Serial.println(hour2);
            // set "use day refresh time" to false if fetched time falls within night time
            if (hour1 == '0' && hour2 >= ('0' + NIGHT_START) && hour2 <= ('0' + NIGHT_END))
            {
                useDay = false;
            }
        }
    }
    http.end();

    // prepare for shut-off
    WiFi.mode(WIFI_OFF);
    if (useDay)
    {
        Serial.println("Starting day sleep");
        static constexpr auto DEEP_SLEEP_TIME = std::chrono::minutes{REFRESH_INTERVAL_DAY};
        esp_sleep_enable_timer_wakeup(std::chrono::duration_cast<std::chrono::microseconds>(DEEP_SLEEP_TIME).count());
    }
    else
    {
        Serial.println("Starting night sleep");
        static constexpr auto DEEP_SLEEP_TIME = std::chrono::minutes{REFRESH_INTERVAL_NIGHT};
        esp_sleep_enable_timer_wakeup(std::chrono::duration_cast<std::chrono::microseconds>(DEEP_SLEEP_TIME).count());
    }
    Serial.flush();
    esp_deep_sleep_start();
}

void loop()
{
}