import { readFileSync } from 'fs'
import { resolve } from 'path'
import { getFileCID } from './getFileCID'
import { getFolderCID } from './getFolderCID'
import { expect } from 'chai'

describe('computing CIDs', () => {
  it('generates the CID value of a file', async () => {
    const content = readFileSync(resolve(__dirname, '..', '..', 'README.md'))
    const cid = await getFileCID(content)
    expect(cid).to.eq('QmbiPLfzT76XqNU2fB4NfqkYSTMQkLShCQu9pt2NFoGM6k')
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
    expect(cid).to.eq('QmULpXkrDsTcYgeJNKkvPjScbdTD7dhN6E6DCdB6kHUfHs')
  })
})
