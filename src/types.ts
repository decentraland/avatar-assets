import { SpringBonesData, SpringBoneParams } from '@dcl/schemas'

/**
 * Authoring shape for `springBones` in `asset.json`. Outer keys may be GLB filenames
 * (e.g. "Hair_Keanu.glb") or pre-resolved CIDv1 content hashes; `buildAsset` resolves
 * filename keys to hashes before the entity is deployed.
 */
export type AuthoredSpringBones = {
  version: SpringBonesData['version']
  models: Record<string, Record<string, SpringBoneParams>>
}

export type AssetJSON = {
  name: string
  i18n: {
    [key: string]: string
  }
  tags: string[]
  replaces?: string[]
  hides?: string[]
  removesDefaultHiding?: string[]
  category: string
  rarity?: string
  description?: string
  main: {
    overrideReplaces?: string[]
    overrideHides?: string[]
    type: string
    model: string
  }[]
  springBones?: AuthoredSpringBones
}

export type Asset = {
  json: AssetJSON
  collection: string
  category: string
  name: string
  glbFilesPaths: string[]
  directoryPath: string
}

export type Arguments = {
  target: string
  identityFilePath: string | undefined
  privateKey: string | undefined
  publicKey: string | undefined
  id: string[]
}

export type Identity = {
  privateKey: string
  ethAddress: string
}

export type BuiltAsset = {
  metadata: any
  files: Map<string, Uint8Array>
}
