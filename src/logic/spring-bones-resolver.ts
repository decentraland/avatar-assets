import { hashV1 } from '@dcl/hashing'
import { SpringBonesData } from '@dcl/schemas'

import { AuthoredSpringBones } from '../types'

const GLB_SUFFIXES = ['.glb', '.gltf']

function isGlbFileName(key: string): boolean {
  const lower = key.toLowerCase()
  return GLB_SUFFIXES.some((suffix) => lower.endsWith(suffix))
}

/**
 * Rewrites authored springBones (whose outer keys may be GLB filenames) into the
 * hash-keyed shape that `@dcl/schemas` expects in deployed entity metadata.
 *
 * The buffers passed in must be the same bytes that will be uploaded for each GLB
 * (i.e. the post-`processGlb` output, not the source file on disk), so the hashes
 * match the `content` map produced by `DeploymentBuilder.buildEntity`.
 *
 * When multiple authored entries resolve to the same hash, the last one wins and a
 * warning is logged so authors can catch accidental duplicates in `asset.json`.
 */
export async function resolveSpringBonesHashes(
  authored: AuthoredSpringBones,
  files: Map<string, Uint8Array>
): Promise<SpringBonesData> {
  const models: SpringBonesData['models'] = {}
  const hashByFileName = new Map<string, string>()
  const sourceKeyByHash = new Map<string, string>()

  for (const [key, bones] of Object.entries(authored.models)) {
    let hash: string

    // If the key looks like a GLB filename, resolve it to a hash. Otherwise, assume it's already a hash.
    if (isGlbFileName(key)) {
      const buffer = files.get(key)
      if (!buffer) {
        const known = [...files.keys()].join(', ') || '<none>'
        throw new Error(`Spring bones references unknown GLB "${key}". Known files: ${known}`)
      }
      const cachedHash = hashByFileName.get(key)
      hash = cachedHash ?? (await hashV1(buffer))
      if (!cachedHash) {
        hashByFileName.set(key, hash)
      }
    } else {
      hash = key
    }

    const previousKey = sourceKeyByHash.get(hash)
    if (previousKey !== undefined) {
      console.warn(
        `Spring bones collision: "${previousKey}" and "${key}" both resolve to ${hash}; "${key}" overrides "${previousKey}".`
      )
    }
    sourceKeyByHash.set(hash, key)
    models[hash] = bones
  }

  return { ...authored, models }
}
