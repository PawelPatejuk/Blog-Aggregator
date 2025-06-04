import { db } from "..";
import { users, feeds, feed_follows } from "../schema";
import { eq, and } from "drizzle-orm";
import { getFeed } from "./feeds";
import { type User } from "../schema";

export async function createFeedFollow(userId: string, feedId: string) {
    const [insertResult] = await db.insert(feed_follows).values({ user_id: userId, feed_id: feedId }).returning();
    
    const [result] = await db.select({
        id: feed_follows.id,
        createdAt: feed_follows.created_at,
        updatedAt: feed_follows.updated_at,
        feedName: feeds.name,
        userName: users.name
    }).from(feed_follows).innerJoin(feeds, eq(feed_follows.feed_id, feeds.id)).innerJoin(users, eq(feed_follows.user_id, users.id)).where(and(eq(feed_follows.user_id, insertResult.user_id), eq(feed_follows.feed_id, insertResult.feed_id)));

    return result;
}

export async function deleteFeedFollow(userId: string, feedId: string) {
    await db.delete(feed_follows).where(and(eq(feed_follows.feed_id, feedId), eq(feed_follows.user_id, userId)));
}

export async function getFeedFollow(userId: string, feedId: string) {
    const [result] = await db.select().from(feed_follows).where(and(eq(feed_follows.user_id, userId), eq(feed_follows.feed_id, feedId)))
    return result;
}

export async function follow(url: string, user: User) {
    const feed = await getFeed(url);
    const feedId = feed.id;
    const feedName = feed.name;

    const flag = await getFeedFollow(user.id, feedId);
    if (flag !== undefined && flag !== null) {
        throw new Error(`User '${user.name}' already follows feed ${feedName}.`);
    }
    
    const result = await createFeedFollow(user.id, feedId);

    console.log(result.feedName, result.userName);
}

export async function unfollow(url: string, user: User) {
    const feed = await getFeed(url);
    const feedId = feed.id;
    const feedName = feed.name;

    const flag = await getFeedFollow(user.id, feedId);
    if (flag !== undefined || flag !== null) {   
        await deleteFeedFollow(user.id, feedId);
    }
    
    console.log(user.id, feed.id);
}

export async function getFeedFollowsForUser(user: User) {
    const result = await db.select({
        id: feed_follows.id,
        createdAt: feed_follows.created_at,
        updatedAt: feed_follows.updated_at,
        feedName: feeds.name,
        userName: users.name
    }).from(feed_follows).innerJoin(users, eq(feed_follows.user_id, users.id)).innerJoin(feeds, eq(feed_follows.feed_id, feeds.id)).where(eq(feed_follows.user_id, user.id));

    return result;
}

export async function following(user: User) {
    const result = await db.select({
        feedName: feeds.name
    }).from(feed_follows).innerJoin(feeds, eq(feed_follows.feed_id, feeds.id)).where(eq(feed_follows.user_id, user.id));

    if (result.length) {   
        for (const obj of result) {
            console.log(obj.feedName);
        }
    }
}
