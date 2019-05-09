import * as fs from 'fs'

import { Log } from 'decentraland-commons'

import { asSafeAction } from '../lib/utils'
import { AssetPackDescriptor, saveAssetPack } from '../lib/pack'

const log = new Log('cmd::init')

const DEFAULT_PACK_PATH = './pack.json'

export const register = (program: any) => {
  program.command('init <name>').action(asSafeAction(main, log))
}

const main = async (name: string) => {
  if (fs.existsSync(DEFAULT_PACK_PATH)) {
    throw new Error('AssetPack already initialized')
  }

  const pack = new AssetPackDescriptor(name)
  saveAssetPack(pack, DEFAULT_PACK_PATH)
  log.info('AssetPack initialized')
}
