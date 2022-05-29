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

## 改进对象和方法里的函数类型推断

TypeScript 4.7 可以对数组和对象里的函数进行更精细的类型推断。
它们可以像普通参数那样将类型从左向右进行传递。

```ts
declare function f<T>(arg: {
    produce: (n: string) => T,
    consume: (x: T) => void }
): void;

// Works
f({
    produce: () => "hello",
    consume: x => x.toLowerCase()
});

// Works
f({
    produce: (n: string) => n,
    consume: x => x.toLowerCase(),
});

// Was an error, now works.
f({
    produce: n => n,
    consume: x => x.toLowerCase(),
});

// Was an error, now works.
f({
    produce: function () { return "hello"; },
    consume: x => x.toLowerCase(),
});

// Was an error, now works.
f({
    produce() { return "hello" },
    consume: x => x.toLowerCase(),
});
```

之所以有些类型推断之前会失败是因为，若要知道 `produce` 函数的类型则需要在找到合适的类型 `T` 之前间接地获得 `arg` 的类型。
（译者注：这些之前失败的情况均是需要进行按上下文件归类的场景，即需要先知道 `arg` 的类型，才能确定 `produce` 的类型；如果不需要执行按上下文归类就能确定 `produce` 的类型则没有问题。）
TypeScript 现在会收集与泛型参数 `T` 的类型推断相关的函数，然后进行惰性地类型推断。

