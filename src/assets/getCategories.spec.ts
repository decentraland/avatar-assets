import { getCategories } from './getCategories'
import { expect } from 'chai'

describe('process files', () => {
  it('utility scanner returns a list of all the categories', () => {
    const categories = getCategories()
    expect(categories).to.deep.equal([
      'mask'
    ])
  })
})
