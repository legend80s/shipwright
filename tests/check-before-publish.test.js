import assert from "node:assert"
import test from "node:test"
import { accumulateFiles } from "../core/check-before-publish.js"

test("accumulateFiles", () => {
  const input = getWalkingLogFilesResp()
  const actual = accumulateFiles(input.tree)
  const expected = { fileCount: 7, unpackedSize: 16979 }

  assert.deepStrictEqual(actual, expected)
})

function getWalkingLogFilesResp() {
  return {
    package: "walking-log",
    version: "1.0.0",
    default: "/index.min.js",
    tree: [
      {
        name: "dist",
        path: "dist",
        type: /** @type {const} */ ("directory"),
        size: 4324,
        children: [
          {
            name: "index.d.ts",
            path: "dist/index.d.ts",
            type: /** @type {const} */ ("file"),
            hash: "uq0Hi7Zkw4eam5QjjgIJ0iNb2Zi3vpxkZvdIQRzQHS8=",
            size: 3433,
          },
          {
            name: "logger.type.d.ts",
            path: "dist/logger.type.d.ts",
            type: /** @type {const} */ ("file"),
            hash: "9yhv3fAsotNq1nEvnKTKDK+PyEV784lxPp/XUsfxH60=",
            size: 891,
          },
        ],
      },
      {
        name: "index.js",
        path: "index.js",
        type: /** @type {const} */ ("file"),
        hash: "2fgE1dHSomqqNjQrzUKY7uJPRtE1W4VBD5P+ec9W2bA=",
        size: 7010,
      },
      {
        name: "LICENSE",
        path: "LICENSE",
        type: /** @type {const} */ ("file"),
        hash: "+RPNvw2YxGaTtKDpq/yWyWIU5jC44THPVG3lC5qktqs=",
        size: 1066,
      },
      {
        name: "logger.type.ts",
        path: "logger.type.ts",
        type: /** @type {const} */ ("file"),
        hash: "14mH7Ug5DLQ5+x6o05m/5riHpW3EO9u3NfJekeUw3jA=",
        size: 859,
      },
      {
        name: "package.json",
        path: "package.json",
        type: /** @type {const} */ ("file"),
        hash: "spgKGeKG/AyqsFZp7Ljf13c1HjG1NVkRkfMdRKxMagI=",
        size: 1301,
      },
      {
        name: "README.md",
        path: "README.md",
        type: /** @type {const} */ ("file"),
        hash: "2mUMkv7r/ej9aXBm3i2GgGJNpsqf5/9h4M/ShgzEg+Y=",
        size: 2419,
      },
    ],
  }
}
