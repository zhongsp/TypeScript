# TypeScript 3.6

## 更严格的生成器

TypeScript 3.6 对迭代器和生成器函数引入了更严格的检查。在之前的版本中，用户无法区分一个值是生成的还是被返回的。

```typescript
function* foo() {
  if (Math.random() < 0.5) yield 100;
  return "Finished!"
}

let iter = foo();
let curr = iter.next();
if (curr.done) {
  // TypeScript 3.5 以及之前的版本会认为 `value` 为 'string | number'。
  // 当 `done` 为 `true` 的时候，它应该知道 `value` 为 'string'！
  curr.value
}
```

另外，生成器只假定 `yield` 的类型为 `any`。

```typescript
function* bar() {
  let x: { hello(): void } = yield;
  x.hello();
}

let iter = bar();
iter.next();
iter.next(123); // 不好! 运行时错误!
```

在 TypeScript 3.6 中，在我们第一个例子中检查器现在知道 `curr.value` 的正确类型应该是 `string` ，并且，在最后一个例子中当我们调用 `next()` 时会准确的提示错误。这要感谢在 `Iterator` 和 `IteratorResule` 的类型定义包含了一些新的类型参数，并且一个被叫做 `Generator` 的新类型在 TypeScript 中用来表示生成器。

类型 `Iterator` 现在允许用户明确的定义生成的类型，返回的类型和 `next` 能够接收的类型。

```typescript
interface Iterator<T, TReturn = any, TNext = undefined> {
  // 接受 0 或者 1 个参数 - 不接受 'undefined'
  next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
  return?(value?: TReturn): IteratorResult<T, TReturn>;
  throw?(e?: any): IteratorResult<T, TReturn>;
}
```

以此为基础，新的 `Generator` 类型是一个迭代器，它总是有 `return` 和 `throw` 方法，并且也是可迭代的。

```typescript
interface Generator<T = unknown, TReturn = any, TNext = unknown> extends Iterator<T, TReturn, TNext> {
  next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
  return(value: TReturn): IteratorResult<T, TReturn>;
  throw(e: any): IteratorResult<T, TReturn>;
  [Symbol.iterator](): Generator<T, TReturn, TNext>;
}
```

为了允许在返回值和生成值之间进行区分，TypeScript 3.6 转变 `IteratorResult` 类型为一个区别对待的联合类型：

```typescript
type IteratorResult<T, TReturn = any> = IteratorYieldResult<T> | IteratorReturnResult<TReturn>;

interface IteratorYieldResult<TYield> {
  done?: false;
  value: TYield;
}

interface IteratorReturnResult<TReturn> {
  done: true;
  value: TReturn;
}
```

简而言之，这意味当直接处理迭代器时，你将有能力细化值的类型。

为了正确的表示在调用生成器的 `next()` 方法的时候能被传入的类型，TypeScript 3.6 还可以在生成器函数内推断出 `yield` 的某些用法。

```typescript
function* foo() {
  let x: string = yield;
  console.log(x.toUpperCase());
}

let x = foo();
x.next(); // 第一次调用 `next` 总是被忽略
x.next(42); // 错啦！'number' 和 'string' 不匹配
```

如果你更喜欢显示的，你还可以使用显示的返回类型强制申明从生成表达式返回的、生成的和计算的的值的类型。下面，`next()` 只能被 `booleans` 值调用，并且根据 `done` 的值，`value` 可以是 `string` 或者 `number`。

```typescript
/**
 * - yields numbers
 * - returns strings
 * - can be passed in booleans
 */
function* counter(): Generator<number, string, boolean> {
  let i = 0;
  while (true) {
    if (yield i++) {
      break;
    }
  }
  return "done!";
}

var iter = counter();
var curr = iter.next()
while (!curr.done) {
  console.log(curr.value);
  curr = iter.next(curr.value === 5)
}
console.log(curr.value.toUpperCase());

// prints:
//
// 0
// 1
// 2
// 3
// 4
// 5
// DONE!
```

