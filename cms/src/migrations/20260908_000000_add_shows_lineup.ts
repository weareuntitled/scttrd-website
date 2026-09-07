import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "shows_lineup" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "url" varchar,
      "source_url" varchar
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "shows_lineup_order_idx" ON "shows_lineup" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "shows_lineup_parent_id_idx" ON "shows_lineup" USING btree ("_parent_id")`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shows_lineup_parent_id_fk') THEN
        ALTER TABLE "shows_lineup"
          ADD CONSTRAINT "shows_lineup_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
    END $$
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "shows_lineup"`)
}
