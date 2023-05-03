import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Get updated directories based on a commit hash
function getUpdatedDirectories(commitHash: string): string[] {
  const gitDiffCommand = `git diff --name-only ${commitHash}^ ${commitHash}`
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
  const regex = /^.*\/assets\/([^\/]*)\/.*/;
  const match = regex.exec(filepath);
  const data = fs.readFileSync(filepath)
  const asset = JSON.parse(data as any)

  return { assetName: asset.name, collectionName: match[1] }
}

// Prepare the deployment command
function prepareDeploymentCommand(args: string[]) {
  const commitHash = args[2]
  const rootDirectory = path.resolve(__dirname, '../..')

  const updatedDirectories = getUpdatedDirectories(commitHash)
    .map((updatedDirectory) => path.join(rootDirectory, updatedDirectory))
    .filter((fullUpdatedDirectory) => containsAssetFile(fullUpdatedDirectory))


  const wearablesToDeploy = updatedDirectories.map((updatedDirectory) => getParsedWearable(path.join(updatedDirectory, 'asset.json')))
  console.log(`Preparing deployment for ${wearablesToDeploy.length} base wearables`)
  
  const wearablesAsArguments = wearablesToDeploy.map((wearableData) => `--id dcl://${wearableData.collectionName}/${wearableData.assetName}`)

  console.log('Command to deploy wearables:\n' + `npm run deploy -- --identityFilePath <identity-file> --target <node-to-deploy> ${wearablesAsArguments.join(' ')}`)
}

prepareDeploymentCommand(process.argv)
