import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import { Asset } from '../types'
import { loadAssets } from '../logic/assets-reader'
import { buildAsset } from '../logic/asset-builder'
import { validate } from '../logic/asset-validator'

const rootDirectory = path.resolve(__dirname, '../..')

function getUpdatedDirectoriesFrom(branch: string): string[] {
  const gitDiffCommand = `git diff --name-only origin/master...origin/${branch} -- assets`
  const diffOutput = execSync(gitDiffCommand).toString().trim()
  const fileNames = diffOutput.split('\n')
  const directories = new Set<string>()

  for (const fileName of fileNames) {
    const directory = fileName.substring(0, fileName.lastIndexOf('/'))
    directories.add(directory)
  }

  return Array.from(directories)
}

function containsAssetFile(directoryPath: string): boolean {
  const assetJsonPath = path.join(directoryPath, 'asset.json')
  return fs.existsSync(assetJsonPath)
}

function loadUpdatedAssetsFrom(branch: string) {
  const updatedDirectories = getUpdatedDirectoriesFrom(branch)
    .map((updatedDirectory) => path.join(rootDirectory, updatedDirectory))
    .filter((fullUpdatedDirectory) => containsAssetFile(fullUpdatedDirectory))
  return loadAssets(updatedDirectories)
}

async function validateAssets(assets: Asset[]): Promise<any[]> {
  const errors: any[] = []
  for (const asset of assets) {
    const builtAsset = await buildAsset(asset)
    const validationResult = validate(builtAsset.metadata)
    if (!!validationResult.length) {
      errors.push({ asset: `${asset.collection}/${asset.name}`, validationResult })
      console.log(
        `VALIDATION_ERROR - ${asset.collection}/${asset.name} with ${JSON.stringify(
          validationResult.map((result) => result!.message).join(' ')
        )}`
      )
    }
  }

  return errors
}

function generateSafeUrls(base: string, collectionIds: string[], maxLength = 2000) {
  const urls = []
  let currentURL = base
  let currentLength = currentURL.length

  collectionIds.forEach((id) => {
    const addition = `${id},`

    if (currentLength + addition.length > maxLength) {
      urls.push(currentURL.replace(/,$/, ''))
      currentURL = base
      currentLength = currentURL.length
    }

    currentURL += addition
    currentLength += addition.length
  })

  if (currentURL !== base) {
    urls.push(currentURL.replace(/,$/, ''))
  }

  return urls
}

async function fetchCollections(): Promise<{
  collections: {
    id: string
    name: string
  }[]
}> {
  try {
    const response = await fetch('https://peer.decentraland.org/lambdas/collections')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Fetching data failed:', error)
    throw error
  }
}

async function main() {
  const branchName = process.argv[2] ?? ''
  const catalystTarget = process.argv[3] ?? '<CATALYST>'
  const updatedAssets: Asset[] = loadUpdatedAssetsFrom(branchName)
  const errors = await validateAssets(updatedAssets)

  if (errors.length) {
    fs.writeFileSync(`${rootDirectory}/validation-errors.json`, JSON.stringify(errors, null, 2))
  } else {
    console.log('VALIDATION_ERROR - none')
  }

  const wearablesAsArguments = updatedAssets.map((asset) => `--id dcl://${asset.collection}/${asset.name}`)

  console.log(
    `COMMAND - yarn run deploy -- --identityFilePath <identity-file> --target ${catalystTarget} ${wearablesAsArguments.join(
      ' '
    )}`
  )

  const collections = await fetchCollections()

  const collectionsSearchResult = updatedAssets.map((asset) => {
    const foundCollection = collections.collections.find((collection) =>
      collection.id.toLocaleLowerCase().includes(asset.collection.toLocaleLowerCase())
    )

    return {
      asset,
      foundCollection
    }
  })

  const notFoundCollectionNames = [
    ...new Set(
      collectionsSearchResult
        .filter((result) => result.foundCollection === undefined)
        .map((result) => result.asset.collection)
    )
  ]

  const collectionsFoundIds = [
    ...new Set(
      collectionsSearchResult
        .filter((result) => result.foundCollection !== undefined)
        .map((result) => result.foundCollection!.id)
    )
  ]

  console.log(`\nCollections to be updated by this: ${collectionsFoundIds.length}`)
  console.log(`\nCollections not found: ${notFoundCollectionNames}`)

  const baseURL = `https://play.decentraland.org/?BUILDER_SERVER_URL=https://builder-api.decentraland.org&DEBUG_MODE=true&DISABLE_backpack_editor_v2=&ENABLE_backpack_editor_v1=&CATALYST=${catalystTarget}&WITH_COLLECTIONS=`
  const safeUrls = generateSafeUrls(baseURL, collectionsFoundIds)

  safeUrls.forEach((url, index) => {
    console.log(`URL ${index + 1}: ${url}`)
  })
}

main().catch(console.error)
