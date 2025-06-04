ALTER TABLE "feeds" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "created_at" DROP NOT NULL;