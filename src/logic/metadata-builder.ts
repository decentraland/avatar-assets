import path from 'path'
import fs from 'fs'
import { I18N, Locale } from '@dcl/schemas'

import { Asset } from '../types'
import { parseUrn } from '@dcl/urn-resolver'

const defaultReplacementsByCategory: { [key: string]: string[] } = {
  mask: ['eyewear', 'tiara', 'hat', 'helmet'],
  eyewear: ['mask', 'helmet'],
  tiara: ['mask', 'hat', 'helmet'],
  hat: ['mask', 'tiara', 'helmet', 'top_head'],
  top_head: ['hat', 'helmet'],
  helmet: ['mask', 'tiara', 'hat', 'top_head', 'eyewear'],
  hair: []
}

const defaultHidingsByCategory: { [key: string]: string[] } = {
  mask: ['earring', 'facial_hair'],
  hat: ['hair'],
  helmet: ['eyewear', 'earrings', 'hair', 'facial_hair', 'head']
}

/**
 * Retrieves information from a legacy ID.
 * Parses the legacy ID to extract URN, collection address, and collection name.
 *
 * @param {string} legacyId - The legacy ID to be parsed.
 * @returns {Promise<{ urn: string; collectionAddress?: string; collectionName?: string }>}
 *          An object containing the parsed URN, collection address, and collection name.
 * @throws {Error} If the legacy ID cannot be parsed or is of an unsupported type.
 */
async function getInfoFromLegacyId(
  legacyId: string
): Promise<{ urn: string; collectionAddress?: string; collectionName?: string }> {
  const asset = await parseUrn(legacyId)
  if (!asset) {
    throw new Error(`Failed to parse the legacy ID: '${legacyId}'`)
  }

  // Initialize as undefined for cases where these are not applicable
  let collectionAddress: string | undefined
  let collectionName: string | undefined

  // Handle different asset types
  if (asset.type === 'blockchain-collection-v1-asset') {
    collectionAddress = asset.contractAddress || undefined
    collectionName = asset.collectionName || undefined
  } else if (asset.type !== 'off-chain') {
    throw new Error(`Unsupported asset type for legacy ID: '${legacyId}'`)
  }

  return {
    urn: asset.uri.toString(),
    collectionAddress,
    collectionName
  }
}

export async function buildMetadata(asset: Asset) {
  const legacyId = `dcl://${asset.collection || 'base-exclusive'}/` + asset.name
  const { urn, collectionAddress } = await getInfoFromLegacyId(legacyId)
  const extraTags = asset.directoryPath.includes('base-avatars') ? ['base-wearable'] : ['exclusive']

  const data = {
    replaces:
      (asset.json.replaces === undefined ? defaultReplacementsByCategory[asset.json.category] : asset.json.replaces) ||
      [],
    hides: (asset.json.hides === undefined ? defaultHidingsByCategory[asset.json.category] : asset.json.hides) || [],
    removesDefaultHiding: asset.json.removesDefaultHiding || [],
    tags: [...asset.json.tags, ...extraTags],
    category: asset.json.category,
    representations: []
  }

  return {
    id: urn,
    name: asset.json.name,
    collectionAddress,
    rarity: asset.json.rarity,
    description: asset.json.description === undefined ? '' : asset.json.description,
    image: fs.existsSync(path.join(asset.directoryPath, `${asset.name}.png`)) ? `${asset.name}.png` : '',
    thumbnail: 'thumbnail.png', // default value for thumbnails
    i18n: Object.keys(asset.json.i18n).reduce((cumm, code) => {
      const text = asset.json.i18n[code]
      cumm.push({ code: code as Locale, text })
      return cumm
    }, [] as I18N[]),
    data
  } as any
}

function getBodyShapeByType(type: string): string {
  if (type.toLowerCase().includes('female')) return 'urn:decentraland:off-chain:base-avatars:BaseFemale'
  else return 'urn:decentraland:off-chain:base-avatars:BaseMale'
}

export function getRepresentations(asset: Asset, extractedTextures: { fileName: string; buffer: Buffer }[]) {
  const extractTexturesFilesNames = extractedTextures.map((textures) => textures.fileName)
  return asset.json.main.map((element) => ({
    bodyShapes: [getBodyShapeByType(element.type)],
    mainFile: element.model,
    overrideReplaces: element.overrideReplaces || [],
    overrideHides: element.overrideHides || [],
    contents: extractTexturesFilesNames
  }))
}
