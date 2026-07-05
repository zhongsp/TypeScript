# TypeScript 6.0

## 减少对无 `this` 函数的上下文敏感性

当参数没有显式写出类型时，TypeScript 通常可以根据期望类型推断，甚至根据同一函数调用中的其他参数来推断。

```ts
declare function callIt<T>(obj: {
  produce: (x: number) => T;
  consume: (y: T) => void;
}): void;

// 可以正常工作，没有问题。
callIt({
  produce: (x: number) => x * 2,
  consume: y => y.toFixed(),
});

// 可以正常工作，即使属性顺序颠倒了也没有问题。
callIt({
  consume: y => y.toFixed(),
  produce: (x: number) => x * 2,
});
```

在这里，TypeScript 可以根据从 `produce` 函数推断出的 `T` 来推断 `consume` 函数中 `y` 的类型，与属性的顺序无关。
但如果这些函数使用*方法语法*而不是箭头函数语法来编写，情况又如何呢？

```ts
declare function callIt<T>(obj: {
  produce: (x: number) => T;
  consume: (y: T) => void;
}): void;

// 正常工作，`x` 被推断为 number。
callIt({
  produce(x: number) {
    return x * 2;
  },
  consume(y) {
    return y.toFixed();
  },
});

callIt({
  consume(y) {
    return y.toFixed();
  },
  //                  ~
  // error: 'y' is of type 'unknown'.

  produce(x: number) {
    return x * 2;
  },
});
```

奇怪的是，第二次调用 `callIt` 会产生错误，因为 TypeScript 无法推断 `consume` 方法中 `y` 的类型。
这里发生的情况是，当 TypeScript 尝试为 `T` 寻找候选类型时，它会首先跳过那些参数没有显式类型的函数。
它这样做是因为某些函数可能需要推断出的 `T` 类型才能被正确检查——在我们的例子中，我们需要知道 `T` 的类型才能分析 `consume` 函数。

这些函数被称为*上下文敏感函数*——基本上就是参数没有显式类型的函数。
最终类型系统需要为这些参数找出类型——但这与泛型函数中的推断工作方式有些矛盾，因为两者会在不同方向上"拉扯"类型。

```ts
function callFunc<T>(callback: (x: T) => void, value: T) {
  return callback(value);
}

callFunc(x => x.toFixed(), 42);
//       ^
// 我们需要在这里确定 `x` 的类型，
// 但我们也需要确定 `T` 的类型来检查回调函数。
```

为了解决这个问题，TypeScript 在类型参数推断期间会跳过上下文敏感函数，而是先检查并从其他参数推断。
如果跳过上下文敏感函数不起作用，推断会继续处理任何未检查的参数，按照参数列表从左到右进行。
在上面的例子中，TypeScript 会在推断 `T` 时跳过回调函数，但会查看第二个参数 `42`，并推断 `T` 为 `number`。
然后，当它回来检查回调函数时，它将拥有 `(x: number) => void` 的上下文类型，这允许它推断 `x` 也是 `number`。

那么在我们之前的例子中发生了什么？

```ts
// 箭头语法——没有错误。
callIt({
  consume: y => y.toFixed(),
  produce: (x: number) => x * 2,
});

// 方法语法——报错！
callIt({
  consume(y) {
    return y.toFixed();
  },
  //                  ~
  // error: 'y' is of type 'unknown'.

  produce(x: number) {
    return x * 2;
  },
});
```

在两个例子中，`produce` 都被赋值为一个显式标注了 `x` 参数类型的函数。
它们不应该被相同地检查吗？

问题很微妙：大多数函数（比如使用方法语法的那些）有一个隐式的 `this` 参数，但箭头函数没有。
任何对 `this` 的使用都可能需要"拉扯" `T` 的类型——例如，知道包含对象字面量的类型可能反过来需要 `consume` 的类型，而 `consume` 使用了 `T`。

但我们没有使用 `this`！
当然，函数在运行时可能有一个 `this` 值，但从未被使用过！

TypeScript 6.0 在决定一个函数是否是上下文敏感函数时会考虑这一点。
如果 `this` 在函数中实际上从未被*使用*，那么它就不被视为上下文敏感函数。
这意味着这些函数在类型推断时会被视为更高优先级，我们上面的所有例子现在都可以正常工作了！

