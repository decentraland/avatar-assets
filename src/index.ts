import {
  readdir as readdirOrig,
  writeFile as writeFileOrig,
  readFile as readFileOrig,
  readdirSync,
  writeFileSync,
  mkdirSync
} from 'fs'
import { join, resolve, dirname, basename } from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'
import { processAssetAndBuildAssetDescription } from './catalog/processAssetAndBuildAssetDescription'
import { getAssetFolderAbsPath } from './assets/getAssetFolderAbsPath'
import { getFileCID } from './cid/getFileCID'

if (!module.parent) {
  runMain(['base-avatars','base-exclusive','halloween_2019','xmas_2019','dcg_collection','mch_collection','dcl_launch','community_contest','stay_safe','dg_summer_2020','wonderzone_meteorchaser','dappcraft_moonminer','pm_outtathisworld','dgtble_headspace','moonshot_2020','ethermon_trainer','binance_us_collection', 'cz_mercernary','sugarclub_yumi','manafever_sammichgamer'])
  .catch(error => console.log(error, error.stack))
}

export async function runMain(collectionFolders: string[]) {
  console.log(`Building catalog from folders '${collectionFolders.join(', ')}'...`)

  const workingFolder = dirSync()
  let allResponses: any[] = []
  const mapCategoryFolders: { [key: string]: string[] } = {}

  for (let collectionFolder of collectionFolders) {
    const categoryFolderAbsPath = getAssetFolderAbsPath(collectionFolder)

    const categoryFolders = readdirSync(categoryFolderAbsPath)
    const assetFolders: string[] = []
    mapCategoryFolders[collectionFolder] = assetFolders

    categoryFolders.forEach(category => {
      addFolderEntriesToArray(assetFolders, join(categoryFolderAbsPath, category))
    })

    console.log(`Found ${categoryFolders.length} categories with ${assetFolders.length} assets in total...`)

    console.log(`Output folder is set to ${'dist'}. Copying files...`)
    try {
      mkdirSync(join(__dirname, '..', 'dist'))
    } catch (e) {
      // skip
    }

    const buildAssetsConfig = {
      assetFoldersAbsPath: assetFolders,
      workingDirAbsPath: workingFolder.name,
      contentBaseUrl: `https://content.decentraland.org/contents/`,
      collectionName: collectionFolder
    }

    const response = process.env['DEBUG_ASSET_PROCESSING']
      ? await serializeCallBuild(buildAssetsConfig)
      : await parallelCallAndBuild(buildAssetsConfig)
    allResponses = [ ...allResponses, ...response ]
  }

  const jsonResult = JSON.stringify(allResponses, null, 2)
  const distAbsPath = resolve(join(__dirname, '..', 'dist'))

  writeFileSync(join(distAbsPath, 'expected.json'), jsonResult)
  writeFileSync(join(distAbsPath, 'index.json'), jsonResult)

  console.log(`Generating a fake index.html with the JSON contents of the whole catalog...`)

  writeFileSync(join(distAbsPath, 'index.html'), jsonResult)

  for (let collectionFolder of collectionFolders) {
    try {
      const categoryFolderAbsPath = getAssetFolderAbsPath(collectionFolder)
      console.log('Generating content addressable files...')
      const assetFolders = mapCategoryFolders[collectionFolder]
      await Promise.all(
        assetFolders.map(assetFolderAbsPath => scanFilesAndCopyWithHashName(assetFolderAbsPath.replace(categoryFolderAbsPath, workingFolder.name), distAbsPath))
      )
    } catch (e) {
      console.error(`Error in ${collectionFolder}: ${e.stack}`)
    }
  }
  console.log(JSON.stringify(
    allResponses
      .map((_, index) => {
        if (_ === null) {
          console.log(`Warning! Element ${index} of "allResponses" is null`)
        }
        return _
      })
      .filter(_ => !!_)
      .map(_ => {
        try {
          return _.id
        } catch (e) {
          console.error(`Can't get element "id" of object ${JSON.stringify(_)}`)
          throw e
        }
      })
      .map(_ => _.split('/')[3])
      .map(_ => ({ wearableId: _, maxIssuance: 0})),
    null,
    2
  ))

  console.log('Cleaning up temporary files...')
  workingFolder.removeCallback()
}

const readDir = promisify(readdirOrig)
const readFile = promisify(readFileOrig)
const writeFile = promisify(writeFileOrig)

async function scanFilesAndCopyWithHashName(assetFolder: string, targetFolder: string) {
  const allFiles = await readDir(assetFolder)
  return Promise.all(
    allFiles.map(async file => {
      const sourceFile = join(assetFolder, file)
      const content = await readFile(sourceFile)
      const cid = await getFileCID(content)
      return writeFile(join(targetFolder, cid), content)
    })
  )
}

function addFolderEntriesToArray(array: string[], rootFolder: string) {
  return readdirSync(rootFolder).map(entry => array.push(join(rootFolder, entry)))
}

type MultipleProcessAndBuildConfiguration = {
  assetFoldersAbsPath: string[]
  workingDirAbsPath: string
  contentBaseUrl: string
  collectionName: string
}

async function serializeCallBuild(config: MultipleProcessAndBuildConfiguration) {
  const result: any[] = []
  for (let folder of config.assetFoldersAbsPath) {
    const asset = basename(folder)
    const category = dirname(basename(folder))
    console.log(`Building ${category}:${asset}`)
    result.push(await callOrLogProcessAndBuild(folder, config.workingDirAbsPath, config.contentBaseUrl, config.collectionName))
  }
  return result
}

async function parallelCallAndBuild(config: MultipleProcessAndBuildConfiguration) {
  return await Promise.all(
    config.assetFoldersAbsPath.map(assetFolder =>
      callOrLogProcessAndBuild(assetFolder, config.workingDirAbsPath, config.contentBaseUrl, config.collectionName)
    )
  )
}

async function callOrLogProcessAndBuild(assetFolderAbsPath: string, workingDirAbsPath: string, contentBaseUrl: string, collectionName: string) {
  return processAssetAndBuildAssetDescription(assetFolderAbsPath, workingDirAbsPath, contentBaseUrl, collectionName).catch(error => {
    console.log(
      `Error! Could not process asset ${basename(assetFolderAbsPath)} of category ${basename(
        dirname(assetFolderAbsPath)
      )}: ${error.message}` + (process.env['VERBOSE_ASSET_ERRORS'] ? '\n' + error.stack : '')
    )
    return null
  })
}
