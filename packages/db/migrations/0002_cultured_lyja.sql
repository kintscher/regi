CREATE TABLE "weather_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"station_code" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"temp_c" real,
	"rh_pct" real,
	"wind_kmh" real,
	"gust_kmh" real,
	"precip_mm" real,
	"pressure_hpa" real,
	"raw_hash" text NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weather_observations" ADD CONSTRAINT "weather_observations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weather_obs_station_observed_uniq" ON "weather_observations" USING btree ("station_code","observed_at");