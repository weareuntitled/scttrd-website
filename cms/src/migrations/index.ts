import { down as down000000, up as up000000 } from './20260908_000000_add_shows_lineup'
import { down as down000001, up as up000001 } from './20260908_000001_add_link_cover_show_linkkind'
import { down as down000002, up as up000002 } from './20260924_000000_add_rider_requests'

export const migrations = [
  { name: '20260908_000000_add_shows_lineup', up: up000000, down: down000000 },
  { name: '20260908_000001_add_link_cover_show_linkkind', up: up000001, down: down000001 },
  { name: '20260924_000000_add_rider_requests', up: up000002, down: down000002 },
]
