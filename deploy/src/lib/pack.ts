import * as fs from 'fs'
import * as path from 'path'
import * as uuidv4 from 'uuid/v4'

import { Log } from 'decentraland-commons'

import { AssetDescriptor, readAsset, processAsset } from './asset'
import { getDirectories } from './files'
import * as s3 from './s3'

const DEFAULT_CONTENT_SERVER_URL = 'https://s3.amazonaws.com/content.decentraland.zone'

const log = new Log('pack')

export class AssetPackDescriptor {
  id: string
  version: number
  title: string
  assets: AssetDescriptor[]

  constructor(title: string, assets: AssetDescriptor[] = []) {
    this.id = uuidv4()
    this.version = 1
    this.title = title
    this.assets = assets
  }
}

export const readAssetPack = () => {
  return
}

export const bundleAssetPack = async (
  assetPackDir: string,
  title: string,
  contentServerURL: string = DEFAULT_CONTENT_SERVER_URL
): Promise<AssetPackDescriptor> => {
  const assetDirList = getDirectories(assetPackDir)

  log.info(`(asset-pack) Processing ${assetDirList.length} assets`)
  const assetPackItems: AssetDescriptor[] = []
  for (const assetDir of assetDirList) {
    try {
      const asset = await processAsset(readAsset(assetDir), contentServerURL)
      assetPackItems.push(asset)
    } catch (err) {
      log.error(`[asset-pack] Processing : ${assetDir} ${err}`)
    }
  }
  log.info(`(asset-pack) Found ${assetPackItems.length} valid assets`)

  return new AssetPackDescriptor(title, assetPackItems)
}

export const uploadAssetPack = async (
  assetPack: AssetPackDescriptor,
  assetPackDir: string,
  bucketName: string
) => {
  for (const [idx, asset] of assetPack.assets.entries()) {
    const uploads = Object.values(asset.contents).map(
      async ({ name, file }) => {
        const contentFullPath = path.join(assetPackDir, name)
        const contentData = fs.readFileSync(contentFullPath)
        const isFileUploaded = await s3.checkFile(bucketName, file)
        if (!isFileUploaded) {
          return s3.uploadFile(bucketName, file, contentData)
        }
        return Promise.resolve(true)
      }
    )
    await Promise.all(uploads)
    log.info(
      `(uploader) (${asset.path}) uploaded ${idx + 1}/${
        assetPack.assets.length
      }`
    )
  }
}

export const bundleAllAssets = async(
  assetDirectory: string,
  contentServerURL: string = DEFAULT_CONTENT_SERVER_URL,
  bucketName: string
): Promise<{ [key: string]: AssetPackDescriptor }> => {
  const packsDir = getDirectories(assetDirectory)

  log.info(`(asset-pack) Processing ${packsDir} categories`)
  const packs: {[key: string]: AssetPackDescriptor} = {}
  for (const packDir of packsDir) {
    try {
      const pack = await bundleAssetPack(packDir, path.basename(packDir), contentServerURL)
      packs[path.basename(packDir)] = pack
      await uploadAssetPack(pack, packDir, bucketName)
    } catch(e) {
      console.log(e.stack)
    }
  }
  return packs
}

export const saveAllAssets = async(
  desc: { [key: string]: AssetPackDescriptor },
  dstPath: string
) => {
  const assets:any[] = []
  for (let key in desc) {
    if(desc[key].assets){
      desc[key].assets.forEach(asset => assets.push(createAssetResponse(asset)))
    }
  }
  const result = {
    ok: true,
    data: assets
  }
  
  const data = JSON.stringify(result, null, 2)
  fs.writeFileSync(dstPath, data)
  return data
}

const createAssetResponse = (asset: AssetDescriptor) => {
  const {
    variations,
    extra, 
    ...filteredAsset
  } = asset

  return { 
    ...filteredAsset, 
    ...asset.extra,
    contents: asset.contents.map(
      asset => ({ file: asset.file, name: path.basename(asset.name)})
    )
  }
}

export const saveAssetPack = (
  assetPack: AssetPackDescriptor,
  dstPath: string
) => {
  // HACK: this result format is to return like a server request
  const result = {
    ok: true,
    data: assetPack
  }
  const data = JSON.stringify(result, null, 2)
  fs.writeFileSync(dstPath, data)
}
