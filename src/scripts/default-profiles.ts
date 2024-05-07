import fs from 'fs'
import path from 'path'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { EntityType, Profile } from '@dcl/schemas'
import { hexToBytes } from 'eth-connect'
import { Authenticator } from '@dcl/crypto'
import { ethSign } from '@dcl/crypto/dist/crypto'
import { readFile } from '../adapters/file-system'
import { ArgumentParser } from 'argparse'
import { DeploymentPreparationData } from 'dcl-catalyst-client/dist/client/types'
import { createContentClient, DeploymentBuilder } from 'dcl-catalyst-client'
import { createFetchComponent } from '@well-known-components/fetch-component'
import { createLogComponent } from '@well-known-components/logger'
import { hashV1 } from '@dcl/hashing'

const rootDirectory = path.resolve(__dirname, '../..')

export async function calculateIPFSHashes<T extends Uint8Array>(files: T[]): Promise<{ hash: string; file: T }[]> {
  const entries = Array.from(files).map(async (file) => ({
    hash: await hashV1(file),
    file
  }))
  return Promise.all(entries)
}

async function main() {
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({})
  const fetchComponent = createFetchComponent()

  const logger = logs.getLogger('avatar-assets')

  const parser = new ArgumentParser({ add_help: true })
  parser.add_argument('--deploy', {
    required: false,
    action: 'store_true',
    help: 'If not provided, only prepare the default profiles'
  })
  parser.add_argument('--ci', {
    required: false,
    action: 'store_true',
    help: 'Run for CI'
  })
  parser.add_argument('--target', {
    required: true,
    help: 'The address of the catalyst server where the default profiles will be deployed'
  })
  parser.add_argument('directories', {
    metavar: 'directories',
    type: 'str',
    nargs: '+',
    help: 'directories with profile.json to upload'
  })

  const args = parser.parse_args()

  let ethAddress = ''
  let privateKey = ''
  if (args.deploy) {
    ethAddress = await config.requireString('ADDRESS')
    privateKey = await config.requireString('PRIVATE_KEY')
  }

  const target = args.target.includes('localhost') ? args.target : `${args.target}/content`

  const contentClient = createContentClient({
    url: target,
    fetcher: fetchComponent
  })

  const errors: any[] = []

  for (const updatedDirectory of args.directories) {
    const fullpath = path.join(rootDirectory, updatedDirectory)
    const pointer = updatedDirectory.split('/').pop()
    const profileJsonPath = path.join(fullpath, 'profile.json')
    if (!fs.existsSync(profileJsonPath)) {
      continue
    }

    const metadata = readFile<any>(profileJsonPath)
    const files = new Map<string, Uint8Array>()
    files.set('face256.png', fs.readFileSync(path.join(fullpath, 'face256.png')))
    files.set('body.png', fs.readFileSync(path.join(fullpath, 'body.png')))

    const ipfsHashes = await calculateIPFSHashes([files.get('face256.png')!, files.get('body.png')!])
    metadata.avatars[0].avatar.snapshots = {
      face256: ipfsHashes[0].hash,
      body: ipfsHashes[1].hash
    }

    if (Profile.validate(metadata)) {
      if (args.deploy) {
        const deploymentData: DeploymentPreparationData = await DeploymentBuilder.buildEntity({
          type: EntityType.PROFILE,
          pointers: [pointer],
          files,
          metadata: { ...metadata }
        })

        const { entityId } = deploymentData

        const signature = ethSign(hexToBytes(privateKey), entityId)
        const authChain = Authenticator.createSimpleAuthChain(entityId, ethAddress, signature)

        await contentClient.deploy({
          authChain,
          entityId: deploymentData.entityId,
          files: deploymentData.files
        })
        logger.info(`Default Profile ${pointer} from deployed`)
      }
    } else if (Profile.validate.errors) {
      errors.push({
        pointer,
        validationResult: Profile.validate.errors.map((result) => result!.message).join(' ')
      })
    }
  }

  if (args.ci) {
    if (errors.length) {
      fs.writeFileSync(
        'validation-errors.md',
        errors.map((error) => `* **${error.pointer}**: ${error.validationResult}`).join('\n')
      )
    } else {
      fs.writeFileSync('validation-errors.md', 'None.')
    }
    fs.writeFileSync('output', '')
  }

  console.log(`to deploy: yarn default-profiles --deploy --target ${target} ${args.directories.join(' ')}`)
}

main().catch(console.error)
