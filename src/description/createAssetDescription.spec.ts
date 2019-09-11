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

    const contentBaseUrl = 'https://dcl-basic-wearables.now.sh'
    const assetDescription = await createAssetDescriptionFromFolder(assetFolder, { contentBaseUrl })

    const expectedJSON = {
      id: 'dcl://base-avatars/f_bluestar_earring',
      thumbnail: 'QmeGtEgb9XkachCtGJ1PP2XhxFdh946Lfdfcz3XttYWy5n',
      contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
      name: 'blue_star_earring',
      tags: ['accesories', 'female', 'woman'],
      category: 'earring',
      contents: [
        {
          hash: 'QmWV7zeSREDpfKr61vbR9gh1KkNmAZvX74ENa1ppnNbxwh',
          name: 'F_Earrings_BlueStar.glb'
        },
        {
          hash: 'QmWLrKJFzDCMGXVCef78SDkMHWB94eHP1ZeXfyci3kphTb',
          name: 'QmWLrKJFzDCMGXVCef78SDkMHWB94eHP1ZeXfyci3kphTb'
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

    expect(expectedJSON).to.deep.eq(assetDescription)
    outputFolder.removeCallback()
  })
})
