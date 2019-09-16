import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { dirSync } from 'tmp'
import { processAsset } from '../assets/processAsset'
import { createAssetDescriptionFromFolder } from './fromFolder'

const { expect } = require('chai')

describe('creates a JSON with the asset description', () => {
  it('works', async () => {
    const sourceFolder = resolve(__dirname, '..', '..', 'assets', 'earring', 'F_BlueStar')
    const outputFolder = dirSync()
    mkdirSync(join(outputFolder.name, 'earring'))
    mkdirSync(join(outputFolder.name, 'earring', 'F_BlueStar'))
    const assetFolder = join(outputFolder.name, 'earring', 'F_BlueStar')
    const files = readdirSync(sourceFolder)
    for (var file of files) {
      writeFileSync(join(assetFolder, file), readFileSync(join(sourceFolder, file)))
    }
    await processAsset(sourceFolder, assetFolder)

    const contentBaseUrl = 'https://dcl-base-wearables.now.sh'
    const assetDescription = await createAssetDescriptionFromFolder(assetFolder, { contentBaseUrl })

    const expectedJSON = {
      id: 'dcl://base-wearables/F_BlueStar',
      type: 'wearable',
      thumbnail: 'QmeGtEgb9XkachCtGJ1PP2XhxFdh946Lfdfcz3XttYWy5n',
      baseUrl: 'https://dcl-base-wearables.now.sh',
      tags: ['accesories', 'female', 'woman'],
      category: 'earring',
      representations: [
        {
          bodyShapes: ['BaseFemale'],
          contents: [
            {
              hash: 'QmWLrKJFzDCMGXVCef78SDkMHWB94eHP1ZeXfyci3kphTb',
              file: 'AvatarWearables_TX.png'
            },
            {
              hash: 'QmRH8R6EcnmpkwZkuDp92nspsVZy4SHmAhnktYMr9yiW1s',
              file: 'F_Earrings_BlueStar.glb'
            }
          ],
          mainFile: 'F_Earrings_BlueStar.glb'
        }
      ],
      i18n: [{ code: 'en', text: 'Blue Star Earring' }, { code: 'es', text: 'Aro Azul con Forma de Estrella' }],
    }

    expect(expectedJSON).to.deep.equal(assetDescription)
    outputFolder.removeCallback()
  })
})
