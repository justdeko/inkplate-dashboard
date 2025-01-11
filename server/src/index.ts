import { Request, Response } from "express";
import * as fs from 'fs';
import path from "path";
import * as puppeteer from "puppeteer";
import sharp from 'sharp';
import { getEventHtml } from "./calendar/calendarEvents";
import { customContent } from "./config";
import { renderCustomContentHtml } from "./custom/customContent";
import { getDepartureHtml } from "./departures/transportDepartures";
import { getNewsHtml } from "./news/news";
import { getBatteryIcon, getBatteryLevel, getDateString, getTime, getWeekDayString } from "./util";
import { getSunriseSunsetHtml, getWeatherHtml } from "./weather/weather";

const dashboardViewPath = __dirname + '/layout/dashboard.html';
const dashboardWritePath = __dirname + '/layout/dashboard-write.html';
const imagesPath = __dirname + '/layout/images'

async function renderHtmlToJpeg(browser: puppeteer.Browser): Promise<Buffer> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 825 });
    await page.goto(`file://${dashboardWritePath}`, { waitUntil: 'networkidle0' });
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 100, fullPage: true, });
    return screenshot as Buffer;
}

export const render = async (req: Request, res: Response) => {
    // if gallery mode enabled, return image from images folder
    const mode = process.env.MODE
    console.log(`Starting dashboard in mode: ${mode}`)
    if (mode === "gallery") {
        const image = await getRandomCroppedImageBuffer(imagesPath);
        res.set('Content-Type', 'image/jpeg');
        res.status(200).send(image);
        return;
    } else {
        process.env.TZ = 'Europe/Berlin' // set berlin as timezone
        const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
        const time = new Date()
        // Get the battery level from request body
        console.log(`request body: ${JSON.stringify(req.body)}}`)
        const voltage = req.body.battery
        const batteryLevel = getBatteryLevel(voltage)
        console.log(`battery level: ${batteryLevel}`)
        // replace html elements
        try {
            const htmlTemplate = fs.readFileSync(dashboardViewPath, 'utf-8');
            const sidePaneHtml = customContent.enabled ? await renderCustomContentHtml() : await getDepartureHtml();
            const weatherResponse = await getWeatherHtml();
            const sunriseSunsetHtml = await getSunriseSunsetHtml(weatherResponse.sunrise, weatherResponse.sunset);
            const eventHtml = await getEventHtml();
            const newsHtml = await getNewsHtml();
            const html = htmlTemplate
                .replace('{{DATE}}', getDateString(time))
                .replace('{{WEEKDAY}}', getWeekDayString(time))
                .replace('{{TIME}}', getTime(time))
                .replace('{{BATTERY}}', getBatteryIcon(batteryLevel))
                .replace('{{WEATHER}}', weatherResponse.weatherHtml)
                .replace('{{SUN}}', sunriseSunsetHtml)
                .replace('{{EVENTS}}', eventHtml)
                .replace('{{NEWS}}', newsHtml)
                .replace('{{SIDEPANECONTENT}}', sidePaneHtml)
                .replace('{{SIDEPANETITLE}}', customContent.enabled ? customContent.title : 'Departures');
            fs.writeFile(dashboardWritePath, html, (err) => {
                if (err) {
                    console.error('Error writing HTML:', err);
                    return;
                }
                console.log('Dashboard HTML written successfully.');
            });
            const image = await renderHtmlToJpeg(browser);
            res.set('Content-Type', 'image/jpeg');
            res.status(200).send(image);
            return browser.close();
        } catch (error) {
            console.error('Error rendering HTML to JPEG:', error);
            res.status(500).send('Error rendering HTML to JPEG');
        }
    }
};

async function getRandomCroppedImageBuffer(imagesPath: string, width: number = 1200, height: number = 825): Promise<Buffer> {
    // Read the directory and get all files
    const files = fs.readdirSync(imagesPath);

    // Filter out non-JPG/PNG files
    const imageFiles = files.filter(file => /\.(jpe?g|png)$/.test(file.toLowerCase()));

    if (imageFiles.length === 0) {
        throw new Error('No JPG or PNG files found in the specified directory.');
    }

    // Pick a random image
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    const imagePath = path.join(imagesPath, randomImage);

    // Read and process the image using sharp, then convert to JPEG
    const imageBuffer = await sharp(imagePath)
        .resize(width, height, {
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        .jpeg()
        .toBuffer();

    return imageBuffer;
}