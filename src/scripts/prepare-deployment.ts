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

// Check if a directory path includes '/base-avatars/'
function isBaseAvatar(directoryPath: string): boolean {
  return directoryPath.includes('/base-avatars/')
}

// Check if a directory contains an 'asset.json' file
function containsAssetFile(directoryPath: string): boolean {
  const assetJsonPath = path.join(directoryPath, 'asset.json')
  return fs.existsSync(assetJsonPath)
}

// Get asset name from a file path
function getAssetName(filepath: string) {
  const data = fs.readFileSync(filepath)
  const asset = JSON.parse(data as any)
  return asset.name
}

// Prepare the deployment command
function prepareDeploymentCommand(args: string[]) {
  const commitHash = args[2]
  const rootDirectory = path.resolve(__dirname, '../..')

  const updatedDirectories = getUpdatedDirectories(commitHash)
    .map((updatedDirectory) => path.join(rootDirectory, updatedDirectory))
    .filter((fullUpdatedDirectory) => containsAssetFile(fullUpdatedDirectory) && isBaseAvatar(fullUpdatedDirectory))

  const wearablesNamesToDeploy = updatedDirectories.map((updatedDirectory) => getAssetName(path.join(updatedDirectory, 'asset.json')))
  console.log(`Preparing deployment for ${wearablesNamesToDeploy.length} base wearables`)

  const wearablesAsArguments = wearablesNamesToDeploy.map((wearableName) => `--id dcl://base-avatars/${wearableName}`)

  console.log('Command to deploy wearables:\n' + `npm run deploy -- --identityFilePath <identity-file> --target <node-to-deploy> ${wearablesAsArguments.join(' ')}`)
}

prepareDeploymentCommand(process.argv)
