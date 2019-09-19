import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'
import { outputTexturesFromGLB } from './outputTexturesFromGLB'
import { SourceJson, Wearable } from '../types'

function transformJson(json: SourceJson): Wearable {
  return {
    id: json.name,
    type: 'wearable',
    category: json.category,
    i18n: Object.keys(json.i18n).reduce(
      (cumm, code) => {
        const text = json.i18n[code]
        cumm.push({ code, text })
        return cumm
      }, [] as { code: string, text: string }[]
    ),
    thumbnail: '',
    baseUrl: '',
    tags: [...json.tags, 'base-wearable'],
    representations: json.main.map(
      (original) => ({
        bodyShapes: [original.type],
        mainFile: original.model,
        contents: []
      })
    )
  }
}

const hasExtension = (extension: string[] | string) => (file: string) =>
  typeof extension === 'string'
    ? file.endsWith(extension)
    : extension.reduce((prev, ext) => prev || file.endsWith(ext), false)
const GLB_ASSET = ['.glb']
const isGlbAsset = hasExtension(GLB_ASSET)

export async function processAsset(sourceFolder: string, destinationFolder: string) {
  const allFilesInAssetFolder = readdirSync(sourceFolder)
  const glbFileNames = allFilesInAssetFolder.filter(isGlbAsset)
  for (const glbFilename of glbFileNames) {
    const fullGlbFilepath = resolve(join(sourceFolder, glbFilename))
    try {
      await outputTexturesFromGLB(fullGlbFilepath, destinationFolder)
    } catch (err) {
      console.error(err.message)
    }
  }
  const json = JSON.parse(readFileSync(join(sourceFolder, 'asset.json')).toString()) as SourceJson
  const result: Wearable = transformJson(json)
  writeFileSync(join(destinationFolder, 'asset.json'), JSON.stringify(result, null, 2))
  return result
}
