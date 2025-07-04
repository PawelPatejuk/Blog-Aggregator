import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    name: text("name").notNull().unique(),
});

export const feeds = pgTable("feeds", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    user_id: uuid("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
    last_fetched_at: timestamp("created_at")
})

export const feed_follows = pgTable("feed_follows", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    user_id: uuid("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
    feed_id: uuid("feed_id").notNull().references(() => feeds.id, {onDelete: "cascade"}),
}, (t) => [
    unique("user_id_feed_id_unique").on(t.user_id, t.feed_id)
])

export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    title: text("name").notNull(),
    url: text("url").notNull().unique(),
    description: text("name"),
    published_at: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    feed_id: uuid("feed_id").notNull().references(() => feeds.id, {onDelete: "cascade"}),
})

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
