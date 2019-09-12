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
  const response = await Promise.all(
    assetFolders.map(assetFolderAbsPath =>
      processAssetAndBuildAssetDescription(
        assetFolderAbsPath,
        workingFolder.name,
        'https://dcl-base-avatars.now.sh'
      ).catch(error => {
        console.log(
          `Error! Could not process asset ${path.basename(assetFolderAbsPath)} of category ${path.basename(
            path.dirname(assetFolderAbsPath)
          )}: ${error.message}${process.env['VERBOSE_ASSET_ERRORS'] ? '\n' + error.stack : ''}`
        )
        return null
      })
    )
  )

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
