import * as chai from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { getFileCID } from './cid/getFileCID'
import { getCategories } from './assets/getCategories'

const expect = chai.expect

describe('process files', () => {
  it('utility scanner returns a list of all the categories', () => {
    const categories = getCategories()
    expect(categories).to.deep.equal([
      'body_shape',
      'earring',
      'eyebrows',
      'eyes',
      'eyewear',
      'facial_hair',
      'feet',
      'hair',
      'lower_body',
      'mask',
      'mouth',
      'tiara',
      'upper_body'
    ])
  })
  it('generates the CID value of a file', async () => {
    const content = fs.readFileSync(path.resolve(__dirname, '..', 'README.md'))
    const cid = await getFileCID(content)
    expect(cid).to.eq('QmbiPLfzT76XqNU2fB4NfqkYSTMQkLShCQu9pt2NFoGM6k')
  })
})
