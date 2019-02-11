import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import * as uuidv4 from 'uuid/v4'
import * as url from 'url'

import { Log } from 'decentraland-commons'

import * as CID from 'cids'
import { MemoryDatastore } from 'interface-datastore'
import * as imp from 'ipfs-unixfs-engine'
import * as gltfPipeline from 'gltf-pipeline'
import * as AWS from 'aws-sdk'

import Importer = imp.Importer

const log = new Log('bundler')

// TODO: config file
const CONTENT_SERVER_URL = 'https://content.decentraland.today'

const ASSET_RESOURCE_FORMATS = ['.glb', '.gltf', '.png', '.jpg', '.bin']
const ASSET_SCENE_FORMATS = ['.glb']
const ASSET_FILE_NAME = 'asset.json'
const THUMB_FILE_NAME = 'thumbnail.png'

class AssetDescriptor {
  id: string
  name: string
  tags: string[]
  category: string
  thumbnail: string = ''
  url: string = ''
  variations: string[] = []
  contents: { [key: string]: string } = {}
  path: string = ''

  constructor(name: string, tags: string[], category: string) {
    this.id = uuidv4()
    this.name = name
    this.tags = tags
    this.category = category
  }

  static newFromJSON(assetData: any): AssetDescriptor {
    return new AssetDescriptor(
      assetData.name,
      assetData.tags,
      assetData.category
    )
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

class AssetPackDescriptor {
  id: string
  version: number
  title: string
  assets: AssetDescriptor[]

  constructor(title: string, assets: AssetDescriptor[]) {
    this.id = uuidv4()
    this.version = 1
    this.title = title
    this.assets = assets
  }
}

type ContentIdentifier = {
  cid: string
  name: string
}

interface IFile {
  path: string
  content: Buffer
  size: number
}

/**
 * Utility class to handle the calculation of a IFile CID
 */
class CIDUtils {
  /**
   * Retrieves a ContentIdentifier (which contains the CID) for each File
   * The path is ignored, it only uses the file name.
   * @param files Files to calculate the CID
   */
  static async getIdentifiersForIndividualFile(
    files: IFile[]
  ): Promise<ContentIdentifier[]> {
    const result: ContentIdentifier[] = []
    for (const file of files) {
      const fileCID: string = await this.getListCID(
        [
          {
            path: path.basename(file.path),
            content: file.content,
            size: file.size
          }
        ],
        false
      )
      result.push({ cid: fileCID, name: file.path })
    }
    return result
  }

  /**
   * Calculates the RootCID for all the files
   * @param files Content to use to calculate the root CID
   */
  static getFilesComposedCID(files: IFile[]): Promise<string> {
    return this.getListCID(files, true)
  }

  private static async getListCID(
    files: IFile[],
    shareRoot: boolean
  ): Promise<string> {
    const importer = new Importer(new MemoryDatastore(), { onlyHash: true })
    return new Promise<string>((resolve, reject) => {
      pull(
        pull.values(files),
        pull.asyncMap((file: IFile, cb) => {
          const data = {
            path: shareRoot ? '/tmp/' + file.path : file.path,
            content: file.content
          }
          cb(null, data)
        }),
        importer,
        pull.onEnd(() =>
          importer.flush((err, content) => {
            if (err) {
              reject(err)
            }
            resolve(new CID(content).toBaseEncodedString())
          })
        )
      )
    })
  }
}

// Files

function readFile(filePath: string): IFile {
  const stat = fs.statSync(filePath)
  const content = fs.readFileSync(filePath)
  return {
    path: filePath,
    content: Buffer.from(content),
    size: stat.size
  }
}

const takeFirst = (arr: Array<any>) => (arr && arr.length > 0 ? arr[0] : null)
const takeLast = (arr: Array<any>) =>
  arr && arr.length > 0 ? arr[arr.length - 1] : null

const isDirectory = (source: string) => fs.lstatSync(source).isDirectory()

const getDirectories = (source: string) =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory)

const getFiles = (source: string) =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(obj => !isDirectory(obj))

const getBaseDir = (source: string) => takeLast(path.dirname(source).split('/'))

const getRelativeDir = (source: string) =>
  path.join(getBaseDir(source), path.basename(source))

const getFileCID = (source: string) =>
  CIDUtils.getIdentifiersForIndividualFile([readFile(source)])
    .then(takeFirst)
    .then(cidObj => cidObj.cid)

// S3

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET
})

