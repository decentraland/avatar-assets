import { resolve, join } from 'path'

export function getAssetFolderAbsPath(subfolder: string) {
  return resolve(join(__dirname, '..', '..', 'assets', subfolder))
}
