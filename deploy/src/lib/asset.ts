import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'

import { Log } from 'decentraland-commons'
import * as gltfPipeline from 'gltf-pipeline'

import { getFileCID } from './CIDUtils'
import { getSHA256 } from './crypto'
import { getFiles, getRelativeDir } from './files'

const ASSET_RESOURCE_FORMATS = ['.glb', '.gltf', '.png', '.jpg', '.bin']
const ASSET_SCENE_FORMATS = ['.glb']
const ASSET_FILE_NAME = 'asset.json'
const THUMB_FILE_NAME = 'thumbnail.png'

const log = new Log('asset')

export class AssetDescriptor {
  id: string
  name: string
  tags: string[]
  category: string
  thumbnail: string = ''
  url: string = ''
  variations: string[] = []
  contents: { [key: string]: string } = {}
  path: string = ''
  extra: any

  constructor(id: string, name: string, tags: string[], category: string, extra: any = {}) {
    this.id = id
    this.name = name
    this.tags = tags
    this.category = category
    this.extra = extra
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      thumbnail: this.thumbnail,
      url: this.url,
      tags: this.tags,
      category: this.category,
      variations: this.variations,
      contents: this.contents,
      ...this.extra
    }
  }
}

// Validation

const isAssetFormat = (formats: string[]) => {
  return function(source: string): boolean {
    const extension = path.extname(source)
    for (const format of formats) {
      if (extension.indexOf(format) !== -1) {
        return true
      }
    }
    return false
  }
}

export const isAssetResource = isAssetFormat(ASSET_RESOURCE_FORMATS)
export const isAssetScene = isAssetFormat(ASSET_SCENE_FORMATS)

export const checkAsset = (asset: AssetDescriptor) => {
  if (!asset.name) {
    throw new Error(`Asset must have a name`)
  }
}
// Transformations

const separateTexturesFromGLB = (srcFilePath: string, dstDir: string = '.') => {
  const options = {
    separateTextures: true,
    resourceDirectory: path.dirname(srcFilePath)
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

export const readAsset = (assetDir: string): AssetDescriptor => {
  log.info(`(asset) Reading : ${assetDir}...`)

  const filepath = path.join(assetDir, ASSET_FILE_NAME)
  const assetData = fs.readFileSync(filepath)
  const assetJSON = JSON.parse(assetData.toString())
  const asset = new AssetDescriptor(
    getSHA256(path.basename(assetDir)),
    assetJSON.name,
    assetJSON.tags,
    assetJSON.category,
    assetJSON
  )
  asset.path = assetDir

  checkAsset(asset)

  return asset
}

const processAssetTexture = async (asset: AssetDescriptor) => {
  const contentFilePaths = getFiles(asset.path + '/').filter(isAssetScene)
  for (const contentFilePath of contentFilePaths) {
    try {
      await separateTexturesFromGLB(contentFilePath, asset.path)
    } catch (err) {
      log.error(err.message)
    }
  }
}

export const processAsset = async (
  asset: AssetDescriptor,
  contentServerURL: string
): Promise<AssetDescriptor> => {
  // Thumb
  const thumbnailPath = path.join(asset.path, THUMB_FILE_NAME)
  const cid = await getFileCID(thumbnailPath)
  asset.thumbnail = url.resolve(contentServerURL, 'contents/' + cid)

  // Contents
  try {
    await processAssetTexture(asset)

    const contentFilePaths = getFiles(asset.path + '/').filter(isAssetResource)
    for (const contentFilePath of contentFilePaths) {
      const cid = await getFileCID(contentFilePath)
      asset.contents[getRelativeDir(contentFilePath)] = cid
    }
  } catch (e) {
    console.log('error', e.stack)
  }

  // Entry point
  const assetSceneFilePath =
    Object.keys(asset.contents).find(isAssetScene) || ''
  asset.url = assetSceneFilePath

  return asset
}
