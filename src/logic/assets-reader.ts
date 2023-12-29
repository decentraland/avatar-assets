import { join, resolve } from 'path'
import { readdirSync } from 'fs'

import { getDirectoryNamesFrom, readFilesFrom } from './../adapters/file-system'
import { Asset, AssetJSON } from '../types'

/**
 * Read all assets directories from /assets
 * return a map containing all assets directories by collection name.
 *
 * Example:
 * { key: 'xmash_up_2020',
 *  files: [
 *      '/local-path/avatar-assets-v2/assets/xmash_up_2020/eyewear/xmash_up_googles_eyewear',
 *      '/local-path/avatar-assets-v2/assets/xmash_up_2020/feet/xmash_up_boots_feet' ]}
 * @export
 * @return {*} {[key: string]: string[]}
 */
export function getAllAssetsDirectories(): {
  [key: string]: string[]
} {
  const collectionDirectoriesPath = resolve(join(__dirname, '../..', 'assets'))
  const collectionDirectoryNamies = getDirectoryNamesFrom(collectionDirectoriesPath)

  const collectionFilesMap: { [key: string]: string[] } = {}
  for (const collectionName of collectionDirectoryNamies) {
    const absoluteCollectionDirectoryPath = resolve(join(collectionDirectoriesPath, collectionName))
    const collectionCategoriesDirectories = readdirSync(absoluteCollectionDirectoryPath)
    collectionFilesMap[collectionName] = []

    collectionCategoriesDirectories.forEach((collectionCateogryDirectory) => {
      readdirSync(join(absoluteCollectionDirectoryPath, collectionCateogryDirectory)).forEach(
        (collectionCategoryFile) => {
          if (!collectionCategoryFile.endsWith('.DS_Store')) {
            collectionFilesMap[collectionName].push(
              join(absoluteCollectionDirectoryPath, collectionCateogryDirectory, collectionCategoryFile)
            )
          }
        }
      )
    })
  }

  return collectionFilesMap
}

export function loadAssets(assetsDirectories: string[]): Asset[] {
  const assets: Asset[] = []

  for (const directoryPath of assetsDirectories) {
    const collection = directoryPath.split('/').slice(-3, -2)[0]
    const category = directoryPath.split('/').slice(-2, -1)[0]
    const associatedGLBS = readFilesFrom(directoryPath, ['.glb'])
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const json = require(join(directoryPath, 'asset.json'))
    assets.push({
      json: json as AssetJSON,
      collection,
      category,
      name: json.name,
      glbFilesPaths: associatedGLBS,
      directoryPath
    })
  }

  return assets
}

/**
 * Given a list of assets ids return the assets to deploy
 *
 * @export
 * @param {string[]} assetsIdsToDeploy
 * @return {*}  {Promise<Asset[]>}
 */
export async function getAssetsToDeploy(assetsIdsToDeploy: string[]): Promise<Asset[]> {
  const assetsToDeploy = assetsIdsToDeploy.map((assetIdToDeploy) => {
    const match = assetIdToDeploy.match(/dcl:\/\/([^\/]+)\/([^\/]+)$/)

    return {
      collection: match![1],
      wearable: match![2]
    }
  })

  const allAssetsDirectories = getAllAssetsDirectories()

  const collectionsToDeploy = Object.keys(allAssetsDirectories).filter((collectionName: string) =>
    assetsToDeploy.find((assetToDeploy) => assetToDeploy.collection === collectionName)
  )

  const collectionsFiles = collectionsToDeploy
    .map((collectionToDeploy) => allAssetsDirectories[collectionToDeploy])
    .flat()

  const collectionAssets = loadAssets(collectionsFiles)

  return collectionAssets.filter((asset) =>
    assetsToDeploy.find((assetToDeploy) => asset.name === assetToDeploy.wearable)
  )
}