const s3CheckFile = (bucketName: string, key: string): Promise<boolean> => {
  const params = {
    Bucket: bucketName,
    Key: key
  }
  return new Promise((resolve, reject) => {
    s3.headObject(params, function (err, data) {
      (err) ? resolve(false) : resolve(true)
    })
  })
}

const s3UploadFile = (bucketName: string, key: string, data: Buffer) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ACL: 'public-read'
  }
  return new Promise((resolve, reject) => {
    s3.upload(params, function(err, data) {
      (err) ? reject(err) : resolve(data)
    })
  })
}

// Transformations

const separateTexturesFromGLB = (srcFilePath: string, dstDir: string = '.') => {
  const options = {
    separateTextures: true
  }
  const file = readFile(srcFilePath)

  return gltfPipeline.processGlb(file.content, options).then((results) => {
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

// Asset

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

const checkValidAsset = (asset: AssetDescriptor) => {
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

const readAsset = (assetDir: string): AssetDescriptor => {
  log.info(`(asset) Reading : ${assetDir}...`)

  const filepath = path.join(assetDir, ASSET_FILE_NAME)
  const assetFile = readFile(filepath)
  const assetJSON = JSON.parse(assetFile.content.toString())
  const asset = AssetDescriptor.newFromJSON(assetJSON)
  asset.path = assetDir

  checkValidAsset(asset)

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

const processAsset = async (
  asset: AssetDescriptor
): Promise<AssetDescriptor> => {
  // thumb
  const thumbnailPath = path.join(asset.path, THUMB_FILE_NAME)
  const cid = await getFileCID(thumbnailPath)
  asset.thumbnail = url.resolve(CONTENT_SERVER_URL, 'contents/' + cid)

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

// Asset Pack

const bundleAssetPack = async (
  assetPackDir: string,
  title: string
): Promise<AssetPackDescriptor> => {
  const assetDirList = getDirectories(assetPackDir)

  log.info(`(asset-pack) Processing ${assetDirList.length} assets`)
  const assetPackItems = []
  for (const assetDir of assetDirList) {
    try {
      const asset = await processAsset(readAsset(assetDir))
      assetPackItems.push(asset)
    } catch (err) {
      log.error(`[asset-pack] Processing : ${assetDir} ${err}`)
    }
  }
  log.info(`(asset-pack) Found ${assetPackItems.length} valid assets`)

  return new AssetPackDescriptor(title, assetPackItems)
}

const uploadAssetPack = async (assetPack: AssetPackDescriptor, assetPackDir: string, bucketName: string) => {
  for (const [idx, asset] of assetPack.assets.entries()) {
    const uploads = Object.entries(asset.contents).map(async ([contentFilePath, contentCID]) => {
      const contentFullPath = path.join(assetPackDir, contentFilePath)
      const contentData = fs.readFileSync(contentFullPath)
      const isFileUploaded = await s3CheckFile(bucketName, contentCID)
      if (!isFileUploaded) {
        return s3UploadFile(bucketName, contentCID, contentData)
      }
      return Promise.resolve(true)
    })
    await Promise.all(uploads)
    log.info(`[uploader] (${asset.path}) uploaded ${idx + 1}/${assetPack.assets.length}`)
  }
}

const saveAssetPack = (assetPack: AssetPackDescriptor, dstPath: string) => {
  // HACK: this result format is to return like a server request
  const result = {
    ok: true,
    data: assetPack
  }
  const data = JSON.stringify(result, null, 2)
  fs.writeFileSync(dstPath, data)
}

async function main() {
  // TODO: process input args

  const assetPackTitle = 'MiniTown'
  const assetPackDir = './packs/MiniTown/'
  const assetPackOut = 'dist/packs/default-pack.json'
  const bucketName = 'content-service.decentraland.today'

  try {
    const assetPack = await bundleAssetPack(assetPackDir, assetPackTitle)
    saveAssetPack(assetPack, assetPackOut)
    uploadAssetPack(assetPack, assetPackDir, bucketName)
  } catch (err) {
    log.error(err)
  }
}

main()
