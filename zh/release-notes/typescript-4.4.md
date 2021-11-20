# TypeScript 4.4

## 针对条件表达式和判别式的别名引用进行控制流分析

在 JavaScript 中，总会用多种方式对某个值进行检查，然后根据不同类型的值执行不同的操作。
TypeScript 能够理解这些检查，并将它们称作为*类型守卫*。
我们不需要在变量的每一个使用位置上都指明类型，TypeScript 的类型检查器能够利用*基于控制流的分析*技术来检查是否在前面使用了类型守卫。

例如，可以这样写

```ts twoslash
function foo(arg: unknown) {
    if (typeof arg === 'string') {
        console.log(arg.toUpperCase());
        //           ^?
    }
}
```

这个例子中，我们检查 `arg` 是否为 `string` 类型。
TypeScript 识别出了 `typeof arg === "string"` 检查，它被当作是一个类型守卫，并且知道在 `if` 分支内 `arg` 的类型为 `string`。
这样就可以正常地访问 `string` 类型上的方法，例如 `toUpperCase()`。

但如果我们将条件表达式提取到一个名为 `argIsString` 的常量会发生什么？

```ts
// 在 TS 4.3 及以下版本

function foo(arg: unknown) {
    const argIsString = typeof arg === 'string';
    if (argIsString) {
        console.log(arg.toUpperCase());
        //              ~~~~~~~~~~~
        // 错误！'unknown' 类型上不存在 'toUpperCase' 属性。
    }
}
```

在之前版本的 TypeScript 中，这样做会产生错误 - 就算 `argIsString` 的值为类型守卫，TypeScript 也会丢掉这个信息。
这不是想要的结果，因为我们可能想要在不同的地方重用这个检查。
为了绕过这个问题，通常需要重复多次代码或使用类型断言。

在 TypeScript 4.4 中，情况有所改变。
上面的例子不再产生错误！
当 TypeScript 看到我们在检查一个常量时，会额外检查它是否包含类型守卫。
如果那个类型守卫操作的是 `const` 常量，某个 `readonly` 属性或某个未修改的参数，那么 TypeScript 能够对该值进行类型细化。

不同种类的类型守卫都支持，不只是 `typeof` 类型守卫。
例如，对于可辨识联合类型同样适用。

```ts twoslash
type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'square'; sideLength: number };

function area(shape: Shape): number {
    const isCircle = shape.kind === 'circle';
    if (isCircle) {
        // 知道此处为 circle
        return Math.PI * shape.radius ** 2;
    } else {
        // 知道此处为 square
        return shape.sideLength ** 2;
    }
}
```

在 TypeScript 4.4 版本中对判别式的分析又进了一层 - 现在可以提取出判别式然后细化原来的对象类型。

```ts twoslash
type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'square'; sideLength: number };

function area(shape: Shape): number {
    // Extract out the 'kind' field first.
    const { kind } = shape;

    if (kind === 'circle') {
        // We know we have a circle here!
        return Math.PI * shape.radius ** 2;
    } else {
        // We know we're left with a square here!
        return shape.sideLength ** 2;
    }
}
```

另一个例子，该函数会检查它的两个参数是否有内容。

```ts twoslash
function doSomeChecks(
    inputA: string | undefined,
    inputB: string | undefined,
    shouldDoExtraWork: boolean
) {
    const mustDoWork = inputA && inputB && shouldDoExtraWork;
    if (mustDoWork) {
        // We can access 'string' properties on both 'inputA' and 'inputB'!
        const upperA = inputA.toUpperCase();
        const upperB = inputB.toUpperCase();
        // ...
    }
}
```

TypeScript 知道如果 `mustDoWork` 为 `true` 那么 `inputA` 和 `inputB` 都存在。
也就是说不需要编写像 `inputA!` 这样的非空断言的代码来告诉 TypeScript `inputA` 不为 `undefined`。

