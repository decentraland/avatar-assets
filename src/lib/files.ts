import * as fs from 'fs'
import * as path from 'path'

import { takeLast } from './utils'

export const isDirectory = (source: string) =>
  fs.lstatSync(source).isDirectory()

export const getDirectories = (source: string) =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory)

export const getFiles = (source: string) =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(obj => !isDirectory(obj))

export const getBaseDir = (source: string) =>
  takeLast(path.dirname(source).split('/'))

export const getRelativeDir = (source: string) =>
  path.join(getBaseDir(source), path.basename(source))

export const walkDir = (source: string, filelist: string[] = []) => {
  let files = fs.readdirSync(source)
  filelist = filelist || []
  files.forEach(function(file) {
    if (fs.statSync(path.join(source, file)).isDirectory()) {
      filelist = walkDir(path.join(source, file), filelist)
    } else {
      filelist.push(path.join(source, file))
    }
  })
  return filelist
}
