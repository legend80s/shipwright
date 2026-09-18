# shipwright

<div align="center" style="display: flex; justify-content: space-around; align-items: center">
  <img width="20%" alt="A captain at a ship's wheel" src="https://koboyo.com/icons/svg/captain-ship-s-wheel.svg" />
  &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;
  <img valign="top" width="12%" alt="A container ship of boxes" src="https://koboyo.com/icons/svg/cartoon-container-ship-boxes.svg" />
</div>

> Ship it right and don't ship unexpected files.
>
> Count and weigh your package before you publish it.

## Why "shipwright"?

Shipwright: every release should ship right.

A **shipwright** is a craftsman who builds and repairs ships. Before a vessel
leaves the harbor, the shipwright walks the deck and checks the manifest — every
plank, every crate, every crew member accounted for. Nothing sails that shouldn't,
nothing stays ashore that should have gone.

`shipwright` is the one who makes sure what you ship is what you meant to ship.

“Don't let the boat leave the dock until you've counted what's on it and weighed it.”

That is exactly what this tool does before `npm publish`: **counting** files and **weighing** size.

## What it does

Before running `npm publish`, `shipwright` compares the package you're about to
publish against the **previously published version**, on two dimensions:

1. **File count** — from `npm pack --dry-run`.
2. **Package size** — the packed tarball size and/or unpacked size.

It fetches the previous version's file count and size from the npm registry, and
exits with an error if either metric deviates beyond a configurable threshold.

Checking size matters as much as checking count. The two failure modes are
different, and each catches things the other misses:

- **A file count check** catches *"a file went missing"* or *"a file appeared"* —
  but it stays silent when one file leaves and another enters, keeping the count
  stable.
- **A size check** catches *"something got much bigger or much smaller"* — a
  source map slipped into the tarball, a bundled dependency ballooned, a build
  artifact failed to compress. It stays silent when a small file is swapped for
  another small file of the same size.

Together they cover each other's blind spots.

## Why both

The Claude Code leak in March 2026 is the cautionary tale. A single stray file —
a 59.8 MB source map — rode along in the published npm package and exposed the
entire proprietary codebase. The file count barely moved: one file in, one file
out of a large package is easy to miss. But the **size** would have screamed.
A tarball that suddenly grows by tens of megabytes is a five-alarm signal.

Neither check alone would have caught every possible mistake. A size check alone
misses the case where a secret file of normal size replaces a normal file. A count
check alone misses the case where a huge file is added while an equally huge file
is removed. Run both, and the tarball has to pass two independent gates before
it ships.

## Usage

### Usage #1: Manually check before every publish

```sh
npx npm-shipwright
```

> Or with customized threshold values:

```sh
npx npm-shipwright --threshold-count 5 --threshold-size 10%
```

Exits `success` if both deviations are within their thresholds, `error` otherwise.

### Usage #1: Automatically check on every publish

Add the following to your `package.json`:

```json
"scripts": {
  "prepublishOnly": "npx npm-shipwright"
}
```

Or use it like in the `package.json` example [here](https://github.com/legend80s/my-npm-dashboard/blob/main/src/package.json#L13).

### Usage #3: As a linter

> TODO: not implemented yet.

## Philosophy

Ship intentionally. Count before you publish. Weigh before you sail.

## TODO

- [ ] Add linter support. Maybe name as `eslint-plugin-publish`.