一个好的性质是该分析同时具有可传递性。
TypeScript 可以通过这些常量来理解在它们背后执行的检查。

```ts twoslash
function f(x: string | number | boolean) {
    const isString = typeof x === 'string';
    const isNumber = typeof x === 'number';
    const isStringOrNumber = isString || isNumber;
    if (isStringOrNumber) {
        x;
        //  ^?
    } else {
        x;
        //  ^?
    }
}
```

注意这里会有一个截点 - TypeScript 并不是毫无限制地去追溯检查这些条件表达式，但对于大多数使用场景而言已经足够了。

这个功能能让很多直观的 JavaScript 代码在 TypeScript 里也好用，而不会妨碍我们。
更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44730)！

## Symbol 以及模版字符串索引签名

TypeScript 支持使用*索引签名*来为对象的每个属性定义类型。
这样我们就可以将对象当作字典类型来使用，把字符串放在方括号里来进行索引。

例如，可以编写由 `string` 类型的键映射到 `boolean` 值的类型。
如果我们给它赋予 `boolean` 类型以外的值会报错。

```ts twoslash
interface BooleanDictionary {
    [key: string]: boolean;
}

declare let myDict: BooleanDictionary;

// 允许赋予 boolean 类型的值
myDict['foo'] = true;
myDict['bar'] = false;

// 错误
myDict['baz'] = 'oops';
```

虽说在这里 [`Map` 可能是更适合的数据结构](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)（具体的说是 `Map<string, boolean>`），但 JavaScript 对象通常更方便或者正是我们要操作的目标。

相似地，`Array<T>` 已经定义了 `number` 索引签名，我们可以插入和获取 `T` 类型的值。

```ts
// 这是 TypeScript 内置的部分 Array 类型
interface Array<T> {
    [index: number]: T;

    // ...
}

let arr = new Array<string>();

// 没问题
arr[0] = 'hello!';

// 错误，期待一个 'string' 值
arr[1] = 123;
```

索引签名是一种非常有用的表达方式。
然而，直到现在它们只能使用 `string` 和 `number` 类型的键（`string` 索引签名存在一个有意为之的怪异行为，它们可以接受 `number` 类型的键，因为 `number` 会被转换为字符串）。
这意味着 TypeScript 不允许使用 `symbol` 类型的键来索引对象。
TypeScript 也无法表示由一部分 `string` 类型的键组成的索引签名 - 例如，对象属性名是以 `data-` 字符串开头的索引签名。

TypeScript 4.4 解决了这个问题，允许 `symbol` 索引签名以及模版字符串。

例如，TypeScript 允许声明一个接受任意 `symbol` 值作为键的对象类型。

```ts twoslash
interface Colors {
    [sym: symbol]: number;
}

const red = Symbol('red');
const green = Symbol('green');
const blue = Symbol('blue');

let colors: Colors = {};

// 没问题
colors[red] = 255;
let redVal = colors[red];
//  ^ number

colors[blue] = 'da ba dee';
// 错误：'string' 不能赋值给 'number'
```

相似地，可以定义带有模版字符串的索引签名。
一个场景是用来免除对以 `data-` 开头的属性名执行的 TypeScript 额外属性检查。
当传递一个对象字面量给目标类型时，TypeScript 会检查是否存在相比于目标类型的额外属性。

```ts
interface Options {
    width?: number;
    height?: number;
}

let a: Options = {
    width: 100,
    height: 100,

    'data-blah': true,
};

interface OptionsWithDataProps extends Options {
    // 允许以 'data-' 开头的属性
    [optName: `data-${string}`]: unknown;
}

let b: OptionsWithDataProps = {
    width: 100,
    height: 100,
    'data-blah': true,

    // 使用未知属性会报错，不包括以 'data-' 开始的属性
    'unknown-property': true,
};
```

最后，索引签名现在支持联合类型，只要它们是无限域原始类型的联合 - 尤其是：

