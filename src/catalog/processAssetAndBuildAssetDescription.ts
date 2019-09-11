import * as fs from 'fs'
import * as path from 'path'
import { processAsset } from 'assets/processAsset'
import { createAssetDescriptionFromFolder } from 'description/fromFolder'

export async function processAssetAndBuildAssetDescription(
  sourceFolder: string,
  workingFolder: string,
  contentBaseUrl?: string
): Promise<any> {
  const assetFolderName = path.basename(sourceFolder)
  const categoryFolderName = path.basename(path.dirname(sourceFolder))
  try {
    fs.mkdirSync(path.join(workingFolder, categoryFolderName))
  } catch (e) {
    // Silenced error -- category folder might already exist
  }
  const targetFolderName = path.join(workingFolder, categoryFolderName, assetFolderName)
  fs.mkdirSync(targetFolderName)
  const files = fs.readdirSync(sourceFolder)
  for (var file of files) {
    fs.writeFileSync(path.join(targetFolderName, file), fs.readFileSync(path.join(sourceFolder, file)))
  }
  await processAsset(sourceFolder, targetFolderName)
  return await createAssetDescriptionFromFolder(targetFolderName, { contentBaseUrl: contentBaseUrl })
}
