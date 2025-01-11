import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import { customContent } from '../config';

export async function renderCustomContentHtml(): Promise<string> {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({
            width: 400,
            height: 750,
            deviceScaleFactor: 1.5,
        });

        await page.goto(customContent.url, { waitUntil: 'networkidle0', timeout: 30000 });

        const screenshot = await page.screenshot({
            fullPage: false,
            encoding: 'binary'
        });

        await browser.close();

        // Save the screenshot to a file
        const filename = `customContent.png`;
        console.log(__dirname);
        const dir = join(__dirname, '..', 'layout', 'custom');

        const filepath = join(dir, filename);
        // Ensure directory exists
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        console.log(`Saving custom content screenshot to ${filepath}`);
        writeFileSync(filepath, screenshot);

        // Return the HTML to display the screenshot
        return `<img src="custom/${filename}" style="max-width: 100%; height: auto;">`;
    } catch (error) {
        console.error('Error capturing custom content screenshot:', error);
        return `<p>Error displaying custom content: ${error.message}</p>`;
    }
}