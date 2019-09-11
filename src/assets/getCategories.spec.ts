import * as chai from 'chai'
import { getCategories } from './getCategories'

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
})
