<h1 align="center">shipwright</h1>

<div align="center" style="display: flex; justify-content: space-around; align-items: center">
  <img width="20%" alt="A captain at a ship's wheel" src="https://koboyo.com/icons/svg/captain-ship-s-wheel.svg" />
  &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;
  <img valign="top" width="5%" alt="A gull in flight" src="https://koboyo.com/icons/svg/gull-flight.svg" />
  <img valign="top" width="14%" alt="A container ship of boxes" src="https://koboyo.com/icons/svg/cartoon-container-ship-boxes.svg" />
</div>

[English](./README.md) | 中文

> Ship it right and don't ship unexpected files or let files supposed to ship missing in tarball.
>
> Count and weigh your package before you publish it.

## **shipwright** 的由来

最近我的一个 npm 包差点把 node_modules 发布出去：

> 我在 .gitignore 加了 `node_modules/` 几天后我想把占用包体积的 assets 文件从 tarball 删除，但这些文件不应该被 git 忽略，故新增了 .npmignore 将 `assets/` 规则写入其中，但是我没有写入 `node_modules/`，因为我满心以为 npm 打包时会将 .gitignore 和 .npmignore 二者规则 merge，然而事实上如果[二者同时存在 npm 只会使用 `.npmignore`](https://docs.npmjs.com/cli/v12/commands/npm-publish#:~:text=If%20both%20files%20exist%2C%20then%20the%20.gitignore%20is%20ignored%2C%20and%20only%20the%20.npmignore%20is%20used.)）。

还有多年前我的一个被大量依赖的公司内部包发布少了 dist 目录下面很多文件，差点造成事故。

直到今年 Anthropic 的 Claude Code 源码泄露事件：因打包配置错误，将一个 57 MB 的 source map 文件（cli.js.map）意外打包进了公开发布的 npm 包中。

打包配置容易发生错误，因为是人为的，能否有一个工具在即使配置错误，仍能在误发布之前尽可能检测到异常的文件数量变化和包体积变化，从而拦截这些可能酿成重大事故的发布呢？

这就是我为什么要开发这个工具的原因。

> [!IMPORTANT]
> Ship intentionally. Count before you publish. Weigh before you sail.
> If the cargo count suddenly grows or shrinks, or if the weight suddenly rises or falls — watch out!
>
> 发布，要有意识。发布前先数，起航前先称。如果船上的货物突然增多或变少，重量突然变大或变小，一定要小心！

## 使用方式

### 使用方式 #1: 手动每次发布前运行

```sh
npx npm-shipwright
```

> 或者使用自定义阈值：

```sh
npx npm-shipwright --threshold-count 5 --threshold-size 10 --silent
```

如果两个偏差都在阈值范围内，则检测通过 `success`，否则 `error`。

### 使用方式 #2: Automatically Check Before Every Publish

```sh
npm install -D npm-shipwright
```

在 `package.json` 中添加以下内容：

```json
"scripts": {
  "prepublishOnly": "shipwright --silent"
}
```

或按照[这个例子](https://github.com/legend80s/my-npm-dashboard/blob/main/src/package.json#L13)中的 `package.json`。

## **Shipwright**: Ship it right 每次发布都应该发对

不该发布的，一件也不能发布；该发布的，“一个也不能少”。

`shipwright` 确保你发布的，就是你想发布的。

“不能要让船离开码头，除非你数清楚了船上有什么货物，称好了每一件的重量。”

这正是 `shipwright` 在发布前做的事情：**统计文件数量**和**计算文件大小**。

## 工作原理

在运行 `npm publish` 之前，`shipwright` 会在两个维度上比较你即将发布的包与**之前发布的版本**：

1. **File count** — 来自 `npm pack --dry-run --json` 的 `entryCount` 字段
2. **Package size** — 来自 `npm pack --dry-run --json` 的 `unpackedSize` 字段

它从 [npm registry](https://registry.npmjs.org/<package-name>) 获取上一版本的文件数量和体积（获取失败回退到 [npmx](https://npmx.dev/api/registry/files/<package-name>/v/<version>)），并以此作为基准。如果任一数值相对上一版本偏离超过阈值，就会报错退出（阈值可配置）。

## 为什么二者必须结合使用

检查包体积大小和检查数量一样重要。两种模式不同，每种失败模式互补尽量捕捉到对方遗漏的东西：

- **A file count check 🧮** 能捕获 *"有多个文件意外丢失或新增"*，但如果有单个**大文件**偷偷溜入就无能为力了。
- **A size check ⚖️** 能敏锐地捕捉到 *"包体积骤增或骤降"*，比如一个 source map 文件被不小心打包进去了，或引入了不合理的包体积突然膨胀。但如果有*大量小文件*被意外地丢失或新增，它就无能为力了。

**两者结合** 覆盖彼此盲区。

2026 年 3 月的 Claude Code 泄露事件，就是前车之鉴。**仅一个** 57 MB 的 source map 误入已发布的 npm 包里，就把整个闭源代码库都暴露了出去。而文件数量几乎没动：一个文件数量巨大的包里偷偷混进**一个**文件，太容易被忽视了。但**体积**会尖叫。一个突然增大几十兆的 tarball，是最高级别的警报。

单靠任何一道检查，挡不住所有错误。体积检查（默认阈值：`10%`）看不见「大量小文件被误添加或删除」，数量检查（默认阈值：`5`）会错过「一个巨大文件被添加或删除的异常」。两道一起跑，才能捕获尽可能多的异常。

## Philosophy

> [!IMPORTANT]
> Ship it right 不要发布意料之外的文件，也不要让本应该发布的文件莫名其妙丢失了。

人容易犯错而工具不会，对团队成员“发布时应慎重”的叮嘱长期来看只是徒劳，因为事情有紧急人会疲劳注意力会分散，让工具和流程守住底线才是正道。

## TODO

- [x] ~~Works as a linter. Maybe name as `eslint-plugin-publish`.~~ 不适合做成 linter，因为检查要花几秒：运行 `npm pack --dry-run --json`，并从 npm registry 拉取基线数据。对于 linter 来说太重了。
