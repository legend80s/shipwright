# shipwright

<div align="center" style="display: flex; justify-content: space-around; align-items: center">
  <img width="20%" alt="A captain at a ship's wheel" src="https://koboyo.com/icons/svg/captain-ship-s-wheel.svg" />
  &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;
  <img valign="top" width="11%" alt="A container ship of boxes" src="https://koboyo.com/icons/svg/cartoon-container-ship-boxes.svg" />
</div>

> Ship it right and don't ship unexpected files or let files supposed to ship missing in tarball.
>
> Count and weigh your package before you publish it.

## **shipwright** 的由来

最近我的一个 npm 包差点把 node_modules 发布出去（我在 .gitignore 加了 `node_modules/` 几天后我想把占用包体积的 assets 文件从 tarball 删除，但这些文件不应该被 git 忽略，故新增了 .npmignore 文件将 `assets/` 规则写入其中，但是我没有写入 `node_modules/`，因为我满心以为 npm 打包时会将 .gitignore 和 .npmignore 二者的规则 merge，然而事实上如果二者同时存在 npm 只会使用 `.npmignore`）；还有多年前我的一个被大量依赖的公司内部包发布少了 dist 目录下面很多文件，差点造成事故。

还有就是 Anthropic 的 Claude Code 因打包配置错误，将一个 57 MB 的 source map 文件（cli.js.map）意外打包进了公开发布的 npm 包中。

打包配置容易发生错误，因为是人为的，能否有一个工具在即使配置错误，仍能在误发布之前尽可能检测到异常的文件数量变化和包体积变化，从而拦截这些可能酿成重大事故的发布呢？