更多详情请阅读[这里](https://github.com/microsoft/TypeScript/pull/48538)。

## 实例化表达式

我们偶尔可能会觉得某个函数过于通用了。
例如有一个 `makeBox` 函数。

```ts
interface Box<T> {
    value: T;
}

function makeBox<T>(value: T) {
    return { value };
}
```

假如我们想要定义一组更具体的可以收纳*扳手*和*锤子*的 `Box` 函数。
为此，我们将 `makeBox` 函数包装进另一个函数，或者明确地定义一个 `makeBox` 的类型别名。

```ts
function makeHammerBox(hammer: Hammer) {
    return makeBox(hammer);
}

// 或者

const makeWrenchBox: (wrench: Wrench) => Box<Wrench> = makeBox;
```

这样可以工作，但有些浪费且笨重。
理想情况下，我们可以在替换泛型参数的时候直接声明 `makeBox` 的别名。

TypeScript 4.7 支持了该特性！
我们现在可以直接为函数和构造函数传入类型参数。

```ts
const makeHammerBox = makeBox<Hammer>;
const makeWrenchBox = makeBox<Wrench>;
```

这样我们可以让 `makeBox` 只接受更具体的类型并拒绝其它类型。

```ts
const makeStringBox = makeBox<string>;

// TypeScript 会提示错误
makeStringBox(42);
```

这对构造函数也生效，例如 `Array`，`Map` 和 `Set`。

```ts
// 类型为 `new () => Map<string, Error>`
const ErrorMap = Map<string, Error>;

// 类型为 `Map<string, Error>`
const errorMap = new ErrorMap();
```

当函数或构造函数接收了一个类型参数，它会生成一个新的类型并保持所有签名使用了兼容的类型参数列表，
将形式类型参数替换成给定的实际类型参数。
其它种类的签名会被丢弃，因为 TypeScript 认为它们不会被使用到。

更多详情请阅读[这里](https://github.com/microsoft/TypeScript/pull/47607)。

## `infer` 类型参数上的 `extends` 约束

有条件类型有点儿像一个进阶功能。
它允许我们匹配并依据类型结构进行推断，然后作出某种决定。
例如，编写一个有条件类型，它返回元组类型的第一个元素如果它类似 `string` 类型的话。

```ts
type FirstIfString<T> =
    T extends [infer S, ...unknown[]]
        ? S extends string ? S : never
        : never;

 // string
type A = FirstIfString<[string, number, number]>;

// "hello"
type B = FirstIfString<["hello", number, number]>;

// "hello" | "world"
type C = FirstIfString<["hello" | "world", boolean]>;

// never
type D = FirstIfString<[boolean, number, string]>;
```

`FirstIfString` 匹配至少有一个元素的元组类型，将元组第一个元素的类型提取到 `S`。
然后检查 `S` 与 `string` 是否兼容，如果是就返回它。

可以注意到我们必须使用两个有条件类型来实现它。
我们也可以这样定义 `FirstIfString`：

```ts
type FirstIfString<T> =
    T extends [string, ...unknown[]]
        // Grab the first type out of `T`
        ? T[0]
        : never;
```

它可以工作但要更多的“手动”操作且不够形象。
我们不是进行类型模式匹配并给首个元素命名，而是使用 `T[0]` 来提取 `T` 的第 `0` 个元素。
如果我们处理的是比元组类型复杂得多的类型就会变得棘手，因此 `infer` 可以让事情变得简单。

使用嵌套的条件来推断类型再去匹配推断出的类型是很常见的。
为了省去那一层嵌套，TypeScript 4.7 允许在 `infer` 上应用约束。

```ts
type FirstIfString<T> =
    T extends [infer S extends string, ...unknown[]]
        ? S
        : never;
```

通过这种方式，在 TypeScript 去匹配 `S` 时，它也会保证 `S` 是 `string` 类型。
如果 `S` 不是 `string` 就是进入到 `false` 分支，此例中为 `never`。

更多详情请阅读[这里](https://github.com/microsoft/TypeScript/pull/48112)。

## 可选的类型参数变型注释

先看一下如下的类型。

```ts
interface Animal {
    animalStuff: any;
}

interface Dog extends Animal {
    dogStuff: any;
}

// ...

type Getter<T> = () => T;

type Setter<T> = (value: T) => void;
```

假设有两个不同的 `Getter` 实例。
要想知道这两个 `Getter` 实例是否可以相互替换完全依赖于类型 `T`。
例如要知道 `Getter<Dog> → Getter<Animal>` 是否允许，则需要检查 `Dog → Animal` 是否允许。
因为对 `T` 与 `Getter<T>` 的判断是相同“方向”的，我们称 `Getter` 是*协变*的。
相反的，判断 `Setter<Dog> → Setter<Animal>` 是否允许，需要检查 `Animal → Dog` 是否允许。
这种在方向上的“翻转”有点像数学里判断 $−x < −y$ 等同于判断 $y < x$。
当我们需要像这样翻转方向来比较 `T` 时，我们称 `Setter` 对于 `T` 是*逆变*的。

在 TypeScript 4.7 里，我们可以明确地声明类型参数上的变型关系。

因此，现在如果想在 `Getter` 上明确地声明对于 `T` 的协变关系则可以使用 `out` 修饰符。

```ts
type Getter<out T> = () => T;
```

相似的，如果想要明确地声明 `Setter` 对于 `T` 是逆变关系则可以指定 `in` 修饰符。

```ts
type Setter<in T> = (value: T) => void;
```

使用 `out` 和 `in` 的原因是类型参数的变型关系依赖于它们被用在*输出*的位置还是*输入*的位置。
若不思考变型关系，你也可以只关注 `T` 是被用在输出还是输入位置上。

当然也有同时使用 `out` 和 `in` 的时候。

```ts
interface State<in out T> {
    get: () => T;
    set: (value: T) => void;
}
```

当 `T` 被同时用在输入和输出的位置上时就成为了*不变*关系。
两个不同的 `State<T>` 不允许互换使用，除非两者的 `T` 是相同的。
换句话说，`State<Dog>` 和 `State<Animal>` 不能互换使用。

从技术上讲，在纯粹的结构化类型系统里，类型参数和它们的变型关系不太重要 -
我们只需要将类型参数替换为实际类型，然后再比较相匹配的类型成员之间是否兼容。
那么如果 TypeScript 使用结构化类型系统为什么我们要在意类型参数的变型呢？
还有为什么我们会想要为它们添加类型注释呢？

其中一个原因是可以让读者能够明确地知道类型参数是如何被使用的。
对于十分复杂的类型来讲，可能很难确定一个类型参数是用于输入或者输出再或者两者兼有。
如果我们忘了说明类型参数是如何被使用的，TypeScript 也会提示我们。
举个例子，如果忘了在 `State` 上添加 `in` 和 `out` 就会产生错误。

```ts
interface State<out T> {
    //          ~~~~~
    // error!
    // Type 'State<sub-T>' is not assignable to type 'State<super-T>' as implied by variance annotation.
    //   Types of property 'set' are incompatible.
    //     Type '(value: sub-T) => void' is not assignable to type '(value: super-T) => void'.
    //       Types of parameters 'value' and 'value' are incompatible.
    //         Type 'super-T' is not assignable to type 'sub-T'.
    get: () => T;
    set: (value: T) => void;
}
```

另一个原因则有关精度和速度。
TypeScript 已经在尝试推断类型参数的变型并做为一项优化。
这样做可以快速对大型的结构化类型进行类型检查。
提前计算变型省去了深入结构内部进行兼容性检查的步骤，
仅比较类型参数相比于一次又一次地比较完整的类型结构会快得多。
但经常也会出现这个计算十分耗时，并且在计算时产生了环，从而无法得到准确的变型关系。

```ts
type Foo<T> = {
    x: T;
    f: Bar<T>;
}

type Bar<U> = (x: Baz<U[]>) => void;

type Baz<V> = {
    value: Foo<V[]>;
}

declare let foo1: Foo<unknown>;
declare let foo2: Foo<string>;

foo1 = foo2;  // Should be an error but isn't ❌
foo2 = foo1;  // Error - correct ✅
```

提供明确的类型注解能够加快对环状类型的解析速度，有利于提高准确度。
例如，将上例的 `T` 设置为逆变可以帮助阻止有问题的赋值运算。

```ts
- type Foo<T> = {
+ type Foo<in out T> = {
      x: T;
      f: Bar<T>;
  }
```

我们并不推荐为所有的类型参数都添加变型注解；
例如，我们是能够（但不推荐）将变型设置为更严格的关系（即便实际上不需要），
因此 TypeScript 不会阻止你将类型参数设置为不变，就算它们实际上是协变的、逆变的或者是分离的。
因此，如果你选择添加明确的变型标记，我们推荐要经过深思熟虑后准确地使用它们。

但如果你操作的是深层次的递归类型，尤其是作为代码库作者，那么你可能会对使用这些注解来让用户获利感兴趣。
这些注解能够帮助提高准确性和类型检查速度，甚至可以增强代码编辑的体验。
可以通过实验来确定变型计算是否为类型检查时间的瓶颈，例如使用像 [analyze-trace](https://github.com/microsoft/typescript-analyze-trace) 这样的工具。

更多详情请阅读[这里](https://github.com/microsoft/TypeScript/pull/48240)。

## 使用 `moduleSuffixes` 自定义解析策略

TypeScript 4.7 支持了 `moduleSuffixes` 选项来自定义模块说明符的查找方式。

```ts
{
    "compilerOptions": {
        "moduleSuffixes": [".ios", ".native", ""]
    }
}
```

对于上述配置，如果有如下的导入语句：

```ts
import * as foo from "./foo";
```

它会尝试查找文件 `./foo.ios.ts`，`./foo.native.ts` 最后是 `./foo.ts`。

注意 `moduleSuffixes` 末尾的空字符串 `""` 是必须的，只有这样 TypeScript 才会去查找 `./foo.ts`。
也就是说，`moduleSuffixes` 的默认值是 `[""]`。

这个功能对于 React Native 工程是很有用的，因为对于不同的目标平台会有不同的 `tsconfig.json` 和 `moduleSuffixes`。

这个[功能](https://github.com/microsoft/TypeScript/pull/48189)是由 [Adam Foxman](https://github.com/afoxman) 贡献的！

## resolution-mode

Node.js 的 ECMAScript 解析规则是根据当前文件所属的模式以及使用的语法来决定如何解析导入；
然而，在 ECMAScript 模块里引用 CommonJS 模块也是很常用的，或者反过来。

TypeScript 允许使用 `/// <reference types="..." />` 指令。

```ts
/// <reference types="pkg" resolution-mode="require" />

// or

/// <reference types="pkg" resolution-mode="import" />
```

此外，在 Nightly 版本的 TypeScript 里，`import type` 可以指定导入断言来达到同样的目的。

```ts
// Resolve `pkg` as if we were importing with a `require()`
import type { TypeFromRequire } from "pkg" assert {
    "resolution-mode": "require"
};

// Resolve `pkg` as if we were importing with an `import`
import type { TypeFromImport } from "pkg" assert {
    "resolution-mode": "import"
};

export interface MergedType extends TypeFromRequire, TypeFromImport {}
```

这些断言也可以用在 `import()` 类型上。

```ts
export type TypeFromRequire =
    import("pkg", { assert: { "resolution-mode": "require" } }).TypeFromRequire;

export type TypeFromImport =
    import("pkg", { assert: { "resolution-mode": "import" } }).TypeFromImport;

export interface MergedType extends TypeFromRequire, TypeFromImport {}
```

`import type` 和 `import()` 语法仅在 [Nightly 版本](https://www.typescriptlang.org/docs/handbook/nightly-builds.html)里支持 `resolution-mode`。
你可能会看到如下的错误：

```txt
Resolution mode assertions are unstable.
Use nightly TypeScript to silence this error.
Try updating with 'npm install -D typescript@next'.
```

如果你在 TypeScript 的 Nightly 版本中使用了该功能，别忘了可以[提供反馈](https://github.com/microsoft/TypeScript/issues/49055)。

更多详情请查看 [PR: 引用指令](https://github.com/microsoft/TypeScript/pull/47732)和[PR: 类型导入断言](https://github.com/microsoft/TypeScript/pull/47807)。

## 跳转到在源码中的定义

TypeScript 4.7 支持了一个实验性的编辑器功能叫作 *Go To Source Definition* （跳转到在源码中的定义）。
它和 *Go To Definition* （跳转到定义）相似，但不是跳转到声明文件中。
而是查找相应的*实现*文件（比如 `.js` 或 `.ts` 文件），并且在那里查找定义 -
即便这些文件总是会被声明文件 `.d.ts` 所遮蔽。

当你想查看导入的三方库的函数实现而不是 `.d.ts` 声明文件时是很便利的。

你可以在最新版本的 Visual Studio Code 里试用该功能。
但该功能还是预览版，存在一些已知的限制。
在某些情况下 TypeScript 使用启发式的方法来猜测函数定义的代码在哪个 `.js` 文件中，
因此结果可能不太精确。
Visual Studio Code 也不会提示哪些结果是通过猜测得到的，但我们正在实现它。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/issues/49003)。

## 分组整理导入语句

TypeScript 为 JavaScript 和 TypeScript 提供了叫做 “Organize Imports” （整理导入语句）编辑器功能。
可是，它的行为有点简单粗暴，它直接排序所有的导入语句。

例如，在如下的代码上使用 “Organize Imports”：

```ts
// local code
import * as bbb from "./bbb";
import * as ccc from "./ccc";
import * as aaa from "./aaa";

// built-ins
import * as path from "path";
import * as child_process from "child_process"
import * as fs from "fs";

// some code...
```

你会得到：

```ts
// local code
import * as child_process from "child_process";
import * as fs from "fs";
// built-ins
import * as path from "path";
import * as aaa from "./aaa";
import * as bbb from "./bbb";
import * as ccc from "./ccc";


// some code...
```

这不是我们想要的。
尽管导入语句已经按它们的路径排序了，并且注释和折行被保留了，
但仍不是我们期望的。

TypeScript 4.7 在 “Organize Imports” 时会考虑分组。
再次在上例代码上执行 “Organize Imports” 会得到期望的结果：

```ts
// local code
import * as aaa from "./aaa";
import * as bbb from "./bbb";
import * as ccc from "./ccc";

// built-ins
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

// some code...
```

感谢 [Minh Quy](https://github.com/MQuy) 的 [PR](https://github.com/microsoft/TypeScript/pull/48330)。
