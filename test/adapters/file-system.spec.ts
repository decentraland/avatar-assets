import { join, resolve } from 'path'

import { readFilesFrom } from '../../src/adapters/file-system'

describe('file-system should', () => {
  it('read all GLB files when calling readFilesFrom with filter included', () => {
    const glbFiles = readFilesFrom(
      resolve(join(__dirname, '../..', 'assets/wonderzone_steampunk/upper_body/steampunk_jacket')),
      ['.glb']
    )

    expect(glbFiles.length).toBe(2)
    glbFiles.forEach((glbFile) => expect(glbFile.endsWith('.glb')).toBeTruthy())
  })
})
