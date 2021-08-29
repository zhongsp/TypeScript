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

In JavaScript, any type of value can be thrown with `throw` and caught in a `catch` clause.
Because of this, TypeScript historically typed catch clause variables as `any`, and would not allow any other type annotation:

```ts
try {
    // Who knows what this might throw...
    executeSomeThirdPartyCode();
} catch (err) {
    // err: any
    console.error(err.message); // Allowed, because 'any'
    err.thisWillProbablyFail(); // Allowed, because 'any' :(
}
```

Once TypeScript added the `unknown` type, it became clear that `unknown` was a better choice than `any` in `catch` clause variables for users who want the highest degree of correctness and type-safety, since it narrows better and forces us to test against arbitrary values.
Eventually TypeScript 4.0 allowed users to specify an explicit type annotation of `unknown` (or `any`) on each `catch` clause variable so that we could opt into stricter types on a case-by-case basis;
however, for some, manually specifying `: unknown` on every `catch` clause was a chore.

That's why TypeScript 4.4 introduces a new flag called `--useUnknownInCatchVariables`.
This flag changes the default type of `catch` clause variables from `any` to `unknown`.

```ts twoslash
// @errors: 2571
declare function executeSomeThirdPartyCode(): void;
// ---cut---
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

This flag is enabled under the `--strict` family of options.
That means that if you check your code using `--strict`, this option will automatically be turned on.
You may end up with errors in TypeScript 4.4 such as

```
Property 'message' does not exist on type 'unknown'.
Property 'name' does not exist on type 'unknown'.
Property 'stack' does not exist on type 'unknown'.
```

In cases where we don't want to deal with an `unknown` variable in a `catch` clause, we can always add an explicit `: any` annotation so that we can opt _out_ of stricter types.

<!-- prettier-ignore -->
```ts twoslash
declare function executeSomeThirdPartyCode(): void;
// ---cut---
try {
  executeSomeThirdPartyCode();
} catch (err: any) {
  console.error(err.message); // Works again!
}
```

For more information, take a look at [the implementing pull request](https://github.com/microsoft/TypeScript/pull/41013).

## Exact Optional Property Types (`--exactOptionalPropertyTypes`)

In JavaScript, reading a _missing_ property on an object produces the value `undefined`.
It's also possible to _have_ an actual property with the value `undefined`.
A lot of code in JavaScript tends to treat these situations the same way, and so initially TypeScript just interpreted every optional property as if a user had written `undefined` in the type.
For example,

```ts
interface Person {
    name: string;
    age?: number;
}
```

was considered equivalent to

```ts
interface Person {
    name: string;
    age?: number | undefined;
}
```

What this meant is that a user could explicitly write `undefined` in place of `age`.

```ts
const p: Person = {
    name: 'Daniel',
    age: undefined, // This is okay by default.
};
```

So by default, TypeScript doesn't distinguish between a present property with the value `undefined` and a missing property.
While this works most of the time, not all code in JavaScript makes the same assumptions.
Functions and operators like `Object.assign`, `Object.keys`, object spread (`{ ...obj }`), and `for`-`in` loops behave differently depending on whether or not a property actually exists on an object.
In the case of our `Person` example, this could potentially lead to runtime errors if the `age` property was observed in a context where its presence was important.

In TypeScript 4.4, the new flag `--exactOptionalPropertyTypes` specifies that optional property types should be interpreted exactly as written, meaning that `| undefined` is not added to the type:

```ts twoslash
// @exactOptionalPropertyTypes
// @errors: 2322
interface Person {
    name: string;
    age?: number;
}
// ---cut---
// With 'exactOptionalPropertyTypes' on:
const p: Person = {
    name: 'Daniel',
    age: undefined, // Error! undefined isn't a number
};
```

This flag is **not** part of the `--strict` family and needs to be turned on explicitly if you'd like this behavior.
It also requires `--strictNullChecks` to be enabled as well.
We've been making updates to DefinitelyTyped and other definitions to try to make the transition as straightforward as possible, but you may encounter some friction with this depending on how your code is structured.

For more information, you can [take a look at the implementing pull request here](https://github.com/microsoft/TypeScript/pull/43947).

## `static` Blocks in Classes

TypeScript 4.4 brings support for [`static` blocks in classes](https://github.com/tc39/proposal-class-static-block#ecmascript-class-static-initialization-blocks), an upcoming ECMAScript feature that can help you write more-complex initialization code for static members.

```ts twoslash
declare function someCondition(): boolean
// ---cut---
class Foo {
    static count = 0;

