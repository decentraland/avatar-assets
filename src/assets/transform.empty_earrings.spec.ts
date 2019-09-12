import { resolve, join } from 'path'
import { statSync } from 'fs'
import { dirSync } from 'tmp'
import { processAsset } from './processAsset'

const { expect } = require('chai')

describe('sample asset: earrings', () => {
  it.only('creates an output folder with the expected values', async () => {
    const assetFolder = resolve(__dirname, '..', '..', 'assets', 'earring', '00_EmptyEarring')
    const outputFolder = dirSync()

    await processAsset(assetFolder, outputFolder.name)
    expect(statSync(join(outputFolder.name, 'AvatarWearables_TX.png')))

    outputFolder.removeCallback()
  })
})
