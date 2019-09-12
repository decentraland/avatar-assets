import { resolve, join } from 'path'
import { mkdirSync, statSync } from 'fs'
import { processAsset } from './processAsset'

const { expect } = require('chai')

describe('sample asset: empty earrings', () => {
  it('creates an output folder with the expected values', async () => {
    const assetFolder = resolve(__dirname, '..', '..', 'assets', 'earring', '00_EmptyEarring')
    const outputFolder = resolve(__dirname, '..', '..', 'tmp')
    try {
      mkdirSync(outputFolder)
    } catch (e) {}

    await processAsset(assetFolder, outputFolder)
    expect(statSync(join(outputFolder, 'AvatarWearables_TX.png')))

  })
})
