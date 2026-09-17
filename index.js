import { parseArgs } from "node:util"
import { createLogger, LEVEL } from "walking-log"
import { check } from "./core/check-before-publish.js"

/** @import { NpmPackDryRunJSONItem, NpmPackDryRunJSON } from './core/type.js' */

/** @typedef {number} int */
/** @typedef {NpmPackDryRunJSONItem['files'][0]} File */
/** @typedef {`${string}/${string}`} Directory */

const DEFAULT_THRESHOLD = 6

// abort if there is any error
const { values } = parseArgs({
  allowNegative: true,
  options: {
    verbose: {
      type: "boolean",
      default: false,
    },
    // TODO version and help
    threshold: {
      type: "string",
      default: String(DEFAULT_THRESHOLD),
      description: "the threshold",
    },
    silent: {
      type: "boolean",
      default: false,
    },
    // throws when threshold overflow
    throw: {
      type: "boolean",
      default: true,
      description:
        "Should exit with error when file count to publish is less or more than previous published file count by an threshold?",
    },
  },
})

const { verbose, silent } = values
const logger = createLogger({
  level: silent ? LEVEL.ERROR : verbose ? LEVEL.DEBUG : LEVEL.INFO,
})

async function main() {
  await check(values, logger)
}

main()
