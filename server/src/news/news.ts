import Parser from "rss-parser";
import { NewsItem } from "../interfaces";
import { newsFeedUrl } from "../config";

export async function getNewsHtml(): Promise<string> {
    const noNews = `<div class="no-news">No news found</div>`;
    const newItems = await getNewsItems();
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

async function getNewsItems(): Promise<NewsItem[]> {
    let parser = new Parser();
    try {
        const feed = await parser.parseURL(newsFeedUrl);
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