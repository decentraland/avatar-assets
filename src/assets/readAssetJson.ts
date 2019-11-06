import { readFileSync } from 'fs'
import { Wearable } from 'types'
import { join } from 'path'

export function readAssetJson(folder: string): Wearable {
  return JSON.parse(readFileSync(join(folder, 'asset.json')).toString())
}
