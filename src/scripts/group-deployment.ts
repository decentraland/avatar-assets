import fs from 'fs'
import path from 'path'

function getParsedWearable(filepath: string) {
  const regex = /^.*\/assets\/([^\/]*)\/.*/
  const match = regex.exec(filepath)
  const data = fs.readFileSync(filepath)
  const asset = JSON.parse(data as any)

  return { assetName: asset.name, collectionName: match[1] }
}

function prepareDeploymentCommand(directoryPrefix: string) {
  if (!directoryPrefix.startsWith('/')) directoryPrefix = '/' + directoryPrefix
  const rootDirectory = path.resolve(__dirname, '../../assets')

  const getAllFiles = function (dirPath: string, arrayOfFiles: string[]) {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
      const fullPath = path.join(dirPath, file)

      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles)
      } else {
        arrayOfFiles.push(fullPath)
      }
    })

    return arrayOfFiles
  }

  const allFiles = getAllFiles(rootDirectory, [])

  const wearablesToDeploy = allFiles
    .filter((filepath) => filepath.startsWith(rootDirectory + directoryPrefix))
    .filter((filepath) => filepath.endsWith('asset.json'))
    .map((filepath) => getParsedWearable(filepath))

  console.log(`Preparing deployment for ${wearablesToDeploy.length} base wearables`)

  const wearablesAsArguments = wearablesToDeploy.map(
    (wearableData) => `--id dcl://${wearableData.collectionName}/${wearableData.assetName}`
  )

  console.log(
    'Command to deploy wearables:\n' +
      `npm run deploy -- --identityFilePath <identity-file> --target <node-to-deploy> ${wearablesAsArguments.join(' ')}`
  )
}

const directoryPrefix = process.argv[2]
prepareDeploymentCommand(directoryPrefix)
