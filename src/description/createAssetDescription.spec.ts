import { readdirSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
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

    const contentBaseUrl = 'https://dcl-base-avatars.now.sh'
    const assetDescription = await createAssetDescriptionFromFolder(assetFolder, { contentBaseUrl })

    const expectedJSON = {
      id: 'dcl://base-avatars/blue_star_earring',
      thumbnail: 'QmeGtEgb9XkachCtGJ1PP2XhxFdh946Lfdfcz3XttYWy5n',
      contentBaseUrl: 'https://dcl-base-avatars.now.sh',
      name: 'blue_star_earring',
      tags: ['accesories', 'female', 'woman'],
      category: 'earring',
      contents: [
        {
          hash: 'QmWLrKJFzDCMGXVCef78SDkMHWB94eHP1ZeXfyci3kphTb',
          name: 'AvatarWearables_TX.png'
        },
        {
          hash: 'QmRH8R6EcnmpkwZkuDp92nspsVZy4SHmAhnktYMr9yiW1s',
          name: 'F_Earrings_BlueStar.glb'
        }
      ],
      i18n: [{ code: 'en', text: 'Blue Star Earring' }, { code: 'es', text: 'Aro Azul con Forma de Estrella' }],
      main: [
        {
          bodyType: 'BaseFemale',
          entryPoint: 'F_Earrings_BlueStar.glb'
        }
      ]
    }

    expect(expectedJSON).to.deep.equal(assetDescription)
    outputFolder.removeCallback()
  })
})
