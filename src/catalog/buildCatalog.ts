import { Wearable } from 'types'
import { createAssetDescriptionFromFolder } from '../description/fromFolder'

export async function buildCatalog(
  folders: string[],
  options: {
    contentBaseUrl: string
    workingFolder: string
  }
) {
  const catalog: Wearable[] = []
  for (let folder of folders) {
    catalog.push(await createAssetDescriptionFromFolder(folder, { contentBaseUrl: options.contentBaseUrl }))
  }
  return {
    ok: true,
    data: catalog
  }
}
