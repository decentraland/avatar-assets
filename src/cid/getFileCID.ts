const importer = require('ipfs-unixfs-importer')
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')

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
