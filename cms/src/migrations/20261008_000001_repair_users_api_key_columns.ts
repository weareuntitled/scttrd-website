import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Reparatur für DBs, auf denen die erste Version dieser Migration lief:
// dort hieß die Checkbox-Spalte `enable_api_key` (falsch, ohne die
// Einzelbuchstaben-Trennung von to-snake-case), Payload erwartet aber
// `enable_a_p_i_key` — ohne sie schlägt jeder users-Query fehl (Login 500).
// Guarded, damit sie auf frischen DBs (die direkt korrekt angelegt sind)
// genauso sicher durchläuft. `api_key`/`api_key_index` waren von Anfang an richtig.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean`)
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "enable_api_key"`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_api_key" boolean`)
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "enable_a_p_i_key"`)
}
