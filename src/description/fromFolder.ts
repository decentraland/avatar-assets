import * as fs from 'fs'
import * as path from 'path'
import { AssetDescription, createAssetDescription } from './createAssetDescription'
import { getFileCID } from '../cid/getFileCID'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const readAssetJsonFromFolder = (folder: string) =>
  JSON.parse(fs.readFileSync(path.join(folder, 'asset.json')).toString())

// /some/path/<body_shape>/<asset_id> <-- path
//                         ########## <-- basename(path)
//            ############ <------------- basename(dirname(path))
// ####################### <------------- dirname(path)
const extractCategoryFromPath = (folder: string) => path.basename(path.dirname(folder))

export async function createAssetDescriptionFromFolder(
  folderFullPath: string,
  opts: {
    contentBaseUrl?: string
  }
) {
  if (!folderFullPath || !folderFullPath.startsWith('/')) {
    throw new Error('Expected the folder\'s full path to start with "/"')
  }
  const originalJson = readAssetJsonFromFolder(folderFullPath)
  const category = extractCategoryFromPath(folderFullPath)

  const dirEntries = fs.readdirSync(folderFullPath)
  const thumbnail = path.join(folderFullPath, 'thumbnail.png')

  const value: AssetDescription = {
    id: 'dcl://base-avatars/' + originalJson.name,
    name: originalJson.name,
    contents: await Promise.all(
      dirEntries
        .filter(_ => _ !== 'asset.json' && _ !== 'thumbnail.png')
        .map(async _ => {
          return {
            name: _,
            hash: await getFileCID(await readFile(path.join(folderFullPath, _)))
          }
        })
    ),
    i18n: Object.entries(originalJson.i18n).map(([key, value]) => ({
      code: key,
      text: value as string
    })),
    tags: originalJson.tags,
    category,
    contentBaseUrl: opts.contentBaseUrl,
    thumbnail: await getFileCID(await readFile(thumbnail)),
    main: originalJson.main.map(entry => ({ bodyType: entry.type, entryPoint: entry.model }))
  }
  return createAssetDescription(value)
}
