import { readFileSync } from 'fs'
import { resolve } from 'path'
import { getFileCID } from './getFileCID'
import { getFolderCID } from './getFolderCID'
import { expect } from 'chai'

describe('computing CIDs', () => {
  it('generates the CID value of a file', async () => {
    const content = readFileSync(resolve(__dirname, '..', '..', 'README.md'))
    const cid = await getFileCID(content)
    expect(cid).to.eq('QmP8EdnyYx2fHraa1MyAxPY1iPL2HTCpRcTL6D3CoJxE8m')
  })
  it('generates the CID of a folder', async () => {
    const cid = await getFolderCID([
      {
        filename: 'README.md',
        buffer: readFileSync(resolve(__dirname, '..', '..', 'README.md'))
      },
      {
        filename: 'LICENSE.md',
        buffer: readFileSync(resolve(__dirname, '..', '..', 'LICENSE'))
      }
    ])
    expect(cid).to.eq('QmVjzm2Yry3QutAeWt5qsYo5r5LvkN2zajfq6Y5R8GKsuU')
  })
})
