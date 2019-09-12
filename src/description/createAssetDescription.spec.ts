import * as fs from 'fs'
import * as path from 'path'
import * as tmp from 'tmp'
import { processAsset } from '../assets/processAsset'
import { createAssetDescriptionFromFolder } from './fromFolder'

const { expect } = require('chai')

describe('creates a JSON with the asset description', () => {
  it('works', async () => {
    const sourceFolder = path.resolve(__dirname, '..', '..', 'assets', 'earring', 'F_BlueStar')
    const outputFolder = tmp.dirSync()
    fs.mkdirSync(path.join(outputFolder.name, 'earring'))
    fs.mkdirSync(path.join(outputFolder.name, 'earring', 'F_BlueStar'))
    const assetFolder = path.join(outputFolder.name, 'earring', 'F_BlueStar')
    const files = fs.readdirSync(sourceFolder)
    for (var file of files) {
      fs.writeFileSync(path.join(assetFolder, file), fs.readFileSync(path.join(sourceFolder, file)))
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
