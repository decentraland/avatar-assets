import { Log } from 'decentraland-commons'

import { asSafeAction } from '../lib/utils'
import { bundleAssetPack, saveAssetPack, uploadAssetPack } from '../lib/pack'

const log = new Log('cmd::bundle')

export const register = (program: any) => {
  program
  .command('bundle')
    .option(
      '--title [assetPackTitle]',
      'The title for the asset pack'
    )
    .option('--src [assetPackDir]', 'Path to the asset pack content folder')
    .option(
      '--bucket [bucketName]',
      'S3 bucket name to upload the asset pack contents'
    )
    .option('--out [assetPackOut]', 'Path to output the asset pack descriptor')
    .option('--content-server [contentServerURL]', 'Content server URL')
    .action(asSafeAction(main, log))
}

const main = async (options: any) => {
  log.info('Bundling into AssetPack')

  const assetPack = await bundleAssetPack(
    options.src,
    options.title,
    options.contentServer
  )
  if (options.out) {
    saveAssetPack(assetPack, options.out)
  }

  if (options.bucket) {
    await uploadAssetPack(assetPack, options.src, options.bucket)
  }
}
