/* eslint-disable @typescript-eslint/no-var-requires */
import { BodyShape, Locale, Rarity, Wearable, WearableCategory } from '@dcl/schemas'
import { buildMetadata, getRepresentations } from './../../src/logic/metadata-builder'
import { getAssetsToDeploy } from '../../src/logic/assets-reader'
import { Asset } from '../../src/types'
import { extractAssetTextures } from '../../src/logic/glb-optimizer'

describe('metadata builder should', () => {
  it('parse BaseFemale wearable from base-avatars collection correctly', async () => {
    const fullMetadata: Partial<Wearable> = {
      id: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
      name: 'BaseFemale',
      description: '',
      thumbnail: 'thumbnail.png',
      image: '',
      data: {
        replaces: [],
        hides: [],
        tags: ['body', 'male', 'man', 'base-wearable'],
        category: WearableCategory.BODY_SHAPE,
        representations: [
          {
            bodyShapes: [BodyShape.FEMALE],
            mainFile: 'BaseFemale.glb',
            overrideReplaces: [],
            overrideHides: [],
            contents: [
              'Avatar_FemaleSkinBase.png',
              'BaseFemale.glb',
              'F_Eyebrows_00.png',
              'F_Eyes_00.png',
              'F_Mouth_00.png'
            ]
          }
        ]
      },
      i18n: [
        {
          code: Locale.EN,
          text: 'Woman'
        },
        {
          code: Locale.ES,
          text: 'Mujer'
        }
      ]
    }

    const expectedMetadata = {
      ...fullMetadata,
      data: { ...fullMetadata.data, representations: [], removesDefaultHiding: [] }
    }

    const assets: Asset[] = await getAssetsToDeploy(['dcl://base-avatars/BaseFemale'])

    const generatedMetadata = await buildMetadata(assets[0])

    expect(generatedMetadata).toEqual(expectedMetadata)
  })

  it('correctly get representations for BaseFemale wearable', async () => {
    const expectedRepresentations = [
      {
        bodyShapes: [BodyShape.FEMALE],
        mainFile: 'BaseFemale.glb',
        overrideReplaces: [],
        overrideHides: [],
        contents: [
          'BaseFemale.glb',
          'Avatar_FemaleSkinBase.png',
          'F_Eyebrows_00.png',
          'F_Eyes_00.png',
          'F_Mouth_00.png'
        ]
      }
    ]

    const assets = await getAssetsToDeploy(['dcl://base-avatars/BaseFemale'])
    const extractedTextures = await extractAssetTextures(assets[0])

    const representations = getRepresentations(assets[0], extractedTextures)

    expect(representations).toEqual(expectedRepresentations)
  })

  it('parse an asset containing an image', async () => {
    const fullMetadata: Partial<Wearable> = {
      id: 'urn:decentraland:ethereum:collections-v1:3lau_basics:3lau_blue_hat',
      name: '3lau_blue_hat',
      rarity: Rarity.LEGENDARY,
      description: "3LAU's signature triangle on a black and blue cap.",
      image: '3lau_blue_hat.png',
      thumbnail: 'thumbnail.png',
      collectionAddress: '0xe1ecb4e5130f493551c7d6df96ad19e5b431a0a9',
      data: {
        replaces: [WearableCategory.HELMET],
        hides: [WearableCategory.HAIR],
        tags: ['3LAU', 'cap', 'triangle', 'hat', 'decentraland', 'exclusive'],
        category: WearableCategory.HAT,
        representations: [
          {
            bodyShapes: [BodyShape.MALE],
            mainFile: 'M_3LAU_Hat_Blue.glb',
            overrideReplaces: [],
            overrideHides: [],
            contents: [
              '3lau_wearable_blue_emissive.png',
              '3lau_wearable_blue_logo.png',
              'AvatarWearables_TX_2.png',
              'F_3LAU_Hat_Blue.glb',
              'M_3LAU_Hat_Blue.glb'
            ]
          },
          {
            bodyShapes: [BodyShape.FEMALE],
            mainFile: 'F_3LAU_Hat_Blue.glb',
            overrideReplaces: [],
            overrideHides: [],
            contents: [
              '3lau_wearable_blue_emissive.png',
              '3lau_wearable_blue_logo.png',
              'AvatarWearables_TX_2.png',
              'F_3LAU_Hat_Blue.glb',
              'M_3LAU_Hat_Blue.glb'
            ]
          }
        ]
      },
      i18n: [
        {
          code: Locale.EN,
          text: '3LAU Blue Triangle Cap'
        },
        {
          code: Locale.ES,
          text: 'Gorra con Triangulo Azul de 3LAU'
        }
      ]
    }

    const expectedMetadata = {
      ...fullMetadata,
      data: { ...fullMetadata.data, representations: [], removesDefaultHiding: [] }
    }

    const assets = await getAssetsToDeploy(['dcl://3lau_basics/3lau_blue_hat'])

    const generatedMetadata = await buildMetadata(assets[0])

    expect(generatedMetadata).toEqual(expectedMetadata)
  })

  it('correctly get representations for 3lau_blue_hat wearable', async () => {
    const expectedRepresentations = [
      {
        bodyShapes: [BodyShape.MALE],
        mainFile: 'M_3LAU_Hat_Blue.glb',
        overrideReplaces: [],
        overrideHides: [],
        contents: [
          'F_3LAU_Hat_Blue.glb',
          '3lau_wearable_blue_emissive.png',
          '3lau_wearable_blue_logo.png',
          'AvatarWearables_TX_2.png',
          'M_3LAU_Hat_Blue.glb'
        ]
      },
      {
        bodyShapes: [BodyShape.FEMALE],
        mainFile: 'F_3LAU_Hat_Blue.glb',
        overrideReplaces: [],
        overrideHides: [],
        contents: [
          'F_3LAU_Hat_Blue.glb',
          '3lau_wearable_blue_emissive.png',
          '3lau_wearable_blue_logo.png',
          'AvatarWearables_TX_2.png',
          'M_3LAU_Hat_Blue.glb'
        ]
      }
    ]

    const assets = await getAssetsToDeploy(['dcl://3lau_basics/3lau_blue_hat'])
    const extractedTexturesFemale = await extractAssetTextures(assets[0])

    const representations = getRepresentations(assets[0], extractedTexturesFemale)

    expect(representations).toEqual(expectedRepresentations)
  })
})
