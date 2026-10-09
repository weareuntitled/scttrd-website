import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Stellt sicher, dass die neuen Show-Detailfelder auch in Production existieren.
// Production pusht kein Schema — deshalb hier explizit + defensiv (IF NOT EXISTS).
// Spaltennamen folgen Payloads to-snake-case (Unterstrich vor jedem Großbuchstaben).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shows') THEN
        ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "description" varchar;
        ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "address" varchar;
        ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "doors_time" varchar;
        ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "start_time" varchar;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shows') THEN
        ALTER TABLE "shows" DROP COLUMN IF EXISTS "description";
        ALTER TABLE "shows" DROP COLUMN IF EXISTS "address";
        ALTER TABLE "shows" DROP COLUMN IF EXISTS "doors_time";
        ALTER TABLE "shows" DROP COLUMN IF EXISTS "start_time";
      END IF;
    END $$;
  `)
}
