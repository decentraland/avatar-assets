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
    expect(response).to.deep.eq([
      {
        id: 'dcl://base-avatars/basefemale_body_shape',
        name: 'female_body',
        contents: [{}, {}, {}, {}, {}],
        main: [{}],
        category: 'body_shape',
        tags: ['body', 'male', 'man'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmQo9oNMzYTDdcGTixkioFdb4ArrB42ZgrHVGNua36gXpn'
      },
      {
        id: 'dcl://base-avatars/basemale_body_shape',
        name: 'male_body',
        contents: [{}, {}, {}, {}, {}],
        main: [{}],
        category: 'body_shape',
        tags: ['body', 'male', 'man'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmbEoKs839SoKDSHF9tkgc3S6ge777ywU9X85W8K42WePu'
      },
      {
        id: 'dcl://base-avatars/00_emptyearring_earring',
        name: '00_EmptyEarring',
        contents: [{}],
        main: [{}, {}],
        category: 'earring',
        tags: ['accesories', 'male', 'man', 'female', 'woman'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmUA7fineYQ5ES3sXu9GjBaiDcCTYS3oXPBUhgZe1EG4oH'
      },
      {
        id: 'dcl://base-avatars/f_bluestar_earring',
        name: 'blue_star_earring',
        contents: [{}, {}],
        main: [{}],
        category: 'earring',
        tags: ['accesories', 'female', 'woman'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmeGtEgb9XkachCtGJ1PP2XhxFdh946Lfdfcz3XttYWy5n'
      },
      {
        id: 'dcl://base-avatars/f_earring_greenfeather_earring',
        name: 'green_feather_earring',
        contents: [{}, {}],
        main: [{}],
        category: 'earring',
        tags: ['accesories', 'female', 'woman'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'Qmen8Ag1sybXsF7G6s9cbWgQPQJ6dGbjZxGftdXpxdXuWg'
      },
      {
        id: 'dcl://base-avatars/f_eyebrows_00_eyebrows',
        name: 'f_eyebrows_00',
        contents: [{}],
        main: [{}],
        category: 'eyebrows',
        tags: ['face', 'eyebrows', 'Female', 'woman'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmWf7zZJhJoDhN45uJZVXw2bExuarbXnskrepxWdTtDBwW'
      },
      {
        id: 'dcl://base-avatars/f_eyebrows_01_eyebrows',
        name: 'f_eyebrows_01',
        contents: [{}],
        main: [{}],
        category: 'eyebrows',
        tags: ['face', 'eyebrows', 'Female', 'woman'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmV2fzgVkpWuMo8W4UWRbBume6u3BoNMdZJRUXYfWfj2pt'
      },
      {
        id: 'dcl://base-avatars/f_eyebrows_02_eyebrows',
        name: 'f_eyebrows_02',
        contents: [{}],
        main: [{}],
        category: 'eyebrows',
        tags: ['face', 'eyebrows', 'Female', 'woman'],
        contentBaseUrl: 'https://dcl-basic-wearables.now.sh',
        i18n: [{}, {}],
        thumbnail: 'QmQZ8Xb6TTPyo9m9JVDd7NE1P31kWrX5kM2PvR3HiqL2Fd'
      }
    ])
  })
})
