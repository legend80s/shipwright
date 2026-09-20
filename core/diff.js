import assert from "node:assert"
import { cyan, gray, green, red, yellow } from "../utils/colors.js"
import { logHeader } from "../utils/markdown.js"

/** @typedef {`${string}/${string}`} Directory */
/** @import { int, DryRunFiles, NpmxPkgFilesResp } from './type.js' */

const PACK_DRY_RUN_CMD = `npm pack --dry-run`

/**
 * @param {{lastPublishedFiles: DryRunFiles; dryRunResultFiles: DryRunFiles }} params
 */
export function printDiff({ lastPublishedFiles, dryRunResultFiles }) {
  // group by second level dir if no second level dir use first lever fallback to whole file name
  const sortedBaseline = groupAndSortByFileCount(lastPublishedFiles)
  const sortedDryRun = groupAndSortByFileCount(dryRunResultFiles)

  console.log()
  logHeader(
    "h2",
    "Files stats (by parsing",
    green(`\`${PACK_DRY_RUN_CMD} --json\``),
    "and grouped):",
  )

  /** @type {Set<string>} */
  const baselineFiles = new Set(sortedBaseline.map(([filename]) => filename))
  const dryRunFiles = new Set(sortedDryRun.map(([filename]) => filename))

  // console.log("baselineFiles:", baselineFiles)
  // console.log("dryRunFiles:", dryRunFiles)

  const removedFilepaths = baselineFiles.difference(dryRunFiles)
  /**
   * @type {Array<{ filename: string, baseline: int }>}
   */
  const removed = []

  // print removed
  let index = 0
  logHeader("h3", red("🧹 REMOVED"))
  const size = String(removedFilepaths.size).length
  removedFilepaths.forEach((key) => {
    const baseline = sortedBaseline.find(([k]) => k === key)
    assert(baseline)

    const baselineCount = baseline[1].length

    removed.push({ filename: key, baseline: baselineCount })
    console.info(
      `${cyan((index + 1).toString().padStart(size, "0"))}.`,
      key,
      "\b:",
      baselineCount,
      `(${red("DEL")})`,
    )

    index++
  })
  console.log()

  /**
   * @type {Array<{ filename: string, count: int }>}
   */
  const added = []
  /**
   * @type {Array<{ filename: string, count: int, baseline: int }>}
   */
  const downs = []
  /**
   * @type {Array<{ filename: string, count: int, baseline: int }>}
   */
  const ups = []
  /**
   * @type {Array<{ filename: string, count: int, baseline: int }>}
   */
  const equals = []

  sortedDryRun.forEach(([key, files]) => {
    const baseline = sortedBaseline.find(([k]) => k === key)

    const isAdded = !baseline
    if (isAdded) {
      added.push({ filename: key, count: files.length })
      return
    }

    if (files.length > baseline[1].length) {
      ups.push({ filename: key, count: files.length, baseline: baseline[1].length })
    } else if (files.length < baseline[1].length) {
      downs.push({ filename: key, count: files.length, baseline: baseline[1].length })
    } else {
      equals.push({ filename: key, count: files.length, baseline: baseline[1].length })
    }
  })
  // print added
  logHeader("h3", green("🆕 NEW"))

  let len = added.length.toString().length
  added.forEach(({ filename, count }, index) => {
    console.info(
      `${cyan((index + 1).toString().padStart(len, "0"))}. ${filename}:`,
      count,
      `(${green("NEW")})`,
    )
  })

  // print downs
  console.log()
  logHeader("h3", yellow("🔻 DOWN"))
  len = downs.length.toString().length
  downs.forEach(({ filename, count, baseline }, index) => {
    console.info(
      `${cyan((index + 1).toString().padStart(len, "0"))}. ${filename}:`,
      count,
      `${yellow("↓")} (${baseline})`,
    )
  })
  // print ups
  console.log()
  logHeader("h3", green("🔺 UP"))

  len = ups.length.toString().length
  ups.forEach(({ filename, count, baseline }, index) => {
    console.info(
      `${cyan((index + 1).toString().padStart(len, "0"))}. ${filename}:`,
      count,
      `${green("↑")} (${baseline})`,
    )
  })
  // print equals
  console.log()
  logHeader("h3", gray("🔒 EQUAL"))

  const LIMIT = 10

  len = equals.length.toString().length
  equals.slice(0, LIMIT).forEach(({ filename, count, baseline }, index) => {
    console.info(
      `${cyan((index + 1).toString().padStart(len, "0"))}. ${filename}:`,
      count,
      `(${gray(baseline)})`,
    )
  })

  // show the last one
  if (equals.length > LIMIT) {
    console.log(gray(`...`))
    // @ts-expect-error
    const { filename, count, baseline } = equals.at(-1)
    console.info(
      `${cyan(equals.length.toString().padStart(len, "0"))}. ${filename}:`,
      count,
      `(${gray(baseline)})`,
    )
  }

  return {
    removed,
    added,
    downs,
    ups,
    equals,
  }
}

/**
 *
 * @param {NpmxPkgFilesResp['tree']} tree
 * @returns {DryRunFiles}
 *
 */
export function flattenTree(tree) {
  return tree.reduce(
    (acc, file) => {
      if (file.type === "directory") {
        return acc.concat(flattenTree(file.children))
      }

      return acc.concat({
        path: file.path,
        size: file.size,
        mode: 420,
      })
    },
    /** @type {DryRunFiles} */ ([]),
  )
}

/**
 * @param {DryRunFiles} files
 */
export function groupAndSortByFileCount(files) {
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
    /** @type {Record<string, DryRunFiles>} */ ({}),
  )

  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  return sorted
}

/**
 *
 * @param {string | undefined} filepath
 * @returns {filepath is Directory}
 */
function isDir(filepath) {
  return !!filepath && !filepath.includes(".")
}
