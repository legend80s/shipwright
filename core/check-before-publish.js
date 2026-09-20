// If file count to publish is less or more than previous published file count by an threshold, exit with error
// Because it usually shows sign of error which means there is many files missing or extra files added by mistake
// Use `npm pack --dry-run` to get the file count before publish and `https://registry.npmjs.org/${pkgName}` to get the file count of previous published version.
import assert from "node:assert"
import { execSync } from "node:child_process"
import readline from "node:readline"
import { styleText } from "node:util"
import { colors, cyan, green, red } from "../utils/colors.js"
import { fetchJSON, safeAsyncCall } from "../utils/light-lodash.js"
import { flattenTree, groupAndSortByFileCount, printDiff } from "./diff.js"

/** @import { NpmPackDryRunJSONItem, NpmPackDryRunJSON, Logger, NpmPkgResp, NpmxPkgFilesResp, DryRunFiles } from './type.js' */

/** @typedef {number} int */
/** @typedef {NpmPackDryRunJSONItem['files'][0]} DryRunFileInfo */

const testing = false
const fileCountOverlimit = true
const packageSizeOverlimit = true

const PACK_DRY_RUN_CMD = `npm pack --dry-run`

/**
 *
 * @param {import('../index.js').CliValues} values
 * @param {Logger} logger
 */
export async function check(values, logger) {
  const { verbose, name: pkgName } = values

  const {
    diff,
    // version,
    totalFiles,
    prevFileCount,
    prevVersion,
    files: dryRunResultFiles,
    prevUnpackedSize,
    unpackedSize,
  } = await fetchDiff(pkgName, verbose, logger)
  if (prevVersion === null) {
    logger.success(`✅ New package: no previous version found. Ready to publish!`)
    return
  }

  const threshold = {
    fileCount: Number(values["threshold-count"]),
    unpackedSize: Number(values["threshold-size"]),
  }

  const isFileCountOverThreshold = Math.abs(diff.fileCount) >= threshold.fileCount
  const isPackageSizeOverThreshold = Math.abs(diff.unpackedSize) >= threshold.unpackedSize

  if (isFileCountOverThreshold) {
    handleFileCountThresholdExceeded(prevVersion)
  } else if (isPackageSizeOverThreshold) {
    handlePackageSizeThresholdExceeded(prevVersion)
  } else {
    logger.success(
      `✅ File count check success: diff (${Math.abs(diff.fileCount)}) < threshold (${threshold.fileCount}). Ready to publish!`,
    )
  }

  /** @param {string} prevVersion */
  function handlePackageSizeThresholdExceeded(prevVersion) {
    const msg =
      `To publish package size: ${red(unpackedSize)}, but previous published ` +
      green(`v${prevVersion}`) +
      ` size: ${green(prevUnpackedSize)}. Package size diff ${diff.unpackedSize}% ${red("❯=")} threshold ${threshold.unpackedSize}%.`
    logger.error(colors.RESET + msg + colors.RESET)

    handleThresholdExceeded(prevVersion)
  }

  /** @param {string} prevVersion */
  async function handleFileCountThresholdExceeded(prevVersion) {
    const msg1 =
      `To publish file count: ${red(totalFiles)}, but previous published ` +
      green(`v${prevVersion}`) +
      ` file count: ${green(prevFileCount)}. Count diff (Math.abs(${totalFiles} - ${prevFileCount}) = ${diff.fileCount}) ${red("❯=")} threshold (${green(threshold.fileCount)}).`
    logger.error(colors.RESET + msg1 + colors.RESET)

    handleThresholdExceeded(prevVersion)
  }

  /** @param {string} prevVersion */
  async function handleThresholdExceeded(prevVersion) {
    // Print diff vs baseline and only show dry run file stats if baseline fetch erred.
    try {
      const lastPublishedFiles = flattenTree(
        (await fetchNpmxPkgFiles(pkgName, prevVersion, logger)).tree,
      )
      printDiff({ lastPublishedFiles, dryRunResultFiles })
    } catch (error) {
      logger.debug(error)

      printFilesStats(logger, dryRunResultFiles)
    }

    showConfirm()
  }

  async function showConfirm() {
    // const msg3 = `This usually means an error — too many files missing or too many extra files added. Please review the changes and make sure it's intentional.`
    // logger.error(msg3)

    const isInteractive = process.stdin.isTTY

    const fileCountOverThresholdError = `FileCountOverThresholdError: Previous published file count (${prevFileCount}) is too different from to publish file count (${totalFiles}).`
    const packageSizeOverThresholdError = `PackageSizeOverThresholdError: Previous published package size (${prevUnpackedSize}) is too different from to publish package size (${unpackedSize}).`

    let errMsg = ""

    if (isFileCountOverThreshold) {
      errMsg = fileCountOverThresholdError
    } else if (isPackageSizeOverThreshold) {
      errMsg = packageSizeOverThresholdError
    } else {
      throw new Error(
        "showConfirm should only be called when isFileCountOverThreshold or isPackageSizeOverThreshold is true",
      )
    }

    if (!isInteractive) {
      logger.debug("Not interactive mode")
      if (values.throw) {
        logger.debug("  Exit with error")
        throw new Error(errMsg)
      }

      logger.debug("  Exit with error log only")
    } else {
      console.log()
      console.log(`${styleText("cyan", "1.")} Confirm the files above to publish are all expected.`)
      const answer = await confirmInteractive(
        logger,
        `${styleText("cyan", "2.")} If it's OK to continue publishing enter "yes", "n" to abort.\n${cyan("❯")} `,
      )
      if (answer !== "yes") {
        logger.debug("Aborted by user.\n")

        throw new Error(errMsg)
      }
    }
  }
}