有关更多详细的改变，[查看 pull request](https://github.com/Microsoft/TypeScript/issues/2983)。

## 更准确的数组展开

在 ES2015 之前的目标中，对于像循环和数组展开之类的结构最忠实的生成可能有点繁重。因此，TypeScript 默认使用更简单的生成，它只支持数组类型，并支持使用 `--downlevelIteration` 标志迭代其它类型。在此标志下，发出的代码更准确，但更大。

默认情况下 `--downlevelIteration` 默认关闭效果很好，因为大多数以 ES5 为目标的用户只计划使用带数组的迭代结构。但是，我们支持数组的生成在某些边缘情况下仍然存在一些可观察到的差异。

例如，以下示例：

```typescript
[...Array(5)]
```

相当于以下数组：

```typescript
[undefined, undefined, undefined, undefined, undefined]
```

但是，TypeScript 会将原始代码转换为此代码：

```typescript
Array(5).slice();
```

这略有不同。 `Array(5)` 生成一个长度为 5 的数组，但并没有在其中插入任何元素！

```typescript
1 in [undefined, undefined, undefined] // true
1 in Array(3) // false
```

当 TypeScript 调用 `slice()` 时，它还会创建一个索引尚未设置的数组。

这可能看起来有点深奥，但事实证明许多用户遇到了这种令人不快的行为。 TypeScript 3.6 不是使用 `slice()` 和内置函数，而是引入了一个新的 `__spreadArrays` 辅助程序，以准确地模拟 ECMAScript 2015 中在 `--downlevelIteration` 之外的旧目标中发生的事情。 `__spreadArrays` 也可以在 [`tslib`](https://github.com/Microsoft/tslib/) 中使用（如果你正在寻找更小的包，那么值得一试）。

有关更多信息，请[参阅相关的 pull request](https://github.com/microsoft/TypeScript/pull/31166)。

## 改进了 `Promises` 的 UX

`Promise` 是当今使用异步数据的常用方法之一。不幸的是，使用面向 `Promise` 的 API 通常会让用户感到困惑。 TypeScript 3.6 引入了一些改进，以防止错误的处理 `Promise`。

例如，在将它传递给另一个函数之前忘记 `.then()` 或等待 `Promise` 的完成通常是很常见的。TypeScript 的错误消息现在是专门的，并告知用户他们可能应该考虑使用 `await` 关键字。

```typescript
interface User {
  name: string;
  age: number;
  location: string;
}

declare function getUserData(): Promise<User>;
declare function displayUser(user: User): void;

async function f() {
  displayUser(getUserData());
//            ~~~~~~~~~~~~~
// 'Promise <User>' 类型的参数不能分配给 'User' 类型的参数。
//   ...
// 你忘记使用 'await' 吗？
}
```

在等待或 `.then()` - `Promise` 之前尝试访问方法也很常见。这是另一个例子，在许多其他方面，我们能够做得更好。

```typescript
async function getCuteAnimals() {
  fetch("https://reddit.com/r/aww.json")
    .json()
  // ~~~~
  // 'Promise <Response>'类型中不存在属性'json'。
  // 你忘记使用'await'吗？
}
```

目的是即使用户不知道需要等待，至少，这些消息提供了更多关于从何处开始的上下文。

与可发现性相同，让您的生活更轻松 - 除了 `Promises` 上更好的错误消息之外，我们现在还在某些情况下提供快速修复。

![&#x6B63;&#x5728;&#x5E94;&#x7528;&#x5FEB;&#x901F;&#x4FEE;&#x590D;&#x4EE5;&#x6DFB;&#x52A0;&#x7F3A;&#x5C11;&#x7684; \`await\` &#x5173;&#x952E;&#x5B57;&#x3002;](https://user-images.githubusercontent.com/3277153/61071690-8ca53480-a3c6-11e9-9b08-4e6d9851c9db.gif)

有关更多详细信息，请[参阅原始问题以及链接回来的 pull request](https://github.com/microsoft/TypeScript/issues/30646)。

## 标识符更好的支持 Unicode

当发射到 ES2015 及更高版本的目标时，TypeScript 3.6 在标识符中包含对 Unicode 字符的更好支持。

```typescript
const 𝓱𝓮𝓵𝓵𝓸 = "world"; // previously disallowed, now allowed in '--target es2015'
// 以前不允许，现在在 '--target es2015' 中允许
```

## 支持在 SystemJS 中使用 `import.meta`

当模块目标设置为 `system` 时，TypeScript 3.6 支持将 `import.meta` 转换为 `context.meta`。

```typescript
// 此模块:
console.log(import.meta.url)

// 获得如下的转变:
System.register([], function (exports, context) {
  return {
    setters: [],
    execute: function () {
      console.log(context.meta.url);
    }
  };
});
```

## 在环境上下文中允许 `get` 和 `set` 访问者

在以前的 TypeScript 版本中，该语言不允许在环境上下文中使用 `get` 和 `set` 访问器（例如，在 `declare-d` 类中，或者在 `.d.ts` 文件中）。理由是，就这些属性的写作和阅读而言，访问者与属性没有区别，但是，[因为 ECMAScript 的类字段提议可能与现有版本的 TypeScript 具有不同的行为](https://github.com/tc39/proposal-class-fields/issues/248)，我们意识到我们需要一种方法来传达这种不同的行为，以便在子类中提供适当的错误。

因此，用户可以在 TypeScript 3.6 中的环境上下文中编写 `getter` 和 `setter`。

```typescript
declare class Foo {
  // 3.6+ 允许
  get x(): number;
  set x(val: number): void;
}
```

在TypeScript 3.7中，编译器本身将利用此功能，以便生成的 `.d.ts` 文件也将生成 `get` / `set` 访问器。

## 环境类和函数可以合并

在以前版本的 TypeScript 中，在任何情况下合并类和函数都是错误的。现在，环境类和函数（具有 `declare` 修饰符的类/函数或 `.d.ts` 文件中）可以合并。这意味着现在您可以编写以下内容：

```typescript
export declare function Point2D(x: number, y: number): Point2D;
export declare class Point2D {
  x: number;
  y: number;
  constructor(x: number, y: number);
}
```

而不需要使用

```typescript
export interface Point2D {
    x: number;
    y: number;
}
export declare var Point2D: {
    (x: number, y: number): Point2D;
    new (x: number, y: number): Point2D;
}
```

这样做的一个优点是可以很容易地表达可调用的构造函数模式，同时还允许名称空间与这些声明合并（因为 `var` 声明不能与名称空间合并）。

在 TypeScript 3.7 中，编译器将利用此功能，以便从 `.js` 文件生成的 `.d.ts` 文件可以适当地捕获类类函数的可调用性和可构造性。

有关更多详细信息，请[参阅 GitHub 上的原始 PR](https://github.com/microsoft/TypeScript/pull/32584)。

## APIs 支持 `--build` 和 `--incremental`

TypeScript 3.0 引入了对引用其他项目的支持，并使用 `--build` 标志以增量方式构建它们。此外，TypeScript 3.4 引入了 `--incremental` 标志，用于保存有关以前编译的信息，仅重建某些文件。这些标志对于更灵活地构建项目和加速构建非常有用。不幸的是，使用这些标志不适用于 Gulp 和 Webpack 等第三方构建工具。TypeScript 3.6 现在公开了两组 API 来操作项目引用和增量构建。

对于创建 `--incremental` 构建，用户可以利用 `createIncrementalProgram` 和 `createIncrementalCompilerHost` API。用户还可以使用新公开的 `readBuilderProgram` 函数从此 API 生成的 `.tsbuildinfo` 文件中重新保存旧程序实例，该函数仅用于创建新程序（即，您无法修改返回的实例 - 它意味着用于其他 `create * Program` 函数中的 `oldProgram` 参数）。

为了利用项目引用，公开了一个新的 `createSolutionBuilder` 函数，它返回一个新类型 `SolutionBuilder` 的实例。

有关这些 API 的更多详细信息，您可以[查看原始 pull request](https://github.com/microsoft/TypeScript/pull/31432)。

## 新的 TypeScript Playground

TypeScript Playground 已经获得了急需的刷新功能，并提供了便利的新功能！Playground 主要是 [Artem Tyurin](https://github.com/agentcooper) 的 [TypeScript Playground](https://github.com/agentcooper/typescript-play) 的一个分支，社区成员越来越多地使用它。我们非常感谢 Artem 在这里提供帮助！

新的 Playground 现在支持许多新的选项，包括：

* `target` 选项（允许用户切换输出 `es5` 到 `es3`、`es2015`、`esnext` 等）
* 所有的严格检查标记（包括 `just strict`）
* 支持纯 JavaScript 文件（使用 `allowJs` 和可选的 `checkJs`）

当分享 Playground 的链接时，这些选项也会保存下来，允许用户更可靠地分享示例，而无需告诉受众“哦，别忘了打开 `noImplicitAny` 选项！”。

在不久的将来，我们将更新 Playground 样本，添加 `JSX` 支持和改进自动类型获取，这意味着您将能够在 Playground 上体验到与编辑器中相同的体验。

随着我们改进 Playground 和网站，我们欢迎GitHub上的[issue 和 pull request](https://github.com/microsoft/TypeScript-Website/)！

## 代码编辑的分号感知

对于 Visual Studio 和 Visual Studio Code 编辑器可以自动的应用快速修复、重构和自动从其它模块导入值等其它的转换。这些转换都由 TypeScript 来驱动，老版本的 TypeScript 无条件的在语句的末尾添加分号，不幸的是，这和大多数用户的代码风格不相符，并且，很多用户对于编辑器自动输入分号很不爽。

TypeScript 现在在应用这些简短的编辑的时候，已经足够的智能去检测你的文件分号的使用情况。如果你的文件通常缺少分号，TypeScript 就不会添加分号。

更多细节，查看[这些 pull request](https://github.com/microsoft/TypeScript/pull/31801)。

## 更智能的自动导入

JavaScript 有大量不同的模块语法或者约定：EMACScript standard、CommonJS、AMD、System.js 等等。在大多数的情况下，TypeScript 默认使用 ECMAScript standard 语法自动导入，这在具有不同编译器设置的某些 TypeScript 项目中通常是不合适的，或者在使用纯 JavaScript 和需要调用的 Node 项目中。

在决定如何自动导入模块之前，TypeScript 3.6 现在会更加智能的查看你的现有导入。你可以通过[这些 pull request](https://github.com/microsoft/TypeScript/pull/32684)查看更多细节。

## 接下来？

要了解团队将要开展的工作，请[查看今年 7 月至 12 月的 6 个月路线图](https://github.com/microsoft/TypeScript/issues/33118)。

与往常一样，我们希望这个版本的 TypeScript 能让编码体验更好，让您更快乐。如果您有任何建议或遇到任何问题，我们总是感兴趣，所以随时[在GitHub上提一个 issue](https://github.com/microsoft/TypeScript/issues/new/choose)。

## 参考

* [Announcing TypeScript 3.6](https://devblogs.microsoft.com/typescript/announcing-typescript-3-6/)

