import * as fs from 'fs'
import * as cliProgress  from 'cli-progress';
import asyncPool from "tiny-async-pool"
import * as EthCrypto from "eth-crypto"
import { Authenticator } from 'dcl-crypto'
import { ContentFileHash } from 'dcl-catalyst-commons';
import { V2Wearable, Identity } from './types';
import { CONCURRENCY } from './config';

export async function executeWithProgressBar<T, K>(detail: string, array: Array<T>, iterator: (T) => Promise<K>): Promise<K[]> {
  const bar = new cliProgress.SingleBar({format: `${detail}: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`});
  bar.start(array.length, 0);
  const result = await asyncPool(CONCURRENCY, array, async (value) => {
    const result: K = await iterator(value)
    bar.increment(1)
    return result
  });
  bar.stop()
  return result
}

export async function parseIdentityFile(filePath: string): Promise<Identity> {
  const buffer = await fs.promises.readFile(filePath)
  return JSON.parse(buffer.toString())
}

export function getContentFileMap(wearable: V2Wearable): { key: string, hash: ContentFileHash}[] {
  const filesToDownload: { key: string, hash: ContentFileHash}[] = [];
  if (wearable.thumbnail) {
    filesToDownload.push({ key: 'thumbnail.png', hash: wearable.thumbnail });
  }
  if (wearable.image) {
    filesToDownload.push({ key: 'image.png', hash: wearable.image });
  }
  wearable.representations.forEach(representation =>
    representation.contents.forEach(({ file, hash }) => {
      if (file === 'thumbnail.png' || file === 'image.png') {
        throw new Error(`Found a wearable with a content called either thumbnail or image ${wearable.id}`)
      }
      filesToDownload.push({ key: file, hash })
    }))
  return filesToDownload
}

export function sign(entityId: string, identity: Identity) {
  const messageHash = Authenticator.createEthereumMessageHash(entityId)
  return EthCrypto.sign(identity.privateKey, messageHash)
}

export function flatten<T>(array: T[][]): T[] {
  return array.reduce((acc, val) => acc.concat(val), []);
}