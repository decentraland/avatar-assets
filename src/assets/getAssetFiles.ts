import { readdirSync, readFile as readFileOrig } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { getFileCID } from '../cid/getFileCID'

const readFile = promisify(readFileOrig)

export function getAssetFiles(folderFullPath: string) {
  const filenames = readdirSync(folderFullPath)

  return Promise.all(
    filenames.map(async fileName => {
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