-   `string`
-   `number`
-   `symbol`
-   模版字符串（例如 `` `hello-${string}` ``）

带有以上类型的联合的索引签名会展开为不同的索引签名。

```ts
interface Data {
    [optName: string | symbol]: any;
}

// 等同于

interface Data {
    [optName: string]: any;
    [optName: symbol]: any;
}
```

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44512)。

## Defaulting to the `unknown` Type in Catch Variables (`--useUnknownInCatchVariables`)

## 异常捕获变量的类型默认为 `unknown` （`--useUnknownInCatchVariables`）

在 JavaScript 中，允许使用 `throw` 语句抛出任意类型的值，并在 `catch` 语句中捕获它。
因此，TypeScript 从前会将异常捕获变量的类型设置为 `any` 类型，并且不允许指定其它的类型注解:

```ts
try {
    // 谁知道它会抛出什么东西
    executeSomeThirdPartyCode();
} catch (err) {
    // err: any
    console.error(err.message); // 可以，因为类型为 'any'
    err.thisWillProbablyFail(); // 可以，因为类型为 'any' :(
}
```

当 TypeScript 引入了 `unknown` 类型后，对于追求高度准确性和类型安全的用户来讲在 `catch` 语句的捕获变量处使用 `unknown` 成为了比 `any` 类型更好的选择，因为它强制我们去检测要使用的值。
后来，TypeScript 4.0 允许用户在 `catch` 语句中明确地指定 `unknown`（或 `any`）类型，这样就可以根据情况有选择一使用更严格的类型检查；
然而，在每一处 `catch` 语句里手动指定 `: unknown` 是一件繁琐的事情。

因此，TypeScript 4.4 引入了一个新的标记 `--useUnknownInCatchVariables`。
它将 `catch` 语句捕获变量的默认类型由 `any` 改为 `unknown`。

```ts
declare function executeSomeThirdPartyCode(): void;

try {
    executeSomeThirdPartyCode();
} catch (err) {
    // err: unknown

    // Error! Property 'message' does not exist on type 'unknown'.
    console.error(err.message);

    // Works! We can narrow 'err' from 'unknown' to 'Error'.
    if (err instanceof Error) {
        console.error(err.message);
    }
}
```

这个标记属性于 `--strict` 标记家族的一员。
也就是说如果你启用了 `--strict`，那么该标记也自动启用了。
在 TypeScript 4.4 中，你可能会看到如下的错误：

```
Property 'message' does not exist on type 'unknown'.
Property 'name' does not exist on type 'unknown'.
Property 'stack' does not exist on type 'unknown'.
```

如果我们不想处理 `catch` 语句中 `unknown` 类型的捕获变量，那么可以明确使用 `: any` 类型注解，这样就会关闭严格类型检查。

```ts twoslash
declare function executeSomeThirdPartyCode(): void;

try {
    executeSomeThirdPartyCode();
} catch (err: any) {
    console.error(err.message); // Works again!
}
```

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/41013)。

## 确切的可选属性类型 (`--exactOptionalPropertyTypes`)

在 JavaScript 中，读取对象上某个不存在的属性会得到 `undefined` 值。
与此同时，某个已有属性的值也允许为 `undefined` 值。
有许多 JavaScript 代码都会对这些情况一视同仁，因此最初 TypeScript 将可选属性视为添加了 `undefined` 类型。
例如，

```ts
interface Person {
    name: string;
    age?: number;
}
```

等同于：

```ts
interface Person {
    name: string;
    age?: number | undefined;
}
```

这意味着用户可以给 `age` 明确地指定 `undefined` 值。

```ts
const p: Person = {
    name: 'Daniel',
    age: undefined, // This is okay by default.
};
```

