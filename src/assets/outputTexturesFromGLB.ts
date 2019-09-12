import { join, basename, dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'
const processGlb: any = require('gltf-pipeline').processGlb

export const outputTexturesFromGLB = (srcFilePath: string, dstDir: string = '.') => {
  const options = {
    // skipExtensionInRelativePath: true,
    separateTextures: true,
    resourceDirectory: dirname(srcFilePath)
    // customStages: [
    //   async function(gltf) {
    //     await Promise.all(
    //       gltf.images.map(async (image: any) => {
    //         image.name = await getFileCID(image.extras._pipeline.source)
    //       })
    //     )
    //     return gltf
    //   }
    //]
  }
  const data = readFileSync(srcFilePath)

  return processGlb(data, options).then((results: any) => {
    const glbFilePath = join(dstDir, basename(srcFilePath))
    writeFileSync(glbFilePath, results.glb)

    const separateResources = results.separateResources
    for (const relativePath in separateResources) {
      if (separateResources.hasOwnProperty(relativePath)) {
        const resource = separateResources[relativePath]
        const resourceFilePath = join(dstDir, relativePath)
        writeFileSync(resourceFilePath, resource)
      }
    }
  })
}