/**
 * @param {string} pkgName
 * @param {boolean} verbose
 * @param {Logger} logger
 * @returns
 */
async function fetchDiff(pkgName, verbose, logger) {
  const timeLabel = `[check-before-publish] ${pkgName}`
  verbose && console.time(timeLabel)

  try {
    return await fetchDiffCore(pkgName, logger)
  } finally {
    if (verbose) {
      console.log()
      console.timeEnd(timeLabel)
      console.log()
    }
  }
}

/**
 * @param {string} pkgName
 * @param {Logger} logger
 * @returns
 */
async function fetchDiffCore(pkgName, logger) {
  logger.info(`Start checking file count for`, pkgName)

  const {
    latestVersionFileCount: prevFileCount,
    latestVersion: prevVersion,
    latestVersionUnpackedSize: prevUnpackedSize,
  } = await getPrevPublishedFilesCount(pkgName, logger)

  if (prevFileCount === null) {
    return /** @type {const} */ ({
      diff: { fileCount: 0, unpackedSize: 0 },
      prevVersion: null,
      prevFileCount: 0,
      prevUnpackedSize: 0,
      totalFiles: 0,
      version: null,
      files: [],
      unpackedSize: 0,
    })
  }

  logger.debug(`Previous published v${prevVersion}:`, { prevFileCount, prevUnpackedSize })

  const { name, entryCount: totalFiles, version, files, unpackedSize } = fetchToPublishInfo(pkgName)

  const msgWrongDir = `Check if \`${PACK_DRY_RUN_CMD}\` ran in the wrong directory.`
  if (name !== pkgName) {
    throw new Error(
      `Tarball name mismatch. Expected "${pkgName}", but got "${name}". ${msgWrongDir}`,
    )
  }

  const diffFileCount = totalFiles - prevFileCount

  // diffUnpackedSizeInPercent can be negative
  const diffUnpackedSizeInPercent = Number(
    (((unpackedSize - prevUnpackedSize) / prevUnpackedSize) * 100).toFixed(0),
  )

  logger.debug(
    `To publish file count:`,
    totalFiles,
    "unpacked size:",
    unpackedSize,
    "\b. File count diff:",
    diffFileCount,
    `(= ${totalFiles} - ${prevFileCount})`,
    "\b. Unpacked size diff:",
    diffUnpackedSizeInPercent,
    `\b% (= (${unpackedSize} - ${prevUnpackedSize}) / ${prevUnpackedSize} * 100)`,
  )

  return {
    diff: { fileCount: diffFileCount, unpackedSize: diffUnpackedSizeInPercent },
    prevVersion,
    prevFileCount,
    prevUnpackedSize,

    totalFiles,
    version,
    files,
    unpackedSize,
  }
}

/**
 * 交互式：通过 readline 询问
 * @param {Logger} logger
 * @param {string} question
 * @return {Promise<string>}
 */
