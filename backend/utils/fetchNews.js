import Parser from "rss-parser";
import axios from "axios";
import NewsArticle from "../models/NewsArticle.js";

const parser = new Parser();

const SOURCES = [
    {name: "Vatican News (English)", url: "https://www.vaticannews.va/en.rss.xml"},
    {name: "Catholic News Agency", url: "https://www.catholicnewsagency.com/rss"},
    {name: "EWTN News", url: "https://www.ewtnnews.com/rss"},
];

export async function fetchNews() {
    console.log("Starting news fetch at", new Date().toLocaleString());

    for (const source of SOURCES) {
        try {
            const response = await axios.get(source.url, {
                headers: {
                    "User-Agent": "CatholicNewsAggregator/1.0 (https://howtobecatholic.com; howtobeacatholic23@gmail.com)", // ← Change to your real email/site
                },
                timeout: 20000,
            });

            const feed = await parser.parseString(response.data);

            console.log(`Fetched ${feed.items.length} items from ${source.name}`);

            for (const item of feed.items) {
                const exists = await NewsArticle.findOne({url: item.link});
                if (exists) continue;

                // Extract best image from RSS
                let imageUrl = null;
                if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
                    imageUrl = item.enclosure.url;
                } else if (item["media:content"]?.["$"]?.url) {
                    imageUrl = item["media:content"]["$"].url;
                } else if (item["media:thumbnail"]?.["$"]?.url) {
                    imageUrl = item["media:thumbnail"]["$"].url;
                } else {
                    const imgMatch = item.content?.match(/<img[^>]+src=["'](.*?)["']/i);
                    if (imgMatch) imageUrl = imgMatch[1];
                }

                await NewsArticle.create({
                    source: source.name,
                    title: item.title || "(No title)",
                    description: item.contentSnippet || "",
                    content: item.content || item.contentSnippet || "",
                    url: item.link,
                    imageUrl,
                    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                    guid: item.guid || item.id,
                    categories: item.categories || [],
                    status: "active",
                });

                console.log(`Saved: ${item.title} (image: ${imageUrl || "none"})`);
            }
        } catch (err) {
            console.error(`Error fetching ${source.name}:`, err.message);
            if (err.response) {
                console.error("Status:", err.response.status);
                if (err.response.status === 429) {
                    console.warn("Rate limited — consider waiting 15–60 min or adding email in User-Agent");
                }
            }
        }
    }

    console.log("News fetch complete.");
}

// Run once on startup
fetchNews().catch(console.error);

const intervalMs = 7200000 + Math.floor(Math.random() * 7200000); // 2–4 hours
setInterval(fetchNews, intervalMs);

// Every hour
setInterval(fetchNews, 4 * 60 * 60 * 1000);
