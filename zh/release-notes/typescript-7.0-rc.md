# TypeScript 7.0 RC

今天我们很高兴宣布 TypeScript 7.0 的发布候选版（Release Candidate）！

如果你还没有关注 TypeScript 7.0 的开发进展，这次发布有一个重要变化：它建立在一个全新的基础之上。在过去的一年里，我们一直在将现有的 TypeScript 代码库（一个自举的、编译为 JavaScript 的代码库）移植到 Go 语言。凭借原生代码的速度和共享内存并行能力，**TypeScript 7.0 通常比 TypeScript 6.0 快约 10 倍**。

要获取新的编译器，你可以像安装其他版本一样，从 npm 的 `typescript` 包安装：

```sh
npm install -D typescript@rc
```

新的 Go 代码库是有条理地从现有实现移植而来，而非从零重写，其类型检查逻辑在结构上与 TypeScript 6.0 完全一致。这种架构上的对等性确保了编译器继续执行你早已依赖的完全相同的语义。TypeScript 7.0 已经过我们十年来积累的庞大测试套件的评估，并且已经在 Microsoft 内外多个数百万行代码的项目中使用。它非常稳定、高度兼容，并且已经准备好在你日常的工作流程和 CI 流水线中*立即*进行测试。

一年多来，我们一直与 Microsoft 内部的许多团队，以及 Bloomberg、Canva、Figma、Google、Lattice、Linear、Miro、Notion、Slack、Vanta、Vercel、VoidZero 等公司的团队合作，在他们的代码库上试用 TypeScript 7.0 的预发布版本。反馈非常积极，许多团队报告了类似的加速效果，大幅缩短了构建时间，并享受到了更轻量、更流畅的编辑体验。因此，我们对发布候选版的状态充满信心，迫不及待想让你来试试。

## 使用 TypeScript 7.0 RC

如上所述，要获取 TypeScript 7.0 RC，可以通过 npm 安装：

```sh
npm install -D typescript@rc
```

之后，你可以像使用任何旧版 TypeScript 一样运行 `tsc`，你应该会看到与之前相同的结果——只是快得多！

```sh
> npx tsc --version
Version 7.0.1-rc
```

要体验编辑功能，可以安装 VS Code 的 TypeScript Native Preview 扩展。编辑器支持非常稳定，已被许多团队使用了数月。这是在你的代码库上立即试用 TypeScript 7.0 的简便方式。它与命令行体验使用相同的基础，因此你在编辑器中也能获得与命令行相同的性能提升。值得注意的是，它也基于语言服务器协议（LSP）构建，因此可以轻松在大多数现代编辑器中运行，甚至包括 Copilot CLI 等工具。

## 与 TypeScript 6.0 并行运行

尽管 7.0 RC 已接近可用于生产，但在 TypeScript 7.1 发布之前（至少还要几个月），我们不会有稳定的程序化 API。鉴于此，我们优先确保 TypeScript 7.0 可以在可预见的未来与 TypeScript 6.0 并行运行，而不会出现"哪个 `tsc` 是哪个"的冲突。

作为 6.0/7.0 过渡过程的一部分，我们发布了一个新的兼容包 `@typescript/typescript6`。该包提供了一个名为 `tsc6` 的可执行文件，因此如果需要，你可以安装 TypeScript 7.0（它自带 `tsc` 二进制文件）而不会出现命名冲突。新包还重新导出了 TypeScript 6.0 的 API，因此你可以用 `tsc` 运行 TypeScript 7，而其他工具可以继续依赖 6.0。

由于一些工具（如 typescript-eslint）期望通过 peer dependencies 直接从 `typescript` 导入，我们推荐通过 npm 别名来实现这一点。你可以运行以下命令：

```sh
npm install -D typescript@npm:@typescript/typescript6
```

或者按如下方式修改 `package.json`：

```json
{
  "devDependencies": {
    "typescript": "npm:@typescript/typescript6@^6.0.0"
  }
}
```

请注意，这样做之后你只会得到 `tsc6` 可执行文件。要获取 7.0 的 `tsc`，可以为 TypeScript 7 添加另一个别名，`npx tsc` 就能直接使用 7.0：

```json
{
  "devDependencies": {
    "typescript": "npm:@typescript/typescript6@^6.0.0",
    "typescript-7": "npm:typescript@rc"
  }
}
```

### 每日构建版本

TypeScript 7 的每日构建版本目前仍发布在 npm 的 `@typescript/native-preview` 包下，可以通过以下方式安装：

```sh
npm install -D @typescript/native-preview
```

该包提供的二进制文件仍命名为 `tsgo`。一旦 TypeScript 7 在 npm 上以 `latest` 标签发布，我们预计所有稳定版本、主要预发布版本和每日构建版本都将发布在 npm 的 `typescript` 包下。

