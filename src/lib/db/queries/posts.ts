import { db } from "..";
import { feeds, posts } from "../schema";
import { eq, desc } from "drizzle-orm";
import { type User } from "../schema";
import { type Post } from "../schema";

export async function createPost(title: string, url: string, feedId: string, description: string, published_at: string) {
  const [result] = await db.insert(posts).values({
    title: title,
    url: url,
    feed_id: feedId,
    description: description,
    published_at: new Date(published_at)
  }).returning();
  return result;
}

export async function getPostsForUser(user: User, numOfPosts: number) {
  const result = await db.select().from(posts).innerJoin(feeds, eq(feeds.user_id, user.id)).where(eq(posts.feed_id, feeds.id)).orderBy(desc(posts.published_at)).limit(numOfPosts);
  return result;
}

export async function getPost(url: string) {
  const [result] = await db.select().from(posts).where(eq(posts.url, url));
  return result;
}

export async function browse(user: User, limit: number = 2): Promise<Post[]> {
  const result = await getPostsForUser(user, limit);
  const posts: Post[] = result.map(r => r.posts); 
  return posts;
}
