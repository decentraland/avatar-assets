import { getAssetsToDeploy } from '../../src/logic/assets-reader'
import { extractAssetTextures } from '../../src/logic/glb-optimizer'

describe('glb-optimizer should', () => {
  it('extract textures from Asset correctly', async () => {
    const asset = await getAssetsToDeploy(['dcl://base-avatars/BaseFemale'])

    const extractedFiles = await extractAssetTextures(asset[0])

    expect(extractedFiles.map((extractedFile) => extractedFile.fileName)).toEqual([
      'BaseFemale.glb',
      'Avatar_FemaleSkinBase.png',
      'F_Eyebrows_00.png',
      'F_Eyes_00.png',
      'F_Mouth_00.png'
    ])
  })
})
