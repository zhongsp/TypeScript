# TypeScript 4.7

## Node.js 对 ECMAScript Module 的支持

在过去的几年中，Node.js 为支持 ECMAScript 模块（ESM）而做了一些工作。
这是一项有难度的工作，因为 Node.js 生态圈是基于 CommonJS（CJS）模块系统构建的，而非 ESM。
支持两者之间的互操作带来了巨大挑战，有大量的特性需要考虑；
然而，在 Node.js 12 及以上版本中，已经提供了对 ESM 的大部分支持。
在 TypeScript 4.5 期间的一个 nightly 版本中支持了在 Node.js 里使用 ESM 以获得用户反馈，
同时让代码库作者们有时间为此提前作准备。

TypeScript 4.7 正式地支持了该功能，它添加了两个新的 `module` 选项：`node16` 和`nodenext`。

```json
{
    "compilerOptions": {
        "module": "node16",
    }
}
```

这些新模式带来了一些高级特征，下面将一一介绍。

### `package.json` 里的 `type` 字段和新的文件扩展名

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

这些设置会控制 `.js` 文件是作为 ESM 进行解析还是作为 CommonJS 模块进行解析，
若没有设置，则默认值为 CommonJS。
当一个文件被当做 ESM 模块进行解析时，会使用如下与 CommonJS 模块不同的规则：

* 允许使用 `import` / `export` 语句
* 允许使用顶层的 `await`
* 相对路径导入必须提供完整的扩展名（需要使用 `import "./foo.js"` 而非 `import "./foo"`）
* 解析 `node_modules` 里的依赖可能不同
* 不允许直接使用像 `require` 和 `module` 这样的全局值
* 需要使用特殊的规则来导入 CommonJS 模块

我们回头会介绍其中一部分。

为了让 TypeScript 融入该系统，`.ts` 和 `.tsx` 文件现在也以同样的方式工作。
当 TypeScript 遇到 `.ts`，`.tsx`，`.js` 或 `.jsx` 文件时，
它会向上查找 `package.json` 来确定该文件是否使用了 ESM，然后再以此决定：

* 如何查找该文件所导入的其它模块
* 当需要产生输出的时，如何转换该文件

当一个 `.ts` 文件被编译为 ESM 时，ECMAScript `import` / `export` 语句在生成的 `.js` 文件中原样输出；
当一个 `.ts` 文件被编译为 CommonJS 模块时，则会产生与使用了 `--module commonjs` 选项一致的输出结果。

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

此外还需要注意的是该行为同样适用于 `.d.ts` 文件。
当 TypeScript 在一个 package 里找到了 `.d.ts` 文件，它会基于这个 package 来解析 `.d.ts` 文件。

### 新的文件扩展名

`package.json` 文件里的 `type` 字段让我们可以继续使用 `.ts` 和 `.js` 文件扩展名；
但你可能偶尔需要编写与 `type` 设置不符的文件，或者更喜欢明确地表达意图。

为此，Node.js 支持了两个文件扩展名：`.mjs` 和 `.cjs`。
`.mjs` 文件总是使用 ESM，而 `.cjs` 则总是使用 CommonJS 模块，
它们分别会生成 `.mjs` 和`.cjs` 文件。

正因此，TypeScript 也支持了两个新的文件扩展名：`.mts` 和 `.cts`。
当 TypeScript 生成 JavaScript 文件时，将生成 `.mjs` 和`.cjs`。

TypeScript 还支持了两个新的声明文件扩展名：`.d.mts` 和 `.d.cts`。
当 TypeScript 为 `.mts` 和 `.cts` 生成声明文件时，对应的扩展名为 `.d.mts` 和 `.d.cts`。

这些扩展名的使用完全是可选的，但通常是有帮助的，不论它们是不是你工作流中的一部分。

### CommonJS 互操作性

Node.js 允许 ESM 导入 CommonJS 模块，就如同它们是带有默认导出的 ESM。

```ts
// ./foo.cts
export function helper() {
    console.log("hello world!");
}

// ./bar.mts
import foo from "./foo.cjs";

// prints "hello world!"
foo.helper();
```

