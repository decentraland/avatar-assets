import * as path from 'path'
import * as fs from 'fs'
import * as tmp from 'tmp'
import { processAsset } from './processAsset'

const { expect } = require('chai')

describe('sample asset: earrings', () => {
  it('creates an output folder with the expected values', async () => {
    const assetFolder = path.resolve(__dirname, '..', '..', 'assets', 'earring', 'F_BlueStar')
    const outputFolder = tmp.dirSync()

    await processAsset(assetFolder, outputFolder.name)
    expect(fs.statSync(path.join(outputFolder.name, 
        'AvatarWearables_TX.png')))

    outputFolder.removeCallback()
  })
})
