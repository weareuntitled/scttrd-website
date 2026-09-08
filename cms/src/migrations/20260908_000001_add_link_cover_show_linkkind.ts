import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Stellt sicher, dass neuere Collection-Felder auch in Production existieren.
// Production pusht kein Schema (siehe db-postgres connect.js: nur prodMigrations
// laufen mit NODE_ENV=production) — deshalb hier explizit + defensiv (IF NOT EXISTS).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Falls die links-Tabelle ganz fehlt (nie gepusht): vollständig anlegen.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "links" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "label" varchar NOT NULL,
      "platform" varchar DEFAULT 'other',
      "url" varchar NOT NULL,
      "cover" varchar,
      "scraped_at" timestamptz,
      "target" varchar DEFAULT '_blank',
      "order" numeric DEFAULT 10,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'links') THEN
        ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "cover" varchar;
        ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "scraped_at" timestamptz;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shows') THEN
        ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "link_kind" varchar;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'links') THEN
        ALTER TABLE "links" DROP COLUMN IF EXISTS "cover";
        ALTER TABLE "links" DROP COLUMN IF EXISTS "scraped_at";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shows') THEN
        ALTER TABLE "shows" DROP COLUMN IF EXISTS "link_kind";
      END IF;
    END $$;
  `)
}
