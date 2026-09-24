import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Protokoll-Tabelle für Rider-Anfragen (Website → CMS). Rein additiv.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rider_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "venue" varchar NOT NULL,
      "email" varchar NOT NULL,
      "file" varchar DEFAULT 'rider',
      "source" varchar DEFAULT 'styleguide',
      "user_agent" varchar,
      "ip" varchar,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "rider_requests_created_at_idx" ON "rider_requests" ("created_at")
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "rider_requests"`)
}
