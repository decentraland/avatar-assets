import * as fs from 'fs'
import * as path from 'path'
import { AssetDescription, createAssetDescription } from './createAssetDescription'
import { getFileCID } from '../cid/getFileCID'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

export async function createAssetDescriptionFromFolder(folder, opts: { contentBaseUrl?: string }) {
  const json = JSON.parse(fs.readFileSync(path.join(folder, 'asset.json')).toString())
  const folderName = path.basename(folder)
  const category = path.basename(path.dirname(folder))
  const dirEntries = fs.readdirSync(folder)
  const thumbnail = path.join(folder, 'thumbnail.png')
  const value: AssetDescription = {
    id: 'dcl://base-avatars/' + folderName.toLowerCase() + '_' + category.toLowerCase(),
    name: json.name,
    contents: await Promise.all(
      dirEntries
        .filter(_ => _ !== 'asset.json' && _ !== 'thumbnail.png')
        .map(async _ => {
          return {
            name: _,
            hash: await getFileCID(await readFile(path.join(folder, _)))
          }
        })
    ),
    i18n: Object.entries(json.i18n).map(([key, value]) => ({
      code: key,
      text: value as string
    })),
    tags: json.tags,
    category,
    contentBaseUrl: opts.contentBaseUrl,
    thumbnail: await getFileCID(await readFile(thumbnail)),
    main: json.main.map(entry => ({ bodyType: entry.type, entryPoint: entry.model }))
  }
  return createAssetDescription(value)
}