[此更改](https://github.com/microsoft/TypeScript/pull/62243)得益于 [Mateusz Burzyński](https://github.com/Andarist) 的工作。

## 以 `#/` 开头的子路径导入

当 Node.js 添加对模块的支持时，它引入了一个名为["子路径导入"](https://nodejs.org/api/packages.html#subpath-imports)的功能。
这基本上是[一个名为 `imports` 的字段](https://nodejs.org/api/packages.html#imports)，允许包为其包内的模块创建内部别名。

```json
{
  "name": "my-package",
  "type": "module",
  "imports": {
    "#root/*": "./dist/*"
  }
}
```

这允许 `my-package` 中的模块从以 `#root/` 开头的路径导入

```js
import * as utils from '#root/utils.js';
```

而不是使用如下相对路径。

```js
import * as utils from '../../utils.js';
```

此功能的一个小烦恼是，开发者在指定子路径导入时总是必须在 `#` 后面写*一些内容*。
这里我们使用了 `root`，但这有点多余，因为我们映射的目录只有 `./dist/`

使用过打包工具的开发者也习惯于使用路径映射来避免冗长的相对路径。
打包工具中一个常见的约定是使用简单的 `@/` 作为前缀。
不幸的是，子路径导入根本不能以 `#/` 开头，这给试图在项目中采用它们的开发者带来了很多困惑。

但最近，[Node.js 添加了对以 `#/` 开头的子路径导入的支持](https://github.com/nodejs/node/pull/60864)。
这允许包使用简单的 `#/` 前缀进行子路径导入，而无需添加额外的路径段。

```json
{
  "name": "my-package",
  "type": "module",
  "imports": {
    "#/*": "./dist/*"
  }
}
```

这在较新的 Node.js 20 版本中受支持，因此 TypeScript 现在在 `--moduleResolution` 设置为 `nodenext` 和 `bundler` 时支持它。

这项工作得益于 [magic-akari](https://github.com/magic-akari)，[实现此功能的拉取请求可在此找到](https://github.com/microsoft/TypeScript/pull/62844)。

## 将 `--moduleResolution bundler` 与 `--module commonjs` 组合使用

TypeScript 的 `--moduleResolution bundler` 设置以前只允许与 `--module esnext` 或 `--module preserve` 一起使用；
然而，随着 `--moduleResolution node`（又名 `--moduleResolution node10`）的弃用，这种新组合通常是许多项目最合适的升级路径。

项目通常希望改为规划迁移至

- `--module preserve` 和 `--moduleResolution bundler`
- `--module nodenext`

取决于你的项目类型（例如打包的 Web 应用、Bun 应用或 Node.js 应用）。

更多信息可在[此实现拉取请求](https://github.com/microsoft/TypeScript/pull/62320)中找到。

## `--stableTypeOrdering` 标志

作为我们[TypeScript 原生移植](https://devblogs.microsoft.com/typescript/typescript-native-port/)持续工作的一部分，我们引入了一个名为 `--stableTypeOrdering` 的新标志，旨在协助 6.0 到 7.0 的迁移。

目前，TypeScript 按照遇到类型的顺序为类型分配类型 ID（内部跟踪编号），并使用这些 ID 以一致的方式对联合类型进行排序。
属性也会经历类似的过程。
因此，程序中声明事物的顺序可能会对声明输出等产生可能令人惊讶的影响。

例如，考虑此文件的声明输出：

```ts
// 输入：some-file.ts
export function foo(condition: boolean) {
  return condition ? 100 : 500;
}

// 输出：some-file.d.ts
export declare function foo(condition: boolean): 100 | 500;
//                                               ^^^^^^^^^
//             注意此联合类型的顺序：100，然后是 500。
```

如果我们在 `foo` *上方*添加一个无关的 `const`，声明输出会发生变化：

```ts
// 输入：some-file.ts
const x = 500;
export function foo(condition: boolean) {
  return condition ? 100 : 500;
}

// 输出：some-file.d.ts
export declare function foo(condition: boolean): 500 | 100;
//                                               ^^^^^^^^^
//                           注意此处顺序的变化。
```

这是因为字面量类型 `500` 获得了比 `100` 更低的类型 ID，因为在分析 `const x` 声明时它先被处理。
在极少数情况下，这种顺序变化甚至可能导致错误根据程序处理顺序而出现或消失，但一般来说，你可能注意到这种顺序的主要地方是输出的声明文件，或编辑器中类型的显示方式。

TypeScript 7 中的一项主要架构改进是并行类型检查，这显著提高了整体检查时间。
然而，并行性带来了一个挑战：当不同的类型检查器以不同的顺序访问节点、类型和符号时，分配给这些构造的内部 ID 变得非确定性。
这反过来导致令人困惑的非确定性输出，其中同一程序中内容相同的两个文件可能产生不同的声明文件，甚至在分析同一文件时计算出不同的错误。
为了解决这个问题，TypeScript 7.0 根据其对象的内容（例如类型和符号）使用确定性算法对其内部对象进行排序。
这确保了所有检查器无论对象如何以及何时创建，都会遇到相同的对象顺序。
因此，在给定的例子中，TypeScript 7 将*始终*输出 `100 | 500`，完全消除了顺序不稳定性。

这意味着 TypeScript 6 和 7 有时确实会显示不同的顺序。
虽然这些顺序变化几乎总是无害的，但如果你在比较不同运行之间的编译器输出（例如，比较 6.0 与 7.0 输出的声明文件），这些不同的顺序可能会产生大量噪音，使评估正确性变得困难。
偶尔，你可能会目睹顺序变化导致类型错误出现或消失，这可能会更加令人困惑。

为了帮助应对这种情况，在 6.0 中，你可以指定新的 `--stableTypeOrdering` 标志。
这使 6.0 的类型排序行为与 7.0 匹配，减少两个代码库之间的差异数量。
请注意，我们不一定鼓励一直使用此标志，因为它可能会给类型检查带来显著的性能下降（根据代码库不同，最多可达 25%）。

如果你在使用 `--stableTypeOrdering` 时遇到类型错误，这通常是由于推断差异造成的。
之前没有 `--stableTypeOrdering` 的推断*碰巧*基于程序中类型的当前顺序而工作。
为了解决这个问题，你通常会在某处提供显式类型会有所帮助。
通常，这将是一个类型参数

```diff
- someFunctionCall(/*...*/);
+ someFunctionCall<SomeExplicitType>(/*...*/);
```

或者为你打算传入调用的参数添加变量注解。

```diff
- const someVariable = { /*... some complex object ...*/ };
+ const someVariable: SomeExplicitType = { /*... some complex object ...*/ };

someFunctionCall(someVariable);
```

**请注意，此标志仅用于帮助诊断 6.0 和 7.0 之间的差异——它并非旨在作为长期功能使用**

[在此拉取请求中查看更多内容](https://github.com/microsoft/TypeScript/pull/63084)。

## `target` 和 `lib` 的 `es2025` 选项

TypeScript 6.0 为 `target` 和 `lib` 添加了对 `es2025` 选项的支持。
虽然 ES2025 中没有新的 JavaScript 语言特性，但这个新目标为内置 API 添加了新类型（例如 `RegExp.escape`），并将一些声明从 `esnext` 移入 `es2025`（例如 `Promise.try`、`Iterator` 方法和 `Set` 方法）。
启用[新目标](https://github.com/microsoft/TypeScript/pull/63046)的工作得益于 [Kenta Moriuchi](https://github.com/petamoriken) 的贡献。

## `Temporal` 的新类型

期待已久的 [Temporal 提案](https://github.com/tc39/proposal-temporal) 已达到第 4 阶段，并将成为未来 ECMAScript 标准的一部分。
TypeScript 6.0 现在包含 Temporal API 的内置类型，因此你可以通过 `--target esnext` 或 `"lib": ["esnext"]`（或更细粒度的 `esnext.temporal`）在 TypeScript 代码中立即开始使用它。

```ts
let yesterday = Temporal.Now.instant().subtract({
  hours: 24,
});

let tomorrow = Temporal.Now.instant().add({
  hours: 24,
});

console.log(`Yesterday: ${yesterday}`);
console.log(`Tomorrow: ${tomorrow}`);
```

Temporal 已在多个运行时中可用，随着第 4 阶段状态，它现在正式成为 JavaScript 语言的一部分。
[Temporal API 的文档可在 MDN 上找到](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)。

[此工作](https://github.com/microsoft/TypeScript/pull/62628)得益于 GitHub 用户 [Renegade334](https://github.com/Renegade334) 的贡献。

## "upsert" 方法（又名 `getOrInsert`）的新类型

`Map` 的一个常见模式是检查键是否存在，如果不存在，则设置并获取默认值。

```ts
function processOptions(compilerOptions: Map<string, unknown>) {
  let strictValue: unknown;
  if (compilerOptions.has('strict')) {
    strictValue = compilerOptions.get('strict');
  } else {
    strictValue = true;
    compilerOptions.set('strict', strictValue);
  }
  // ...
}
```

这种模式可能很繁琐。
[ECMAScript 的 "upsert" 提案](https://github.com/tc39/proposal-upsert) 最近达到第 4 阶段，并在 `Map` 和 `WeakMap` 上引入了 2 个新方法：

- `getOrInsert`
- `getOrInsertComputed`

这些方法已添加到 `esnext` lib 中，以便你可以在 TypeScript 6.0 中立即开始使用它们。

使用 `getOrInsert`，我们可以将上面的代码替换为以下内容：

```ts
function processOptions(compilerOptions: Map<string, unknown>) {
  let strictValue = compilerOptions.getOrInsert('strict', true);
  // ...
}
```

`getOrInsertComputed` 的工作方式类似，但适用于默认值可能计算成本较高的情况（例如需要大量计算、分配或执行长时间同步 I/O）。
相反，它接受一个回调，只有在键尚不存在时才会调用。

```ts
someMap.getOrInsertComputed('someKey', () => {
  return computeSomeExpensiveValue(/*...*/);
});
```

此回调还会将键作为参数传入，这对于默认值基于键的情况很有用。

```ts
someMap.getOrInsertComputed(someKey, computeSomeExpensiveDefaultValue);

function computeSomeExpensiveValue(key: string) {
  // ...
}
```

[此更新](https://github.com/microsoft/TypeScript/pull/62612)得益于 GitHub 用户 [Renegade334](https://github.com/Renegade334) 的贡献。

## `RegExp.escape`

在正则表达式中构造要匹配的某个字面量字符串时，转义特殊正则表达式字符（如 `*`、`+`、`?`、`(`、`)` 等）非常重要。
[RegExp Escaping ECMAScript 提案](https://github.com/tc39/proposal-regex-escaping) 已达到第 4 阶段，并引入了一个新的 `RegExp.escape` 函数来为你处理这个问题。

```ts
function matchWholeWord(word: string, text: string) {
  const escapedWord = RegExp.escape(word);
  const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
  return text.match(regex);
}
```

`RegExp.escape` 在 `es2025` lib 中可用，因此你可以立即在 TypeScript 6.0 中开始使用它。

[此工作](https://github.com/microsoft/TypeScript/pull/63046)得益于 [Kenta Moriuchi](https://github.com/petamoriken) 的贡献。

## `dom` lib 现在包含 `dom.iterable` 和 `dom.asynciterable`

TypeScript 的 `lib` 选项允许你指定目标运行时具有哪些全局声明。
其中一个选项是 `dom`，用于表示 Web 环境（即实现 [DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) 的浏览器）。
以前，DOM API 部分拆分为 `dom.iterable` 和 `dom.asynciterable`，用于不支持 `Iterable` 和 `AsyncIterable` 的环境。
这意味着你必须显式添加 `dom.iterable` 才能在 `NodeList` 或 `HTMLCollection` 等 DOM 集合上使用迭代方法。

在 TypeScript 6.0 中，`lib.dom.iterable.d.ts` 和 `lib.dom.asynciterable.d.ts` 的内容已完全包含在 `lib.dom.d.ts` 中。
你仍然可以在配置文件的 `"lib"` 数组中引用 `dom.iterable` 和 `dom.asynciterable`，但它们现在只是空文件。

```ts
// TypeScript 6.0 之前，这需要 "lib": ["dom", "dom.iterable"]
// 现在只需 "lib": ["dom"] 即可工作
for (const element of document.querySelectorAll('div')) {
  console.log(element.textContent);
}
```

这是一项质量改进，消除了一个常见的困惑点，因为没有主流现代浏览器缺少这些能力。
如果你已经同时包含了 `dom` 和 `dom.iterable`，现在可以简化为仅 `dom`。

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/60959)及其[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/62111)。

## TypeScript 6.0 中的破坏性变更和弃用

TypeScript 6.0 作为一个重要的过渡版本发布，旨在帮助开发者为 TypeScript 7.0（即将推出的 TypeScript 编译器原生移植）做好准备。
虽然 TypeScript 6.0 与你现有的 TypeScript 知识完全兼容，并继续与 TypeScript 5.9 API 兼容，但此版本引入了许多破坏性变更和弃用，反映了不断发展的 JavaScript 生态系统，并为 TypeScript 7.0 奠定了基础。

自 TypeScript 5.0 以来的两年里，我们看到开发者编写和发布 JavaScript 的方式持续变化：

- 几乎每种运行时环境现在都是"常青"的。真正的遗留环境（ES5）已极为罕见。
- 打包工具和 ESM 已成为新项目最常见的模块目标，尽管 CommonJS 仍然是主要目标。AMD 和其他浏览器内用户态模块系统比 2012 年时罕见得多。
- 几乎所有包都可以通过某种模块系统消费。UMD 包仍然存在，但几乎没有新代码*仅*以全局变量形式提供。
- `tsconfig.json` 作为配置机制几乎已普及。
- 对"更严格"类型的需求持续增长。
- TypeScript 构建性能是首要考虑。尽管 TypeScript 7 带来了性能提升，性能必须始终是关键目标，无法以高性能方式支持的选项需要更有力的理由。

因此 TypeScript 6.0 和 7.0 是考虑到这些现实而设计的。
对于 TypeScript 6.0，可以通过在 tsconfig 中设置 `"ignoreDeprecations": "6.0"` 来忽略这些弃用；但是，请注意 TypeScript 7.0 *将不会*支持任何这些已弃用的选项。

一些必要的调整可以通过 codemod 或工具自动执行。
例如，[实验性的 `ts5to6` 工具](https://github.com/andrewbranch/ts5to6) 可以自动调整整个代码库中的 `baseUrl` 和 `rootDir`。

### 前置调整

我们将在下面介绍具体调整，但必须指出，一些弃用和行为变更不一定有直接指向根本问题的错误消息。
因此，我们在此预先指出**许多项目至少需要执行以下操作之一**：

- 在 tsconfig 中设置 `"types"` 数组，通常为 `"types": ["node"]`。

  `"types": ["*"]` 将恢复 5.9 的行为，但我们建议使用显式数组以提高构建性能和可预测性。

  如果你看到*大量*与缺失标识符或未解析的内置模块相关的类型错误，通常就知道是这个问题。

- 如果你之前依赖推断，请设置 `"rootDir": "./src"`

  如果你看到文件被写入 `./dist/src/index.js` 而不是 `./dist/index.js`，通常就知道是这个问题。

### 简单的默认值变更

多个编译器选项现在有了更新的默认值，更好地反映现代开发实践。

- **`strict` 现在默认为 `true`**：
  对更严格类型的需求持续增长，我们发现大多数新项目希望启用 `strict` 模式。
  如果你已经在使用 `"strict": true`，对你来说没有任何变化。
  如果你依赖之前的默认值 `false`，你需要在 `tsconfig.json` 中显式设置 `"strict": false`。

- **`module` 默认为 `esnext`**：
  同样，新的默认 `module` 是 `esnext`，承认 ESM 现在是主导的模块格式。

- **`target` 默认为当前年份的 ES 版本**：
  新的默认 `target` 是最新支持的 ECMAScript 规范版本（实际上是一个浮动目标）。
  目前，该目标是 `es2025`。
  这反映了大多数开发者面向常青运行时发布，不需要编译到较旧的 ECMAScript 版本这一现实。

- **`noUncheckedSideEffectImports` 现在默认为 `true`**：
  这有助于捕获仅副作用导入中的拼写错误问题。

- **`libReplacement` 现在默认为 `false`**：
  此标志以前每次运行都会导致大量模块解析失败，进而增加了我们在 `--watch` 和编辑器场景下需要监视的位置数量。
  在新项目中，`libReplacement` 在其他显式配置生效之前永远不会做任何事情，因此为了默认获得更好的性能，将其默认关闭是合理的。

如果这些新默认值破坏了你的项目，你可以在 `tsconfig.json` 中显式指定之前的值。

### `rootDir` 现在默认为 `.`

`rootDir` 控制输出文件相对于输出目录的目录结构。
以前，如果你没有指定 `rootDir`，它会根据所有非声明输入文件的公共目录推断。
但这通常意味着，如果不尝试加载和解析该项目，就无法知道某个文件是否属于该项目。
这也意味着 TypeScript 必须通过分析程序中的每个文件路径来花费更多时间推断公共源目录。

在 TypeScript 6.0 中，默认 `rootDir` 将始终是包含 `tsconfig.json` 文件的目录。
只有在使用命令行 `tsc` 且没有 `tsconfig.json` 文件时，`rootDir` 才会被推断。

如果你的源文件比 `tsconfig.json` 目录深任何一级，并且你依赖 TypeScript 推断源文件的公共根目录，你需要显式设置 `rootDir`：

```diff
  {
      "compilerOptions": {
          // ...
+         "rootDir": "./src"
      },
      "include": ["./src"]
  }
```

同样，如果你的 `tsconfig.json` 引用了包含 `tsconfig.json` 目录之外的文件，你需要调整 `rootDir` 以包含这些文件。

```diff
  {
      "compilerOptions": {
          // ...
+         "rootDir": "../src"
      },
      "include": ["../src/**/*.tests.ts"]
  }
```

更多信息请参见[此处的讨论](https://github.com/microsoft/TypeScript/issues/62194)和[此处的实现](https://github.com/microsoft/TypeScript/pull/62418)。

### `types` 现在默认为 `[]`

在 `tsconfig.json` 中，`compilerOptions` 的 `types` 字段指定编译期间要包含在全局作用域中的包名列表。
通常，`node_modules` 中的包通过源代码中的 import 自动包含；
但为了方便，TypeScript 默认也会包含 `node_modules/@types` 中的所有包，这样你就可以获得像 `process` 或 `"fs"` 模块（来自 `@types/node`）、或 `describe` 和 `it`（来自 `@types/jest`）等全局声明，而无需直接 import 它们。

从某种意义上说，`types` 的值以前默认为"枚举 `node_modules/@types` 中的所有内容"。
这可能*非常*昂贵，因为如今一个正常的仓库设置可能会传递性地拉入数百个 `@types` 包，尤其是在具有扁平化 `node_modules` 的多项目工作区中。
现代项目几乎总是只需要 `@types/node`、`@types/jest` 或少数其他常见的全局影响包。

在 TypeScript 6.0 中，默认 `types` 值将是 `[]`（空数组）。
此更改防止项目在构建时无意中拉入数百甚至数千个不需要的声明文件。
我们查看的许多项目仅通过适当设置 `types` 就将构建时间提高了 20-50%。

**这将影响许多项目。** 你可能需要添加 `"types": ["node"]` 或其他几个：

```diff
  {
      "compilerOptions": {
          // 显式列出你需要的 @types 包
+         "types": ["node", "jest"]
      }
  }
```

你也可以指定 `*` 条目来重新启用旧的枚举行为：

```diff
  {
      "compilerOptions": {
          // 加载所有类型——TypeScript 5.9 及之前的默认值。
+         "types": ["*"]
      }
  }
```

如果你最终出现如下新的错误消息：

```
Cannot find module '...' or its corresponding type declarations.
Cannot find name 'fs'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
Cannot find name 'path'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
Cannot find name 'Bun'. Do you need to install type definitions for Bun? Try `npm i --save-dev @types/bun` and then add 'bun' to the types field in your tsconfig.
Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` and then add 'jest' or 'mocha' to the types field in your tsconfig.
```

你可能需要在 `types` 字段中添加一些条目。

更多信息请参见[此处的提案](https://github.com/microsoft/TypeScript/issues/62195)以及[此处的实现拉取请求](https://github.com/microsoft/TypeScript/pull/63054)。

### 已弃用：`target: es5`

ECMAScript 5 目标长期以来对于支持遗留浏览器很重要；但其继任者 ECMAScript 2015（ES6）在十多年前就已发布，所有现代浏览器已支持它多年。
随着 Internet Explorer 的退役以及常青浏览器的普及，今天 ES5 输出的用例非常少。

TypeScript 的最低目标现在将是 ES2015，`target: es5` 选项已弃用。如果你在使用 `target: es5`，你需要迁移到更新的目标或使用外部编译器。
如果你仍然需要 ES5 输出，我们建议使用外部编译器直接编译 TypeScript 源代码，或对 TypeScript 的输出进行后处理。

[在此了解更多关于此弃用的信息](https://github.com/microsoft/TypeScript/issues/62196)以及[其实现拉取请求](https://github.com/microsoft/TypeScript/pull/63067)。

### 已弃用：`--downlevelIteration`

`--downlevelIteration` 仅对 ES5 输出有影响，由于 `--target es5` 已弃用，`--downlevelIteration` 不再有任何用途。

微妙的是，在 TypeScript 5.9 及更早版本中，将 `--downlevelIteration false` 与 `--target es2015` 一起使用不会报错，即使它没有任何效果。
在 TypeScript 6.0 中，设置 `--downlevelIteration` 将导致弃用错误。

参见[此处的实现](https://github.com/microsoft/TypeScript/pull/63071)。

### 已弃用：`--moduleResolution node`（又名 `--moduleResolution node10`）

`--moduleResolution node` 编码了 Node.js 模块解析算法的一个特定版本，最准确地反映了 Node.js 10 的行为。
不幸的是，此目标（及其名称）忽略了此后 Node.js 解析算法的许多更新，它不再能很好地代表现代 Node.js 版本的行为。

在 TypeScript 6.0 中，`--moduleResolution node`（具体为 `--moduleResolution node10`）已弃用。
使用 `--moduleResolution node` 的用户如果计划直接面向 Node.js，通常应迁移到 `--moduleResolution nodenext`；如果使用打包工具或 Bun，则应迁移到 `--moduleResolution bundler`。

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62200)及其[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/62338)。

### 已弃用：`module` 的 `amd`、`umd` 和 `systemjs` 值

以下标志值不再受支持

- `--module amd`
- `--module umd`
- `--module systemjs`
- `--module none`

AMD、UMD 和 SystemJS 在 JavaScript 模块早期很重要，当时浏览器缺乏原生模块支持。
"none" 的语义从未被明确定义，经常导致混淆。
今天，ESM 在浏览器和 Node.js 中普遍受支持，import maps 和打包工具已成为填补空白的首选方式。
如果你仍然面向这些模块系统，请考虑迁移到适当的 ECMAScript 模块输出目标、采用打包工具或不同的编译器，或停留在 TypeScript 5.x 直到可以迁移。

这也意味着不再支持 `amd-module` 指令，它将不再有任何效果。

更多信息请参见[提案 issue](https://github.com/microsoft/TypeScript/issues/62199)以及[实现拉取请求](https://github.com/microsoft/TypeScript/pull/62669)。

### 已弃用：`--baseUrl`

`baseUrl` 选项最常与 `paths` 一起使用，通常作为 `paths` 中每个值的前缀。
不幸的是，`baseUrl` 也被视为模块解析的查找根。

例如，给定以下 `tsconfig.json`

```json5
{
  compilerOptions: {
    // ...
    baseUrl: './src',
    paths: {
      '@app/*': ['app/*'],
      '@lib/*': ['lib/*'],
    },
  },
}
```

以及如下 import

```ts
import * as someModule from 'someModule.js';
```

TypeScript 可能会将其解析为 `src/someModule.js`，即使开发者只打算为以 `@app/` 和 `@lib/` 开头的模块添加映射。

在最好的情况下，这通常也会导致打包工具会忽略的"更难看"的路径；
但通常这意味着许多在运行时永远不会工作的 import 路径被 TypeScript 认为"完全没问题"。

`path` 映射已经很长时间不需要指定 `baseUrl` 了，实际上，大多数使用 `baseUrl` 的项目仅将其用作 `paths` 条目的前缀。
在 TypeScript 6.0 中，`baseUrl` 已弃用，将不再被视为模块解析的查找根。

将 `baseUrl` 用作路径映射条目前缀的开发者可以简单地移除 `baseUrl` 并将前缀添加到 `paths` 条目中：

```diff json5
  {
    "compilerOptions": {
      // ...
-     "baseUrl": "./src",
      "paths": {
-       "@app/*": ["app/*"],
-       "@lib/*": ["lib/*"]
+       "@app/*": ["./src/app/*"],
+       "@lib/*": ["./src/lib/*"]
      }
    }
  }
```

实际上*确实*将 `baseUrl` 用作查找根的开发者也可以添加显式路径映射来保留旧行为：

```json5
{
  compilerOptions: {
    // ...
    paths: {
      // 替代 baseUrl 的新通配符映射：
      '*': ['./src/*'],

      // 其他每个路径现在都有显式的公共前缀：
      '@app/*': ['./src/app/*'],
      '@lib/*': ['./src/lib/*'],
    },
  },
}
```

然而，这极为罕见。
我们建议大多数开发者简单地移除 `baseUrl` 并将适当的前缀添加到 `paths` 条目中。

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62207)和[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/62509)。

### 已弃用：`--moduleResolution classic`

`moduleResolution: classic` 设置已被移除。
`classic` 解析策略是 TypeScript 原始的模块解析算法，早于 Node.js 解析算法成为事实标准。
今天，所有实际用例都由 `nodenext` 或 `bundler` 满足。
如果你在使用 `classic`，请迁移到这些现代解析策略之一。

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62206)和[实现拉取请求](https://github.com/microsoft/TypeScript/pull/62669)。

### 已弃用：`--esModuleInterop false` 和 `--allowSyntheticDefaultImports false`

以下设置不能再设置为 `false`：

- `esModuleInterop`
- `allowSyntheticDefaultImports`

`esModuleInterop` 和 `allowSyntheticDefaultImports` 最初是可选启用的，以避免破坏现有项目。
然而，它们启用的行为多年来一直是推荐的默认值。
将它们设置为 `false` 通常会在从 ESM 消费 CommonJS 模块时导致微妙的运行时问题。
在 TypeScript 6.0 中，更安全的互操作行为始终启用。

如果你有依赖旧行为的 import，可能需要调整它们：

```ts
// 之前（esModuleInterop: false）
import * as express from 'express';

// 之后（esModuleInterop 始终启用）
import express from 'express';
```

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62529)及其[实现拉取请求](https://github.com/microsoft/TypeScript/pull/62567)。

### 已弃用：`--alwaysStrict false`

`alwaysStrict` 标志涉及 `"use strict";` 指令的推断和输出。
在 TypeScript 6.0 中，所有代码将被假定为处于 [JavaScript 严格模式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)，这是一组 JS 语义，最明显地影响围绕保留字的语法边界情况。
如果你有使用 `await`、`static`、`private` 或 `public` 等保留字作为普通标识符的"非严格模式"代码，你需要重命名它们。
如果你依赖非严格代码中 `this` 含义的微妙语义，可能也需要调整代码。

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62213)及其[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/63089)。

### 已弃用：`outFile`

`--outFile` 选项已从 TypeScript 6.0 中移除。此选项最初设计用于将多个输入文件连接成单个输出文件。然而，Webpack、Rollup、esbuild、Vite、Parcel 等外部打包工具现在可以更快、更好、且配置性更强地完成这项工作。移除此选项简化了实现，并使我们能够专注于 TypeScript 最擅长的事情：类型检查和声明输出。如果你当前在使用 `--outFile`，你需要迁移到外部打包工具。大多数现代打包工具开箱即用地提供出色的 TypeScript 支持。

### 已弃用：用于命名空间的旧版 `module` 语法

早期版本的 TypeScript 使用 `module` 关键字来声明命名空间：

```ts
// ❌ 已弃用的语法——现在是错误
module Foo {
  export const bar = 10;
}
```

此语法后来被别名为使用 `namespace` 关键字的现代首选形式：

```ts
// ✅ 正确的语法
namespace Foo {
  export const bar = 10;
}
```

当 `namespace` 被引入时，`module` 语法只是被不鼓励使用。
几年前，TypeScript 语言服务开始将该关键字标记为已弃用，建议改用 `namespace`。

在 TypeScript 6.0 中，在期望 `namespace` 的地方使用 `module` 现在是一个硬性弃用。
此变更是必要的，因为 `module` 块是一个潜在的 ECMAScript 提案，会与旧版 TypeScript 语法冲突。

环境模块声明形式仍然完全受支持：

```ts
// ✅ 仍然完全正常工作
declare module 'some-module' {
  export function doSomething(): void;
}
```

更多详情请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62211)及其[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/62876)。

### 已弃用：import 上的 `asserts` 关键字

`asserts` 关键字通过 import assertions 提案被提议加入 JavaScript 语言；
然而，该提案最终演变为[import attributes 提案](https://github.com/tc39/proposal-import-attributes)，它使用 `with` 关键字而不是 `asserts`。

因此，`asserts` 语法在 TypeScript 6.0 中已弃用，使用它将导致错误：

```ts
// ❌ 已弃用的语法——现在是错误。
import blob from "./blahb.json" asserts { type: "json" }
//                              ~~~~~~~
// error: Import assertions have been replaced by import attributes. Use 'with' instead of 'asserts'.
```

相反，请使用 import attributes 的 `with` 语法：

```ts
// ✅ 使用新的 import attributes 语法正常工作。
import blob from './blahb.json' with { type: 'json' };
```

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62210)及其[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/63077)。

### 已弃用：`no-default-lib` 指令

`/// <reference no-default-lib="true"/>` 指令在很大程度上被误解和误用。
在 TypeScript 6.0 中，此指令不再受支持。
如果你在使用它，请考虑改用 `--noLib` 或 `--libReplacement`。

[在此查看更多](https://github.com/microsoft/TypeScript/issues/62209)以及[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/62435)。

### 存在 `tsconfig.json` 时在命令行指定文件现在是错误

目前，如果你在有 `tsconfig.json` 的文件夹中运行 `tsc foo.ts`，配置文件会被完全忽略。
如果你期望检查和输出选项应用于输入文件，这通常非常令人困惑。

在 TypeScript 6.0 中，如果你在包含 `tsconfig.json` 的目录中使用文件参数运行 `tsc`，将发出错误以使此行为明确：

```
error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.
```

如果你确实想忽略 `tsconfig.json` 并使用 TypeScript 的默认值编译 `foo.ts`，可以使用新的 `--ignoreConfig` 标志。

```sh
tsc --ignoreConfig foo.ts
```

更多信息请参见[此 issue](https://github.com/microsoft/TypeScript/issues/62197)及其[对应的拉取请求](https://github.com/microsoft/TypeScript/pull/62477)。

## 为 TypeScript 7.0 做准备

TypeScript 6.0 被设计为一个过渡版本。
虽然 TypeScript 6.0 中弃用的选项在设置 `"ignoreDeprecations": "6.0"` 时仍可无错误地工作，但这些选项将在 TypeScript 7.0（原生 TypeScript 移植）中**完全移除**。
如果你在升级到 TypeScript 6.0 后看到弃用警告，我们强烈建议在项目中采用 TypeScript 7.0（或尝试[原生预览版](https://www.npmjs.com/package/@typescript/native-preview)）之前解决它们。
