import * as fs from 'fs'
import * as path from 'path'
import { processAssetAndBuildAssetDescription } from './catalog/processAssetAndBuildAssetDescription'
import { getAssetFolderAbsPath } from './assets/getAssetFolderAbsPath'

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

  const response = await Promise.all(
    assetFolders.map(assetFolderAbsPath =>
      processAssetAndBuildAssetDescription(
        assetFolderAbsPath,
        path.resolve(path.join(__dirname, '..', 'dist')),
        'https://dcl-basic-wearables.now.sh'
      )
    )
  )

  const jsonResult = JSON.stringify(response, null, 2)
  fs.writeFileSync(path.resolve(path.join(__dirname, '..', 'dist', 'expected.json')), jsonResult)

  console.log(`Generating a fake index.html with the JSON contents of the whole catalog...`)

  fs.writeFileSync(path.resolve(path.join(__dirname, '..', 'dist', 'index.html')), jsonResult)
}

function addFolderEntriesToArray(array, rootFolder) {
  fs.readdirSync(rootFolder).forEach(entry => array.push(path.join(rootFolder, entry)))
}
