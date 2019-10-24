import { readdirSync, readFile as readFileOrig, readFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { Wearable } from 'types'
import { promisify } from 'util'
import { getFileCID } from '../cid/getFileCID'
import { createAssetDescription } from './createAssetDescription'

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
    contentBaseUrl?: string,
    collectionName?: string
  }
): Promise<Wearable> {
  if (!folderFullPath || !folderFullPath.startsWith('/')) {
    throw new Error('Expected the folder\'s full path to start with "/"')
  }
  const originalJson = readAssetJsonFromFolder(folderFullPath) as Wearable
  const category = extractCategoryFromPath(folderFullPath)

  const dirEntries = readdirSync(folderFullPath)
  const thumbnail = join(folderFullPath, 'thumbnail.png')

  const value: Wearable = {
    ...originalJson,
    id: `dcl://${opts.collectionName || 'base-exclusive'}/` + (originalJson as any).id,
    category,
    type: 'wearable',
    baseUrl: opts.contentBaseUrl || 'https://dcl-base-exclusive.now.sh',
    thumbnail: await getFileCID(await readFile(thumbnail)),
    replaces: originalJson.replaces,
    hides: originalJson.hides,
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
