<h1 align="center">shipwright</h1>

<div align="center" style="display: flex; justify-content: space-around; align-items: center">
  <img width="20%" alt="A captain at a ship's wheel" src="https://koboyo.com/icons/svg/captain-ship-s-wheel.svg" />
  &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;
  <img valign="top" width="5%" alt="A gull in flight" src="https://koboyo.com/icons/svg/gull-flight.svg" />
  <img valign="top" width="14%" alt="A container ship of boxes" src="https://koboyo.com/icons/svg/cartoon-container-ship-boxes.svg" />
</div>

[中文](./README.zh.md) | English

> Ship it right and don't ship unexpected files.
>
> **shipwright** count and weigh your package before publishing for you.

## Usage

### Usage #1: Manually Check Before Every Publish

```sh
npx npm-shipwright
```

> Or with customized threshold values:

```sh
npx npm-shipwright --threshold-count 5 --threshold-size 10
```

Exits `success` if both deviations are within their thresholds, `error` otherwise.

### Usage #2: Automatically Check Before Every Publish

```sh
npm install -D npm-shipwright
```

Add the following to your `package.json`:

```json
"scripts": {
  "prepublishOnly": "npx npm-shipwright"
}
```

Or use it like the `package.json` [example here](https://github.com/legend80s/my-npm-dashboard/blob/main/src/package.json#L13).

## **Shipwright**: Every Release Should Ship Right

Nothing sails that shouldn't, nothing stays ashore that should have gone.

`shipwright` makes sure what you ship is what you meant to ship.

“Don't let the boat leave the dock until you've counted what's on it and weighed it.”

That is exactly what this tool does before `npm publish`: **counting 🧮** files and **weighing ⚖️** size.

## Why I Create "**shipwright**"?

Recently, one of my npm packages nearly shipped `node_modules`.

> I had added `node_modules/` to `.gitignore` and a few days later I wanted to drop some `assets/` files from the tarball to cut down package size — but those files shouldn't be git-ignored, so I added a `.npmignore` with an `assets/` rule. I didn't add `node_modules/` to it, because I was sure npm will merge the rules from `.gitignore` and `.npmignore`. But in fact it doesn't — [when both exist, npm uses only `.npmignore`](https://docs.npmjs.com/cli/v12/commands/npm-publish#:~:text=If%20both%20files%20exist%2C%20then%20the%20.gitignore%20is%20ignored%2C%20and%20only%20the%20.npmignore%20is%20used.).

And many years ago, a widely-depended-on company internal package was published by me with most of the files under `dist/` missing, nearly causing an incident.

Then there's Anthropic's Claude Code, where a packaging misconfiguration accidentally bundled a 57 MB source map (`cli.js.map`) into a public npm release.

Packaging misconfiguration are easy to make because they're made by humans. Could there be a tool that catches abnormal changes in file count and package size *before* a bad publish goes out — even when packaging config is wrong — and blocks the releases that might have become serious incidents?

> [!IMPORTANT]
> Ship intentionally. Count before you publish. Weigh before you sail.
> If the cargo count suddenly grows or shrinks, or if the weight suddenly rises or falls — watch out!

## How It Works

Before running `npm publish`, `shipwright` compares the package you're about to publish against the **previously published version**, on two dimensions:

1. **File count** — from `npm pack --dry-run --json`.
2. **Package size** — the unpacked size from `npm pack --dry-run --json`.

It fetches the previous version's file count and size from the [npm registry](https://registry.npmjs.org/<package-name>) (fallback to [npmx](https://npmx.dev/api/registry/files/<package-name>/v/<version>) when needed) and uses them as the baseline. It exits with an error if either value drifts too far from the last release beyond a configurable threshold.

## Why Both

Checking size matters as much as checking count. The two failure modes are different, and each catches things the other misses:

- **A file count check 🧮** catches *"several files went missing or appeared"* — but it stays silent when a heavy file sneaks in or out.
- **A size check ⚖️** catches *"package got much bigger or much smaller"* — a source map slipped into the tarball, a bundled dependency ballooned. But it stays silent even when a large number of small files are missing or added mistakenly.

Together they cover each other's blind spots.

The Claude Code leak in March 2026 is the cautionary tale. **A single** stray file — a 57 MB source map — rode along in the published npm package and exposed the entire proprietary codebase. The file count barely moved: one file sneak into a large package is easy to miss. But the **size** would have screamed. A tarball that suddenly grows by tens of megabytes is a five-alarm signal.

Neither check alone would have caught every possible mistake. **A count check** (default threshold: `5`) alone misses the case where a huge file is added or removed. **A size check** (default threshold: `10%`) alone misses the case where many tiny files are added or removed by mistake.

## Philosophy

> [!IMPORTANT]
> Ship it right and don't ship unexpected files or let files supposed to ship missing in tarball.

People slip; tools hold. Telling people to "Be careful when you ship" is futile in the long run — because the tide gets urgent, the crew gets tired, and eyes wander. The check is best run by the system, not by the sailors.

## TODO

- [x] ~~Works as a linter. Maybe name as `eslint-plugin-publish`.~~ It is not fit for a linter because the check takes seconds. It will run `npm pack --dry-run --json` and fetch the baseline from npm registry. So too heavy for linter.
- [ ] Print files when size over threshold.
