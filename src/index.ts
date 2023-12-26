import { createLogComponent } from '@well-known-components/logger'

import { getArguments, loadIdentity } from './logic/arguments-parser'
import { getAssetsToDeploy } from './logic/assets-reader'
import { Arguments, Asset } from './types'
import { buildMetadata, getRepresentations } from './logic/metadata-builder'
import { extractAssetTextures } from './logic/glb-optimizer'
import { DeploymentBuilder } from 'dcl-catalyst-client'
import { EntityType } from '@dcl/schemas'
import { DeploymentPreparationData } from 'dcl-catalyst-client/dist/client/types'
import { deploy } from './logic/deployer'
import path from 'path'
import fs from 'fs'
import { buildAsset } from './logic/asset-builder'

async function getLogger() {
  const logs = await createLogComponent({})
  const logger = logs.getLogger('avatar-assets')
  return logger
}

async function main() {
  const logger = await getLogger()
  const args: Arguments = getArguments()
  const identity = await loadIdentity(args.identityFilePath)

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
