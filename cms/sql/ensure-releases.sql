CREATE TABLE IF NOT EXISTS "releases" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "release_date" timestamptz NOT NULL,
  "cover_id" integer,
  "description" varchar,
  "pre_save_url" varchar,
  "spotify_url" varchar,
  "soundcloud_url" varchar,
  "youtube_url" varchar,
  "banner_enabled" boolean DEFAULT true,
  "banner_duration_days" numeric DEFAULT 28,
  "status" varchar DEFAULT 'published' NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "releases_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "releases_slug_idx" ON "releases" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "releases_cover_idx" ON "releases" USING btree ("cover_id");
CREATE INDEX IF NOT EXISTS "releases_updated_at_idx" ON "releases" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "releases_created_at_idx" ON "releases" USING btree ("created_at");
