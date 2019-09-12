import * as fs from 'fs'
import * as path from 'path'
import * as tmp from 'tmp'
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

  const categoryFolders = fs.readdirSync(categoryFolderAbsPath)
  const assetFolders: any[] = []

  categoryFolders.forEach(category => {
    addFolderEntriesToArray(assetFolders, path.join(categoryFolderAbsPath, category))
  })

  console.log(`Found ${categoryFolders.length} categories with ${assetFolders.length} assets in total...`)

  console.log(`Output folder is set to ${'dist'}. Copying files...`)
  try {
    fs.mkdirSync(path.join(__dirname, '..', 'dist'))
  } catch (e) {
    // skip
  }

  const workingFolder = tmp.dirSync()
  const buildAssetsConfig = {
    assetFoldersAbsPath: assetFolders,
    workingDirAbsPath: workingFolder.name,
    contentBaseUrl: 'https://dcl-base-avatars.now.sh'
  }

  const response = process.env['DEBUG_ASSET_PROCESSING']
    ? await serializeCallBuild(buildAssetsConfig)
    : await parallelCallAndBuild(buildAssetsConfig)

  const jsonResult = JSON.stringify(response, null, 2)
  const distAbsPath = path.resolve(path.join(__dirname, '..', 'dist'))

  fs.writeFileSync(path.join(distAbsPath, 'expected.json'), jsonResult)

  console.log(`Generating a fake index.html with the JSON contents of the whole catalog...`)

  fs.writeFileSync(path.join(distAbsPath, 'index.html'), jsonResult)

  console.log('Generating content addressable files...')
  await Promise.all(
    assetFolders.map(assetFolderAbsPath => scanFilesAndCopyWithHashName(assetFolderAbsPath, distAbsPath))
  )

  console.log('Cleaning up temporary files...')
  workingFolder.removeCallback()
}

const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

async function scanFilesAndCopyWithHashName(assetFolder, targetFolder) {
  const allFiles = await readDir(assetFolder)
  return Promise.all(
    allFiles.map(async (file) => {
      const sourceFile = path.join(assetFolder, file)
      const content = await readFile(sourceFile)
      const cid = await getFileCID(content)
      return writeFile(path.join(targetFolder, cid), content)
    })
  )
}

function addFolderEntriesToArray(array, rootFolder) {
  return fs.readdirSync(rootFolder).map(entry => array.push(path.join(rootFolder, entry)))
}

type MultipleProcessAndBuildConfiguration = {
  assetFoldersAbsPath: string[]
  workingDirAbsPath: string
  contentBaseUrl: string
}

async function serializeCallBuild(config: MultipleProcessAndBuildConfiguration) {
  const result: any[] = []
  for (let folder of config.assetFoldersAbsPath) {
    const asset = path.basename(folder)
    const category = path.dirname(path.basename(folder))
    console.log(`Building ${category}:${asset}`)
    result.push(await callOrLogProcessAndBuild(folder, config.workingDirAbsPath, config.contentBaseUrl))
  }
  return result
}

async function parallelCallAndBuild(config: MultipleProcessAndBuildConfiguration) {
  return await Promise.all(
    config.assetFoldersAbsPath.map(assetFolder => callOrLogProcessAndBuild(
      assetFolder,
      config.workingDirAbsPath,
      config.contentBaseUrl
    ))
  )
}

async function callOrLogProcessAndBuild(
  assetFolderAbsPath: string,
  workingDirAbsPath: string,
  contentBaseUrl: string
) {
  return processAssetAndBuildAssetDescription(
    assetFolderAbsPath,
    workingDirAbsPath,
    contentBaseUrl
  ).catch(error => {
    console.log(
      `Error! Could not process asset ${
        path.basename(assetFolderAbsPath)
      } of category ${
        path.basename(path.dirname(assetFolderAbsPath))
      }: ${error.message}`
      + (process.env['VERBOSE_ASSET_ERRORS'] ? '\n' + error.stack : '')
    )
    return null
  })
}