因此默认情况下，TypeScript 不区分带有 `undefined` 类型的属性和不存在的属性。
虽说这在大部分情况下是没问题的，但并非所有的 JavaScript 代码都如此。
像是 `Object.assign`，`Object.keys`，对象展开（`{ ...obj }`）和 `for`-`in` 循环这样的函数和运算符会区别对待属性是否存在于对象之上。
在 `Person` 例子中，如果 `age` 属性的存在与否是至关重要的，那么就可能会导致运行时错误。

在 TypeScript 4.4 中，新的 `--exactOptionalPropertyTypes` 标记指明了可选属性的确切表示方式，即不自动添加 `| undefined` 类型：

```ts twoslash
interface Person {
    name: string;
    age?: number;
}

// 启用 'exactOptionalPropertyTypes'
const p: Person = {
    name: 'Daniel',
    age: undefined, // 错误！undefined 不是一个成员
};
```

该标记**不是** `--strict` 标记家族的一员，需要显式地开启。
该标记要求同时启用 `--strictNullChecks` 标记。
我们已经更新了 DefinitelyTyped 以及其它的声明定义来帮助进行平稳地过渡，但你仍可能遇到一些问题，这取决于代码的结构。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/43947)。

## 类中的 `static` 语句块

TypeScript 4.4 支持了 [类中的 `static` 语句块](https://github.com/tc39/proposal-class-static-block#ecmascript-class-static-initialization-blocks)，一个即将到来的 ECMAScript 特性，它能够帮助编写复杂的静态成员初始化代码。

```ts
declare function someCondition(): boolean

class Foo {
    static count = 0;

    // 静态语句块：
    static {
        if (someCondition()) {
            Foo.count++;
        }
    }
}
```

在静态语句块中允许编写一系列语句，它们可以访问类中的私有字段。
也就是说在初始化代码中能够编写语句，不会暴露变量，并且可以完全访问类的内部信息。

```ts
declare function loadLastInstances(): any[]

class Foo {
    static #count = 0;

    get count() {
        return Foo.#count;
    }

    static {
        try {
            const lastInstances = loadLastInstances();
            Foo.#count += lastInstances.length;
        }
        catch {}
    }
}
```

若不使用 `static` 语句块也能够编写上述代码，只不过需要使用一些折中的 hack 手段。

一个类可以有多个 `static` 语句块，它们的运行顺序与编写顺序一致。

```ts
// Prints:
//    1
//    2
//    3
class Foo {
    static prop = 1
    static {
        console.log(Foo.prop++);
    }
    static {
        console.log(Foo.prop++);
    }
    static {
        console.log(Foo.prop++);
    }
}
```

感谢 [Wenlu Wang](https://github.com/Kingwl) 为 TypeScript 添加了该支持。
更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/43370)。

## `tsc --help` 更新与优化

TypeScript 的 `--help` 选项完全更新了！
感谢 [Song Gao](https://github.com/ShuiRuTian)，我们[更新了编译选项的描述](https://github.com/microsoft/TypeScript/pull/44409)和 [`--help` 菜单的配色样式](https://github.com/microsoft/TypeScript/pull/44157)。

![The new TypeScript `--help` menu where the output is bucketed into several different areas](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/tsc-help-ps-wt-4-4.png)

更多详情请参考 [Issue](https://github.com/microsoft/TypeScript/issues/44074)。

## 性能优化

### 更快地生成声明文件

TypeScript 现在会缓存下内部符号是否可以在不同上下文中被访问，以及如何显示指定的类型。
这些改变能够改进 TypeScript 处理复杂类型时的性能，尤其是在使用了 `--declaration` 标记来生成 `.d.ts` 文件的时候。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/43973)。

### 更快地标准化路径

TypeScript 经常需要对文件路径进行“标准化”操作来得到统一的格式，以便编译器能够随处使用它。
它包括将反斜线替换成正斜线，或者删除路径中间的 `/./` 和 `/../` 片段。
当 TypeScript 需要处理成千上万的路径时，这个操作就会很慢。
在 TypeScript 4.4 里会先对路径进行快速检查，判断它们是否需要进行标准化。
这些改进能够减少 5-10% 的工程加载时间，对于大型工程来讲效果会更加明显。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44173) 以及 [PR](https://github.com/microsoft/TypeScript/pull/44100)。

### 更快地路径映射

TypeScript 现在会缓存构造的路径映射（通过 `tsconfig.json` 里的 `paths`）。
对于拥有数百个路径映射的工程来讲效果十分明显。
更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44078)。

### 更快地增量构建与 `--strict`

这曾是一个缺陷，在 `--incremental` 模式下，如果启用了 `--strict` 则 TypeScript 会重新进行类型检查。
这导致了不管是否开启了 `--incremental` 构建速度都挺慢。
TypeScript 4.4 修复了这个问题，该修复也应用到了 TypeScript 4.3 里。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44394)。

