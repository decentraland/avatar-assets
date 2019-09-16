import { readdirSync, readFileSync, readFile as readFileOrig } from 'fs'
import { basename, join, dirname } from 'path'
import { AssetDescription, createAssetDescription } from './createAssetDescription'
import { getFileCID } from '../cid/getFileCID'
import { promisify } from 'util'
import { Wearable } from 'types'

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
  const originalJson = readAssetJsonFromFolder(folderFullPath) as Wearable
  const category = extractCategoryFromPath(folderFullPath)
  const name = basename(folderFullPath)

  const dirEntries = readdirSync(folderFullPath)
  const thumbnail = join(folderFullPath, 'thumbnail.png')

  const value: Wearable = {
    ...originalJson,
    id: 'dcl://base-wearables/' + name,
    category,
    thumbnail: await getFileCID(await readFile(thumbnail)),
    representations: await Promise.all(originalJson.representations.map(
      async (original) => ({
        ...original,
        contents: await Promise.all(dirEntries
          .filter(_ => _ !== 'asset.json' && _ !== 'thumbnail.png')
          .map(async _ => {
            return {
              file: _,
              hash: await getFileCID(await readFile(join(folderFullPath, _)))
            }
          })
        )
      }))
    )
  }
  return createAssetDescription(value)
}
