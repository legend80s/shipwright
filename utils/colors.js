export const colors = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: `\x1b[33m`,
  CYAN: "\x1b[36m",
  RESET: "\x1b[0m",
}

/**
 * @param {string | number} val
 * @returns {string}
 */
export function red(val) {
  return colors.RED + val + colors.RESET
}

/** @type {typeof red} */
export function green(val) {
  return colors.GREEN + val + colors.RESET
}

/** @type {typeof red} */
export function cyan(val) {
  return colors.CYAN + val + colors.RESET
}
