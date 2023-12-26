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
