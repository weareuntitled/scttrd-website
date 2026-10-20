import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Additive Migration: facts-Collection plus footer-Global inkl. Arrays.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "facts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" varchar NOT NULL,
      "intro" varchar,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "facts_slug_idx" ON "facts" USING btree ("slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "facts_status_idx" ON "facts" USING btree ("status")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "facts_updated_at_idx" ON "facts" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "facts_created_at_idx" ON "facts" USING btree ("created_at")`)

  const arrays: Array<[string, string, Array<[string, string, boolean]>]> = [
    ['facts_facts', 'facts', [['label', 'varchar NOT NULL', true], ['value', 'varchar NOT NULL', true]]],
    ['facts_members', 'facts', [['name', 'varchar NOT NULL', true], ['role', 'varchar NOT NULL', true]]],
    ['facts_profiles', 'facts', [['label', 'varchar NOT NULL', true], ['url', 'varchar NOT NULL', true]]],
    ['facts_research_sources', 'facts', [['url', 'varchar NOT NULL', true]]],
  ]
  for (const [table, parent, columns] of arrays) {
    const columnSql = columns.map(([name, type]) => `"${name}" ${type}`).join(', ')
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS "${table}" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, ${columnSql})`))
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "${table}_order_idx" ON "${table}" USING btree ("_order")`))
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "${table}_parent_id_idx" ON "${table}" USING btree ("_parent_id")`))
    await db.execute(sql.raw(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${table}_parent_id_fk') THEN ALTER TABLE "${table}" ADD CONSTRAINT "${table}_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."${parent}"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`))
  }

  // Sections: die Links liegen als JSON in der Zeile (keine verschachtelte Array-Tabelle).
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "facts_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "body" varchar,
      "links" jsonb
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "facts_sections_order_idx" ON "facts_sections" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "facts_sections_parent_id_idx" ON "facts_sections" USING btree ("_parent_id")`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'facts_sections_parent_id_fk') THEN
        ALTER TABLE "facts_sections" ADD CONSTRAINT "facts_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."facts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
    END $$
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "footer" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "footer_groups" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "footer_groups_order_idx" ON "footer_groups" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "footer_groups_parent_id_idx" ON "footer_groups" USING btree ("_parent_id")`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_groups_parent_id_fk') THEN
        ALTER TABLE "footer_groups" ADD CONSTRAINT "footer_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
    END $$
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "footer_groups_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "url" varchar NOT NULL,
      "target" varchar DEFAULT 'self'
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "footer_groups_links_order_idx" ON "footer_groups_links" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "footer_groups_links_parent_id_idx" ON "footer_groups_links" USING btree ("_parent_id")`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'footer_groups_links_parent_id_fk') THEN
        ALTER TABLE "footer_groups_links" ADD CONSTRAINT "footer_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
    END $$
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "footer_groups_links"`)
  await db.execute(sql`DROP TABLE IF EXISTS "footer_groups"`)
  await db.execute(sql`DROP TABLE IF EXISTS "footer"`)
  await db.execute(sql`DROP TABLE IF EXISTS "facts_sections"`)
  await db.execute(sql`DROP TABLE IF EXISTS "facts_research_sources"`)
  await db.execute(sql`DROP TABLE IF EXISTS "facts_profiles"`)
  await db.execute(sql`DROP TABLE IF EXISTS "facts_members"`)
  await db.execute(sql`DROP TABLE IF EXISTS "facts_facts"`)
  await db.execute(sql`DROP TABLE IF EXISTS "facts"`)
}
