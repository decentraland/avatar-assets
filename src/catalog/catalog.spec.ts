import * as fs from 'fs'
import * as path from 'path'
import { processAssetAndBuildAssetDescription } from './processAssetAndBuildAssetDescription'
import * as tmp from 'tmp'
import { AssetDescription } from '../description/createAssetDescription'
import { getAssetFolderAbsPath } from '../assets/getAssetFolderAbsPath'

const { expect } = require('chai')

describe('Build the catalog', () => {
  it('creates a description for all the files', async () => {
    const contentBaseUrl = 'https://dcl-base-avatars.now.sh'

    const workingFolder = tmp.dirSync()

    const response: AssetDescription[] = []

    const categoryFolderAbsPath = getAssetFolderAbsPath(__dirname, 2)

    const categoryFolders = fs.readdirSync(categoryFolderAbsPath)

    for (let category of categoryFolders) {
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
    if (process.env['WRITE_TEST_CATALOG_RESULT']) {
      fs.writeFileSync(path.join(__dirname, 'expected.json'), JSON.stringify(response, null, 2))
    }
    expect(response).to.deep.equal(JSON.parse(fs.readFileSync(path.join(__dirname, 'expected.json')).toString()))
    workingFolder.removeCallback()
  })
})
