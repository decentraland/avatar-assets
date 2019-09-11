import * as path from 'path'

const getAssetFolderAbsPath = (postFix: string, currentHeight: number) =>
  currentHeight === 0
    ? path.resolve(path.join(postFix, 'assets'))
    : getAssetFolderAbsPath(path.join(postFix, '..'), currentHeight - 1)
