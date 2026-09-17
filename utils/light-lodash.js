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
  const res = await fetch(url, {
    // headers: {
    //   // set User-Agent: curl/8.17.0
    //   "User-Agent": "curl/8.17.0",
    //   Accept: "application/json",
    // },
  })

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
 * @param {{ onError?: (error: Error) => void }} options
 * @returns {Promise<T | null>}
 */
export async function safeAsyncCall(asyncFunc, { onError = () => {} } = {}) {
  try {
    return await asyncFunc()
  } catch (error) {
    onError(/** @type {Error} */ (error))
    return null
  }
}
