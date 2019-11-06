import { readdirSync, readFile as readFileOrig } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { getFileCID } from '../cid/getFileCID'

const readFile = promisify(readFileOrig)

export async function getContents(folderFullPath: string) {
  const fullContents = await getFullContents(folderFullPath)

  return fullContents.map(contents => ({
    file: contents.fileName,
    hash: contents.hash
  }))
}

export function getFullContents(folderFullPath: string) {
  const fileNames = readdirSync(folderFullPath)

  return Promise.all(
    fileNames.filter(fileName => fileName !== 'asset.json' && fileName !== 'thumbnail.png').map(async fileName => {
      const filePath = join(folderFullPath, fileName)
      const fileContent = await readFile(filePath)
      return {
        filePath,
        fileContent,
        fileName,
        hash: await getFileCID(fileContent)
      }
    })
  )
}
