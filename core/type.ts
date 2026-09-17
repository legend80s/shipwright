// cli types
export type CliValues = {
  verbose: boolean
  threshold: string
  silent: boolean
  throw: boolean
}

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
  fileCount: number
  integrity: string
  signatures: Signature[]
  unpackedSize: number
}

interface Signature {
  sig: string
  keyid: string
}

type Bin = Record<string, string>
