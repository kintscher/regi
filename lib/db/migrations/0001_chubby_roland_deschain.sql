ALTER TABLE "publications" DROP CONSTRAINT "publications_source_id_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;