# TypeScript 4.7

## Node.js 对 ECMAScript Module 的支持

在过去的几年中，Node.js 为支持 ECMAScript 模块（ESM）而做了一些工作。
这是一项有难度的工作，因为 Node.js 生态圈是基于不同的 CommonJS（CJS）模块系统构建的。
在两者之前进行互操作带来了巨大挑战，有大量的特性需要考虑；
然而，在 Node.js 12 及以上版本中，已经提供了对 ESM 的大部分支持。
在 TypeScript 4.5 期间的一个 nightly 版本中支持了在 Node.js 中使用 ESM 以获得用户反馈，
并且让代码库作者们有时间为此提前作准备。

TypeScript 4.7 正式地支持了该功能，它添加了两个新的 `module` 选项：`node16` 和`nodenext`。

```json
{
    "compilerOptions": {
        "module": "node16",
    }
}
```

这些新模式带来了一些高级特征，下面将一一介绍。

### `package.json` 里的 `type` 和新的扩展名

Node.js 在 [package.json 中支持了一个新的设置](https://nodejs.org/api/packages.html#packages_package_json_and_file_extensions)，叫做 `type`。
`"type"` 可以被设置为 `"module"` 或者 `"commonjs"`。

```json
{
    "name": "my-package",
    "type": "module",

    "//": "...",
    "dependencies": {
    }
}
```

这些设置会控制 `.js` 文件以 ESM 进行解析还是以 CommonJS 模块进行解析，
若没有设置则默认值为 CommonJS。
当一个文件被当做 ESM 模块解析时，会使用如下与 CommonJS 不同的规则：

* 允许使用 `import` / `export` 语句
* 允许使用顶层的 `await`
* 相对路径导入必须提供完整的扩展名（需要使用 `import "./foo.js"` 而非 `import "./foo"`）
* 解析 `node_modules` 里的依赖可能不同
* 不允许直接使用像 `require` 和 `module` 这样的全局值
* 需要使用特殊的规则来导入 CommonJS 模块

我们回头会介绍其中一部分。

为了让 TypeScript 适用该系统，`.ts` 和 `.tsx` 文件现在也以同样的方式工作。
当 TypeScript 找到 `.ts`，`.tsx`，`.js` 或 `.jsx` 文件时，
它会向上查找 `package.json` 来确定该文件是否使用了 ESM，然后再以此决定：

* 如何查找该文件导入的其它模块
* 如何转换文件当需要产生输出的时候

当一个 `.js` 文件被编译为 ESM 时，ECMAScript `import` / `export` 语句在生成的 `.js` 文件中原样输出；
当一个 `.js` 文件被编译为 CommonJS 模块时，则会产生与使用了 `--module commonjs` 选项一致的输出结果。

这也意味着 ESM 和 CJS 模块中的 `.ts` 文件路径解析是不同的。
例如，现在有如下的代码：

```ts
// ./foo.ts
export function helper() {
    // ...
}

// ./bar.ts
import { helper } from "./foo"; // only works in CJS

helper();
```

这段代码在 CommonJS 模块里没问题，但在 ESM 里会出错，因为相对导入需要使用完整的扩展名。
因此，我们不得不重写代码并使用 `foo.ts` 输出文件的扩展名，`bar.ts` 必须从 `./foo.js` 导入。

```ts
// ./bar.ts
import { helper } from "./foo.js"; // works in ESM & CJS

helper();
```

初看可能感觉很繁琐，但 TypeScript 的自动导入工具以及路径补全工具会有所帮助。

还需要注意的是该行为同样适用于 `.d.ts` 文件。
当 TypeScript 在一个 package 里找到了 `.d.ts` 文件，它会基于这个 package 来解析 `.d.ts` 文件。