### 针对大型输出更快地生成 Source Map

TypeScript 4.4 优化了为超大输出文件生成 source map 的速度。
在构建旧版本的 TypeScript 编译器时，结果显示节省了 8% 的生成时间。

感谢 [David Michon](https://github.com/dmichon-msft) 提供了这项[简洁的优化](https://github.com/microsoft/TypeScript/pull/44031)。

### 更快的 `--force` 构建

当在工程引用上使用了 `--build` 模式时，TypeScript 必须执行“是否更新检查”来确定是否需要重新构建。
在进行 `--force` 构建时，该检查是无关的，因为每个工程依赖都要被重新构建。
在 TypeScript 4.4 里，`--force` 会避免执行无用的步骤并进行完整的构建。
更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/43666)。

## JavaScript 中的拼写建议

TypeScript 为在 Visual Studio 和 Visual Studio Code 等编辑器中的 JavaScript 编写体验赋能。
大多数情况下，在处理 JavaScript 文件时，TypeScript 会置身事外；
然而，TypeScript 经常能够提供有理有据的建议且不过分地侵入其中。

这就是为什么 TypeScript 会为 JavaScript 文件提供拼写建议 - 不带有 `// @ts-check` 的 文件或者关闭了 `checkJs` 选项的工程。
即，TypeScript 文件中已有的 _"Did you mean...?"_ 建议，现在它们也作用于 JavaScript 文件。

这些拼写建议也暗示了代码中可能存在错误。
我们在测试该特性时已经发现了已有代码中的一些错误！

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44271)！

## 内嵌提示（Inlay Hints）

TypeScript 4.4 支持了*内嵌提示*特性，它能帮助显示参数名和返回值类型等信息。
可将其视为一种友好的“ghost text”。

![A preview of inlay hints in Visual Studio Code](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/inlayHints-4.4-rc-ghd.png)

