# TypeScript 5.7

## 检查未初始化的变量

长期以来，TypeScript 已经能够在所有先前的分支中捕获变量未初始化的问题。

```typescript
let result: number;
if (someCondition()) {
  result = doSomeWork();
} else {
  let temporaryWork = doSomeWork();
  temporaryWork *= 2;
  // 忘记赋值给 'result'
}

console.log(result); // 错误：变量 'result' 在使用前未赋值。
```

不幸的是，在某些情况下这种分析不起作用。
例如，如果变量在单独的函数中访问，类型系统不知道函数何时被调用，而是采取“乐观”的观点，认为变量将被初始化。

```typescript
function foo() {
  let result: number;
  if (someCondition()) {
    result = doSomeWork();
  } else {
    let temporaryWork = doSomeWork();
    temporaryWork *= 2;
    // 忘记赋值给 'result'
  }

  printResult();

  function printResult() {
    console.log(result); // 这里没有错误。
  }
}
```

虽然 TypeScript 5.7 仍然对可能已初始化的变量持宽松态度，但当变量从未初始化时，类型系统能够报告错误。

```typescript
function foo() {
  let result: number;

  // 做了一些工作，但忘记赋值给 'result'

  function printResult() {
    console.log(result); // 错误：变量 'result' 在使用前未赋值。
  }
}
```

