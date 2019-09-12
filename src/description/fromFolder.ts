import { readdirSync, readFileSync, readFile as readFileOrig } from 'fs'
import { basename, join, dirname } from 'path'
import { AssetDescription, createAssetDescription } from './createAssetDescription'
import { getFileCID } from '../cid/getFileCID'
import { promisify } from 'util'

const readFile = promisify(readFileOrig)
const readAssetJsonFromFolder = (folder: string) => JSON.parse(readFileSync(join(folder, 'asset.json')).toString())

// /some/path/<body_shape>/<asset_id> <-- path
//                         ########## <-- basename(path)
//            ############ <------------- basename(dirname(path))
// ####################### <------------- dirname(path)
const extractCategoryFromPath = (folder: string) => basename(dirname(folder))

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

  const dirEntries = readdirSync(folderFullPath)
  const thumbnail = join(folderFullPath, 'thumbnail.png')

  const value: AssetDescription = {
    id: 'dcl://base-avatars/' + originalJson.name,
    name: originalJson.name,
    contents: await Promise.all(
      dirEntries
        .filter(_ => _ !== 'asset.json' && _ !== 'thumbnail.png')
        .map(async _ => {
          return {
            name: _,
            hash: await getFileCID(await readFile(join(folderFullPath, _)))
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
    main: originalJson.main.map((entry: any) => ({ bodyType: entry.type, entryPoint: entry.model }))
  }
  return createAssetDescription(value)
}
