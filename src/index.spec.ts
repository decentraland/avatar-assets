import * as fs from 'fs'
import { getCategories } from './assets/getCategories'
import { getFileCID } from './cid/getFileCID'
import * as chai from 'chai'

const expect = chai.expect

describe('process files', () => {
  it('utility scanner returns a list of all the categories', () => {
      const categories = getCategories()
      expect(categories).to.deep.equal([
        'body_shape', 'earring', 'eyebrows', 'eyes', 'eyewear', 'facial_hair', 'feet', 'hair', 'lower_body', 'mask', 'mouth', 'tiara', 'upper_body'
      ])
  })
  it('generates the CID value of a file', async () => {
    const cid = await getFileCID(fs.readFileSync('README.md'))
    console.log(cid)
    expect(cid).to.be.true
  })
})
