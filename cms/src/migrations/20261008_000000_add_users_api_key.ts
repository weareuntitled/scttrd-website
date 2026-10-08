import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Payload 3 API-Key-Auth (useAPIKey: true in collections/Users.ts).
// Reine ADD-Spalten, deshalb in CI sicher anwendbar:
//   enable_a_p_i_key — Checkbox, ob der Key aktiv ist
//   api_key          — der Key selbst (Payload speichert ihn verschlüsselt)
//   api_key_index    — HMAC-SHA256 des Keys, über den die Auth-Strategie sucht
// WICHTIG: die Spaltennamen kommen aus `to-snake-case`, das ein Unterstrich vor
// JEDEN Großbuchstaben setzt — `enableAPIKey` wird also zu `enable_a_p_i_key`
// (nicht `enable_api_key`). Alle Spalten nullable, weil der Index beim
// Deaktivieren des Keys wieder null wird.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean`)
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" varchar`)
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_index" varchar`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "api_key_index"`)
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "api_key"`)
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "enable_a_p_i_key"`)
}
