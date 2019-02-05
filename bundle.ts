import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import * as uuidv4 from 'uuid/v4'
import * as url from 'url'

import * as CID from 'cids'
import { MemoryDatastore } from 'interface-datastore'
import * as imp from 'ipfs-unixfs-engine'

import Importer = imp.Importer

// TODO: config file
const CONTENT_SERVER_URL = 'https://content.decentraland.today'

const ASSET_ACCEPTED_FORMATS = ['.glb']
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

// Asset

const isAcceptedAssetFormat = (source: string): boolean => {
  const extension = path.extname(source)
  for (const format of ASSET_ACCEPTED_FORMATS) {
    if (extension.indexOf(format) !== -1) {
      return true
    }
  }
  return false
}

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

const readAsset = (dirpath: string): AssetDescriptor => {
  console.log(`[asset] Reading : ${dirpath}...`)

  const filepath = path.join(dirpath, ASSET_FILE_NAME)
  const assetFile = readFile(filepath)
  const assetJSON = JSON.parse(assetFile.content.toString())
  const asset = AssetDescriptor.newFromJSON(assetJSON)
  asset.path = dirpath

  checkValidAsset(asset)

  return asset
}

const processAsset = async (
  asset: AssetDescriptor
): Promise<AssetDescriptor> => {
  // thumb
  const thumb = readFile(path.join(asset.path, THUMB_FILE_NAME))
  const cidObj = await CIDUtils.getIdentifiersForIndividualFile([thumb]).then(
    takeFirst
  )
  asset.thumbnail = url.resolve(CONTENT_SERVER_URL, 'contents/' + cidObj.cid)

  // contents
  const contentFiles = getFiles(asset.path + '/')
    .filter(isAcceptedAssetFormat)
    .map(readFile)
  for (const contentFile of contentFiles) {
    const cidObj = await CIDUtils.getIdentifiersForIndividualFile([
      contentFile
    ]).then(takeFirst)
    asset.contents[getRelativeDir(contentFile.path)] = cidObj.cid
  }

  // TODO: check this out
  const anyContent = Object.keys(asset.contents)[0]
  asset.url = anyContent

  return asset
}

// Asset Pack

const bundleAssetPack = async (
  dirpath: string,
  title: string
): Promise<AssetPackDescriptor> => {
  const assetDirList = getDirectories(dirpath)

  console.log(`[asset-pack] Processing ${assetDirList.length} assets`)
  const assetPackItems = []
  for (const assetDir of assetDirList) {
    try {
      const asset = await processAsset(readAsset(assetDir))
      assetPackItems.push(asset)
    } catch (err) {
      console.log(`[asset-pack] Processing : ${assetDir} ${err}`)
    }
  }
  console.log(`[asset-pack] Found ${assetPackItems.length} valid assets`)

  return new AssetPackDescriptor(title, assetPackItems)
}

async function main() {
  // TODO: process input args
  // TODO: summary of errors found
  // TODO: use logging facility
  const packTitle = 'MiniTown'
  const packDir = './packs/MiniTown/'
  try {
    const assetPack = await bundleAssetPack(packDir, packTitle)
    console.log(JSON.stringify(assetPack, null, 2))
  } catch (err) {
    console.log(err)
  }
}

main()