function confirmInteractive(logger, question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.on("SIGINT", () => {
      rl.close()
      console.log()
      logger.error("❌ Aborted.\n")
      process.exit(1)
    })

    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

/**
 * Returns the previous published files count and version. If no previous version is found, returns null.
 * @param {string} pkgName
 * @param {Logger} logger
 * @returns {Promise<{ latestVersionFileCount: int, latestVersion: string; latestVersionUnpackedSize: int } | { latestVersionFileCount: null, latestVersion: null; latestVersionUnpackedSize: null }>}
 */
async function getPrevPublishedFilesCount(pkgName, logger) {
  // mock code for testing to avoid rate limit
  if (testing) {
    return {
      latestVersion: "1.2.0",
      latestVersionFileCount: 83,
      latestVersionUnpackedSize: 16979,
    }
  }
  // read from npm registry
  const api = `https://registry.npmjs.org/${pkgName}`
  logger.debug(`📡 Fetching ${api} ...`)
  const json = await safeAsyncCall(() => /** @type {Promise<NpmPkgResp>} */ (fetchJSON(api)))
  logger.debug(`✅ Fetched`, { json })

  if (!json) {
    logger.info("New Package: pkg not found by", api)
    return {
      latestVersion: null,
      latestVersionFileCount: null,
      latestVersionUnpackedSize: null,
    }
  }

  const latestVersion = json["dist-tags"].latest
  let { fileCount: latestVersionFileCount, unpackedSize: latestVersionUnpackedSize } =
    // @ts-expect-error
    json.versions[latestVersion].dist

  if (!latestVersionFileCount) {
    logger.warn(
      `pkg exists but file count of the latest version ${latestVersion} is undefined by ${api}.`,
    )

    const stats = await fetchFileStats(pkgName, latestVersion, logger)

    latestVersionFileCount = stats.fileCount
    latestVersionUnpackedSize = stats.unpackedSize
  }

  return { latestVersionFileCount, latestVersion, latestVersionUnpackedSize }
}

/**
 *
 * @param {string} pkgName
 * @param {string} version
 * @param {Logger} logger
 * @return {Promise<{ fileCount: int; unpackedSize: int}>}
 */
async function fetchFileStats(pkgName, version, logger) {
  // 1. Fetch from npm registry: 403
  // let api = `https://www.npmjs.com/package/${pkgName}/v/${version}/index`

  // let json = await safeAsyncCall(() => /** @type {Promise<NpmPkgIndex>} */ (fetchJSON(api)), {
  //   onError: (err) => {
  //     logger.debug(`❌ Failed to fetch ${api}`, err)
  //   },
  // })

  // if (!json) {
  // 2. Fetch from npmx
  // logger.warn(`pkg fils count not found by npm (${api}), trying npmx`)
  // https://npmx.dev/api/registry/files/sse-stuntman/v/1.1.2
  const json = await fetchNpmxPkgFiles(pkgName, version, logger)

  return accumulateFiles(json.tree)
  // }

  // return json.fileCount
}

/**
 * @param {string} pkgName
 * @param {string} version
 * @param {Logger} logger
 * @returns {Promise<NpmxPkgFilesResp>}
 */
async function fetchNpmxPkgFiles(pkgName, version, logger) {
  // @ts-expect-error
  if (fetchNpmxPkgFiles.promise) {
    // @ts-expect-error
    return fetchNpmxPkgFiles.promise
  }
  const api = `https://npmx.dev/api/registry/files/${pkgName}/v/${version}`
  logger.info(`Try fetch pkg fils count by npmx (${api})`)
  // @ts-expect-error
  fetchNpmxPkgFiles.promise = safeAsyncCall(
    () => /** @type {Promise<NpmxPkgFilesResp>} */ (fetchJSON(api)),
    {
      onError: (err) => {
        logger.debug(`❌ Failed to fetch ${api}`, err)
      },
    },
  )

  // @ts-expect-error
  const json = await fetchNpmxPkgFiles.promise

  if (!json) {
    logger.error(`❌ pkg files fetch failed by ${api}`)
    throw new Error(`❌ pkg files fetch failed by ${api} and ${api}`)
  }

  return json
}

/**
 * 递归统计树中所有文件（type === "file"）的数量。
 * @param {NpmxPkgFilesResp['tree']} nodes - 节点数组，每个节点可能是 file 或 directory
 * @returns {{ fileCount: int; unpackedSize: int;}} 文件总数
 */
export function accumulateFiles(nodes) {
  let fileCount = 0
  let unpackedSize = 0

  for (const node of nodes) {
    unpackedSize += node.size

    if (node.type === "file") {
      fileCount += 1
    } else if (node.type === "directory" && Array.isArray(node.children)) {
      fileCount += accumulateFiles(node.children).fileCount
    } else {
      console.error(`Unexpected node type: ${node.type}, node:`, node)
      throw new TypeError(`Unexpected node type: ${node.type}`)
    }
  }

  return { fileCount, unpackedSize }
}

/**
 * @param {string} pkgName
 * @returns {Pick<NpmPackDryRunJSONItem, 'name' | 'version' | 'entryCount' | 'files' | 'unpackedSize'>}
 */
function fetchToPublishInfo(pkgName) {
  if (testing) {
    const entryCount = fileCountOverlimit ? 659 : 86
    const unpackedSize = packageSizeOverlimit ? 18979 : 16978
    return {
      name: pkgName,
      version: "1.3.0",
      entryCount,
      files: new Array(entryCount),
      unpackedSize,
    }
  }
  const stdout = execSync(`${PACK_DRY_RUN_CMD} --json`).toString("utf-8")

  const parsed = /** @type {NpmPackDryRunJSON} */ (JSON.parse(stdout))

  assert(parsed[0])

  return parsed[0]
}

/**
 * @param {Logger} logger
 * @param {DryRunFiles} files
 */
function printFilesStats(logger, files) {
  // group by second level dir if no second level dir use first lever fallback to whole file name
  const sorted = groupAndSortByFileCount(files)

  console.log()
  logger.info(
    "## Files stats (by parsing",
    green(`\`${PACK_DRY_RUN_CMD} --json\``),
    "and grouped):",
  )
  sorted.forEach(([key, files], index) => {
    // logger.info(index + 1, `\b.`, key, ":", files.length)
    logger.info(`${cyan(index + 1)}.`, key, "\b:", files.length)
  })
  // console.log(Object.fromEntries(sorted.map(([key, files]) => [key, files.length])))
  console.log()
}