这一[变化](https://github.com/microsoft/TypeScript/pull/55887)得益于 GitHub 用户 [Zzzen](https://github.com/Zzzen) 的贡献！

## 相对路径的路径重写

有一些工具和运行时允许你“就地”运行 TypeScript 代码，这意味着它们不需要生成输出 JavaScript 文件的构建步骤。
例如，`ts-node`、`tsx`、Deno 和 Bun 都支持直接运行 `.ts` 文件。
最近，Node.js 也在研究通过 `--experimental-strip-types`（即将 unflagged！）和 `--experimental-transform-types` 来支持这种功能。
这非常方便，因为它允许我们更快地迭代，而不用担心重新运行构建任务。

不过，在使用这些模式时需要注意一些复杂性。
为了与所有这些工具最大限度地兼容，在运行时导入“就地”运行的 TypeScript 文件时必须使用适当的 TypeScript 扩展名。
例如，要导入名为 `foo.ts` 的文件，我们必须在 Node 的新实验性支持中编写以下内容：

```typescript
// main.ts

import * as foo from './foo.ts'; // <- 这里需要 foo.ts，而不是 foo.js
```

通常，TypeScript 会在此情况下发出错误，因为它期望我们导入输出文件。
由于某些工具确实允许 `.ts` 导入，TypeScript 已经支持这种导入风格，并通过一个名为 `--allowImportingTsExtensions` 的选项支持了一段时间。
这工作得很好，但如果我们需要从这些 `.ts` 文件生成 `.js` 文件会发生什么？
这是库作者的要求，他们需要能够仅分发 `.js` 文件，但到目前为止，TypeScript 一直避免重写任何路径。

为了支持这种场景，我们添加了一个新的编译器选项 `--rewriteRelativeImportExtensions`。
当导入路径是相对的（以 `./` 或 `../` 开头），以 TypeScript 扩展名（`.ts`、`.tsx`、`.mts`、`.cts`）结尾，并且是非声明文件时，编译器会将路径重写为相应的 JavaScript 扩展名（`.js`、`.jsx`、`.mjs`、`.cjs`）。

```typescript
// 在 --rewriteRelativeImportExtensions 下...

// 这些将被重写。
import * as foo from './foo.ts';
import * as bar from '../someFolder/bar.mts';

// 这些不会以任何方式被重写。
import * as a from './foo';
import * as b from 'some-package/file.ts';
import * as c from '@some-scope/some-package/file.ts';
import * as d from '#/file.ts';
import * as e from './file.js';
```

这使我们能够编写可以就地运行的 TypeScript 代码，然后在准备好时将其编译为 JavaScript。

现在，我们注意到 TypeScript 通常避免重写路径。
这有几个原因，但最明显的一个是动态导入。
如果开发人员编写了以下内容，处理 `import` 接收的路径并不容易。
事实上，不可能覆盖任何依赖项中 `import` 的行为。

```typescript
function getPath() {
  if (Math.random() < 0.5) {
    return './foo.ts';
  } else {
    return './foo.js';
  }
}

let myImport = await import(getPath());
```

另一个问题是（如上所述）只有相对路径会被重写，并且它们是被“天真地”重写。
这意味着任何依赖于 TypeScript 的 `baseUrl` 和 `paths` 的路径都不会被重写：

```typescript
// tsconfig.json

{
    "compilerOptions": {
        "module": "nodenext",
        // ...
        "paths": {
            "@/*": ["./src/*"]
        }
    }
}
```

```typescript
// 不会被转换，不会工作。
import * as utilities from '@/utilities.ts';
```

任何可能通过 `package.json` 的 [`exports`](https://nodejs.org/api/packages.html#exports) 和 [`imports`](https://nodejs.org/api/packages.html#imports) 字段解析的路径也不会被重写。

```typescript
// package.json
{
    "name": "my-package",
    "imports": {
        "#root/*": "./dist/*"
    }
}
```

```typescript
// 不会被转换，不会工作。
import * as utilities from '#root/utilities.ts';
```

因此，如果你一直在使用多包相互引用的工作区风格布局，你可能需要使用带有[作用域自定义条件](https://nodejs.org/api/packages.html#resolving-user-conditions)的[条件导出](https://nodejs.org/api/packages.html#conditional-exports)：

```typescript
// my-package/package.json

{
    "name": "my-package",
    "exports": {
        ".": {
            "@my-package/development": "./src/index.ts",
            "import": "./lib/index.js"
        },
        "./*": {
            "@my-package/development": "./src/*.ts",
            "import": "./lib/*.js"
        }
    }
}
```

任何时候你想导入 `.ts` 文件，你可以使用 `node --conditions=@my-package/development` 运行它。

注意我们为条件 `@my-package/development` 使用的“命名空间”或“作用域”。
这是一个临时的解决方案，以避免依赖项可能也使用 `development` 条件时的冲突。
如果每个人都在他们的包中提供了 `development`，那么解析可能会尝试解析到 `.ts` 文件，而这不一定有效。
这个想法类似于 Colin McDonnell 的文章[《TypeScript 单体仓库中的实时类型》](https://colinhacks.com/essays/live-types-typescript-monorepo#:~:text=custom%20conditions)中描述的内容，以及 [`tshy` 的从源代码加载的指南](https://github.com/isaacs/tshy#loading-from-source)。

有关此功能如何工作的更多详细信息，[请阅读此处的更改](https://github.com/microsoft/TypeScript/pull/59767)。

## 支持 `--target es2024` 和 `--lib es2024`

TypeScript 5.7 现在支持 `--target es2024`，允许用户以 ECMAScript 2024 运行时为目标。
此目标主要启用了新的 `--lib es2024`，其中包含许多 `SharedArrayBuffer` 和 `ArrayBuffer`、`Object.groupBy`、`Map.groupBy`、`Promise.withResolvers` 等功能。
它还将 `Atomics.waitAsync` 从 `--lib es2022` 移动到 `--lib es2024`。

请注意，作为 `SharedArrayBuffer` 和 `ArrayBuffer` 更改的一部分，两者现在有些分歧。
为了弥合差距并保留底层缓冲区类型，所有 `TypedArray`（如 `Uint8Array` 等）现在也是[泛型的](https://github.com/microsoft/TypeScript/pull/59417)。

```typescript
interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
  // ...
}
```

每个 `TypedArray` 现在都包含一个名为 `TArrayBuffer` 的类型参数，尽管该类型参数有一个默认的类型参数，因此我们可以继续引用 `Int32Array` 而无需显式写出 `Int32Array<ArrayBufferLike>`。

如果你在此更新过程中遇到任何问题，你可能需要更新 `@types/node`。

[这项工作](https://github.com/microsoft/TypeScript/pull/58573)主要由 [Kenta Moriuchi](https://github.com/petamoriken) 提供！

## 在编辑器中搜索祖先配置文件以确定项目所有权

当使用 TSServer（如 Visual Studio 或 VS Code）在编辑器中加载 TypeScript 文件时，编辑器会尝试找到“拥有”该文件的相关 `tsconfig.json` 文件。
为此，它会从正在编辑的文件向上遍历目录树，查找任何名为 `tsconfig.json` 的文件。

以前，此搜索会在找到第一个 `tsconfig.json` 文件时停止；
然而，想象一下如下的项目结构：

```plaintext
project/
├── src/
│   ├── foo.ts
│   ├── foo-test.ts
│   ├── tsconfig.json
│   └── tsconfig.test.json
└── tsconfig.json
```

这里的想法是 `src/tsconfig.json` 是项目的“主”配置文件，而 `src/tsconfig.test.json` 是用于运行测试的配置文件。

```json
// src/tsconfig.json
{
  "compilerOptions": {
    "outDir": "../dist"
  },
  "exclude": ["**/*.test.ts"]
}
```

```json
// src/tsconfig.test.json
{
  "compilerOptions": {
    "outDir": "../dist/test"
  },
  "include": ["**/*.test.ts"],
  "references": [{ "path": "./tsconfig.json" }]
}
```

```json
// tsconfig.json
{
  // 这是一个“工作区风格”或“解决方案风格”的 tsconfig。
  // 它不指定任何文件，而是引用所有实际项目。
  "files": [],
  "references": [
    { "path": "./src/tsconfig.json" },
    { "path": "./src/tsconfig.test.json" }
  ]
}
```

这里的问题是，当编辑 `foo-test.ts` 时，编辑器会找到 `project/src/tsconfig.json` 作为“拥有”配置文件——但这并不是我们想要的！
如果遍历在此停止，这可能不是我们想要的。
以前避免这种情况的唯一方法是将 `src/tsconfig.json` 重命名为 `src/tsconfig.src.json`，然后所有文件都会命中引用每个可能项目的顶级 `tsconfig.json`。

```plaintext
project/
├── src/
│   ├── foo.ts
│   ├── foo-test.ts
│   ├── tsconfig.src.json
│   └── tsconfig.test.json
└── tsconfig.json
```

为了避免强迫开发人员这样做，TypeScript 5.7 现在继续向上遍历目录树，以找到其他合适的 `tsconfig.json` 文件用于编辑器场景。这可以为项目的组织方式和配置文件的结构提供更多的灵活性。

你可以在 GitHub 上获取有关实现的更多详细信息 [这里](https://github.com/microsoft/TypeScript/pull/51925) 和 [这里](https://github.com/microsoft/TypeScript/pull/51926)。

## 编辑器中复合项目的更快项目所有权检查

想象一下具有以下结构的大型代码库：

```plaintext
packages
├── graphics/
│   ├── tsconfig.json
│   └── src/
│       └── ...
├── sound/
│   ├── tsconfig.json
│   └── src/
│       └── ...
├── networking/
│   ├── tsconfig.json
│   └── src/
│       └── ...
├── input/
│   ├── tsconfig.json
│   └── src/
│       └── ...
└── app/
    ├── tsconfig.json
    ├── some-script.js
    └── src/
        └── ...
```

`packages` 中的每个目录都是一个单独的 TypeScript 项目，而 `app` 目录是依赖于所有其他项目的主项目。

```json
// app/tsconfig.json
{
  "compilerOptions": {
    // ...
  },
  "include": ["src"],
  "references": [
    { "path": "../graphics/tsconfig.json" },
    { "path": "../sound/tsconfig.json" },
    { "path": "../networking/tsconfig.json" },
    { "path": "../input/tsconfig.json" }
  ]
}
```

现在注意到我们在 `app` 目录中有文件 `some-script.js`。当我们在编辑器中打开 `some-script.js` 时，TypeScript 语言服务（它也处理 JavaScript 文件的编辑器体验！）必须确定该文件属于哪个项目，以便应用正确的设置。

在这种情况下，最近的 `tsconfig.json` 不包括 `some-script.js`，但 TypeScript 会继续询问“`app/tsconfig.json` 引用的项目之一是否可能包括 `some-script.js`？”。为此，TypeScript 之前会逐个加载每个项目，并在找到包含 `some-script.js` 的项目时停止。即使 `some-script.js` 不包括在根文件集中，TypeScript 仍然会解析项目中的所有文件，因为某些根文件仍然可以间接引用 `some-script.js`。

随着时间的推移，我们发现这种行为在较大的代码库中导致了极端且不可预测的行为。开发人员会打开杂散的脚本文件，并发现自己等待整个代码库被打开。

幸运的是，每个可以被另一个（非工作区）项目引用的项目都必须启用一个名为 `composite` 的标志，该标志强制执行一条规则，即所有输入源文件必须事先已知。因此，在探测复合项目时，TypeScript 5.7 只会检查文件是否属于该项目的根文件集。这应该可以避免这种常见的最坏情况行为。

有关更多信息，[请参阅此处的更改](https://github.com/microsoft/TypeScript/pull/59688)。

## 在 `--module nodenext` 中验证 JSON 导入

在 `--module nodenext` 下从 `.json` 文件导入时，TypeScript 现在将强制执行某些规则以防止运行时错误。

首先，任何 JSON 文件导入都需要包含 `type: "json"` 的导入属性。

```typescript
import myConfig from "./myConfig.json";
//                   ~~~~~~~~~~~~~~~~~
// ❌ 错误：当 'module' 设置为 'NodeNext' 时，将 JSON 文件导入 ECMAScript 模块需要 'type: "json"' 导入属性。

import myConfig from "./myConfig.json" with { type: "json" };
//                                          ^^^^^^^^^^^^^^^^
// ✅ 这是可以的，因为我们提供了 `type: "json"`
```

除此之外，TypeScript 不会生成“命名”导出，并且 JSON 导入的内容只能通过默认导出访问。

```typescript
// ✅ 这是可以的：
import myConfigA from "./myConfig.json" with { type: "json" };
let version = myConfigA.version;

///////////

import * as myConfigB from "./myConfig.json" with { type: "json" };

// ❌ 这是不可以的：
let version = myConfig.version;

// ✅ 这是可以的：
let version = myConfig.default.version;
```

有关此更改的更多信息，请参阅[此处](https://github.com/microsoft/TypeScript/pull/60019)。

## 支持 Node.js 中的 V8 编译缓存

Node.js 22 支持一个新的 API，称为 `module.enableCompileCache()`。此 API 允许运行时在工具的第一次运行后重用一些解析和编译工作。

TypeScript 5.7 现在利用此 API，以便它可以更快地开始做有用的工作。在我们的一些测试中，我们见证了运行 `tsc --version` 的速度提高了约 2.5 倍。

```plaintext
基准测试 1：node ./built/local/_tsc.js --version（无缓存）
  时间（平均值 ± 标准差）：122.2 ms ± 1.5 ms [用户：101.7 ms，系统：13.0 ms]
  范围（最小 … 最大）：119.3 ms … 132.3 ms，200 次运行

基准测试 2：node ./built/local/tsc.js --version（有缓存）
  时间（平均值 ± 标准差）：48.4 ms ± 1.0 ms [用户：34.0 ms，系统：11.1 ms]
  范围（最小 … 最大）：45.7 ms … 52.8 ms，200 次运行

总结
  node ./built/local/tsc.js --version 运行速度比 node ./built/local/_tsc.js --version 快 2.52 ± 0.06 倍
```

有关更多信息，请参阅此处的 [Pull Request](https://github.com/microsoft/TypeScript/pull/59720)。

## 重要的行为变化

本节概述了一些需要注意的重要变化，作为升级的一部分，应该理解并加以确认。有时，它会突出弃用、移除以及新的限制条件。它也可能包含功能性改进的 Bug 修复，但这些改进也可能通过引入新的错误影响现有构建。

### lib.d.ts

为 DOM 生成的类型可能会影响代码库的类型检查。有关更多信息，[请查看与 DOM 和 lib.d.ts 更新相关的链接问题，以了解此版本 TypeScript 的更新内容](https://github.com/microsoft/TypeScript/pull/60061)。

### TypedArrays 现在是基于 ArrayBufferLike 的泛型

在 ECMAScript 2024 中，SharedArrayBuffer 和 ArrayBuffer 的类型稍微有所不同。为了填补这一差距并保留底层缓冲区类型，所有 TypedArrays（如 Uint8Array 等）[现在也变为泛型](https://github.com/microsoft/TypeScript/pull/59417)。

```ts
interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
  // ...
}
```

现在每个 TypedArray 都包含一个名为 `TArrayBuffer` 的类型参数，虽然该类型参数有默认的类型参数，这样用户可以继续使用 `Int32Array`，而不需要显式地写出 `Int32Array<ArrayBufferLike>`。

如果在更新过程中遇到如下错误：

```ts
error TS2322: Type 'Buffer' is not assignable to type 'Uint8Array<ArrayBufferLike>'.
error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'Uint8Array<ArrayBufferLike>'.
error TS2345: Argument of type 'ArrayBufferLike' is not assignable to parameter of type 'ArrayBuffer'.
error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'string | ArrayBufferView | Stream | Iterable<string | ArrayBufferView> | AsyncIterable<string | ArrayBufferView>'.
```

那么，您可能需要更新 `@types/node`。

您可以在[ GitHub 上阅读有关此更改的具体内容](https://github.com/microsoft/TypeScript/pull/59417)。

### 在类中使用非字面量方法名创建索引签名

TypeScript 现在对类中的方法具有更一致的行为，尤其是当它们使用非字面量计算属性名声明时。例如，在以下代码中：

```ts
declare const symbolMethodName: symbol;

export class A {
  [symbolMethodName]() {
    return 1;
  }
}
```

之前，TypeScript 将类视为如下：

```ts
export class A {}
```

换句话说，从类型系统的角度来看，`[symbolMethodName]` 对类 `A` 的类型没有任何贡献。

TypeScript 5.7 现在更加有意义地处理 `[symbolMethodName]() {}` 方法，并生成一个索引签名。因此，上面的代码被解释为类似以下代码：

```ts
export class A {
  [x: symbol]: () => number;
}
```

这种行为与对象字面量中的属性和方法一致。

[有关此更改的详细信息，请阅读此处](https://github.com/microsoft/TypeScript/pull/59860).

### 对返回 `null` 和 `undefined` 的函数更多的隐式 `any` 错误

当函数表达式由返回泛型类型的签名进行上下文类型推断时，TypeScript 现在在 `noImplicitAny` 模式下适当地提供隐式 `any` 错误，但在 `strictNullChecks` 之外。

```ts
declare var p: Promise<number>;
const p2 = p.catch(() => null);
//                 ~~~~~~~~~~
// error TS7011: Function expression, which lacks return-type annotation, implicitly has an 'any' return type.
```

[有关此更改的更多细节，请查看此处](https://github.com/microsoft/TypeScript/pull/59661)。

### 接下来的计划

我们将在不久后发布有关下一版本 TypeScript 的详细计划。如果您正在寻找最新的修复和功能，我们让您可以轻松使用 npm 上的 nightly 构建版本的 TypeScript，并且我们还发布了一个扩展，可以在 Visual Studio Code 中使用这些 nightly 版本。

否则，我们希望 TypeScript 5.7 能为您的编程带来愉悦体验。祝编程愉快！
