import { db } from "..";
import { feeds } from "../schema";
import { desc, eq, sql } from "drizzle-orm";
import { fetchFeed } from "../../rss/rss";
import { createPost, getPost } from "./posts";

export async function createFeed(name: string, url: string, userId: string) {
  if (await getFeed(url) !== undefined) {
    throw new Error("This feed already exists.");
  }
  const [result] = await db.insert(feeds).values({
    name: name,
    url: url,
    user_id: userId
  }).returning();
  return result;
}

export async function getFeed(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
  return result;
}

export async function getFeeds() {
  const result = await db.select().from(feeds);
  return result;
}

export async function markFeedFetched(feedId: string) {
  await db.update(feeds).set({
    last_fetched_at: new Date,
    updated_at: new Date
  }).where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const [result] = await db.execute(sql`SELECT * FROM ${feeds} ORDER BY ${feeds.last_fetched_at} ASC NULLS FIRST LIMIT 1`);
  if (result) {
    return result;
  }
}

export async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    return;
  }

  try {
    await markFeedFetched(feed.id as string);
    
    const data = await fetchFeed(feed.url as string);
    
    for (const item of data.channel.item) {
      if (!getPost(item.link)) {
        createPost(item.title, item.link, feed.id as string, item.description, item.pubDate);
      }
    }
  } catch (err) {
    console.log(`Error: ${err}.`);
  }
}