## 并行化与控制选项

TypeScript 7.0 现在并行执行许多步骤，包括解析、类型检查和输出。其中一些步骤（如解析和输出）大多可以跨文件独立进行。因此，并行化可以自动很好地扩展，对于较大的代码库开销相对较小。但并非 TypeScript 构建中的每一步都容易并行化。

### 类型检查器并行化

其他步骤（如类型检查）在文件之间有更复杂的依赖关系。大多数文件最终都依赖来自其依赖项和全局作用域的相同类型信息，因此完全独立地运行类型检查器会造成浪费——无论是在计算还是内存方面。另一方面，类型检查偶尔依赖程序中信息的相对顺序，因此从头开始类型检查必须始终以相同的顺序检查相同的文件，以确保相同的结果。

为了在避免这些陷阱的同时启用并行化，TypeScript 7.0 创建了固定数量的类型检查器 worker，每个 worker 都有自己的世界视图。这些类型检查 worker 可能会重复一些公共工作，但给定相同的输入文件，它们将始终以相同的方式划分文件并产生相同的结果。

默认的类型检查 worker 数量是 4，但可以通过新的 `--checkers` 标志进行配置。你可能会发现，在拥有更多 CPU 核心的机器上，增加此数量可以进一步加速较大代码库的构建，但通常以增加内存使用为代价。同样，CPU 核心和内存较少的机器（例如 CI 运行器）可能希望减少此数量，以避免不必要或偶发的开销。

在极少数情况下，改变 `--checkers` 的数量可能会暴露依赖顺序的结果。在构建环境中指定固定数量的检查器可以帮助确保每个人都获得相同的结果，但这取决于每个团队的判断。

### 项目引用构建器并行化

TypeScript 7.0 可以在项目内并行化构建，现在也可以同时构建多个项目。此行为可以通过新的 `--builders` 标志进行配置，该标志控制可以同时运行的并行项目引用构建器的数量。这对于拥有许多项目的 monorepo 特别有帮助。

与 `--checkers` 类似，增加构建器的数量可以加速构建，但可能会增加内存使用。它还与 `--checkers` 有乘法效应，因此为你的机器和代码库找到合适的平衡很重要。例如，使用 `--checkers 4 --builders 4` 构建时，最多可以同时运行 16 个类型检查器，这可能过多。

与 `--checkers` 不同，改变构建器的数量不应产生不同的结果；但是，构建项目引用从根本上受项目依赖图的瓶颈限制（除非是在利用 `--isolatedDeclarations` 和独立语法声明文件输出的代码库上进行类型检查）。

### 单线程模式

在某些情况下，强制整个编译器以单线程方式运行会很有帮助。这对于调试、与 TypeScript 6 和 7 进行性能比较、在外部编排并行构建，或在资源非常有限的环境中运行都很有用。要启用单线程模式，可以使用新的 `--singleThreaded` 标志。这不仅会将类型检查 worker 的数量限制为 1，还会确保解析和输出在单线程中完成。

## 改进的 `--watch` 模式

值得一提的是 TypeScript 7 重建的 `--watch` 模式。`--watch` 现在建立在一个新基础上，该基础源自 Parcel 打包工具的文件监视器，提供高效且稳定的跨平台文件监视能力。

当我们的团队着手移植文件监视逻辑时，我们在 Go 的跨平台文件监视方面遇到了一些挑战。标准库没有提供内置的文件监视 API，我们探索的现有第三方库在稳定性、性能、跨平台支持或与构建工具集成方面存在各种问题。我们围绕定期轮询来检查文件变化构建了解决方案，这在各操作系统上广泛适用；然而它在计算上开销很大，尤其是在 `node_modules` 中有许多依赖项的大规模项目中。即使采用动态调度策略，我们发现纯轮询方案对于一般使用来说负担太重。

多年来，Visual Studio Code 一直依赖 @parcel/watcher，近年来 VS Code 中的 TypeScript 也间接依赖它的文件监视能力。虽然看起来很有前景，但 Parcel 的监视器对我们来说有一个问题：它是用 C++ 编写的，因此需要完整的 C++ 工具链来构建。鉴于我们在 VS Code 中使用 Parcel 监视器的积极体验，我们探索将其移植到 Go，并使用一些最小的汇编 shim 来避免引入新的工具链依赖。

这次探索取得了成功——最初从 C++ 到 Go 的直接翻译，后来被进一步精炼为符合 Go 习惯的代码，同时仍能通过移植的测试套件。监视器是一个独立的包，使我们能够在"监视什么"和"为什么监视"之间保持清晰的关注点分离。我们现在在各平台的 `--watch` 模式下看到了显著的资源改进，并且从 TypeScript 7 的早期用户那里听到了积极的反馈。

