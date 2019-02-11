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

  constructor(id: string, name: string, tags: string[], category: string) {
    this.id = id
    this.name = name
    this.tags = tags
    this.category = category
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
      contents: this.contents
    }
  }
}

export const checkAsset = (asset: AssetDescriptor) => {
  if (!asset.name) {
    throw new Error(`Asset must have a name`)
  }

  if (asset.tags.length === 0) {
    throw new Error(`Asset must have at least 1 tag`)
  }

  if (!asset.category) {
    throw new Error(`Asset must have a category`)
  }

  if (asset.tags.indexOf(asset.category) === -1) {
    throw new Error(`Asset must have a category from the included tags`)
  }
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
    assetJSON.category
  )
  asset.path = assetDir

  checkAsset(asset)

  return asset
}

export const processAsset = async (
  asset: AssetDescriptor,
  contentServerURL: string
): Promise<AssetDescriptor> => {
  // thumb
  const thumbnailPath = path.join(asset.path, THUMB_FILE_NAME)
  const cid = await getFileCID(thumbnailPath)
  asset.thumbnail = url.resolve(contentServerURL, 'contents/' + cid)

  // contents
  await processAssetTexture(asset)

  const contentFilePaths = getFiles(asset.path + '/').filter(isAssetResource)
  for (const contentFilePath of contentFilePaths) {
    const cid = await getFileCID(contentFilePath)
    asset.contents[getRelativeDir(contentFilePath)] = cid
  }

  // entry point
  const assetSceneFilePath = Object.keys(asset.contents).find(isAssetScene) || ''
  asset.url = assetSceneFilePath

  return asset
}

// Validation

const isAssetFormat = (formats: string[]) => {
  return function (source: string): boolean {
    const extension = path.extname(source)
    for (const format of formats) {
      if (extension.indexOf(format) !== -1) {
        return true
      }
    }
    return false
  }
}

const isAssetResource = isAssetFormat(ASSET_RESOURCE_FORMATS)
const isAssetScene = isAssetFormat(ASSET_SCENE_FORMATS)

// Transformations

const separateTexturesFromGLB = (srcFilePath: string, dstDir: string = '.') => {
  const options = {
    separateTextures: true
  }
  const data = fs.readFileSync(srcFilePath)

  return gltfPipeline.processGlb(data, options).then((results) => {
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
