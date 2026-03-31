import path from 'path'
import fs from 'fs'

import { Asset, BuiltAsset } from '../types'
import { extractAssetTextures } from './glb-optimizer'
import { buildMetadata, getRepresentations } from './metadata-builder'

export async function buildAsset(asset: Asset): Promise<BuiltAsset> {
  const files: Map<string, Uint8Array> = new Map<string, Uint8Array>()
  const extractedTextures = await extractAssetTextures(asset.glbFilesPaths)
  extractedTextures.forEach((extractedTexture) => {
    files.set(extractedTexture.fileName, new Uint8Array(extractedTexture.buffer))
  })

  // For PNG-based wearables (eyebrows, eyes, mouth), add the PNG files directly
  for (const element of asset.json.main) {
    if (element.model.endsWith('.png')) {
      const pngPath = path.join(asset.directoryPath, element.model)
      if (fs.existsSync(pngPath)) {
        files.set(element.model, new Uint8Array(fs.readFileSync(pngPath)))
      }
    }
  }

  files.set('thumbnail.png', new Uint8Array(fs.readFileSync(path.join(asset.directoryPath, 'thumbnail.png'))))

  const metadata = await buildMetadata(asset)
  metadata.data.representations = getRepresentations(asset, extractedTextures)

  return {
    metadata,
    files
  }
}
