import * as path from 'path'
import * as fs from 'fs'
import * as gltfPipeline from 'gltf-pipeline'
import { getFileCID } from '../cid/getFileCID'

export const outputTexturesFromGLB = (srcFilePath: string, dstDir: string = '.') => {
  const options = {
    skipExtensionInRelativePath: true,
    separateTextures: true,
    resourceDirectory: path.dirname(srcFilePath),
    customStages: [
      async function(gltf) {
        await Promise.all(
          gltf.images.map(async (image: any) => {
            image.name = await getFileCID(image.extras._pipeline.source)
          })
        )
        return gltf
      }
    ]
  }
  const data = fs.readFileSync(srcFilePath)

  return gltfPipeline.processGlb(data, options).then(results => {
    const glbFilePath = path.join(dstDir, path.basename(srcFilePath))
    fs.writeFileSync(glbFilePath, results.glb)

    const separateResources = results.separateResources
    for (const relativePath in separateResources) {
      if (separateResources.hasOwnProperty(relativePath)) {
        const resource = separateResources[relativePath]
        const resourceFilePath = path.join(dstDir, relativePath)
        fs.writeFileSync(resourceFilePath, resource)
      }
    }
  })
}
