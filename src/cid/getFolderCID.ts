import * as importer from 'ipfs-unixfs-importer'
import * as IPLD from 'ipld'
import * as inMemory from 'ipld-in-memory'

const all = require('async-iterator-all')

const inMemoryIPLD = inMemory(IPLD)

export const getFolderCID = async (flatFolder: { buffer: Buffer; filename: string }[]) => {
  const ipld = await inMemoryIPLD
  const folder = await all(
    importer(
      flatFolder
        .sort((a, b) => (a.filename < b.filename ? -1 : 1))
        .map(_ => ({
          path: './' + _.filename,
          content: _.buffer
        })),
      ipld,
      { strategy: 'flat' }
    )
  )
  return folder[folder.length - 1].cid.toBaseEncodedString()
}
