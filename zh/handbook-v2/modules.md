# 模块

JavaScript 历来具有多种处理代码模块化的方式。TypeScript 自 2012 年问世以来，已经实现了对这其中很多格式的支持。但随着时间的推移，社区和 JavaScript 规范已经趋于使用一种称为 ES 模块（或 ES6 模块）的格式。它使用的是 `import`/`export` 语法。

ES 模块在 2015 年被添加到 JavaScript 规范中，并且截至 2020 年已经在大多数 Web 浏览器和 JavaScript 运行时中得到广泛支持。

本手册将重点介绍 ES 模块及其流行的前身 CommonJS `module.exports =` 语法，你可以在参考部分的[模块](/docs/handbook/modules.html)下找到其他模块模式的信息。

## JavaScript 模块的定义方式

在 TypeScript 中（与 ECMAScript 2015 一样），任何包含顶级 `import` 或 `export` 声明的文件都被视为一个模块。

相反，如果一个文件没有任何顶级导入或导出声明，它将被视为一个脚本，其内容在全局范围内可用（因此也可用于模块）。

模块在它们自己的作用域中执行，而不是在全局作用域中执行。这意味着在模块中声明的变量、函数、类等在模块外部是不可见的，除非它们使用其中某种导出形式进行了显式导出。相反，要使用从其他模块导出的变量、函数、类、接口等，必须使用某种导入形式进行导入。

## 非模块文件

在开始之前，我们有必要了解一下 TypeScript 将什么当作模块。JavaScript 规范声明，任何没有 `import` 声明、`export` 声明或顶级 `await` 的 JavaScript 文件都应被视为脚本而不是模块。

