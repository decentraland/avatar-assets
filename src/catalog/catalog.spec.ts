import * as fs from 'fs'
import * as path from 'path'
import { processAssetAndBuildAssetDescription } from './processAssetAndBuildAssetDescription'
import * as tmp from 'tmp'

describe('Build the catalog', () => {
  it('creates a description for all the files', async () => {
    const contentBaseUrl = 'https://dcl-basic-wearables.now.sh'
    const workingFolder = tmp.dirSync()
    const response = []
    const categoryFolders = fs.readdirSync(path.resolve(path.join(__dirname, '..', '..', 'assets')))
    for (let category of categoryFolders.slice(0, 3)) {
      const assetFolders = fs.readdirSync(path.resolve(path.join(__dirname, '..', '..', 'assets', category)))
      for (let asset of assetFolders.slice(0, 3)) {
        response.push(
          await processAssetAndBuildAssetDescription(path.join(category, asset), workingFolder.name, contentBaseUrl)
        )
      }
    }
    console.log(response)
  })
})
