#pragma once

#include <Inkplate.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "config.h"
#include <ArduinoJson.h>
#include <chrono>
// check that config file is correctly set
#if !defined CONFIG_SET
#error Missing config.h. Make sure to copy over the content of config_example.h to config.h and adapt accordingly.
#endif

extern Inkplate display;
extern HTTPClient http;