我们要感谢 Devon Govett 在 Parcel 上的工作，它为 Visual Studio Code 和 TypeScript 项目都带来了巨大的好处。我们希望这次移植能为原始 Parcel 监视器代码库提供机会和见解。

## 自 5.x 以来的更新，以及 6.0 的新行为

TypeScript 7.0 旨在与 TypeScript 6.0 的类型检查和命令行行为兼容。实际上，任何能用 TypeScript 6.0（开启 `stableTypeOrdering` 标志，且未设置任何 `ignoreDeprecations` 标志）干净编译的 TypeScript 代码，都应该在 TypeScript 7.0 中编译出相同的结果。

话虽如此，TypeScript 7.0 采用了 6.0 的新默认值，并对 TypeScript 6.0 中已弃用的任何标志和构造提供硬错误。值得注意的是，6.0 仍然相对较新，许多项目需要适应它的新行为。我们鼓励开发者采用 TypeScript 6.0 以使过渡到 TypeScript 7.0 更容易，你也可以阅读 [TypeScript 6.0 发布博客文章](typescript-6.0.md)以了解更多关于这些弃用的详情。

概览一下，值得注意的配置默认变更包括：

* `strict` 默认为 `true`。
* `module` 默认为 `esnext`。
* `target` 默认为紧接在 `esnext` 之前的当前稳定 ECMAScript 版本。
* `noUncheckedSideEffectImports` 默认为 `true`。
* `libReplacement` 默认为 `false`。
* `stableTypeOrdering` 默认为 `true`，且无法关闭。
* `rootDir` 现在默认为 `./`，内部源目录必须显式设置。
* `types` 现在默认为 `[]`，旧行为可以通过设置为 `["*"]` 来恢复。

我们认为 `rootDir` 和 `types` 的变更可能是最"令人惊讶"的变更，但它们可以很容易地缓解。`tsconfig.json` 位于 `src` 等目录之外的项目，只需包含 `rootDir` 即可保持相同的目录结构。

```json
{
  "compilerOptions": {
    // ...
    "rootDir": "./src"
  },
  "include": ["./src"]
}
```

对于 `types` 的变更，依赖特定全局声明的项目需要显式列出它们。例如：

```json
{
  "compilerOptions": {
    // 显式列出你需要的 @types 包（例如 bun、mocha、jasmine 等）
    "types": ["node", "jest"]
  }
}
```

已变为硬错误（无操作行为）的弃用项包括：

* 不再支持 `target: es5`。
* 不再支持 `downlevelIteration`。
* 不再支持 `moduleResolution: node/node10`，推荐使用 `nodenext` 和 `bundler`。
* 不再支持 `module: amd, umd, systemjs, none`，推荐与打包工具或基于浏览器的模块解析一起使用 `esnext` 或 `preserve`。
* 不再支持 `baseUrl`，`paths` 可以更新为相对于项目根目录而非 `baseUrl`。
* 不再支持 `moduleResolution: classic`，推荐使用 `bundler` 或 `nodenext`。
* `esModuleInterop` 和 `allowSyntheticDefaultImports` 不能设置为 `false`。
* `alwaysStrict` 假定为 `true`，不能再设置为 `false`。
* 不能在 namespace 声明中使用 `module` 关键字。
* 不能在 import 上使用 `asserts` 关键字，必须使用 `with` 关键字（以与 ECMAScript import attributes 语法的发展保持一致）。
* 在 `skipDefaultLibCheck` 下不再尊重 `/// <reference no-default-lib />` 指令。
* 当当前目录包含 `tsconfig.json` 文件时，命令行构建不能接收文件路径，除非传入显式的 `--ignoreConfig` 标志。

### 模板字面量类型现在保留 Unicode 码点

TypeScript 7.0 在从模板字面量类型推断时，现在更自然地处理 Unicode 码点。例如：

```ts
type HeadTail<S> = S extends `${infer Head}${infer Tail}` ? [Head, Tail] : never;

type Result = HeadTail<"😀abc">;
//   ^
// 在 7.0 中：["😀", "abc"]
// 之前：["\ud83d", "\ude00abc"]
```

之前，TypeScript 在这里遵循 JavaScript 的 UTF-16 索引行为，将 `"😀"` 拆分为代理对的两个半部分（`\ud83d` 和 `\ude00`）。这在技术上与 JavaScript 中的索引一致（例如，推断出的 `Head` 类型等于 `"😀abc"[0]`），但通常不是人们想要的，并且可能产生包含不成对代理的字符串字面量类型，这些类型在语义上没有意义。

