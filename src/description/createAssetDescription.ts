import { validCategories } from '../assets/validCategories'

export type AssetDescription = {
  id: string
  name: string
  contents: {
    name: string
    hash: string
  }[]
  main: {
    bodyType: string
    entryPoint: string
  }
  category: string
  tags: string[]
  contentBaseUrl: string | undefined
  i18n: { code: string; text: string }[]
  thumbnail: string
}
export function idValidationError(id: string) {
  if (!id) {
    return 'missing value for "id"'
  }
  if (!id.startsWith('dcl://')) {
    return 'id should start with dcl://'
  }
}
export function nameValidationError(name: string) {
  if (!name) {
    return 'missing value for "name"'
  }
}
export function contentValidationError(content: any) {
  if (!content) {
    return 'missing "contents" key'
  }
  if (!Array.isArray(content)) {
    return `"contents" must be an array (received ${content})`
  }
  const contentLength = content.length
  for (let i = 0; i < contentLength; i++) {
    if (!content[i].hash) return `element ${i} of "contents" doesn't have a "hash" value with the CIDv0 value`
    if (!content[i].name) return `element ${i} of "contents" doesn't have a "name" value with the name of the file`
    if (!content[i].hash.startsWith('Qm'))
      return `element ${i} of "contents" should be a valid CIDv0 hash (received ${content[i].hash})`
  }
}
export function mainValidationError(opts: AssetDescription) {
  if (!opts.main) {
    return 'missing "main" key'
  }
  if (!Array.isArray(opts.main)) {
    return `"main" should be an array (received ${JSON.stringify(opts.main)}`
  }
  const mainLength = opts.main.length
  for (let i = 0; i < mainLength; i++) {
    const entry = opts.main[i]
    if (!entry || !(typeof entry === 'object')) return `all elements of "main" should be objects`
    if (!entry.entryPoint)
      return `all elements of "main" should have an "entryPoint" (received ${JSON.stringify(entry)})`
    if (!entry.bodyType) return `all elements of "main" should have a "bodyType" (received ${JSON.stringify(entry)})`
    if (!opts.contents.filter(_ => _.name === entry.entryPoint).length)
      return `entrypoint ${entry.entryPoint} was not present in the contents of ${opts.id}`
  }
}
export function categoryValidationError(category: string) {
  if (!category) {
    return 'missing "category" key'
  }
  if (!validCategories.includes(category)) {
    return `supplied category ${category} is not in the set of valid categories: ${JSON.stringify(validCategories)}`
  }
}
export function tagsValidationError(tags: string[]) {
  if (!tags || !tags.length) {
    return 'missing or empty "tags" key'
  }
  if (!Array.isArray(tags)) {
    return '"tags" should be an array'
  }
}
export function contentBaseUrlValidationError(contentBaseUrl?: string) {
  if (contentBaseUrl && typeof contentBaseUrl !== 'string') {
    return `the optional value "contentBaseUrl" should be a string if present`
  }
}
export function i18nValidationError(i18n: { code: string; text: string }[]) {
  if (!i18n || !i18n.length) {
    return 'missing translations! an empty value for "i18n" was supplied'
  }
  if (!Array.isArray(i18n)) {
    return '"i18n" should be an array'
  }
  const i18nLength = i18n.length
  for (let i = 0; i < i18nLength; i++) {
    const entry = i18n[i]
    if (!entry || !(typeof entry === 'object')) return `all elements of "i18n" should be objects`
    if (!entry.code)
      return `all elements of "i18n" should have an "code" specifying which language is the entry translatng to (received ${JSON.stringify(
        entry
      )})`
    if (!entry.text)
      return `all elements of "i18n" should have a "text" value with the corresponding translation (received ${JSON.stringify(
        entry
      )})`
    if (!['jp', 'fr', 'es', 'en', 'zh', 'kr'].includes(entry.code)) {
      return 'unknown language ${entry.text} - did we add a new supported language? received ${entry.code}'
    }
  }
}
export function thumbnailValidationError(content: string) {
  if (!content) {
    return 'missing "thumbnail" key'
  }
  if (typeof content !== 'string' || !content.startsWith('Qm')) {
    return `the ${content} value should be a valid CIDv0 string`
  }
}
export function validate(opts: AssetDescription) {
  return (
    idValidationError(opts.id) ||
    nameValidationError(opts.name) ||
    contentValidationError(opts.contents) ||
    mainValidationError(opts) ||
    categoryValidationError(opts.category) ||
    tagsValidationError(opts.tags) ||
    contentBaseUrlValidationError(opts.contentBaseUrl) ||
    i18nValidationError(opts.i18n) ||
    thumbnailValidationError(opts.thumbnail)
  )
}
export function createAssetDescription(opts: AssetDescription) {
  const validationError = validate(opts)
  if (validationError) {
    throw new Error(`Asset ${opts.id} has the following error: ${validationError}`)
  }
  const { id, name, contents, main, category, tags, contentBaseUrl, i18n, thumbnail } = opts
  return { id, name, contents, main, category, tags, contentBaseUrl, i18n, thumbnail }
}
