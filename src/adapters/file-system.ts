import { Dirent, PathLike, readdirSync, readFileSync } from 'fs'
import path from 'path'

/**
 * Get all path of directories from a given source path
 *
 * @export
 * @param {PathLike} source
 * @return {*}  {string[]}
 */
export function getDirectoryNamesFrom(source: PathLike): string[] {
  const directories = readdirSync(source, { withFileTypes: true }).filter((dirent: Dirent) => dirent.isDirectory())

  return directories.map((dirent: Dirent) => dirent.name)
}

/**
 * Get all files from a given directory path
 *
 * @export
 * @param {string} directoryPath
 * @param {string[]} [expectedExtensions=[]]
 * @return {*}  {string[]}
 */
export function readFilesFrom(directoryPath: string, expectedExtensions: string[] = []): string[] {
  const files = readdirSync(directoryPath)

  return files
    .filter((file) => expectedExtensions.length === 0 || expectedExtensions.includes(path.extname(file)))
    .map((file) => path.join(directoryPath, file))
}

export function readFile<T>(file: string): T {
  const buffer = readFileSync(file)
  const data = buffer.toString()
  return JSON.parse(data) as T
}
