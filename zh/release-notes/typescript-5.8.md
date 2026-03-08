# TypeScript 5.8

## 返回表达式中分支的精细检查

考虑如下代码：

```ts
declare const untypedCache: Map<any, any>;

function getUrlObject(urlString: string): URL {
  return untypedCache.has(urlString) ? untypedCache.get(urlString) : urlString;
}
```

这段代码的意图是：如果缓存中存在对应的 URL 对象则将其取出，否则创建一个新的 URL 对象。
然而其中存在一个 bug：我们忘记使用输入参数实际构造一个新的 URL 对象。
不幸的是，TypeScript 通常不会捕获这类 bug。

当 TypeScript 检查条件表达式（如 `cond ? trueBranch : falseBranch`）时，其类型被视为两个分支类型的联合类型。
换句话说，它会获取 `trueBranch` 和 `falseBranch` 的类型，并将其合并为联合类型。
在这个例子中，`untypedCache.get(urlString)` 的类型是 `any`，而 `urlString` 的类型是 `string`。
这就是问题所在，因为 `any` 在与其他类型交互时具有很强的传染性。
联合类型 `any | string` 被简化为 `any`，因此当 TypeScript 开始检查 `return` 语句中的表达式是否与声明的返回类型 `URL` 兼容时，类型系统已经丢失了所有能够捕获这个 bug 的信息。

在 TypeScript 5.8 中，类型系统对直接位于 `return` 语句中的条件表达式进行了特殊处理。
条件表达式的每个分支都会与所在函数的声明返回类型（如果存在）进行单独检查，因此类型系统能够捕获上述示例中的 bug。

```ts
declare const untypedCache: Map<any, any>;

function getUrlObject(urlString: string): URL {
  return untypedCache.has(urlString) ? untypedCache.get(urlString) : urlString;
  //  ~~~~~~~~~
  // error! Type 'string' is not assignable to type 'URL'.
}
```