在脚本文件中，声明的变量和类型处于共享的全局作用域。你应该要么使用 [`outFile`](/tsconfig#outFile) 编译器选项将多个输入文件合并为一个输出文件，要么在 HTML 代码中使用多个 `<script>` 标签按正确的顺序加载这些文件。

如果你有一个当前没有任何 `import` 或 `export` 声明的文件，但你希望将其视为一个模块，可以添加以下代码行：

```ts twoslash
export {};
```

这将使文件成为一个不导出任何内容的模块。无论你的模块目标是什么，这种语法都适用。

## TypeScript 中的模块

<blockquote class='bg-reading'>
   <p>延申阅读：<br />
   <a href='https://exploringjs.com/impatient-js/ch_modules.html#overview-syntax-of-ecmascript-modules'>Impatient JS（Modules）</a><br/>
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules'>MDN：JavaScript 模块</a><br/>
   </p>
</blockquote>

在用 TypeScript 编写基于模块的代码时，主要有三个要考虑的方面：

- **语法**：我希望使用什么语法来导入和导出内容？
- **模块解析**：模块名称（或路径）与磁盘上的文件之间的关系是什么？
- **模块输出目标**：我的输出 JavaScript 模块应该是什么样子的？

### ES 模块语法

一个文件可以通过 `export default` 来声明主要的导出项：

```ts twoslash
// @filename: hello.ts
export default function helloWorld() {
  console.log("Hello, world!");
}
```

然后可以通过以下方式进行导入：

```ts twoslash
// @filename: hello.ts
export default function helloWorld() {
  console.log("Hello, world!");
}
// @filename: index.ts
// ---cut---
import helloWorld from "./hello.js";
helloWorld();
```

除了默认导出之外，你还可以通过省略 `default` 来导出多个变量和函数：

```ts twoslash
// @filename: maths.ts
export var pi = 3.14;
export let squareTwo = 1.41;
export const phi = 1.61;

export class RandomNumberGenerator {}

export function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}
```

可以通过 `import` 语法在另一个文件中使用这些导出项：

```ts twoslash
// @filename: maths.ts
export var pi = 3.14;
export let squareTwo = 1.41;
export const phi = 1.61;
export class RandomNumberGenerator {}
export function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}
// @filename: app.ts
// ---cut---
import { pi, phi, absolute } from "./maths.js";

console.log(pi);
const absPhi = absolute(phi);
//    ^?
```

### 更多的导入语法

可以使用以下格式将导入进行重命名：`import {old as new}`：

```ts twoslash
// @filename: maths.ts
export var pi = 3.14;
// @filename: app.ts
// ---cut---
import { pi as π } from "./maths.js";

console.log(π);
//          ^?
```

你可以将上述语法混合使用在单个 `import` 语句中：

```ts twoslash
// @filename: maths.ts
export const pi = 3.14;
export default class RandomNumberGenerator {}

// @filename: app.ts
import RandomNumberGenerator, { pi as π } from "./maths.js";

RandomNumberGenerator;
// ^?

console.log(π);
//          ^?
```

你可以使用声明 `* as name` 将所有导出的对象放入单个命名空间中：

```ts twoslash
// @filename: maths.ts
export var pi = 3.14;
export let squareTwo = 1.41;
export const phi = 1.61;

export function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}
// ---cut---
// @filename: app.ts
import * as math from "./maths.js";

console.log(math.pi);
const positivePhi = math.absolute(math.phi);
//    ^?
```

通过使用 `import "./file"`，你可以导入一个文件，而不将任何变量包含在当前模块中：

```ts twoslash
// @filename: maths.ts
export var pi = 3.14;
// ---cut---
// @filename: app.ts
import "./maths.js";

console.log("3.14");
```

在这种情况下，`import` 没有任何作用。然而，`maths.ts` 中的所有代码都被执行，这可能触发影响其他对象的副作用。

#### TypeScript 特定的 ES 模块语法

类型可以使用与 JavaScript 相同的语法进行导出和导入：

```ts twoslash
// @filename: animal.ts
export type Cat = { breed: string; yearOfBirth: number };

export interface Dog {
  breeds: string[];
  yearOfBirth: number;
}

// @filename: app.ts
import { Cat, Dog } from "./animal.js";
type Animals = Cat | Dog;
```

TypeScript 通过两个用来声明类型导入的概念，扩展了 `import` 语法：

###### `import type`

这是一个*仅*能导入类型的导入语句：

```ts twoslash
// @filename: animal.ts
export type Cat = { breed: string; yearOfBirth: number };
export type Dog = { breeds: string[]; yearOfBirth: number };
export const createCatName = () => "fluffy";

// @filename: valid.ts
import type { Cat, Dog } from "./animal.js";
export type Animals = Cat | Dog;

// @filename: app.ts
// @errors: 1361
import type { createCatName } from "./animal.js";
const name = createCatName();
```

###### 内联 `type` 导入

TypeScript 4.5 还允许在个别导入中使用 `type` 前缀，以指示被导入的引用是一个类型：

```ts twoslash
// @filename: animal.ts
export type Cat = { breed: string; yearOfBirth: number };
export type Dog = { breeds: string[]; yearOfBirth: number };
export const createCatName = () => "fluffy";
// ---cut---
// @filename: app.ts
import { createCatName, type Cat, type Dog } from "./animal.js";

export type Animals = Cat | Dog;
const name = createCatName();
```

通过这些语法，非 TypeScript 的转译器（如 Babel、swc 或 esbuild）可以知道哪些导入可以安全地移除。

#### 具有 CommonJS 行为的 ES 模块语法

TypeScript 具有 ES 模块语法，它与 CommonJS 和 AMD 的 `require` *直接*对应。使用 ES 模块进行导入在大多数情况下与这些环境中的 `require` 相同，但是此语法确保你的 TypeScript 文件与 CommonJS 输出保持一对一的匹配：

```ts twoslash
/// <reference types="node" />
// @module: commonjs
// ---cut---
import fs = require("fs");
const code = fs.readFileSync("hello.ts", "utf8");
```

你可以在[模块参考页面](/docs/handbook/modules.html#export--and-import--require)了解更多关于此语法的信息。

## CommonJS 语法

CommonJS 是大多数 npm 模块采用的格式。即使你使用上面的 ES 模块语法编写代码，了解 CommonJS 语法的基本原理也将有助于更轻松地进行调试。

#### 导出

通过在名为 `module` 的全局变量上设置 `exports` 属性，可以导出标识符。

```ts twoslash
/// <reference types="node" />
// ---cut---
function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}

module.exports = {
  pi: 3.14,
  squareTwo: 1.41,
  phi: 1.61,
  absolute,
};
```

然后可以通过 `require` 语句导入这些文件：

```ts twoslash
// @module: commonjs
// @filename: maths.ts
/// <reference types="node" />
function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}

module.exports = {
  pi: 3.14,
  squareTwo: 1.41,
  phi: 1.61,
  absolute,
};
// @filename: index.ts
// ---cut---
const maths = require("./maths");
maths.pi;
//    ^?
```

或者你可以使用 JavaScript 的解构（destructuring）特性来简化代码：

```ts twoslash
// @module: commonjs
// @filename: maths.ts
/// <reference types="node" />
function absolute(num: number) {
  if (num < 0) return num * -1;
  return num;
}

module.exports = {
  pi: 3.14,
  squareTwo: 1.41,
  phi: 1.61,
  absolute,
};
// @filename: index.ts
// ---cut---
const { squareTwo } = require("./maths");
squareTwo;
// ^?
```

### CommonJS 和 ES 模块的互操作性

在 CommonJS 和 ES 模块之间存在一个特性差异，即默认导入和模块命名空间对象导入之间的区别。TypeScript 具有一个编译器标志 [`esModuleInterop`](/tsconfig#esModuleInterop)，用于减少这两组不同约束之间的摩擦。

## TypeScript 的模块解析选项

模块解析是指接收 `import` 或 `require` 语句中的字符串，并确定该字符串所指向的文件的过程。

TypeScript 包括两种解析策略：经典解析和 Node 解析。经典解析在编译器选项 [`module`](/tsconfig#module) 不是 `commonjs` 时是默认策略，它用于向后兼容。Node 解析策略复制了 Node.js 在 CommonJS 模式下的工作方式，并额外检查 `.ts` 和 `.d.ts` 文件。

有许多 TSConfig 标志会影响 TypeScript 内部的模块策略，包括 [`moduleResolution`](/tsconfig#moduleResolution)、[`baseUrl`](/tsconfig#baseUrl)、[`paths`](/tsconfig#paths) 和 [`rootDirs`](/tsconfig#rootDirs)。

要了解这些策略的详细信息，可以参考[模块解析](/docs/handbook/module-resolution.html)。

## TypeScript 的模块输出选项

有两个选项会影响生成的 JavaScript 输出：

- [`target`](/tsconfig#target)：确定哪些 JS 特性会被降级（转换为在较旧的 JavaScript 运行环境中运行的代码），哪些保持不变
- [`module`](/tsconfig#module)：确定用于模块间交互的代码

你选择哪个 [target](/tsconfig#target)，要看你的 TypeScript 代码要在哪种 JavaScript 运行时环境下执行。这可能取决于：你要兼容的最老的网页浏览器，你要使用的 Node.js 的最低版本，或者你的运行时环境有什么特殊的限制 - 比如 Electron。

所有模块之间的通信都是通过模块加载器进行的，编译器选项 [`module`](/tsconfig#module) 确定使用哪个模块加载器。在运行时，模块加载器负责在执行模块之前定位和执行它的所有依赖项。

例如，以下是一个使用 ES 模块语法的 TypeScript 文件，展示了几种不同的 [`module`](/tsconfig#module) 选项：

```ts twoslash
// @filename: constants.ts
export const valueOfPi = 3.142;
// @filename: index.ts
// ---cut---
import { valueOfPi } from "./constants.js";

export const twoPi = valueOfPi * 2;
```

#### `ES2020`

```ts twoslash
// @showEmit
// @module: es2020
// @noErrors
import { valueOfPi } from "./constants.js";

export const twoPi = valueOfPi * 2;
```

#### `CommonJS`

```ts twoslash
// @showEmit
// @module: commonjs
// @noErrors
import { valueOfPi } from "./constants.js";

export const twoPi = valueOfPi * 2;
```

#### `UMD`

```ts twoslash
// @showEmit
// @module: umd
// @noErrors
import { valueOfPi } from "./constants.js";

export const twoPi = valueOfPi * 2;
```

> 请注意，ES2020 在功能上与原始的 `index.ts` 相同。

你可以在 [TSConfig 的 `module` 配置参考页面](/tsconfig#module)中查看所有可用选项及其生成的 JavaScript 代码。

## TypeScript 命名空间

TypeScript 有自己的模块格式，称为 `命名空间`，它早于 ES 模块的标准化。这种语法具有许多用于创建复杂定义文件的有用功能，并且仍然在 [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) 中得到广泛使用。虽然没有被弃用，但大多数命名空间中的功能也存在于 ES 模块中，因此我们建议你使用 ES 模块，以与 JavaScript 的发展方向保持一致。你可以在[命名空间参考页面](/docs/handbook/namespaces.html)了解更多关于命名空间的信息。
