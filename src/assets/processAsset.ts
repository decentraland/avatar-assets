import * as fs from 'fs'
import * as path from 'path'
import { outputTexturesFromGLB } from './outputTexturesFromGLB'

const hasExtension = (extension: string[] | string) => (file: string) =>
  typeof extension === 'string'
    ? file.endsWith(extension)
    : extension.reduce((prev, ext) => prev || file.endsWith(ext), false)
const GLB_ASSET = ['.glb']
const isGlbAsset = hasExtension(GLB_ASSET)

export async function processAsset(sourceFolder: string, destinationFolder: string) {
  const allFilesInAssetFolder = fs.readdirSync(sourceFolder)
  const glbFileNames = allFilesInAssetFolder.filter(isGlbAsset)
  for (const glbFilename of glbFileNames) {
    const fullGlbFilepath = path.resolve(path.join(sourceFolder, glbFilename))
    try {
      await outputTexturesFromGLB(fullGlbFilepath, destinationFolder)
    } catch (err) {
      console.error(err.message)
    }
  }
  return null
}
