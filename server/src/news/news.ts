import axios from "axios";
import Parser from "rss-parser";
import { NewsItem } from "../interfaces";
import { newsSource } from "../config";

export async function getNewsHtml(): Promise<string> {
    if (newsSource.mode === "image") return getNewsImageHtml();
    const noNews = `<div class="no-news">No news found</div>`;
    const newItems = newsSource.mode === "api" ? await getApiNewsItems() : await getNewsItems();
    if (newItems.length === 0) return noNews;
    return newItems.map(({ title, imageUrl }) => {
        return `
    <div class="news-item">
        ${getImageDiv(imageUrl)}
        <div class="news-title">${title}</div>
    </div>
        `
    }).join('')
}

function getImageDiv(imageUrl: string) {
    if (imageUrl.length === 0) return '<div class="image-container-empty"></div>';
    else return `
    <div class="image-container">
        <img src="${imageUrl}">
    </div>
    `
}

// image mode: a single image scaled to fit the news box
function getNewsImageHtml(): string {
    if (!newsSource.url) return `<div class="no-news">No news image configured</div>`;
    return `<div class="news-image"><img src="${newsSource.url}"></div>`;
}

async function getNewsItems(): Promise<NewsItem[]> {
    let parser = new Parser();
    try {
        const feed = await parser.parseURL(newsSource.url);
        return feed.items.slice(0, 4).map(item => {
            return {
                title: item.title,
                imageUrl: extractImageURL(item["content:encoded"])

            }
        })
    } catch (error) {
        console.error('Error fetching news', error);
        return [];
    }
}

// api mode: the news items are read from a json document using itemsPath, titleField and imageField
async function getApiNewsItems(): Promise<NewsItem[]> {
    try {
        const response = await axios.get(newsSource.url, { timeout: 10000 });
        const items = getPath(response.data, newsSource.itemsPath);
        if (!Array.isArray(items)) {
            console.error(`News api did not return a list at "${newsSource.itemsPath}"`);
            return [];
        }
        return items.slice(0, 4).map(item => {
            return {
                title: escapeHtml(String(item?.[newsSource.titleField] ?? '')),
                imageUrl: newsSource.imageField ? String(item?.[newsSource.imageField] ?? '') : ''
            }
        }).filter(item => item.title.length > 0);
    } catch (error) {
        console.error('Error fetching news from api', error);
        return [];
    }
}

/**
 * Resolve a dot separated path in a json document.
 * @param data the json document
 * @param path the path, e.g. "data.items" (empty returns the document itself)
 * @returns the value at the path or undefined
 */
function getPath(data: unknown, path: string): unknown {
    if (!path) return data;
    return path.split('.').reduce<unknown>((value, key) => {
        return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    }, data);
}

/**
 * Escape html special characters in a text.
 * @param text the text to escape
 * @returns the escaped text
 */
function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Extract the image URL from the encoded content. Currently only supports CDATA with embedded img tag.
 * @param htmlContent the content to extract the image from
 * @returns the image URL or an empty string if no image was found
 */
function extractImageURL(htmlContent: string): string {
    if (!htmlContent) {
        return '';
    }
    const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    if (match && match.length > 1) {
        return match[1];
    }
    return '';
}
