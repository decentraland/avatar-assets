import { readFile as readFileOrig, readFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { Wearable } from 'types'
import { promisify } from 'util'
import { getFileCID } from '../cid/getFileCID'
import { getContents } from '../assets/getContents'
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
    contentBaseUrl?: string
    collectionName?: string
  }
): Promise<Wearable> {
  if (!folderFullPath || !folderFullPath.startsWith('/')) {
    throw new Error('Expected the folder\'s full path to start with "/"')
  }
  const originalJson = readAssetJsonFromFolder(folderFullPath) as Wearable
  const category = extractCategoryFromPath(folderFullPath)

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
    representations: await getRepresentations(folderFullPath)
  }
  return createAssetDescription(value)
}

async function getRepresentations(folderFullPath: string) {
  const originalJson = readAssetJsonFromFolder(folderFullPath) as Wearable
  const contents = await getContents(folderFullPath)

  return originalJson.representations.map(original => ({
    ...original,
    contents
  }))
}
