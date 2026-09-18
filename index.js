import { parseArgs, styleText } from "node:util"
import { createLogger, LEVEL } from "walking-log"
import { check } from "./core/check-before-publish.js"

/** @import { NpmPackDryRunJSONItem } from './core/type.js' */

/** @typedef {number} int */
/** @typedef {NpmPackDryRunJSONItem['files'][0]} File */
/** @typedef {`${string}/${string}`} Directory */
/** @typedef {typeof values} CliValues */

const DEFAULT_DIFF_THRESHOLD = {
  FILE_COUNT: 5,
  PACKAGE_SIZE_IN_PERCENT: 10,
}

/**
 * @satisfies {import('node:util').ParseArgsOptionsConfig}
 */
const options = /** @type {const} */ ({
  verbose: {
    type: "boolean",
    default: false,
    // @ts-expect-error
    description: "verbose mode",
  },
  help: {
    type: "boolean",
    default: false,
    short: "h",
    // @ts-expect-error
    description: "show this help message",
  },
  version: {
    type: "boolean",
    default: false,
    short: "v",
    // @ts-expect-error
    description: "show version information",
  },

  name: {
    type: "string",
    // @ts-expect-error
    description: "the name of the package",
    default: "",
  },
  "threshold-count": {
    type: "string",
    default: String(DEFAULT_DIFF_THRESHOLD.FILE_COUNT),
    short: "c",
    // @ts-expect-error
    description:
      "File count threshold. Publish aborts if the count diff from baseline exceeds this value.",
  },
  "threshold-size": {
    type: "string",
    default: String(DEFAULT_DIFF_THRESHOLD.PACKAGE_SIZE_IN_PERCENT),
    short: "s",
    // @ts-expect-error
    description:
      "Package size threshold in percent (10 means 10%). Publish aborts if the size diff from baseline exceeds this.",
  },
  silent: {
    type: "boolean",
    default: false,
    // @ts-expect-error
    description: "Suppress all output except for errors",
  },
  // throws when threshold overflow
  throw: {
    type: "boolean",
    default: true,
    // @ts-expect-error
    description:
      "Should exit with error when to publish vs previous published stats diff by an threshold?",
  },
})

const { values } = parseArgs({ allowNegative: true, options: options })

const { verbose, silent } = values
const logger = createLogger({
  level: silent ? LEVEL.ERROR : verbose ? LEVEL.DEBUG : LEVEL.INFO,
})

async function main() {
  if (values.help) {
    return showHelp()
  }

  if (values.version) {
    return showVersion()
  }

  const name =
    values.name ||
    process.env.npm_package_name ||
    (await import("./package.json", { with: { type: "json" } }).then((pkg) => pkg.default.name))

  if (!name) {
    throw new TypeError(
      "Package `name` is not specified, `shipwright` should be run in the root of the package to be published.",
    )
  }

  // biome-ignore lint/suspicious/noAssignInExpressions: more concise than if-else
  !values.name && (values.name = name)

  // return console.log("values:", values)

  await check(values, logger)
}

main()

function showHelp() {
  console.log()
  console.log(styleText("cyanBright", "## Usage"))
  console.log()
  console.log("Add script to your package.json and make sure it run before publishing:")

  const name = process.platform === "win32" ? `%npm_package_name%` : `$npm_package_name`
  console.log(
    styleText(
      "greenBright",
      `  "check-files-to-publish": "shipwright --name=${name} --threshold-count=6 --threshold-size=10 --throw --silent"`,
    ),
  )
  console.log()
  console.log("Or run it manually in the root of the package to be published:")
  console.log(styleText("greenBright", "  npx npm-shipwright"))

  console.log()
  console.log(styleText("cyanBright", "## Options"))
  console.table(options)
}

async function showVersion() {
  const { name, version } = (await import("./package.json", { with: { type: "json" } })).default

  console.log(`\n${name}@v${version} ${process.arch}_${process.platform}`)
}
