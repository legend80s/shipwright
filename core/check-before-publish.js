// If file count to publish is less or more than previous published file count by an threshold, exit with error
// Because it usually shows sign of error which means there is many files missing or extra files added by mistake
// Use `npm pack --dry-run` to get the file count before publish and `https://registry.npmjs.org/${pkgName}` to get the file count of previous published version.
import assert from "node:assert"
import { execSync } from "node:child_process"
import readline from "node:readline"
import { colors } from "../utils/colors.js"
import { fetchJSON, safeAsyncCall } from "../utils/light-lodash.js"

/** @import { NpmPackDryRunJSONItem, NpmPackDryRunJSON, Logger, NpmPkgResp, NpmxPkgFilesResp } from './type.js' */

/** @typedef {number} int */
/** @typedef {NpmPackDryRunJSONItem['files'][0]} File */
/** @typedef {`${string}/${string}`} Directory */

const testing = false
const overlimit = true

const PACK_DRY_RUN_CMD = `npm pack --dry-run`

/**
 *
 * @param {import('../index.js').CliValues} values
 * @param {Logger} logger
 */
export async function check(values, logger) {
  const { verbose, name: pkgName } = values

  const { diff, version, totalFiles, prevFileCount, prevVersion, files } = await fetchDiff(
    pkgName,
    verbose,
    logger,
  )
  if (prevVersion === null) {
    logger.success(`✅ New package: no previous version found. Ready to publish!`)
    return
  }

  const threshold = Number(values.threshold)

  if (Math.abs(diff) >= threshold) {
    handleThresholdExceeded()
  } else {
    logger.success(
      `✅ File count check success: diff (${Math.abs(diff)}) < threshold (${threshold}). Ready to publish!`,
    )
  }

  async function handleThresholdExceeded() {
    const msg1 =
      `To publish ` +
      red(`v${version}`) +
      ` file count is ${red(totalFiles)}, but previous published ` +
      green(`v${prevVersion}`) +
      ` file count is ${green(prevFileCount)}.`
    logger.error(colors.RESET + msg1 + colors.RESET)

    const msg2 = `The diff (Math.abs(${totalFiles} - ${prevFileCount}) = ${diff}) ${red("❯")} threshold (${threshold}).`
    logger.error(colors.RESET + msg2 + colors.RESET)

    printFilesStats(logger, files)

    const msg3 = `This usually shows sign of error which means there are too many files missing or too many extra files added by mistake.`
    logger.error(msg3)

    const isInteractive = process.stdin.isTTY

    const fileCountOverThresholdError = `FileCountOverThresholdError: Previous published file count (${prevFileCount}) is too different from to publish file count (${totalFiles}).`

    if (!isInteractive) {
      logger.debug("Not interactive mode")
      if (values.throw) {
        logger.debug("  Exit with error")
        throw new Error(fileCountOverThresholdError)
      }

      logger.debug("  Exit with error log only")
    } else {
      console.log()
      console.log(`1. Confirm the files above to publish are all expected.`)
      const answer = await confirmInteractive(
        logger,
        `2. If it's OK to continue publishing enter "yes", "n" to abort.\n${cyan("❯")} `,
      )
      if (answer !== "yes") {
        logger.debug("Aborted by user.\n")

        throw new Error(fileCountOverThresholdError)
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

  const { latestVersionFileCount: prevFileCount, latestVersion: prevVersion } =
    await getPrevPublishedFilesCount(pkgName, logger)

  if (prevFileCount === null) {
    return { diff: 0, prevVersion: null, prevFileCount: 0, totalFiles: 0, version: null, files: [] }
  }

  logger.info(`Previous published v${prevVersion} file count:`, prevFileCount)

  const { name, entryCount: totalFiles, version, files } = await fetchToPublishInfo(pkgName)

  const msgWrongDir = `Check if \`${PACK_DRY_RUN_CMD}\` ran in the wrong directory.`
  if (name !== pkgName) {
    throw new Error(
      `Tarball name mismatch. Expected "${pkgName}", but got "${name}". ${msgWrongDir}`,
    )
  }

  const diff = totalFiles - prevFileCount

  logger.info(
    `To publish file count:`,
    totalFiles,
    "\b. File count diff:",
    diff,
    `(= ${totalFiles} - ${prevFileCount})`,
  )

  return { diff, prevVersion, prevFileCount, totalFiles, version, files }
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
 * @returns {Promise<{ latestVersionFileCount: int, latestVersion: string } | { latestVersionFileCount: null, latestVersion: null }>}
 */
async function getPrevPublishedFilesCount(pkgName, logger) {
  // mock code for testing to avoid rate limit
  if (testing) {
    return {
      latestVersion: "1.2.0",
      latestVersionFileCount: 83,
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
    }
  }

  const latestVersion = json["dist-tags"].latest
  let latestVersionFileCount =
    // @ts-expect-error
    json.versions[latestVersion].dist.fileCount

  if (!latestVersionFileCount) {
    logger.warn(
      `pkg exists but file count of the latest version ${latestVersion} is undefined by ${api}.`,
    )

    latestVersionFileCount = await fetchFileCount(pkgName, latestVersion, logger)
  }

  return { latestVersionFileCount, latestVersion }
}

/**
 *
 * @param {string} pkgName
 * @param {string} version
 * @param {Logger} logger
 * @return {Promise<int>}
 */
async function fetchFileCount(pkgName, version, logger) {
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
  const api = `https://npmx.dev/api/registry/files/${pkgName}/v/${version}`
  logger.info(`Try fetch pkg fils count by npmx (${api})`)
  const json = await safeAsyncCall(
    () => /** @type {Promise<NpmxPkgFilesResp>} */ (fetchJSON(api)),
    {
      onError: (err) => {
        logger.debug(`❌ Failed to fetch ${api}`, err)
      },
    },
  )

  if (!json) {
    logger.error(`❌ pkg files fetch failed by ${api}`)
    throw new Error(`❌ pkg files fetch failed by ${api} and ${api}`)
  }

  return countFiles(json.tree)
  // }

  // return json.fileCount
}

/**
 * 递归统计树中所有文件（type === "file"）的数量。
 * @param {NpmxPkgFilesResp['tree']} nodes - 节点数组，每个节点可能是 file 或 directory
 * @returns {number} 文件总数
 */
function countFiles(nodes) {
  let count = 0

  for (const node of nodes) {
    if (node.type === "file") {
      count += 1
    } else if (node.type === "directory" && Array.isArray(node.children)) {
      count += countFiles(node.children)
    } else {
      console.error(`Unexpected node type: ${node.type}, node:`, node)
      throw new TypeError(`Unexpected node type: ${node.type}`)
    }
  }

  return count
}

/**
 * @param {string} pkgName
 * @returns {Promise<Pick<NpmPackDryRunJSONItem, 'name' | 'version' | 'entryCount' | 'files'>>}
 */
async function fetchToPublishInfo(pkgName) {
  if (testing) {
    const entryCount = overlimit ? 659 : 86
    return {
      name: pkgName,
      version: "1.3.0",
      entryCount,
      files: new Array(entryCount),
    }
  }
  const stdout = execSync(`${PACK_DRY_RUN_CMD} --json`).toString("utf-8")

  const parsed = /** @type {NpmPackDryRunJSON} */ (JSON.parse(stdout))

  assert(parsed[0])

  return parsed[0]
}

/**
 *
 * @param {string | undefined} filepath
 * @returns {filepath is Directory}
 */
function isDir(filepath) {
  return !!filepath && !filepath.includes(".")
}

/**
 * @param {Logger} logger
 * @param {File[]} files
 */
function printFilesStats(logger, files) {
  // group by second level dir if no second level dir use first lever fallback to whole file name
  const grouped = files.reduce(
    (acc, file) => {
      const [first, second] = file.path.split("/")
      // if (file.path.includes("assets")) {
      //   console.log("assets", file.path)
      // }
      if (isDir(second)) {
        acc[second] = [...(acc[second] || []), file]
      } else if (isDir(first)) {
        assert(first)
        acc[first] = [...(acc[first] || []), file]
      } else {
        acc[file.path] = [...(acc[file.path] || []), file]
      }

      return acc
    },
    /** @type {Record<string, File[]>} */ ({}),
  )

  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

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

/**
 * @param {string | number} val
 * @returns {string}
 */
function red(val) {
  return colors.RED + val + colors.RESET
}

/** @type {typeof red} */
function green(val) {
  return colors.GREEN + val + colors.RESET
}

/** @type {typeof red} */
function cyan(val) {
  return colors.CYAN + val + colors.RESET
}
