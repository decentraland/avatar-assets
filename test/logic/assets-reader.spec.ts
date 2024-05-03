import { join, resolve } from 'path'
import { getDirectoryNamesFrom } from '../../src/adapters/file-system'
import { getAllAssetsDirectories, getAssetsToDeploy } from '../../src/logic/assets-reader'

describe('assets-reader should', () => {
  it('read all collections from assets directory', () => {
    const expectedCollections = getDirectoryNamesFrom(resolve(join(__dirname, '../..', 'assets')))

    const assetsDirectories = getAllAssetsDirectories()

    // expects a key for every collection
    expect(Object.keys(assetsDirectories).length).toBe(expectedCollections.length)

    // expects that every asset directory read belongs to a valid collection
    Object.keys(assetsDirectories).forEach((key) => {
      assetsDirectories[key].forEach((assetDirectory) => {
        expect(
          expectedCollections.some((expectedCollection) => assetDirectory.includes(expectedCollection))
        ).toBeTruthy()
      })
    })
  })

  it('return the assets directories to deploy correctly filtered', async () => {
    const assets = await getAssetsToDeploy([
      'dcl://base-avatars/BaseFemale',
      'dcl://wonderzone_steampunk/steampunk_jacket'
    ])

    expect(assets.length).toBe(2)
    expect(assets[0].directoryPath.endsWith('assets/base-avatars/body_shape/BaseFemale')).toBeTruthy()
    expect(assets[1].directoryPath.endsWith('assets/wonderzone_steampunk/upper_body/steampunk_jacket')).toBeTruthy()
  })

  it('not crash when handling an invalid id', async () => {
    const assets = await getAssetsToDeploy(['dcl://base-avatars/invalid_id'])

    expect(assets.length).toBe(0)
  })

  it('return only the matching id when handling also an invalid id', async () => {
    const assets = await getAssetsToDeploy(['dcl://base-avatars/invalid_id', 'dcl://base-avatars/BaseFemale'])

    expect(assets.length).toBe(1)
    expect(assets[0].directoryPath.endsWith('assets/base-avatars/body_shape/BaseFemale')).toBeTruthy()
  })

  it('read JSON files correctly', async () => {
    const assets = await getAssetsToDeploy([
      'dcl://base-avatars/BaseFemale',
      'dcl://wonderzone_steampunk/steampunk_jacket'
    ])

    expect(assets[0].collection).toBe('base-avatars')
    expect(assets[0].category).toBe('body_shape')
    expect(assets[0].name).toBe('BaseFemale')
    expect(assets[0].directoryPath.endsWith('assets/base-avatars/body_shape/BaseFemale')).toBeTruthy()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(assets[0].json).toEqual(require('../../assets/base-avatars/body_shape/BaseFemale/asset.json'))

    expect(assets[1].collection).toBe('wonderzone_steampunk')
    expect(assets[1].category).toBe('upper_body')
    expect(assets[1].name).toBe('steampunk_jacket')
    expect(assets[1].directoryPath.endsWith('assets/wonderzone_steampunk/upper_body/steampunk_jacket')).toBeTruthy()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(assets[1].json).toEqual(require('../../assets/wonderzone_steampunk/upper_body/steampunk_jacket/asset.json'))
  })
})
