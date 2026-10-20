import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "news_id" integer`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id")`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "news" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "category" varchar DEFAULT 'live-recap' NOT NULL,
      "excerpt" varchar NOT NULL,
      "body" varchar NOT NULL,
      "setlist" varchar,
      "published_at" timestamptz NOT NULL,
      "cover_id" integer,
      "related_show_id" integer,
      "event_url" varchar,
      "recording_url" varchar,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "news_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action,
      CONSTRAINT "news_related_show_id_shows_id_fk" FOREIGN KEY ("related_show_id") REFERENCES "public"."shows"("id") ON DELETE set null ON UPDATE no action
    )
  `)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "news_slug_idx" ON "news" USING btree ("slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_cover_idx" ON "news" USING btree ("cover_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_related_show_idx" ON "news" USING btree ("related_show_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_published_at_idx" ON "news" USING btree ("published_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_status_idx" ON "news" USING btree ("status")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_updated_at_idx" ON "news" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_created_at_idx" ON "news" USING btree ("created_at")`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "news_photos" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "alt" varchar NOT NULL,
      "credit" varchar
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_photos_order_idx" ON "news_photos" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_photos_parent_id_idx" ON "news_photos" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_photos_image_idx" ON "news_photos" USING btree ("image_id")`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_photos_parent_id_fk') THEN
        ALTER TABLE "news_photos" ADD CONSTRAINT "news_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_photos_image_id_media_id_fk') THEN
        ALTER TABLE "news_photos" ADD CONSTRAINT "news_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "news_research_sources" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "url" varchar NOT NULL
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_research_sources_order_idx" ON "news_research_sources" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "news_research_sources_parent_id_idx" ON "news_research_sources" USING btree ("_parent_id")`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_research_sources_parent_id_fk') THEN
        ALTER TABLE "news_research_sources" ADD CONSTRAINT "news_research_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
    END $$
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "news_research_sources"`)
  await db.execute(sql`DROP TABLE IF EXISTS "news_photos"`)
  await db.execute(sql`DROP TABLE IF EXISTS "news" CASCADE`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "news_id"`)
}