    // This is a static block:
    static {
        if (someCondition()) {
            Foo.count++;
        }
    }
}
```

These static blocks allow you to write a sequence of statements with their own scope that can access private fields within the containing class.
That means that we can write initialization code with all the capabilities of writing statements, no leakage of variables, and full access to our class's internals.

```ts twoslash
declare function loadLastInstances(): any[]
// ---cut---
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

Without `static` blocks, writing the code above was possible, but often involved several different types of hacks that had to compromise in some way.

Note that a class can have multiple `static` blocks, and they're run in the same order in which they're written.

```ts twoslash
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

We'd like to extend our thanks to [Wenlu Wang](https://github.com/Kingwl) for TypeScript's implementation of this feature.
For more details, you can [see that pull request here](https://github.com/microsoft/TypeScript/pull/43370).

## `tsc --help` Updates and Improvements

TypeScript's `--help` option has gotten a refresh!
Thanks to work in part by [Song Gao](https://github.com/ShuiRuTian), we've brought in changes to [update the descriptions of our compiler options](https://github.com/microsoft/TypeScript/pull/44409) and [restyle the `--help` menu](https://github.com/microsoft/TypeScript/pull/44157) with colors and other visual separation.

![The new TypeScript `--help` menu where the output is bucketed into several different areas](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/tsc-help-ps-wt-4-4.png)

You can read more on [the original proposal thread](https://github.com/microsoft/TypeScript/issues/44074).

## Performance Improvements

### Faster Declaration Emit

TypeScript now caches whether internal symbols are accessible in different contexts, along with how specific types should be printed.
These changes can improve TypeScript's general performance in code with fairly complex types, and is especially observed when emitting `.d.ts` files under the `--declaration` flag.

[See more details here](https://github.com/microsoft/TypeScript/pull/43973).

### Faster Path Normalization

TypeScript often has to do several types of "normalization" on file paths to get them into a consistent format that the compiler can use everywhere.
This involves things like replacing backslashes with slashes, or removing intermediate `/./` and `/../` segments of paths.
When TypeScript has to operates over millions of these paths, these operations end up being a bit slow.
In TypeScript 4.4, paths first undergo quick checks to see whether they need any normalization in the first place.
These improvements together reduce project load time by 5-10% on bigger projects, and significantly more in massive projects that we've tested internally.

For more details, you can [view the PR for path segment normalization](https://github.com/microsoft/TypeScript/pull/44173) along with [the PR for slash normalization](https://github.com/microsoft/TypeScript/pull/44100).

### Faster Path Mapping

TypeScript now caches the way it constructs path-mappings (using the `paths` option in `tsconfig.json`).
For projects with several hundred mappings, the reduction is significant.
You can see more [on the change itself](https://github.com/microsoft/TypeScript/pull/44078).

### Faster Incremental Builds with `--strict`

In what was effectively a bug, TypeScript would end up redoing type-checking work under `--incremental` compilations if `--strict` was on.
This led to many builds being just as slow as if `--incremental` was turned off.
TypeScript 4.4 fixes this, though the change has also been back-ported to TypeScript 4.3.

See more [here](https://github.com/microsoft/TypeScript/pull/44394).

### Faster Source Map Generation for Big Outputs

TypeScript 4.4 adds an optimization for source map generation on extremely large output files.
When building an older version of the TypeScript compiler, this results in around an 8% reduction in emit time.

We'd like to extend our thanks to [David Michon](https://github.com/dmichon-msft) who provided a [simple and clean change](https://github.com/microsoft/TypeScript/pull/44031) to enable this performance win.

### Faster `--force` Builds

When using `--build` mode on project references, TypeScript has to perform up-to-date checks to determine which files need to be rebuilt.
When performing a `--force` build, however, that information is irrelevant since every project dependency will be rebuilt from scratch.
In TypeScript 4.4, `--force` builds avoid those unnecessary steps and start a full build.
See more about the change [here](https://github.com/microsoft/TypeScript/pull/43666).

## Spelling Suggestions for JavaScript

TypeScript powers the JavaScript editing experience in editors like Visual Studio and Visual Studio Code.
Most of the time, TypeScript tries to stay out of the way in JavaScript files;
however, TypeScript often has a lot of information to make confident suggestions, and ways of surfacing suggestions that aren't _too_ invasive.

That's why TypeScript now issues spelling suggestions in plain JavaScript files - ones without `// @ts-check` or in a project with `checkJs` turned off.
These are the same _"Did you mean...?"_ suggestions that TypeScript files already have, and now they're available in _all_ JavaScript files in some form.

