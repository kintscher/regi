ALTER TABLE "publications" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "url" text;--> statement-breakpoint
COMMENT ON COLUMN "publications"."category" IS 'Source-specific categorization (e.g. regensdorf-news: news vs pressemitteilungen). NULL for sources without categorization.';--> statement-breakpoint
COMMENT ON COLUMN "publications"."url" IS 'Per-item detail URL. NULL means fallback to source.url (homepage) for display.';
