ALTER TABLE "events" ADD COLUMN "group_id" text;--> statement-breakpoint
CREATE INDEX "events_source_group_idx" ON "events" USING btree ("source_id","group_id");