对于有意建模 UTF-16 代码单元的类型级字符串操作（例如一些字符串 `Length` 工具），这是一个破坏性变更。实际上，我们预计新行为会更有用、更不那么令人惊讶：模板字面量推断现在遵循与使用 `for...of` 迭代字符串或使用 `[...str]` 展开字符串相同的直觉，其中 `"😀"` 被视为一个单元。

### JavaScript 差异

在移植现有代码库的同时，我们也借此机会重新审视 JavaScript 支持的工作方式。

TypeScript 最初通过使用 JSDoc 注释并识别某些代码模式来进行分析和类型推断，从而支持 JavaScript 文件。很多时候，这是基于流行的编码模式，但偶尔是基于人们*可能*编写的、Closure 和 JSDoc 文档生成工具可能理解的任何内容。虽然这种方法对 JSDoc 编写较松散代码库的开发者很有帮助，但它需要许多妥协和特殊情况才能正常工作，并且在许多方面与 TypeScript 对 `.ts` 文件的分析不同。

在 TypeScript 7.0 中，我们重新设计了 JavaScript 支持，使其与 TypeScript 文件的分析方式更加一致。一些差异包括：

* 值不能用在期望类型的位置——请改用 `typeof someValue`
* `@enum` 不再被特殊识别——在 `(typeof YourEnumDeclaration)[keyof typeof YourEnumDeclaration]` 上创建 `@typedef`
* 独立的 `?` 不能再用作类型——请改用 `any`
* `@class` 不会使函数成为构造函数——请改用 `class` 声明
* 不支持后缀 `!`——直接使用 `T`
* 类型名称必须在 `@typedef` 标签内定义（即 `/** @typedef {T} TypeAliasName */`），而不是在标识符旁边（即 `/** @typedef {T} */ TypeAliasName;`）
* 不再支持 Closure 风格的函数语法（例如 `function(string): void`）——请改用 TypeScript 简写（例如 `(s: string) => void`）

此外，一些 JavaScript 模式（如别名 `this` 和重新赋值函数的整个 `prototype`）不再被特殊处理。

虽然我们的部分 JS 支持仍在变化中，我们一直在更新 [CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md) 文件，以更详细地记录 TypeScript 6.0 和 7.0 之间的差异。

## 编辑器体验

TypeScript 7.0 的性能改进不仅限于命令行体验——它们也延伸到编辑器体验。对于 VS Code 用户，TypeScript Native Preview 扩展提供了一种无缝的方式来在编辑器中试用 TypeScript 7.0，并且已被广泛使用。对于 Visual Studio 用户，最新版本的编辑器将根据你的工作区自动启用 TypeScript 7。当然，TypeScript 7 应该在你选择的任何编辑器中都能很好地工作。新基础建立在语言服务器协议（LSP）之上，能够利用多线程尽可能快地响应并发请求。

自首次亮相以来，我们添加了缺失的功能，如自动导入、可展开的悬停提示、内联提示、代码透镜、跳转到源定义、JSX 链接编辑和标签补全等。TypeScript 7.0 beta 中缺失的功能，如语义高亮、"排序 import"、"移除未使用的 import" 等，现在都已加入。

此外，我们在过去几个月继续推动性能和稳定性。我们重建了大部分测试和诊断基础设施，以确保质量标准，其中我们能够对 GitHub 上顶级的 TypeScript 和 JavaScript 代码库进行语言服务器的模糊测试。根据我们的数据洞察，我们相信与 TypeScript 6.0 相比，TypeScript 7 的语言服务器命令失败率降低了 20 倍以上。

该扩展尊重与 VS Code 内置 TypeScript 扩展相同的大多数配置设置，以及大部分相同的功能。

## 通往 TypeScript 7.0 之路

随着 TypeScript 7.0 RC 的发布，我们目前的计划是在未来一个月内发布 TypeScript 7.0，我们将专注于发布协调和后勤、报告的回归问题，以及 TypeScript 7.1 中的未来 API 能力。

从现在到那时，我们特别希望获得在真实项目上试用 TypeScript 7.0 的反馈。如果你遇到任何问题，请在 [microsoft/typescript-go](https://github.com/microsoft/typescript-go/issues) 的 issue 跟踪器上告诉我们，以便我们确保稳定版发布处于良好状态。

我们也鼓励你分享使用 TypeScript 7.0 的体验，并在 Bluesky 上标记 @typescriptlang.org，或在 Mastodon 上标记 @typescript@fosstodon.org，或在 Twitter 上标记 @typescript。

我们的团队非常期待你试用这个版本，所以今天就试试吧，告诉我们你的想法。编码愉快！

—— TypeScript 团队
