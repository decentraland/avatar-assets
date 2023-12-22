// eslint-disable-next-line @typescript-eslint/no-var-requires
const processGlb: any = require('gltf-pipeline').processGlb
import { basename, dirname } from 'path'
import { readFileSync } from 'fs'
import { Asset } from '../types'

async function extractGLBTextures(originalGLBFilePath: string): Promise<{ fileName: string; buffer: Buffer }[]> {
  const options = {
    separateTextures: true,
    resourceDirectory: dirname(originalGLBFilePath)
  }

  const data = readFileSync(originalGLBFilePath)

  const extractedFiles: { fileName: string; buffer: Buffer }[] = []

  return processGlb(data, options).then((results: any) => {
    extractedFiles.push({ fileName: basename(originalGLBFilePath), buffer: results.glb })

    const separateResources = results.separateResources
    for (const relativePath in separateResources) {
      if (separateResources.hasOwnProperty(relativePath)) {
        const resource = separateResources[relativePath]
        extractedFiles.push({ fileName: basename(relativePath), buffer: resource })
      }
    }

    return extractedFiles
  })
}

/**
 * Extract all textures from the asset's GLB files
 *
 * @export
 * @param {Asset} asset
 * @return {*}  {Promise<{ fileName: string; buffer: Buffer }[]>}
 */
export async function extractAssetTextures(asset: Asset): Promise<{ fileName: string; buffer: Buffer }[]> {
  const extractedTextures = (
    await Promise.all(asset.glbFilesPaths.map(async (glbFilePath) => await extractGLBTextures(glbFilePath)))
  ).flat()

  // remove duplicated extractedTextures with the same file name
  const uniqueExtractedTextures = extractedTextures.filter(
    (extractedTexture, index) =>
      extractedTextures.findIndex((texture) => texture.fileName === extractedTexture.fileName) === index
  )

  return uniqueExtractedTextures
}
