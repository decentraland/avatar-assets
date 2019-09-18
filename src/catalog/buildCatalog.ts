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
  const catalogById: Record<string, Wearable> = {}
  for (let item of catalog) {
    if (catalogById[item.id]) {
      catalogById[item.id].representations = [...catalogById[item.id].representations, ...item.representations]
    } else {
      catalogById[item.id] = item
    }
  }
  return {
    ok: true,
    data: catalog
  }
}
