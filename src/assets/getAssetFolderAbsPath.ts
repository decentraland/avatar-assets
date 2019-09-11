import * as path from 'path'

export const getAssetFolderAbsPath = (postFix: string = __dirname, currentHeight: number = 2) =>
  currentHeight === 0
    ? path.resolve(path.join(postFix, 'assets'))
    : getAssetFolderAbsPath(path.join(postFix, '..'), currentHeight - 1)
