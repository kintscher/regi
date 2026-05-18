CREATE TABLE "waste_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"waste_type" text NOT NULL,
	"collection_date" date NOT NULL,
	"route_ids" text[] NOT NULL,
	"route_names" text NOT NULL,
	"raw_hash" text NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "waste_collections" ADD CONSTRAINT "waste_collections_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "waste_collections_source_external_uniq" ON "waste_collections" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "waste_collections_date_idx" ON "waste_collections" USING btree ("collection_date");