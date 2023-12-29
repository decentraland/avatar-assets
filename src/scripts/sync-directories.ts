import fs from 'fs'
import path from 'path'

class DeepDirectoryFinder {
  constructor(private rootPath: string) {}

  public findDeepestDirectories(): string[] {
    const allPaths = this.getAllPaths(this.rootPath)
    const deepestDirectories = this.getDeepestDirectories(allPaths)
    return deepestDirectories
  }

  private getAllPaths(dirPath: string, arrayOfPaths: string[] = []): string[] {
    const files = fs.readdirSync(dirPath)

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file)

      // Check if the current path is a directory
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfPaths = this.getAllPaths(fullPath, arrayOfPaths) // Recursive call for the next level of directory
      }
    })

    // Include the path itself to compare later which directories are the deepest
    arrayOfPaths.push(dirPath)

    return arrayOfPaths
  }

  private getDeepestDirectories(allPaths: string[]): string[] {
    // Find the maximum depth
    const maxDepth = allPaths.reduce((depth, dirPath) => {
      const currentDepth = dirPath.split(path.sep).length
      return Math.max(depth, currentDepth)
    }, 0)

    // Filter out directories that match the maximum depth
    const deepestDirectories = allPaths.filter((dirPath) => dirPath.split(path.sep).length === maxDepth)

    return deepestDirectories
  }
}

function copyDirectoryContents(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectoryContents(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

async function main() {
  const directoryPath = process.argv[2]

  if (directoryPath) {
    const finder = new DeepDirectoryFinder(directoryPath)
    const deepestDirectories = finder.findDeepestDirectories()
    const structuredOutputs = deepestDirectories.map((deepestDirectory) => {
      const splittedDirectory = deepestDirectory.split(path.sep)

      const relativePath = path.join(
        splittedDirectory[splittedDirectory.length - 3],
        splittedDirectory[splittedDirectory.length - 2],
        splittedDirectory[splittedDirectory.length - 1]
      )

      const correspondingPath = path.join(`${process.cwd()}/assets`, relativePath)

      if (fs.existsSync(deepestDirectory)) {
        copyDirectoryContents(deepestDirectory, correspondingPath)
      }

      const directoryFound = fs.existsSync(correspondingPath)

      return {
        assetName: splittedDirectory[splittedDirectory.length - 1],
        assetType: splittedDirectory[splittedDirectory.length - 2],
        collectionName: splittedDirectory[splittedDirectory.length - 3],
        wholePath: deepestDirectory,
        relativePath: relativePath,
        directoryFound: directoryFound
      }
    })

    console.log({
      notFound: structuredOutputs.filter((output) => !output.directoryFound),
      replacedAmount: structuredOutputs.length
    })
  } else {
    console.error('Please provide a directory path')
    process.exit(1)
  }
}

main().catch(console.error)