在某些情况下，Node.js 会综合和合成 CommonJS 模块里的命名导出，这提供了便利。
此时，ESM 既可以使用“命名空间风格”的导入（例如，`import * as foo from "..."`），
也可以使用命名导入（例如，`import { helper } from "..."`）。

```ts
// ./foo.cts
export function helper() {
    console.log("hello world!");
}

// ./bar.mts
import { helper } from "./foo.cjs";

// prints "hello world!"
helper();
```

有时候 TypeScript 不知道命名导入是否会被综合合并，但如果 TypeScript 能够通过确定地 CommonJS 模块导入了解到该信息，那么就会提示错误。

关于互操作性，TypeScript 特有的注意点是如下的语法：

```ts
import foo = require("foo");
```

在 CommonJS 模块中，它可以归结为 `require()` 调用，
在 ESM 里，它会导入 [createRequire](https://nodejs.org/api/module.html#module_module_createrequire_filename) 来完成同样的事情。
对于像浏览器这样的平台（不支持 `require()`）这段代码的可移植性较差，但对互操作性是有帮助的。
你可以这样改写：

```ts
// ./foo.cts
export function helper() {
    console.log("hello world!");
}

// ./bar.mts
import foo = require("./foo.cjs");

foo.helper()
```

最后值得注意的是在 CommonJS 模块里导入 ESM 的唯一方法是使用动态 `import()` 调用。
这也许是一个挑战，但也是目前 Node.js 的行为。

更多详情，请阅读[这里](https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs)。

### package.json 中的 `exports`, `imports` 以及自引用

Node.js 在 `package.json` 支持了一个新的字段 [`exports`](https://nodejs.org/api/packages.html#packages_exports) 来定义入口位置。
它比在 `package.json` 里定义 `"main"` 更强大，它能控制将包里的哪些部分公开给使用者。

下例的 `package.json` 支持对 CommonJS 和 ESM 使用不同的入口位置：

```json
// package.json
{
    "name": "my-package",
    "type": "module",
    "exports": {
        ".": {
            // Entry-point for `import "my-package"` in ESM
            "import": "./esm/index.js",

            // Entry-point for `require("my-package") in CJS
            "require": "./commonjs/index.cjs",
        },
    },

    // CJS fall-back for older versions of Node.js
    "main": "./commonjs/index.cjs",
}
```

关于该特性的更多详情请阅读[这里](https://nodejs.org/api/packages.html)。
下面我们主要关注 TypeScript 是如何支持它的。

在以前 TypeScript 会先查找 `"main"` 字段，然后再查找其对应的声明文件。
例如，如果 `"main"` 指向了 `./lib/index.js`，
TypeScript 会查找名为 `./lib/index.d.ts` 的文件。
代码包作者可以使用 `"types"` 字段来控制该行为（例如，`"types": "./types/index.d.ts"`）。

新实现的工作方式与[导入条件](https://nodejs.org/api/packages.html)相似。
默认地，TypeScript 使用与**导入条件**相同的规则 -
对于 ESM 里的 `import` 语句，它会查找 `import` 字段；
对于 CommonJS 模块里的 `import` 语句，它会查找 `require` 字段。
如果找到了文件，则去查找相应的声明文件。
如果你想将声明文件指向其它位置，则可以添加一个 `"types"` 导入条件。

```json
// package.json
{
    "name": "my-package",
    "type": "module",
    "exports": {
        ".": {
            // Entry-point for `import "my-package"` in ESM
            "import": {
                // Where TypeScript will look.
                "types": "./types/esm/index.d.ts",

                // Where Node.js will look.
                "default": "./esm/index.js"
            },
            // Entry-point for `require("my-package") in CJS
            "require": {
                // Where TypeScript will look.
                "types": "./types/commonjs/index.d.cts",

                // Where Node.js will look.
                "default": "./commonjs/index.cjs"
            },
        }
    },

    // Fall-back for older versions of TypeScript
    "types": "./types/index.d.ts",

    // CJS fall-back for older versions of Node.js
    "main": "./commonjs/index.cjs"
}
```

**注意**，`"types"` 条件在 `"exports"` 中需要被放在开始的位置。

TypeScript 也支持 `package.json` 里的 [`"imports"`](https://nodejs.org/api/packages.html#packages_imports) 字段，它与查找声明文件的工作方式类似。
此外，还支持[一个包引用它自己](https://nodejs.org/api/packages.html#packages_self_referencing_a_package_using_its_name)。
这些特性通常不特殊设置，但是是支持的。

## 设置模块检测策略

在 JavaScript 中引入模块带来的一个问题是让“Script”代码和新的模块代码之间的界限变得模糊。
（译者注：对于任意一段 JavaScript 代码，它的类型只能为 “Script” 或 “Module” 两者之一，它们是 ECMAScript 语言规范中定义的术语。）
模块中的 JavaScript 存在些许不同的执行方式和作用域规则，因此工具们需要确定每个文件的执行方式。
例如，Node.js 要求模块入口脚本是一个 `.mjs` 文件，或者它有一个邻近的 `package.json` 文件且带有 `"type": "module"`。
TypeScript 的规则则是如果一个文件里存在 `import` 或 `export` 语句，那么它是模块文件；
反之会把 `.ts` 和 `.js` 文件当作是 “Script” 文件，它们存在于**全局作用域**。

这与 Node.js 中对 `package.json` 的处理行为不同，因为 `package.json` 可以改变文件的类型；又或者是在 `--jsx react-jsx` 模式下一个 JSX 文件显式地导入了 JSX 工厂函数。
它也与当下的期望不符，因为大多数的 TypeScript 代码是基于模块来编写的。

以上就是 TypeScript 4.7 引入了 `moduleDetection. moduleDetection` 选项的原因。
它接受三个值：

1. `"auto"`，默认值
1. `"legacy"`，行为与 TypeScript 4.6 和以前的版本相同
1. `"force"`

在 `"auto"` 模式下，TypeScript 不会检测 `import` 和 `export` 语句，但它仍会检测：

* 若启用了 `--module nodenext` / `--module node16`，那么 `package.json` 里的 `"type"` 字段是否为 `"module"`，以及
* 若启用了 `--jsx react-jsx`，那么当前文件是否为 JSX 文件。

在这些情况下，我们想将每个文件都当作模块。
`"force"` 选项能够保证每个非声明文件都被当成模块文件，不论 `module`，`moduleResoluton` 和 `jsx` 是如何设置的。

与此同时，使用 `"legacy"` 选项会回退到以前的行为，仅通过查找 `import` 和 `export` 语句来决定是否为模块。

更多详情请阅读[PR](https://github.com/microsoft/TypeScript/pull/47495)。

## `[]` 语法元素访问的控制流分析

在 TypeScript 4.7 里，当索引键值是字面量类型和 `unique symbol` 类型时会细化访问元素的类型。
例如，有如下代码：

```ts
const key = Symbol();

const numberOrString = Math.random() < 0.5 ? 42 : "hello";

const obj = {
    [key]: numberOrString,
};

if (typeof obj[key] === "string") {
    let str = obj[key].toUpperCase();
}
```

在之前，TypeScript 不会处理涉及 `obj[key]` 的类型守卫，也就不知道 `obj[key]` 的类型是 `string`。
它会将 `obj[key]` 当作 `string | number` 类型，因此调用 `toUpperCase()` 会产生错误。

TypeScript 4.7 能够知道 `obj[key]` 的类型为 `string`。

这意味着在 `--strictPropertyInitialization` 模式下，TypeScript 能够正确地检查*计算属性*是否被初始化。

```ts
// 'key' has type 'unique symbol'
const key = Symbol();

class C {
    [key]: string;

    constructor(str: string) {
        // oops, forgot to set 'this[key]'
    }

    screamString() {
        return this[key].toUpperCase();
    }
}
```

在 TypeScript 4.7 里，`--strictPropertyInitialization` 会提示错误说 `[key]` 属性在构造函数里没有被赋值。

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 提交的[代码](https://github.com/microsoft/TypeScript/pull/45974)。
