CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"location_name" text,
	"location_lat" real,
	"location_lon" real,
	"url" text NOT NULL,
	"organizer_name" text,
	"rubric_id" integer,
	"image_url" text,
	"raw_hash" text NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_source_external_uniq" ON "events" USING btree ("source_id","external_id");