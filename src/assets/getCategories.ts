import { readdirSync } from 'fs'
import { join } from 'path'

const dir = join(__dirname, '..', '..', 'assets')

export function getCategories() {
  return readdirSync(dir)
}
