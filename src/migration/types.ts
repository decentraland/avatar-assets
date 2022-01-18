export type FileHash = string

export type V2Collection = {
  id: string,
  wearables: V2Wearable[]
}

export type V2Wearable = {
  id: string,
  representations: V2Representation[],
  type: string,
  category: string,
  tags: string[]
  baseUrl: string
  i18n: I18N[]
  thumbnail: FileHash,
  image: FileHash,
  replaces: string[],
  hides: string[],
  description: string,
  rarity: string
}

export type V2Representation = {
  bodyShapes: string[]
  mainFile: string,
  overrideReplaces: string[],
  overrideHides: string[],
  contents: { file: string, hash: FileHash }[]
}

export type V3Wearable = {
  id: string
  description: string
  thumbnail?: string
  image?: string
  collectionAddress?: string
  rarity: Rarity
  i18n: I18N[]
  data: WearableData
  metrics?: Metrics
  createdAt: number
  updatedAt: number
}

export type WearableRepresentation = {
  bodyShapes: WearableBodyShape[]
  mainFile: string
  contents: string[]
  overrideHides: WearableCategory[]
  overrideReplaces: WearableCategory[]
}

type WearableData = {
  replaces: WearableCategory[]
  hides: WearableCategory[]
  tags: string[]
  representations: WearableRepresentation[]
  category: WearableCategory
}
type WearableBodyShape = string
type WearableCategory = string
type Rarity = string
export type I18N = {
  code: string
  text: string
}
type Metrics = {
  triangles: number
  materials: number
  textures: number
  meshes: number
  bodies: number
  entities: number
}

export type Identity = {
  privateKey: string,
  ethAddress: string
}
