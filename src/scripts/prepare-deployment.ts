import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

function getDiffCommandFromCommitHash(commitHash: string) {
  return `git diff --name-only ${commitHash}^ ${commitHash}`
}

function getDiffCommandFromBranch(branchName: string) {
  return `git diff --name-only ${branchName}..master`
}

// Get updated directories based on a commit hash
function getUpdatedDirectories(gitDiffCommand: string): string[] {
  const diffOutput = execSync(gitDiffCommand).toString().trim()
  const fileNames = diffOutput.split('\n')
  const directories = new Set<string>()

  for (const fileName of fileNames) {
    const directory = fileName.substring(0, fileName.lastIndexOf('/'))
    directories.add(directory)
  }

  return Array.from(directories)
}

// Check if a directory contains an 'asset.json' file
function containsAssetFile(directoryPath: string): boolean {
  const assetJsonPath = path.join(directoryPath, 'asset.json')
  return fs.existsSync(assetJsonPath)
}

function getParsedWearable(filepath: string) {
  const regex = /^.*\/assets\/([^\/]*)\/.*/
  const match = regex.exec(filepath)
  const data = fs.readFileSync(filepath)
  const asset = JSON.parse(data as any)

  return { assetName: asset.name, collectionName: match[1] }
}

function getDiffCommand(args: string[]) {
  const typeOfDeployment = args[2]
  if (typeOfDeployment === 'commit') {
    return getDiffCommandFromCommitHash(args[3])
  } else {
    const branchName = args[3] ?? ''
    return getDiffCommandFromBranch(branchName)
  }
}

function generateSafeUrls(base, collectionIds, maxLength = 2000) {
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

// Prepare the deployment command
async function prepareDeploymentCommand(args: string[]) {
  const rootDirectory = path.resolve(__dirname, '../..')

  const gitDiffCommand = getDiffCommand(args)

  const updatedDirectories = getUpdatedDirectories(gitDiffCommand)
    .map((updatedDirectory) => path.join(rootDirectory, updatedDirectory))
    .filter((fullUpdatedDirectory) => containsAssetFile(fullUpdatedDirectory))

  const wearablesToDeploy = updatedDirectories.map((updatedDirectory) =>
    getParsedWearable(path.join(updatedDirectory, 'asset.json'))
  )
  console.log(`Preparing deployment for ${wearablesToDeploy.length} base wearables`)

  const wearablesAsArguments = wearablesToDeploy.map(
    (wearableData) => `--id dcl://${wearableData.collectionName}/${wearableData.assetName}`
  )

  console.log(
    'Command to deploy wearables:\n' +
      `npm run deploy -- --identityFilePath <identity-file> --target <node-to-deploy> ${wearablesAsArguments.join(' ')}`
  )

  const collections = await fetchCollections()

  const searchResults = wearablesToDeploy.map((wearableData) => {
    const foundCollection = collections.collections.find((collection) =>
      collection.id.toLocaleLowerCase().includes(wearableData.collectionName.toLocaleLowerCase())
    )

    return {
      wearableData,
      foundCollection,
    }
  })

  const notFound = searchResults.filter((result) => result.foundCollection === undefined)

  const notFoundCollectionNames = [...new Set(notFound.map((result) => result.wearableData.collectionName))]

  const collectionIdsToDeploy = [
    ...new Set(
      searchResults.filter((result) => result.foundCollection !== undefined).map((result) => result.foundCollection.id)
    ),
  ]

  console.log(`\nCollections to be updated by this: ${collectionIdsToDeploy.length}`)
  console.log(`\nCollections not found: ${notFoundCollectionNames}`)

  const baseURL =
    'https://play.decentraland.org/?BUILDER_SERVER_URL=https://builder-api.decentraland.org&DEBUG_MODE=true&DISABLE_backpack_editor_v2=&ENABLE_backpack_editor_v1=&CATALYST=<CATALYST>&WITH_COLLECTIONS='
  const safeUrls = generateSafeUrls(baseURL, collectionIdsToDeploy)

  console.log('\nLinks to test collections:')
  safeUrls.forEach((url, index) => {
    console.log(`URL ${index + 1}: ${url}`)
  })
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
  prepareDeploymentCommand(process.argv)
}

main().catch(console.error)
