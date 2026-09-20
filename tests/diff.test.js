import assert from "node:assert"
import { test } from "node:test"
import { flattenTree, printDiff } from "../core/diff.js"

test("diff", async () => {
  const npmxFilesResult = (await import("./npm-calf-npmx-files.json", { with: { type: "json" } }))
    .default

  const lastPublishedFiles = flattenTree(
    // @ts-expect-error
    npmxFilesResult.tree,
  )
  // printFilesStats(lastPublishedFiles)

  const dryRun = (await import("./npm-calf-dry-run.json", { with: { type: "json" } })).default
  const dryRunResult = dryRun[0]

  assert(dryRunResult)
  // console.log("dryRunResult:", dryRunResult)

  // printFilesStats(dryRunResult?.files)

  // const diff = diffFiles(lastPublishedFiles, dryRunResult?.files)
  // console.log("diff:", diff)

  const { removed, added, downs, ups, equals } = printDiff({
    lastPublishedFiles,
    dryRunResultFiles: dryRunResult.files,
  })

  assert.deepStrictEqual(removed, [
    {
      baseline: 4,
      filename: "assets",
    },
    {
      baseline: 3,
      filename: "scripts",
    },
  ])
  assert.deepStrictEqual(added, [
    {
      count: 11,
      filename: "node_modules",
    },
    {
      count: 1,
      filename: "dryrun.json",
    },
    {
      count: 1,
      filename: "temp.js",
    },
  ])
  assert.deepStrictEqual(downs, [
    {
      baseline: 15,
      count: 14,
      filename: "frontend",
    },
  ])
  assert.deepStrictEqual(ups, [
    {
      baseline: 24,
      count: 26,
      filename: "utils",
    },
  ])
  assert.deepStrictEqual(equals, [
    {
      baseline: 21,
      count: 21,
      filename: "web-components",
    },
    {
      baseline: 8,
      count: 8,
      filename: "dev-server",
    },
    {
      baseline: 4,
      count: 4,
      filename: "backend",
    },
    {
      baseline: 3,
      count: 3,
      filename: "constants",
    },
    {
      baseline: 1,
      count: 1,
      filename: "README.md",
    },
    {
      baseline: 1,
      count: 1,
      filename: "README.zh.md",
    },
    {
      baseline: 1,
      count: 1,
      filename: "bin",
    },
    {
      baseline: 1,
      count: 1,
      filename: "package.json",
    },
  ])
})
