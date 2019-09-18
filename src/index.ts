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
  runMain().catch(error => console.log(error, error.stack))
}

export async function runMain() {
  console.log(`Building catalog from folder ${'assets'}...`)

  const categoryFolderAbsPath = getAssetFolderAbsPath()

  const categoryFolders = readdirSync(categoryFolderAbsPath)
  const assetFolders: any[] = []

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

  const workingFolder = dirSync()
  const buildAssetsConfig = {
    assetFoldersAbsPath: assetFolders,
    workingDirAbsPath: workingFolder.name,
    contentBaseUrl: 'https://dcl-base-avatars.now.sh/'
  }

  const response = process.env['DEBUG_ASSET_PROCESSING']
    ? await serializeCallBuild(buildAssetsConfig)
    : await parallelCallAndBuild(buildAssetsConfig)

  const jsonResult = JSON.stringify(response, null, 2)
  const distAbsPath = resolve(join(__dirname, '..', 'dist'))

  writeFileSync(join(distAbsPath, 'expected.json'), jsonResult)
  writeFileSync(join(distAbsPath, 'index.json'), jsonResult)

  console.log(`Generating a fake index.html with the JSON contents of the whole catalog...`)

  writeFileSync(join(distAbsPath, 'index.html'), jsonResult)

  console.log('Generating content addressable files...')
  await Promise.all(
    assetFolders.map(assetFolderAbsPath => scanFilesAndCopyWithHashName(assetFolderAbsPath.replace(categoryFolderAbsPath, workingFolder.name), distAbsPath))
  )

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
}

async function serializeCallBuild(config: MultipleProcessAndBuildConfiguration) {
  const result: any[] = []
  for (let folder of config.assetFoldersAbsPath) {
    const asset = basename(folder)
    const category = dirname(basename(folder))
    console.log(`Building ${category}:${asset}`)
    result.push(await callOrLogProcessAndBuild(folder, config.workingDirAbsPath, config.contentBaseUrl))
  }
  return result
}

async function parallelCallAndBuild(config: MultipleProcessAndBuildConfiguration) {
  return await Promise.all(
    config.assetFoldersAbsPath.map(assetFolder =>
      callOrLogProcessAndBuild(assetFolder, config.workingDirAbsPath, config.contentBaseUrl)
    )
  )
}

async function callOrLogProcessAndBuild(assetFolderAbsPath: string, workingDirAbsPath: string, contentBaseUrl: string) {
  return processAssetAndBuildAssetDescription(assetFolderAbsPath, workingDirAbsPath, contentBaseUrl).catch(error => {
    console.log(
      `Error! Could not process asset ${basename(assetFolderAbsPath)} of category ${basename(
        dirname(assetFolderAbsPath)
      )}: ${error.message}` + (process.env['VERBOSE_ASSET_ERRORS'] ? '\n' + error.stack : '')
    )
    return null
  })
}
