import * as fs from 'fs'
import * as path from 'path'
import { processAssetAndBuildAssetDescription } from './processAssetAndBuildAssetDescription'
import * as tmp from 'tmp'
import { AssetDescription } from '../description/createAssetDescription'

const getAssetFolderAbsPath = (postFix: string, currentHeight: number) =>
  currentHeight === 0
    ? path.resolve(path.join(postFix, 'assets'))
    : getAssetFolderAbsPath(path.join(postFix, '..'), currentHeight - 1)

describe('Build the catalog', () => {
  it('creates a description for all the files', async () => {
    const contentBaseUrl = 'https://dcl-basic-wearables.now.sh'

    const workingFolder = tmp.dirSync()

    const response: AssetDescription[] = []

    const categoryFolderAbsPath = getAssetFolderAbsPath(__dirname, 2)

    const categoryFolders = fs.readdirSync(categoryFolderAbsPath)

    for (let category of categoryFolders.slice(0, 3)) {

      const assetFolders = fs.readdirSync(path.resolve(path.join(categoryFolderAbsPath, category)))

      for (let asset of assetFolders.slice(0, 3)) {

        response.push(

          await processAssetAndBuildAssetDescription(
            path.join(categoryFolderAbsPath, category, asset),
            workingFolder.name,
            contentBaseUrl
          )
        )
      }
    }
    console.log(response)
  })
})
