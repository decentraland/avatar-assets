export type SourceJson = {
  name: string
  i18n: {
    [key: string]: string
  }
  tags: string[]
  replaces?: string[]
  hides?: string[]
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

export type Wearable = {
  id: WearableId
  type: 'wearable'
  thumbnail: string
  image: string | undefined
  category: string
  baseUrl: string
  replaces: string[]
  hides: string[]
  i18n: {
    code: string
    text: string
  }[]
  tags: string[]
  representations: BodyShapeRespresentation[]
  rarity: string
  description: string
}
export type WearableId = string

export type BodyShapeRespresentation = {
  bodyShapes: string[]
  mainFile: string
  overrideReplaces: string[]
  overrideHides: string[]
  contents: Content[]
}

export type Content = {
  file: string
  hash: string
}
