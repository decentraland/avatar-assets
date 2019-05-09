import { Log } from 'decentraland-commons'

import * as path from 'path'
import { asSafeAction } from '../lib/utils'
import { uploadAssetPack, bundleAllAssets, saveAllAssets } from '../lib/pack'

const log = new Log('cmd::bundle')

const main = async (options: any) => {
  log.info('Bundling into AssetPack')

  const assetPack = await bundleAllAssets(
    options.src,
    options.title,
    options.contentServer
  )
  if (options.out) {
    await saveAllAssets(assetPack, options.out)
  }

  if (options.bucket) {
    for (const asset of Object.values(assetPack)) {
      await uploadAssetPack(asset, path.join(options.src, asset.title), options.bucket)
    }
  }
}

export const register = (program: any) => {
  program
    .command('bundle')
    .option('--src [assetPackDir]', 'Path to the asset pack content folder')
    .option(
      '--bucket [bucketName]',
      'S3 bucket name to upload the asset pack contents'
    )
    .option('--out [assetPackOut]', 'Path to output the asset pack descriptor')
    .option('--content-server [contentServerURL]', 'Content server URL')
    .action(asSafeAction(main, log))
}