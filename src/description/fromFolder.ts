import { readFile as readFileOrig } from 'fs'
import { basename, dirname, join } from 'path'
import { Wearable } from 'types'
import { promisify } from 'util'
import { getFileCID } from '../cid/getFileCID'
import { getContents } from '../assets/getContents'
import { readAssetJson } from '../assets/readAssetJson'
import { createAssetDescription } from './createAssetDescription'

const readFile = promisify(readFileOrig)

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
  const originalJson = readAssetJson(folderFullPath)
  const category = extractCategoryFromPath(folderFullPath)

  const thumbnailCID = await getFilePathCID(folderFullPath, 'thumbnail.png')

  let imageCID
  try {
    imageCID = await getFilePathCID(folderFullPath, `${originalJson.id}.png`)
  } catch (error) {
    console.log(`Skipping image for ${originalJson.id}: ${error.message}`)
  }

  const value: Wearable = {
    ...originalJson,
    id: `dcl://${opts.collectionName || 'base-exclusive'}/` + originalJson.id,
    category,
    type: 'wearable',
    baseUrl: opts.contentBaseUrl || 'https://dcl-base-exclusive.now.sh',
    thumbnail: thumbnailCID,
    image: imageCID,
    replaces: originalJson.replaces,
    hides: originalJson.hides,
    representations: await getRepresentations(folderFullPath)
  }
  return createAssetDescription(value)
}

async function getRepresentations(folderFullPath: string) {
  const originalJson = readAssetJson(folderFullPath)
  const contents = await getContents(folderFullPath)

  return originalJson.representations.map(representation => ({
    ...representation,
    contents
  }))
}

async function getFilePathCID(basePath: string, filename: string) {
  const fullPath = join(basePath, filename)
  return getFileCID(await readFile(fullPath))
}
