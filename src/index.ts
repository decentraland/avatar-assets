import { createLogComponent } from '@well-known-components/logger'

import { getArguments, loadIdentity } from './logic/arguments-parser'
import { getAssetsToDeploy } from './logic/assets-reader'
import { Arguments, Asset, Identity } from './types'
import { DeploymentBuilder } from 'dcl-catalyst-client'
import { EntityType } from '@dcl/schemas'
import { DeploymentPreparationData } from 'dcl-catalyst-client/dist/client/types'
import { deploy } from './logic/deployer'
import { buildAsset } from './logic/asset-builder'

async function getLogger() {
  const logs = await createLogComponent({})
  const logger = logs.getLogger('avatar-assets')
  return logger
}

async function parseIdentity(args: Arguments): Promise<Identity> {
  if (args.identityFilePath) {
    return await loadIdentity(args.identityFilePath)
  } else {
    return {
      privateKey: args.privateKey!,
      ethAddress: args.publicKey!
    }
  }
}

async function main() {
  const logger = await getLogger()
  const args: Arguments = getArguments()
  const identity = await parseIdentity(args)

  const assetsToDeploy: Asset[] = await getAssetsToDeploy(args.id)
  logger.info(
    `Preparing assets from the following directories: ${assetsToDeploy.map((asset) => asset.name).join(', ')}`
  )

  for (const asset of assetsToDeploy) {
    logger.info(`Deploying asset ${asset.name} from collection ${asset.collection}`)
    const { metadata, files } = await buildAsset(asset)

    logger.info(`Asset prepared: `, { metadata })
    const deploymentPreparationData: DeploymentPreparationData = await DeploymentBuilder.buildEntity({
      type: EntityType.WEARABLE,
      pointers: [metadata.id],
      files,
      metadata: { ...metadata }
    })

    const result: Response = (await deploy(deploymentPreparationData, identity, args.target)) as Response
    const { creationTimestamp } = await result.json()
    logger.info(`Asset ${asset.name} from ${asset.collection} deployed: `, { creationTimestamp })
  }
}

main()
  .then(() => console.log('done'))
  .catch((error) => console.error(error))
