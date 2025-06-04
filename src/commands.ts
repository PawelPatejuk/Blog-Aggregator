import { setUser, readConfig } from "./config.js"
import { createUser, getUser, getUserById, getUsers, reset } from "./lib/db/queries/users.js";
import { fetchFeed } from "./lib/rss/rss.js";
import { type Feed, User, Post } from "./lib/db/schema.js";
import { follow } from "./lib/db/queries/feed_follows.js";
import { getFeedFollowsForUser, createFeedFollow, unfollow } from "./lib/db/queries/feed_follows.js";
import { getFeeds, createFeed, scrapeFeeds } from "./lib/db/queries/feeds.js";
import { browse } from "./lib/db/queries/posts.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
export type CommandsRegistry = Record<string, CommandHandler>; 

export type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;
export type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
    return async (cmdName: string, ...args: string[]): Promise<void> => {
        const config = readConfig();
        const userName = config.currentUserName;
        
        const user = await getUser(userName);
        if (!user) {
            throw new Error(`User ${userName} not found`);
        }

        await handler(cmdName, user, ...args);
    }
}

function parseDuration(durationStr: string): number {
    
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    
    if (match) {
        switch (match[2]) {
            case "ms":
                return Number(match[1]);
            case "s":
                return 1000 * Number(match[1]);
            case "m":
                return 1000 * 60 * Number(match[1]);
            case "h":
                return 1000 * 60 * 60 * Number(match[1]);
        }
    }

    return 0;
}

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0 || args.length > 1) {
        throw new Error("The `login handler` expects a single argument (the username).");
    }
    const userName = args[0];
    if (!await getUser(userName)) {
        throw new Error(`The username \`${userName}\` doesn't exist in the database.`);
    }
    setUser(userName);
    console.log(`User \`${userName}\` has been set.`)
}

export async function registerHandler(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length !== 1) {
        throw new Error("The `register handler` expects a single argument (the username).");
    }
    const userName = args[0];
    if (typeof userName !== "string") {
        throw new Error("Invalid type.");
    }
    if (await getUser(userName)) {
        throw new Error(`User \`${userName}\` alerady exists.`);
    }
    const user = await createUser(userName);
    setUser(user.name);
    console.log(`User \`${user.name}\` was successfully created!`);
    console.log(`User id: ${user.id}.`);
    console.log(`User created at: ${user.created_at}.`);
    console.log(`User updated at: ${user.updated_at}.`);
}

export async function resetHandler(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length !== 0) {
        throw new Error("The `reset` handler does not take any arguments.");
    }
    try {
        await reset();
    } catch(err) {
        console.log("Performing `reset` command was not successful.");
        process.exit(1);
    }
    console.log("All rows in `Users` table were successfully deleted.");
}

export async function getUsersHandler(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length !== 0) {
        throw new Error("The `get users handler` does not take any arguments.");
    }
    const users = await getUsers();
    const config = await readConfig();
    const currentUserName = config.currentUserName;
    for (const user of users) {
        console.log(`* ${user.name}${user.name === currentUserName ? " (current)": ""}`);
    }
}

export async function aggHandler(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length !== 1) {
        throw new Error("The `agg handler` expects a single argument (the time between reqs).");
    }

    const timeBetweenRequests = parseDuration(args[0]);

    console.log(`Collecting feeds every ${args[0]}`);

    scrapeFeeds().catch(handleError);

    const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
    }, timeBetweenRequests);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });

}

function handleError(err: Error) {
    console.log(err);
}

export async function addFeedHandler(cmdName: string, user: User, ...args: string[]): Promise<void> {
    if (args.length !== 2) {
        throw new Error("The `add feed handler` expects two arguments (name and url of the feed).");
    }

    const feedName = args[0];
    const url = args[1];

    const feed = await createFeed(feedName, url, user.id);
    const feedFollow = await createFeedFollow(user.id, feed.id);

    printFeedFollow(user.name, feedFollow.feedName);

    console.log("Feed created successfully:");
    printFeed(feed, user);
}

export async function printFeed(feed: Feed, user: User): Promise<void> {
    console.log("Feed:");
    console.log(`id: ${feed.id}`);
    console.log(`created_at: ${feed.created_at}`);
    console.log(`updated_at_at: ${feed.updated_at}`);
    console.log(`name: ${feed.name}`);
    console.log(`url: ${feed.url}`);
    console.log(`user_id: ${feed.user_id}`);
}

export function printFeedFollow(userName: string, feedName: string) {
  console.log(`userName: ${userName}`);
  console.log(`feedName: ${feedName}`);
}

export async function getFeedsHandler(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length !== 0) {
        throw new Error("The `get feed handler` does not take any arguments.");
    }
    const feeds = await getFeeds();

    for (const feed of feeds) {
        const user = await getUserById(feed.user_id);
        printFeed(feed, user);
        console.log(`user_name: ${user.name}`);
    }
}

export async function followingHandler(cmdName: string, user: User, ...args: string[]): Promise<void> {
    if (args.length !== 0) {
        throw new Error("The `follow handler` does not take any arguments.");
    }

    const result = await getFeedFollowsForUser(user);
    for (const obj of result) {
        console.log(obj.feedName);
    }
}

export async function followHandler(cmdName: string, user: User, ...args: string[]): Promise<void> {
    if (args.length !== 1) {
        throw new Error("The `register handler` expects a single argument (the username).");
    }
    const url = args[0];
    await follow(url, user);
}

export async function unfollowHandler(cmdName: string, user: User, ...args: string[]): Promise<void> {
    if (args.length !== 1) {
        throw new Error("The `register handler` expects a single argument (the username).");
    }
    const url = args[0];
    await unfollow(url, user);

}

export async function browseHandler(cmdName: string, user: User, ...args: string[]): Promise<void> {
    if (args.length > 1) {
        throw new Error("The `browse handler` expects a single optional argument (the limit).");
    }
    let posts: Post[] = [];
    if (args.length === 1) {
        posts = await browse(user, Number(args[0]));
    } else {
        posts = await browse(user);
    }
    for (const post of posts) {
        await printPost(post);
    }
}

export async function printPost(post: Post): Promise<void> {
    console.log("Feed:");
    console.log(`id: ${post.id}`);
    console.log(`created_at: ${post.created_at}`);
    console.log(`updated_at_at: ${post.updated_at}`);
    console.log(`title: ${post.title}`);
    console.log(`url: ${post.url}`);
    console.log(`description: ${post.description}`);
    console.log(`published_at: ${post.published_at}`);
    console.log(`feed_id: ${post.feed_id}`);
}

export async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler): Promise<void> {
    registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]): Promise<void> {
    const callback = registry[cmdName];
    if (!callback) {
        throw `Unknown command: ${cmdName}`;
    }
    await callback(cmdName, ...args);
}
