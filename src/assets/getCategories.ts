import * as fs from 'fs'
import * as path from 'path'

const dir = path.join(__dirname, '..', '..', 'assets')

export function getCategories() {
  return fs.readdirSync(dir)
}