These spelling suggestions can provide a subtle clue that your code is wrong.
We managed to find a few bugs in existing code while testing this feature!

For more details on this new feature, [take a look at the pull request](https://github.com/microsoft/TypeScript/pull/44271)!

## Inlay Hints

TypeScript 4.4 provides support for _inlay hints_ which can help display useful information like parameter names and return types in your code.
You can think of it as a sort of friendly "ghost text".

![A preview of inlay hints in Visual Studio Code](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/inlayHints-4.4-rc-ghd.png)

This feature was built by [Wenlu Wang](https://github.com/Kingwl) whose [pull request](https://github.com/microsoft/TypeScript/pull/42089) has more details.

Wenlu also contributed [the integration for inlay hints in Visual Studio Code](https://github.com/microsoft/vscode/pull/113412) which has shipped as [part of the July 2021 (1.59) release](https://code.visualstudio.com/updates/v1_59#_typescript-44).
If you'd like to try inlay hints out, make sure you're using a recent [stable](https://code.visualstudio.com/updates/v1_59) or [insiders](https://code.visualstudio.com/insiders/) version of the editor.
You can also modify when and where inlay hints get displayed in Visual Studio Code's settings.

## Auto-Imports Show True Paths in Completion Lists

When editors like Visual Studio Code show a completion list, completions which include auto-imports are displayed with a path to the given module;
however, this path usually isn't what TypeScript ends up placing in a module specifier.
The path is usually something relative to the _workspace_, meaning that if you're importing from a package like `moment`, you'll often see a path like `node_modules/moment`.

![A completion list containing unwieldy paths containing 'node_modules'. For example, the label for 'calendarFormat' is 'node_modules/moment/moment' instead of 'moment'.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/completion-import-labels-pre-4-4.png)

These paths end up being unwieldy and often misleading, especially given that the path that actually gets inserted into your file needs to consider Node's `node_modules` resolution, path mappings, symlinks, and re-exports.

That's why with TypeScript 4.4, the completion item label now shows the _actual_ module path that will be used for the import!

![A completion list containing clean paths with no intermediate 'node_modules'. For example, the label for 'calendarFormat' is 'moment' instead of 'node_modules/moment/moment'.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/08/completion-import-labels-4-4.png)

Since this calculation can be expensive, completion lists containing many auto-imports may fill in the final module specifiers in batches as you type more characters. It's possible that you'll still sometimes see the old workspace-relative path labels; however, as your editing experience "warms up", they should get replaced with the actual path after another keystroke or two.

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
