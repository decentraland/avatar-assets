import { getAssetsToDeploy } from '../../src/logic/assets-reader'
import { buildMetadata, getRepresentations } from '../../src/logic/metadata-builder'
import { Asset } from '../../src/types'
import { validate } from '../../src/logic/asset-validator'
import { extractAssetTextures } from '../../src/logic/glb-optimizer'

describe('asset validator should', () => {
  it('do not return errors when metadata of base wearable is complete', async () => {
    const assets: Asset[] = await getAssetsToDeploy(['dcl://base-avatars/BaseFemale'])
    const generatedMetadata = await buildMetadata(assets[0])
    const extractedTextures = await extractAssetTextures(assets[0])
    generatedMetadata.data.representations = getRepresentations(assets[0], extractedTextures)

    const errors = validate(generatedMetadata)

    expect(errors.length).toEqual(0)
  })

  it('do not return errors when metadata of an L1 wearable is complete', async () => {
    const assets: Asset[] = await getAssetsToDeploy(['dcl://3lau_basics/3lau_blue_hat'])
    const generatedMetadata = await buildMetadata(assets[0])
    const extractedTextures = await extractAssetTextures(assets[0])
    generatedMetadata.data.representations = getRepresentations(assets[0], extractedTextures)

    const errors = validate(generatedMetadata)

    expect(errors.length).toEqual(0)
  })

  it('return errors when the metadata is not complete', async () => {
    const assets: Asset[] = await getAssetsToDeploy(['dcl://3lau_basics/3lau_blue_hat'])
    const generatedMetadata = await buildMetadata(assets[0])

    const errors = validate(generatedMetadata)

    expect(errors).toEqual([
      {
        instancePath: '/data/representations',
        schemaPath: '#/properties/data/properties/representations/minItems',
        keyword: 'minItems',
        params: expect.anything(),
        message: 'must NOT have fewer than 1 items'
      },
      {
        instancePath: '',
        schemaPath: '#/errorMessage',
        keyword: 'errorMessage',
        params: expect.anything(),
        message: ''
      }
    ])
  })
})