此更改是在[此 pull request](https://github.com/microsoft/TypeScript/pull/56941) 中完成的，是 TypeScript 一系列未来改进计划的一部分。

## `--module nodenext` 中对 ECMAScript 模块 `require()` 的支持

多年来，Node.js 同时支持 ECMAScript 模块（ESM）和 CommonJS 模块。
不幸的是，两者之间的互操作性存在一些挑战。

- ESM 文件可以 `import` CommonJS 文件
- CommonJS 文件***无法*** `require()` ESM 文件

换句话说，从 ESM 文件中使用 CommonJS 文件是可行的，但反过来则不行。
这给希望提供 ESM 支持的库作者带来了许多挑战。
这些库作者要么必须放弃与 CommonJS 用户的兼容性，要么"双重发布"其库（分别为 ESM 和 CommonJS 提供独立的入口点），要么就永远停留在 CommonJS 上。
虽然双重发布听起来像是一个不错的折中方案，但这是一个复杂且易出错的过程，同时还会使包内的代码量大约翻倍。

Node.js 22 放宽了其中一些限制，允许从 CommonJS 模块向 ECMAScript 模块发起 `require("esm")` 调用。
Node.js 仍然不允许对含有顶层 `await` 的 ESM 文件使用 `require()`，但大多数其他 ESM 文件现在都可以从 CommonJS 文件中使用。
这为库作者提供了一个重要机会，使其无需双重发布即可提供 ESM 支持。

TypeScript 5.8 在 `--module nodenext` 标志下支持此行为。
当启用 `--module nodenext` 时，TypeScript 将不再对这些针对 ESM 文件的 `require()` 调用报错。

由于此功能可能会被向后移植到旧版本的 Node.js，目前还没有稳定的 `--module nodeXXXX` 选项来启用此行为；
但我们预计未来版本的 TypeScript 可能会在 `node20` 下将此功能稳定化。
与此同时，我们鼓励 Node.js 22 及更高版本的用户使用 `--module nodenext`，而库作者和旧版 Node.js 用户应继续使用 `--module node16`（或小幅升级到 [`--module node18`](#--module-node18)）。

更多信息，请[参阅我们对 require("esm") 的支持](https://github.com/microsoft/TypeScript/pull/60761)。

## `--module node18`

TypeScript 5.8 引入了稳定的 `--module node18` 标志。
对于固定使用 Node.js 18 的用户，该标志提供了一个稳定的参考点，不包含 `--module nodenext` 中的某些行为。
具体来说：

- `require()` ECMAScript 模块在 `node18` 下不允许，但在 `nodenext` 下允许
- import 断言（已被 import 属性取代）在 `node18` 下允许，但在 `nodenext` 下不允许

更多信息请参阅 [`--module node18` pull request](https://github.com/microsoft/TypeScript/pull/60722) 以及[对 `--module nodenext` 所做的更改](https://github.com/microsoft/TypeScript/pull/60761)。

## `--erasableSyntaxOnly` 选项

最近，Node.js 23.6 取消了[直接运行 TypeScript 文件的实验性支持](https://nodejs.org/api/typescript.html#type-stripping)的标志限制；
但是，该模式下只支持特定的语法结构。
Node.js 取消限制的模式叫做 `--experimental-strip-types`，它要求任何 TypeScript 特有的语法不能具有运行时语义。
换句话说，必须能够轻松地从文件中*擦除*或"剥离"所有 TypeScript 特有的语法，从而留下一个有效的 JavaScript 文件。

这意味着以下构造不被支持：

- `enum` 声明
- 含有运行时代码的 `namespace` 和 `module`
- 类中的参数属性
- 非 ECMAScript 的 `import =` 和 `export =` 赋值

以下是一些不起作用的示例：

```ts
// ❌ error: An `import ... = require(...)` alias
import foo = require('foo');

// ❌ error: A namespace with runtime code.
namespace container {}

// ❌ error: An `import =` alias
import Bar = container.Bar;

class Point {
  // ❌ error: Parameter properties
  constructor(
    public x: number,
    public y: number,
  ) {}
}

// ❌ error: An `export =` assignment.
export = Point;

// ❌ error: An enum declaration.
enum Direction {
  Up,
  Down,
  Left,
  Right,
}
```

类似的工具，如 [ts-blank-space](https://github.com/bloomberg/ts-blank-space) 或 [Amaro](https://github.com/nodejs/amaro)（Node.js 中类型剥离的底层库），也有同样的限制。
这些工具在遇到不符合要求的代码时会提供有用的错误信息，但你仍然要到实际尝试运行时才会发现代码不起作用。

这就是 TypeScript 5.8 引入 `--erasableSyntaxOnly` 标志的原因。
启用此标志后，TypeScript 将对大多数具有运行时行为的 TypeScript 特有构造报错。

```ts
class C {
    constructor(public x: number) { }
    //          ~~~~~~~~~~~~~~~~
    // error! This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
    }
}
```

通常，您需要将此标志与 `--verbatimModuleSyntax` 结合使用，后者可确保模块包含适当的导入语法，并且不会进行 import 省略。

更多信息，请[参阅此处的实现](https://github.com/microsoft/TypeScript/pull/61011)。

## `--libReplacement` 标志

在 TypeScript 4.5 中，我们引入了用自定义文件替换默认 `lib` 文件的可能性。
这基于从名为 `@typescript/lib-*` 的包中解析库文件的能力。
例如，您可以通过以下 `package.json` 将 `dom` 库锁定到 [@types/web 包](https://www.npmjs.com/package/@types/web?activeTab=readme) 的特定版本：

```json
{
  "devDependencies": {
    "@typescript/lib-dom": "npm:@types/web@0.0.199"
  }
}
```

安装后，名为 `@typescript/lib-dom` 的包应已存在，TypeScript 会在 `dom` 被您的设置隐含时始终查找它。

这是一个强大的功能，但它也会带来一些额外开销。
即使您不使用此功能，TypeScript 也始终会执行此查找，并且必须监视 `node_modules` 中的更改，以防 `lib` 替换包*开始*存在。

TypeScript 5.8 引入了 `--libReplacement` 标志，允许您禁用此行为。
如果您不使用 `--libReplacement`，现在可以通过 `--libReplacement false` 来禁用它。
未来，`--libReplacement false` 可能会成为默认值，因此如果您目前依赖此行为，应考虑通过 `--libReplacement true` 显式启用它。

更多信息，请[参阅此处的更改](https://github.com/microsoft/TypeScript/issues/61023)。

## 声明文件中保留计算属性名

为了使计算属性在声明文件中具有更可预测的输出，TypeScript 5.8 将在类的计算属性名中始终保留实体名称（`裸变量` 和形如 `dotted.names.that.look.like.this` 的点分名称）。

例如，考虑以下代码：

```ts
export let propName = 'theAnswer';

export class MyClass {
  [propName] = 42;
  //  ~~~~~~~~~~
  // error!
  // A computed property name in a class property declaration must have a simple literal type or a 'unique symbol' type.
}
```

旧版 TypeScript 在为此模块生成声明文件时会报错，并会生成一个尽力而为的声明文件，其中包含索引签名。

```ts
export declare let propName: string;
export declare class MyClass {
  [x: string]: number;
}
```

在 TypeScript 5.8 中，示例代码现在是被允许的，并且生成的声明文件将与您所写的内容相匹配：

```ts
export declare let propName: string;
export declare class MyClass {
  [propName]: number;
}
```

请注意，这不会在类上创建静态命名的属性。
您最终得到的实际上仍然是类似 `[x: string]: number` 的索引签名，因此对于该用例，您需要使用 `unique symbol` 或字面量类型。

请注意，在 `--isolatedDeclarations` 标志下，编写此代码过去是（现在仍然是）一个错误；
但我们预期，得益于此更改，计算属性名通常将被允许用于声明输出。

请注意，在 TypeScript 5.8 中编译的文件生成的声明文件，有可能（虽然不太可能）与 TypeScript 5.7 或更早版本不向后兼容。

更多信息，请[参阅实现 PR](https://github.com/microsoft/TypeScript/pull/60052)。

## 程序加载和更新的优化

TypeScript 5.8 引入了一系列优化，可以改善构建程序的时间，以及在 `--watch` 模式或编辑器场景中根据文件变更更新程序的时间。

首先，TypeScript 现在[避免了路径规范化过程中涉及的数组分配](https://github.com/microsoft/TypeScript/pull/60812)。
通常，路径规范化需要将路径的每个部分分割为字符串数组，根据相对路径段对结果路径进行规范化，然后使用规范分隔符将其重新拼接。
对于拥有大量文件的项目，这是一项繁重且重复的工作。
TypeScript 现在避免分配数组，而是更直接地在原始路径的索引上进行操作。

此外，当编辑不改变项目基本结构时，[TypeScript 现在会避免重新验证传入的选项](https://github.com/microsoft/TypeScript/pull/60754)（例如 `tsconfig.json` 的内容）。
这意味着，例如，一次简单的编辑可能不需要检查项目的输出路径是否与输入路径冲突。
取而代之的是，可以直接使用上次检查的结果。
这应该使大型项目中的编辑感觉更加流畅。

## 重要行为变更

本节重点介绍了一系列值得注意的变更，在进行任何升级时都应了解和理解这些变更。
有时它会重点说明弃用项、删除项和新增限制。
它也可能包含功能上有所改进的 bug 修复，但这些修复也可能通过引入新的错误影响现有构建。

### `lib.d.ts`

为 DOM 生成的类型可能会对您代码库的类型检查产生影响。
更多信息，请[参阅与此版本 TypeScript 的 DOM 和 `lib.d.ts` 更新相关的 issue](https://github.com/microsoft/TypeScript/issues/60985)。

### `--module nodenext` 下对 Import 断言的限制

Import 断言是拟议添加到 ECMAScript 中的功能，用于确保导入的某些属性（例如"此模块是 JSON，不应被视为可执行的 JavaScript 代码"）。
它后来被重新设计为名为 [import 属性](https://github.com/tc39/proposal-import-attributes)的提案。
在过渡过程中，关键字从 `assert` 改为 `with`。

```ts
// An import assertion ❌ - not future-compatible with most runtimes.
import data from './data.json' assert { type: 'json' };

// An import attribute ✅ - the preferred way to import a JSON file.
import data from './data.json' with { type: 'json' };
```

Node.js 22 不再接受使用 `assert` 语法的 import 断言。
因此，当在 TypeScript 5.8 中启用 `--module nodenext` 时，TypeScript 若遇到 import 断言将会报错。

```ts
import data from './data.json' assert { type: 'json' };
//                             ~~~~~~
// error! Import assertions have been replaced by import attributes. Use 'with' instead of 'assert'
```

更多信息，请[参阅此处的更改](https://github.com/microsoft/TypeScript/pull/60761)
