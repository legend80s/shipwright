// primitive types
export type int = number

// cli types
// export type CliValues = {
//   verbose: boolean
//   threshold: string
//   silent: boolean
//   throw: boolean
//   name: string
// }

export type Logger = {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  success: (...args: unknown[]) => void
}

// model types
export type NpmPackDryRunJSON = NpmPackDryRunJSONItem[]

export type NpmPackDryRunJSONItem = {
  id: string
  name: string
  version: string
  size: number
  unpackedSize: number
  shasum: string
  integrity: string
  filename: string
  files: File[]
  entryCount: number
  bundled: []
}

interface File {
  path: string
  size: number
  mode: number
}

/**
 * https://registry.npmjs.org/sse-stuntman
 */
export type NpmPkgResp = {
  _id: string
  _rev: string
  name: string
  "dist-tags": Disttags
  versions: Versions
  time: Time
  bugs: Bugs
  license: string
  homepage: string
  keywords: string[]
  repository: Repository
  description: string
  maintainers: Maintainer[]
  readme: string
  readmeFilename: string
}

interface Time {
  created: string
  modified: string
  [version: string]: string
  // "0.0.2": string
  // "0.0.3": string
  // "0.0.4": string
  // "0.0.5": string
  // "0.0.6": string
  // "1.0.0": string
  // "1.1.0": string
  // "1.1.1": string
  // "1.1.2": string
}

interface Versions {
  [version: string]: VersionOfPkg
  // "0.0.3": _003
  // "0.0.4": _003
  // "0.0.5": _003
  // "0.0.6": _006
  // "1.0.0": _006
  // "1.1.0": VersionOfPkg
  // "1.1.1": VersionOfPkg
  // "1.1.2": VersionOfPkg
}

interface VersionOfPkg {
  name: string
  version: string
  keywords: string[]
  author: string
  license: string
  _id: string
  maintainers: Maintainer[]
  homepage: string
  bugs: Bugs
  bin: Bin
  dist: Dist
  main: string
  type: string
  gitHead: string
  scripts: Scripts
  _npmUser: Maintainer
  repository: Repository
  _npmVersion: string
  description: string
  directories: Directories
  _nodeVersion: string
  _hasShrinkwrap: boolean
  devDependencies?: Dependencies
  dependencies?: Dependencies
  _npmOperationalInternal: NpmOperationalInternal
}

interface Repository {
  url: string
  type: string
}

interface Bugs {
  url: string
}

interface Maintainer {
  name: string
  email: string
}

interface Disttags {
  latest: string
}

interface NpmOperationalInternal {
  tmp: string
  host: string
}

type Dependencies = {
  [pkgName: string]: string
  // "@types/node": string
}

type Directories = {}

type Scripts = Record<string, string>

interface Dist {
  shasum: string
  tarball: string
  fileCount?: number
  integrity: string
  signatures: Signature[]
  unpackedSize: number
}

interface Signature {
  sig: string
  keyid: string
}

type Bin = Record<string, string>

// https://www.npmjs.com/package/shipwright/v/0.1.2/index
export type NpmPkgFilesResp = {
  files: Files
  totalSize: number
  fileCount: number
  shasum: string
  integrity: string
}

type Path = `/${string}`

type Files = {
  "/package.json": TextFile
  "/README.md": TextFile
  // "/shipwright.jpg": BinaryFile
  [path: Path]: TextFile | BinaryFile
}

type CommonFile = {
  size: int
  type: string
  path: Path
  contentType: `${string}/${string}`
  hex: string
}

// TextFile sample
// {
//   "size": 500,
//   "type": "File",
//   "path": "/bin/claude.exe",
//   "contentType": "application/octet-stream",
//   "hex": "6d7abae055d3b598281300a6c835086dec81bf3048f8a2294c5d3e50c8830d7b",
//   "isBinary": "false",
//   "linesCount": 11
// }
type TextFile = CommonFile & {
  isBinary: "false"
  linesCount: int
}

// BinaryFile sample
// {
//   "size": 109001,
//   "type": "File",
//   "path": "/shipwright.jpg",
//   "contentType": "image/jpeg",
//   "hex": "c1da9f7a24de13fbb83a2cf394123ad20ef8f99f6eb4dee5e359e3ac5b193ba2",
//   "isBinary": "true"
// }
type BinaryFile = CommonFile & {
  isBinary: "true"
}

/**
 * https://npmx.dev/api/registry/files/shipwright/v/0.1.2
 */
// File sample
// {
//   "package": "@anthropic-ai/claude-code",
//   "version": "2.1.274",
//   "tree": [
//     {
//       "name": "bin",
//       "path": "bin",
//       "type": "directory",
//       "size": 500,
//       "children": [
//         {
//           "name": "claude.exe",
//           "path": "bin/claude.exe",
//           "type": "file",
//           "hash": "bXq64FXTtZgoEwCmyDUIbeyBvzBI+KIpTF0+UMiDDXs=",
//           "size": 500
//         }
//       ]
//     },
//     {
//       "name": "cli-wrapper.cjs",
//       "path": "cli-wrapper.cjs",
//       "type": "file",
//       "hash": "Ya1jAz2cgVXV5gop9F3EZlr6B2McCxCOYsyDv0W6SQ4=",
//       "size": 4997
//     },
//     {
//       "name": "install.cjs",
//       "path": "install.cjs",
//       "type": "file",
//       "hash": "XLqxZwWX9JLNTuuUbzw0Tryx+9Q8YjuhksmzN0RGG4U=",
//       "size": 7196
//     },
//     {
//       "name": "LICENSE.md",
//       "path": "LICENSE.md",
//       "type": "file",
//       "hash": "jOlLlHi7mGj5ZB+BjgbNci++VdTCLi0u0RlxsgFGFzo=",
//       "size": 147
//     },
//     {
//       "name": "package.json",
//       "path": "package.json",
//       "type": "file",
//       "hash": "ay8eftUcecSL+e+QSKFvWyTfAkbHMrOf8p+3ZFI1wbE=",
//       "size": 1476
//     },
//     {
//       "name": "README.md",
//       "path": "README.md",
//       "type": "file",
//       "hash": "2nzxXOTjW61qEHrNaja0/gUggwaLueVksao/IHi10M4=",
//       "size": 2037
//     },
//     {
//       "name": "sdk-tools.d.ts",
//       "path": "sdk-tools.d.ts",
//       "type": "file",
//       "hash": "cV8xlSzwR5WdzWlcVHHHuzZ1mmpQ3+dN8d6zdMVph0U=",
//       "size": 168249
//     }
//   ]
// }
export type NpmxPkgFilesResp = {
  package: string
  version: string
  tree: Node[]
}

type Node = FileNode | DirectoryNode

type CommonNode = {
  name: string
  path: string
  size: int
}

type DirectoryNode = CommonNode & {
  type: "directory"
  children: Node[]
}

type FileNode = CommonNode & {
  type: "file"
  hash: string
}
