import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, resolve, basename, dirname } from 'path'
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
  const assetFolderName = basename(sourceFolderAbsPath)
  const categoryFolderName = basename(dirname(sourceFolderAbsPath))
  try {
    mkdirSync(resolve(workingFolderAbsPath, categoryFolderName))
  } catch (e) {
    // Silenced error -- category folder might already exist
  }
  const targetFolderNameAbsPath = join(workingFolderAbsPath, categoryFolderName, assetFolderName)
  try {
    mkdirSync(targetFolderNameAbsPath)
  } catch (e) {
    // Silenced error -- asset folder might already exist
  }
  const files = readdirSync(sourceFolderAbsPath)
  for (var file of files) {
    writeFileSync(join(targetFolderNameAbsPath, file), readFileSync(join(sourceFolderAbsPath, file)))
  }
  await processAsset(sourceFolderAbsPath, targetFolderNameAbsPath)
  return await createAssetDescriptionFromFolder(targetFolderNameAbsPath, { contentBaseUrl: contentBaseUrl })
}
