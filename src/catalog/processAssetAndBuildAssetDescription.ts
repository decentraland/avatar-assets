import * as fs from 'fs'
import * as path from 'path'
import { processAsset } from '../assets/processAsset'
import { createAssetDescriptionFromFolder } from '../description/fromFolder'

export async function processAssetAndBuildAssetDescription(
  sourceFolderAbsPath: string,
  workingFolderAbsPath: string,
  contentBaseUrl?: string
): Promise<any> {
  if (!sourceFolderAbsPath.startsWith('/')) {
    throw new Error('Expected source folder to be an absolute path')
  }
  if (!workingFolderAbsPath.startsWith('/')) {
    throw new Error('Expected source folder to be an absolute path')
  }
  const assetFolderName = path.basename(sourceFolderAbsPath)
  const categoryFolderName = path.basename(path.dirname(sourceFolderAbsPath))
  try {
    fs.mkdirSync(path.resolve(workingFolderAbsPath, categoryFolderName))
  } catch (e) {
    // Silenced error -- category folder might already exist
  }
  const targetFolderNameAbsPath = path.join(workingFolderAbsPath, categoryFolderName, assetFolderName)
  try {
    fs.mkdirSync(targetFolderNameAbsPath)
  } catch (e) {
    // Silenced error -- asset folder might already exist
  }
  const files = fs.readdirSync(sourceFolderAbsPath)
  for (var file of files) {
    fs.writeFileSync(path.join(targetFolderNameAbsPath, file), fs.readFileSync(path.join(sourceFolderAbsPath, file)))
  }
  await processAsset(sourceFolderAbsPath, targetFolderNameAbsPath)
  return await createAssetDescriptionFromFolder(targetFolderNameAbsPath, { contentBaseUrl: contentBaseUrl })
}
