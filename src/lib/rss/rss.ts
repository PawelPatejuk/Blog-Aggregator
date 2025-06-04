import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
    const response = await fetch(feedURL, {
        "method": "GET",
        "headers": {
            "User-Agent": "gator"
        }
    });
    const responseText = await response.text();

    const parser = new XMLParser();
    const parsedObj = parser.parse(responseText);
    const obj = parsedObj.rss;
    if (!("channel" in obj)) {
        throw new Error("The `channel` field does not exist.");
    }

    if (!("title" in obj.channel && "link" in obj.channel && "description" in obj.channel)) {
        throw new Error("Missing some fields in `channel` field.");
    }
    if (!(typeof obj.channel.title === "string" && typeof obj.channel.link === "string" && typeof obj.channel.description === "string")) {
        throw new Error("Some fields in `channel` field have wrong types.");
    }
    const title: string = obj.channel.title; 
    const link: string = obj.channel.link; 
    const description: string = obj.channel.description;

    const channel = {
        "title": title,
        "link": link,
        "description": description,
        "item": [] as RSSItem[]
    };

    if ("item" in obj.channel && Array.isArray(obj.channel.item)) {
        for (const item of obj.channel.item) {
            if ("title" in item && "link" in item && "description" in item && "pubDate" in item && typeof item.title === "string" && typeof item.link === "string" && typeof item.description === "string" && typeof item.pubDate === "string") {   
                const title: string = item.title; 
                const link: string = item.link; 
                const description: string = item.description;
                const pubDate: string = item.pubDate;

                channel.item.push({
                    title: title,
                    link: link,
                    description: description,
                    pubDate: pubDate
                });
            }
        }
    }

    return {
        channel: channel
    };
}
