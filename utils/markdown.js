import { cyan } from "./colors.js"

/**
 *
 * @param {`h${1 | 2 | 3 | 4 | 5 | 6}`} level
 * @param {unknown[]} args
 */
export function logHeader(level, ...args) {
  const count = Number(level.slice(1))

  if (count >= 1 && count <= 6) {
    console.log(`${cyan("#".repeat(count))}`, ...args)
    return
  }

  throw new Error("Invalid header level")
}
