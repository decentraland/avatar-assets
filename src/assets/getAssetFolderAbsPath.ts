import { resolve, join } from 'path'

export function getAssetFolderAbsPath(postFix: string = __dirname, currentHeight: number = 2): string {
  return currentHeight === 0
    ? resolve(join(postFix, 'assets'))
    : getAssetFolderAbsPath(join(postFix, '..'), currentHeight - 1)
}
