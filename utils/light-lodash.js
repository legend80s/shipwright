import { colors } from "./colors.js"

const { YELLOW, RESET } = colors

/**
 * @param {string} url
 * @param {{ label?: string; verbose?: boolean }} options
 * @returns {Promise<unknown>}
 */
export async function fetchJSON(url, { label, verbose = false } = {}) {
  if (verbose) {
    console.log(`${YELLOW}  [fetchJSON]`, label, url, RESET)
  }
  const res = await fetch(url)

  label = label ? ` ${label}` : ""

  if (!res.ok) {
    // console.error(res)
    /** @type {string | null} */
    const text = await safeAsyncCall(async () => await res.text())
    throw new Error(`[fetchJSON]${label} "${url}" failed, status: ${res.status}, resp: ${text}`)
  }

  const data = await res.json()

  return data
}

/**
 * @template T
 * @param {() => Promise<T>} asyncFunc
 * @returns {Promise<T | null>}
 */
async function safeAsyncCall(asyncFunc) {
  try {
    return await asyncFunc()
  } catch (_error) {
    return null
  }
}
