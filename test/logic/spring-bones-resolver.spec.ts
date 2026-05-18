import fs from 'fs'
import path from 'path'
import { hashV1 } from '@dcl/hashing'
import { SpringBoneParams } from '@dcl/schemas'

import { resolveSpringBonesHashes } from '../../src/logic/spring-bones-resolver'
import { AuthoredSpringBones } from '../../src/types'

const FIXTURE_GLB_PATH = path.resolve(__dirname, '../../assets/base-avatars/hair/F_Hair_Anime_01/Hair_Anime_Fringe.glb')

const baseParams: SpringBoneParams = {
  stiffness: 2,
  gravityPower: 0,
  gravityDir: [0, -1, 0],
  drag: 0.3,
  isRoot: true
}

function loadFixtureBuffer(): Uint8Array {
  return new Uint8Array(fs.readFileSync(FIXTURE_GLB_PATH))
}

describe('resolveSpringBonesHashes should', () => {
  it('rewrite GLB filename keys to content hashes', async () => {
    const buffer = loadFixtureBuffer()
    const expectedHash = await hashV1(buffer)

    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        'Hair_Anime_Fringe.glb': {
          Hair_springBone_L: { ...baseParams }
        }
      }
    }

    const result = await resolveSpringBonesHashes(authored, new Map([['Hair_Anime_Fringe.glb', buffer]]))

    expect(result).toEqual({
      version: 1,
      models: {
        [expectedHash]: { Hair_springBone_L: { ...baseParams } }
      }
    })
  })

  it('rewrite .gltf filename keys to content hashes', async () => {
    const buffer = loadFixtureBuffer()
    const expectedHash = await hashV1(buffer)

    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        'Hair.gltf': { Bone: { ...baseParams } }
      }
    }

    const result = await resolveSpringBonesHashes(authored, new Map([['Hair.gltf', buffer]]))

    expect(result.models).toHaveProperty(expectedHash)
  })

  it('pass through pre-resolved hash keys unchanged', async () => {
    const preResolved = 'bafkreialsvt77jvpy673cnugp5ggnxfaalfncufweayuk3jbxskh3pelkm'
    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        [preResolved]: { Bone: { ...baseParams } }
      }
    }

    const result = await resolveSpringBonesHashes(authored, new Map())

    expect(result).toEqual(authored)
  })

  it('let the last entry win when two filenames with disjoint bones hash to the same content', async () => {
    const buffer = loadFixtureBuffer()
    const expectedHash = await hashV1(buffer)

    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        'male/Hair.glb': { Hair_springBone_L: { ...baseParams } },
        'female/Hair.glb': { Hair_springBone_R: { ...baseParams } }
      }
    }

    const result = await resolveSpringBonesHashes(
      authored,
      new Map([
        ['male/Hair.glb', buffer],
        ['female/Hair.glb', buffer]
      ])
    )

    expect(Object.keys(result.models)).toHaveLength(1)
    expect(result.models[expectedHash]).toEqual({ Hair_springBone_R: { ...baseParams } })
  })

  it('let the last entry win when two filenames hashing to the same content define the same bone differently', async () => {
    const buffer = loadFixtureBuffer()
    const expectedHash = await hashV1(buffer)

    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        'male/Hair.glb': { Hair_springBone_L: { ...baseParams } },
        'female/Hair.glb': { Hair_springBone_L: { ...baseParams, stiffness: 1 } }
      }
    }

    const result = await resolveSpringBonesHashes(
      authored,
      new Map([
        ['male/Hair.glb', buffer],
        ['female/Hair.glb', buffer]
      ])
    )

    expect(result.models[expectedHash]).toEqual({ Hair_springBone_L: { ...baseParams, stiffness: 1 } })
  })

  it('throw when a filename key has no corresponding buffer', async () => {
    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        'Missing.glb': { Bone: { ...baseParams } }
      }
    }

    await expect(resolveSpringBonesHashes(authored, new Map())).rejects.toThrow(/unknown GLB "Missing\.glb"/)
  })

  it('treat filename key matching as case-insensitive on the suffix only', async () => {
    const buffer = loadFixtureBuffer()
    const expectedHash = await hashV1(buffer)

    const authored: AuthoredSpringBones = {
      version: 1,
      models: {
        'Hair.GLB': { Bone: { ...baseParams } }
      }
    }

    const result = await resolveSpringBonesHashes(authored, new Map([['Hair.GLB', buffer]]))

    expect(result.models).toHaveProperty(expectedHash)
  })
})
