import { createAssetDescriptionFromFolder } from '../description/fromFolder'
import { AssetDescription } from '../description/createAssetDescription'

export async function buildCatalog(folders: string[], options: { contentBaseUrl: string; workingFolder: string }) {
  const catalog: AssetDescription[] = []
  for (let folder of folders) {
    catalog.push(await createAssetDescriptionFromFolder(folder, { contentBaseUrl: options.contentBaseUrl }))
  }
  return {
    ok: true,
    data: catalog
  }
}
