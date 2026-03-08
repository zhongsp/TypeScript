# TypeScript 5.9

## 最小化且更新的 `tsc --init`

长期以来，TypeScript 编译器支持 `--init` 标志，可在当前目录中创建 `tsconfig.json`。
在过去几年中，运行 `tsc --init` 会生成一个非常"完整"的 `tsconfig.json`，其中充满了已注释掉的设置及其描述。
我们这样设计的初衷是让选项易于发现和切换。

然而，根据外部反馈（以及我们自己的经验），我们发现用户通常会立即删除这些新 `tsconfig.json` 文件中的大部分内容。
当用户想要发现新选项时，他们依赖编辑器的自动补全，或访问[我们网站上的 tsconfig 参考页面](https://www.typescriptlang.org/tsconfig/)（生成的 `tsconfig.json` 中有链接！）。
每个设置的用途也记录在同一页面上，并可通过编辑器的悬停提示/工具提示/快速信息查看。
虽然展示一些已注释掉的设置可能有所帮助，但生成的 `tsconfig.json` 通常被认为过于臃肿。

我们也认为是时候让 `tsc --init` 初始化一些比现有更具指导性的设置了。
我们研究了用户在创建新 TypeScript 项目时遇到的一些常见痛点。
例如，大多数用户编写的是模块（而非全局脚本），而 `--moduleDetection` 可以强制 TypeScript 将每个实现文件视为模块。
开发者通常也希望在运行时直接使用最新的 ECMAScript 特性，因此 `--target` 通常可以设置为 `esnext`。
JSX 用户经常发现回过头来设置 `--jsx` 是不必要的摩擦，且其选项略显混乱。
而且，项目最终往往会从 `node_modules/@types` 加载比 TypeScript 实际所需更多的声明文件；但指定一个空的 `types` 数组可以帮助限制这一点。

在 TypeScript 5.9 中，不带其他标志的普通 `tsc --init` 将生成以下 `tsconfig.json`：

```json5
{
  // Visit https://aka.ms/tsconfig to read more about this file
  compilerOptions: {
    // File Layout
    // "rootDir": "./src",
    // "outDir": "./dist",

    // Environment Settings
    // See also https://aka.ms/tsconfig_modules
    module: 'nodenext',
    target: 'esnext',
    types: [],
    // For nodejs:
    // "lib": ["esnext"],
    // "types": ["node"],
    // and npm install -D @types/node

    // Other Outputs
    sourceMap: true,
    declaration: true,
    declarationMap: true,

    // Stricter Typechecking Options
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,

    // Style Options
    // "noImplicitReturns": true,
    // "noImplicitOverride": true,
    // "noUnusedLocals": true,
    // "noUnusedParameters": true,
    // "noFallthroughCasesInSwitch": true,
    // "noPropertyAccessFromIndexSignature": true,

    // Recommended Options
    strict: true,
    jsx: 'react-jsx',
    verbatimModuleSyntax: true,
    isolatedModules: true,
    noUncheckedSideEffectImports: true,
    moduleDetection: 'force',
    skipLibCheck: true,
  },
}
```

有关更多详细信息，请参阅[实现拉取请求](https://github.com/microsoft/TypeScript/pull/61813)和[讨论问题](https://github.com/microsoft/TypeScript/issues/58420)。

## 支持 `import defer`

TypeScript 5.9 引入了对 [ECMAScript 延迟模块求值提案](https://github.com/tc39/proposal-defer-import-eval/) 的支持，使用新的 `import defer` 语法。
此功能允许你在不立即执行模块及其依赖项的情况下导入模块，从而更好地控制何时发生工作和副作用。

该语法仅允许命名空间导入：

```ts
import * as feature from './some-feature.js';
```

`import defer` 的关键优势在于，只有当首次访问其某个导出项时，模块才会被求值。
请看以下示例：

```ts
// ./some-feature.ts
initializationWithSideEffects();

function initializationWithSideEffects() {
  // ...
  specialConstant = 42;

  console.log('Side effects have occurred!');
}

export let specialConstant: number;
```

使用 `import defer` 时，`initializationWithSideEffects()` 函数在你实际访问导入的命名空间的属性之前不会被调用：

```ts
import * as feature from './some-feature.js';

// No side effects have occurred yet

// ...

// As soon as `specialConstant` is accessed, the contents of the `feature`
// module are run and side effects have taken place.
console.log(feature.specialConstant); // 42
```

由于模块的求值被推迟到你访问模块的成员时，你不能对 `import defer` 使用命名导入或默认导入：

```ts
// ❌ Not allowed
import { doSomething } from 'some-module';

// ❌ Not allowed
import defaultExport from 'some-module';

// ✅ Only this syntax is supported
import * as feature from 'some-module';
```

请注意，当你编写 `import defer` 时，模块及其依赖项已完全加载并准备好执行。
这意味着模块需要存在，并将从文件系统或网络资源加载。
普通 `import` 与 `import defer` 的关键区别在于，*语句和声明的执行*被推迟到你访问导入的命名空间的属性时。

此功能特别适用于条件加载具有昂贵或平台特定初始化的模块。它还可以通过推迟对应用功能的模块求值直到实际需要时，来提升启动性能。

请注意，`import defer` 不会被 TypeScript 转换或"降级"。
它旨在用于原生支持该功能的运行时，或由可应用适当转换的打包工具等工具使用。
这意味着 `import defer` 仅在 `--module` 模式 `preserve` 和 `esnext` 下有效。

我们衷心感谢 [Nicolò Ribaudo](https://github.com/nicolo-ribaudo)，他在 TC39 中推动了该提案，并[提供了此功能的实现](https://github.com/microsoft/TypeScript/pull/60757)。

## 支持 `--module node20`

TypeScript 为 `--module` 和 `--moduleResolution` 设置提供了几个 `node*` 选项。
最近，`--module nodenext` 支持了从 CommonJS 模块中 `require()` ECMAScript 模块的能力，并正确拒绝了导入断言（以支持符合标准的[导入属性](https://github.com/tc39/proposal-import-attributes)）。

TypeScript 5.9 为这些设置带来了一个名为 `node20` 的稳定选项，旨在模拟 Node.js v20 的行为。
与 `--module nodenext` 或 `--moduleResolution nodenext` 不同，此选项在未来不太可能有新行为。
同样与 `nodenext` 不同的是，指定 `--module node20` 将隐式设置 `--target es2023`，除非另有配置。
而 `--module nodenext` 则隐含浮动的 `--target esnext`。

有关更多信息，[请查看此处的实现](https://github.com/microsoft/TypeScript/pull/61805)。

## DOM API 中的摘要描述

以前，TypeScript 中的许多 DOM API 只链接到该 API 的 MDN 文档。
这些链接很有用，但没有提供 API 功能的快速摘要。
感谢 [Adam Naji](https://github.com/Bashamega) 的几处改动，TypeScript 现在为许多 DOM API 包含了基于 MDN 文档的摘要描述。
你可以在[此处](https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1993)和[此处](https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1940)查看更多这些变更。

## 可展开的悬停提示（预览）

_快速信息_（也称为"编辑器工具提示"和"悬停提示"）对于查看变量类型或查看类型别名的实际含义非常有用。
尽管如此，人们通常希望*深入了解*并从快速信息工具提示中显示的内容获取详细信息。
例如，如果我们将鼠标悬停在以下示例中的参数 `options` 上：

```ts
export function drawButton(options: Options): void;
```

我们只会看到 `(parameter) options: Options`。

![Tooltip for a parameter declared as `options` which just shows `options: Options`.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2025/06/bare-hover-5.8-01.png)

我们真的需要跳转到类型 `Options` 的定义才能看到这个值有哪些成员吗？

以前确实如此。
为此，TypeScript 5.9 现在正在预览一个名为*可展开悬停提示*（或"快速信息详细程度"）的功能。
如果你使用 VS Code 等编辑器，你现在会在这些悬停工具提示的左侧看到 `+` 和 `-` 按钮。
点击 `+` 按钮将更深入地展开类型，而点击 `-` 按钮将折叠到上一个视图。

<video autoplay loop style="width: 100%;" src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2025/06/expandable-quick-info-1.mp4" aria-label="Expanding quick info to see more about the type of `Options`."></video>

此功能目前处于预览阶段，我们正在向 TypeScript 和 Visual Studio Code 的合作伙伴征求反馈。
有关更多详细信息，请参阅[此处的功能 PR](https://github.com/microsoft/TypeScript/pull/59940)。

## 可配置的最大悬停长度

有时，快速信息工具提示可能变得非常长，以至于 TypeScript 会截断它们以提高可读性。
这样做的缺点是，最重要的信息往往会从悬停工具提示中省略，这可能令人沮丧。
为了解决这个问题，TypeScript 5.9 的语言服务器支持可配置的悬停长度，可以通过 VS Code 中的 `js/ts.hover.maximumLength` 设置进行配置。

此外，新的默认悬停长度比以前的默认值大得多。
这意味着在 TypeScript 5.9 中，默认情况下你应该在悬停工具提示中看到更多信息。
有关更多详细信息，请参阅[此处的功能 PR](https://github.com/microsoft/TypeScript/pull/61662) 以及[对应的 Visual Studio Code 更改](https://github.com/microsoft/vscode/pull/248181)。

## 优化

### 在映射器上缓存实例化

当 TypeScript 用特定的类型参数替换类型形参时，它可能会一遍又一遍地实例化许多相同的中间类型。
在 Zod 和 tRPC 等复杂库中，这可能会导致性能问题以及有关过度类型实例化深度的错误报告。
感谢 [Mateusz Burzyński](https://github.com/Andarist) 的[一项更改](https://github.com/microsoft/TypeScript/pull/61505)，TypeScript 5.9 能够在已经开始处理特定类型实例化时缓存许多中间实例化。
这反过来避免了大量不必要的工作和内存分配。

### 避免在 `fileOrDirectoryExistsUsingSource` 中创建闭包

在 JavaScript 中，函数表达式通常会分配一个新的函数对象，即使包装函数只是将参数传递给另一个没有捕获变量的函数。
在文件存在性检查的代码路径中，[Vincent Bailly](https://github.com/VincentBailly) 发现了这些直通函数调用的示例，尽管底层函数只接受单个参数。
考虑到在大型项目中可能进行的存在性检查次数，他引用了约 11% 的速度提升。
[在此处查看有关此更改的更多信息](https://github.com/microsoft/TypeScript/pull/61822/)。

## 值得注意的行为变化

### `lib.d.ts` 变更

为 DOM 生成的类型可能会影响你的代码库的类型检查。

此外，一个值得注意的变化是 `ArrayBuffer` 已进行了更改，使其不再是几种不同 `TypedArray` 类型的超类型。
这也包括 `UInt8Array` 的子类型，例如 Node.js 中的 `Buffer`。
因此，你将看到如下新错误消息：

```
error TS2345: Argument of type 'ArrayBufferLike' is not assignable to parameter of type 'BufferSource'.
error TS2322: Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'.
error TS2322: Type 'Buffer' is not assignable to type 'Uint8Array<ArrayBufferLike>'.
error TS2322: Type 'Buffer' is not assignable to type 'ArrayBuffer'.
error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'string | Uint8Array<ArrayBufferLike>'.
```

如果你遇到 `Buffer` 相关问题，你可能首先需要检查是否使用了最新版本的 `@types/node` 包。
这可能包括运行

```
npm update @types/node --save-dev
```

大多数情况下，解决方案是指定更具体的底层缓冲区类型，而不是使用默认的 `ArrayBufferLike`（即明确写出 `Uint8Array<ArrayBuffer>` 而不是普通的 `Uint8Array`）。
在某些 `TypedArray`（如 `Uint8Array`）被传递给期望 `ArrayBuffer` 或 `SharedArrayBuffer` 的函数的情况下，你也可以尝试访问该 `TypedArray` 的 `buffer` 属性，如以下示例所示：

```diff
  let data = new Uint8Array([0, 1, 2, 3, 4]);
- someFunc(data)
+ someFunc(data.buffer)
```

## 类型参数推断变更

为了修复类型推断期间类型变量的"泄漏"，TypeScript 5.9 可能会在某些代码库中引入类型变化，甚至出现新的错误。
这些很难预测，但通常可以通过向泛型函数调用添加类型参数来修复。
[在此处查看更多详细信息](https://github.com/microsoft/TypeScript/pull/61668)。
