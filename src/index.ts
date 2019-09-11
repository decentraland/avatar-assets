import * as fs from 'fs'
import * as path from 'path'
import { processAssetAndBuildAssetDescription } from './processAssetAndBuildAssetDescription'
import * as tmp from 'tmp'
import { getAssetFolderAbsPath } from '../assets/getAssetFolderAbsPath'

if (module.__main__) {
  console.log(`Building catalog from folder ${'assets'}...`)
  const workingFolder = tmp.dirSync()

  const categoryFolderAbsPath = getAssetFolderAbsPath(__dirname, 1)

  const categoryFolders = fs.readdirSync(categoryFolderAbsPath)
  const assetFolders: any[] = []

  categoryFolders.forEach(category => {
    assetFolders.push(fs.readdirSync(path.resolve(path.join(categoryFolderAbsPath, category))))
  })

  console.log(`Found ${categoryFolders.length} categories with ${assetFolders.length} assets in total...`)

  console.log(`Output folder is set to ${'dist'}. Copying files...`)

  const response = await Promise.all(
    assetFolders.map(assetFolderAbsPath => {
      processAssetAndBuildAssetDescription(
        assetFolderAbsPath,
        path.resolve(path.join(__dirname, '..', 'dist')),
        'https://dcl-basic-wearables.now.sh'
      )
    })
  )

  const jsonResult = JSON.stringify(response, null, 2)
  fs.writeFileSync(path.resolve(path.join(__dirname, '..', 'dist', 'expected.json'), jsonResult))

  console.log(`Generating a fake index.html with the JSON contents of the whole catalog...`)

  fs.writeFileSync(path.resolve(path.join(__dirname, '..', 'dist', 'index.html'), jsonResult))
}