该特性由 [Wenlu Wang](https://github.com/Kingwl) 的 [PR](https://github.com/microsoft/TypeScript/pull/42089) 所实现。

他也在 [Visual Studio Code 里进行了集成](https://github.com/microsoft/vscode/pull/113412) 并在 [July 2021 (1.59) 发布](https://code.visualstudio.com/updates/v1_59#_typescript-44)。
若你想尝试该特性，需确保安装了[稳定版](https://code.visualstudio.com/updates/v1_59)或 [insiders](https://code.visualstudio.com/insiders/) 版本的编辑器。
你也可以在 Visual Studio Code 的设置里修改何时何地显示内嵌提示。

## 自动导入的补全列表里显示真正的路径

当 Visual Studio Code 显示补全列表时，包含自动导入在内的补全列表里会显示指向模块的路径；
然而，该路径通常不是 TypeScript 最终替换进来的模块描述符。
该路径通常是相对于 _workspace_ 的，如果你导入了 `moment` 包，你大概会看到 `node_modules/moment` 这样的路径 。

![A completion list containing unwieldy paths containing 'node_modules'. For example, the label for 'calendarFormat' is 'node_modules/moment/moment' instead of 'moment'.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/completion-import-labels-pre-4-4.png)

这些路径很难处理且容易产生误导，尤其是插入的路径同时需要考虑 Node.js 的 `node_modules` 解析，路径映射，符号链接以及重新导出等。

这就是为什么 TypeScript 4.4 中的补全列表会显示真正的导入模块路径。

![A completion list containing clean paths with no intermediate 'node_modules'. For example, the label for 'calendarFormat' is 'moment' instead of 'node_modules/moment/moment'.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/completion-import-labels-4-4.png)

由于该计算可能很昂贵，当补全列表包含许多条目时最终的模块描述符会在你输入更多的字符时显示出来。
你仍可能看到基于 workspace 的相对路径；然而，当编辑器“预热”后，再多输入几个字符它们会被替换为真正的路径。

<!--
## Breaking Changes

### `lib.d.ts` Changes for TypeScript 4.4

As with every TypeScript version, declarations for `lib.d.ts` (especially the declarations generated for web contexts), have changed.
You can consult [our list of known `lib.dom.d.ts` changes](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1029#issuecomment-869224737) to understand what is impacted.

### More-Compliant Indirect Calls for Imported Functions

In earlier versions of TypeScript, calling an import from CommonJS, AMD, and other non-ES module systems would set the `this` value of the called function.
Specifically, in the following example, when calling `fooModule.foo()`, the `foo()` method will have `fooModule` set as the value of `this`.

```ts
// Imagine this is our imported module, and it has an export named 'foo'.
let fooModule = {
    foo() {
        console.log(this);
    },
};

fooModule.foo();
```

This is not the way exported functions in ECMAScript are supposed to work when we call them.
That's why TypeScript 4.4 intentionally discards the `this` value when calling imported functions, by using the following emit.

```ts
// Imagine this is our imported module, and it has an export named 'foo'.
let fooModule = {
    foo() {
        console.log(this);
    },
};

// Notice we're actually calling '(0, fooModule.foo)' now, which is subtly different.
(0, fooModule.foo)();
```

You can [read up more about the changes here](https://github.com/microsoft/TypeScript/pull/44624).

### Using `unknown` in Catch Variables

Users running with the `--strict` flag may see new errors around `catch` variables being `unknown`, especially if the existing code assumes only `Error` values have been caught.
This often results in error messages such as:

```
Property 'message' does not exist on type 'unknown'.
Property 'name' does not exist on type 'unknown'.
Property 'stack' does not exist on type 'unknown'.
```

To get around this, you can specifically add runtime checks to ensure that the thrown type matches your expected type.
Otherwise, you can just use a type assertion, add an explicit `: any` to your catch variable, or turn off `--useUnknownInCatchVariables`.

### Broader Always-Truthy Promise Checks

In prior versions, TypeScript introduced "Always Truthy Promise checks" to catch code where an `await` may have been forgotten;
however, the checks only applied to named declarations.
That meant that while this code would correctly receive an error...

```ts
async function foo(): Promise<boolean> {
    return false;
}

async function bar(): Promise<string> {
    const fooResult = foo();
    if (fooResult) {
        // <- error! :D
        return 'true';
    }
    return 'false';
}
```

...the following code would not.

```ts
async function foo(): Promise<boolean> {
    return false;
}

async function bar(): Promise<string> {
    if (foo()) {
        // <- no error :(
        return 'true';
    }
    return 'false';
}
```

TypeScript 4.4 now flags both.
For more information, [read up on the original change](https://github.com/microsoft/TypeScript/pull/44491).

### Abstract Properties Do Not Allow Initializers

The following code is now an error because abstract properties may not have initializers:

```ts
abstract class C {
    abstract prop = 1;
    //       ~~~~
    // Property 'prop' cannot have an initializer because it is marked abstract.
}
```

Instead, you may only specify a type for the property:

```ts
abstract class C {
    abstract prop: number;
}
```
-->