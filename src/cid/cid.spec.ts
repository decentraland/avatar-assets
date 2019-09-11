import * as chai from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { getFileCID } from './getFileCID'
import { getFolderCID } from './getFolderCID'

const expect = chai.expect

describe('computing CIDs', () => {
  it('generates the CID value of a file', async () => {
    const content = fs.readFileSync(path.resolve(__dirname, '..', '..', 'README.md'))
    const cid = await getFileCID(content)
    expect(cid).to.eq('QmbiPLfzT76XqNU2fB4NfqkYSTMQkLShCQu9pt2NFoGM6k')
  })
  it('generates the CID of a folder', async () => {
    const cid = await getFolderCID([
      {
        filename: 'README.md',
        buffer: fs.readFileSync(path.resolve(__dirname, '..', '..', 'README.md'))
      },
      {
        filename: 'LICENSE.md',
        buffer: fs.readFileSync(path.resolve(__dirname, '..', '..', 'LICENSE'))
      }
    ])
    expect(cid).to.eq('QmULpXkrDsTcYgeJNKkvPjScbdTD7dhN6E6DCdB6kHUfHs')
  })
})
