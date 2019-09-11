import * as importer from 'ipfs-unixfs-importer'
import * as IPLD from 'ipld'
import * as inMemory from 'ipld-in-memory'

const first = require('async-iterator-first')

const inMemoryIPLD = inMemory(IPLD)
export const getFileCID = async (buffer: Buffer, filename = '') => {
  const ipld = await inMemoryIPLD
  const file = await first(
    importer(
      [
        {
          path: filename,
          content: buffer
        }
      ],
      ipld,
      { strategy: 'flat' }
    )
  )
  return file.cid.toBaseEncodedString()
}
