import { getAssetFiles } from '../assets/getAssetFiles'
import { uploadFile, ACL } from './s3'

const hashCache: string[] = []
const batchSize = 20

export async function uploadAssetFiles(folderFullPath: string) {
  const contents = await getAssetFiles(folderFullPath)

  let uploadPromises = []

  for (const content of contents) {
    if (!hashCache.includes(content.hash)) {
      console.log(`Uploading ${content.fileName} with hash ${content.hash} to S3`)

      const promise = uploadFile(content.hash, content.fileContent, ACL.publicRead).catch(error =>
        console.error(`An error occurred trying to upload ${content.hash} to S3. Skipping. Error stack: ${error.stack}`)
      )
      uploadPromises.push(promise)
      hashCache.push(content.hash)
    }

    if (uploadPromises.length >= batchSize) {
      console.log('Waiting for S3 upload batch...')
      await Promise.all(uploadPromises)
      uploadPromises = []
    }
  }

  if (uploadPromises.length > 0) {
    console.log('Waiting for S3 upload batch...')
    await Promise.all(uploadPromises)
  }
}
