## 可变参元组类型

在JavaScript中有一个函数`concat`，它接受两个数组或元组并将它们连接在一起构成一个新数组。

```js
function concat(arr1, arr2) {
  return [...arr1, ...arr2];
}
```

再假设有一个`tail`函数，它接受一个数组或元组并返回除首个元素外的所有元素。

```js
function tail(arg) {
  const [_, ...result] = arg;
  return result;
}
```

那么，我们如何在TypeScript中为这两个函数添加类型？

在旧版本的TypeScript中，对于`concat`函数我们能做的是编写一些函数重载签名。

```ts
function concat(arr1: [], arr2: []): [];
function concat<A>(arr1: [A], arr2: []): [A];
function concat<A, B>(arr1: [A, B], arr2: []): [A, B];
function concat<A, B, C>(arr1: [A, B, C], arr2: []): [A, B, C];
function concat<A, B, C, D>(arr1: [A, B, C, D], arr2: []): [A, B, C, D];
function concat<A, B, C, D, E>(arr1: [A, B, C, D, E], arr2: []): [A, B, C, D, E];
function concat<A, B, C, D, E, F>(arr1: [A, B, C, D, E, F], arr2: []): [A, B, C, D, E, F];)
```

在保持第二个数组为空的情况下，我们已经编写了七个重载签名。
接下来，让我们为`arr2`添加一个参数。

```ts
function concat<A2>(arr1: [], arr2: [A2]): [A2];
function concat<A1, A2>(arr1: [A1], arr2: [A2]): [A1, A2];
function concat<A1, B1, A2>(arr1: [A1, B1], arr2: [A2]): [A1, B1, A2];
function concat<A1, B1, C1, A2>(arr1: [A1, B1, C1], arr2: [A2]): [A1, B1, C1, A2];
function concat<A1, B1, C1, D1, A2>(arr1: [A1, B1, C1, D1], arr2: [A2]): [A1, B1, C1, D1, A2];
function concat<A1, B1, C1, D1, E1, A2>(arr1: [A1, B1, C1, D1, E1], arr2: [A2]): [A1, B1, C1, D1, E1, A2];
function concat<A1, B1, C1, D1, E1, F1, A2>(arr1: [A1, B1, C1, D1, E1, F1], arr2: [A2]): [A1, B1, C1, D1, E1, F1, A2];
```

这已经开始变得不合理了。
不巧的是，在给`tail`函数添加类型时也会遇到同样的问题。

在受尽了“重载的折磨”后，它依然没有完全解决我们的问题。
它只能针对已编写的重载给出正确的类型。
如果我们想要处理所有情况，则还需要提供一个如下的重载：

```ts
function concat<T, U>(arr1: T[], arr2: U[]): Array<T | U>;
```

但是这个重载签名没有反映出输入的长度，以及元组元素的顺序。

TypeScript 4.0带来了两项基础改动，还伴随着类型推断的改善，因此我们能够方便地添加类型。

第一个改动是展开元组类型的语法支持泛型。
这就是说，我们能够表示在元组和数组上的高阶操作，尽管我们不清楚它们的具体类型。
在实例化泛型展开时
当在这类元组上进行泛型展开实例化（或者使用实际类型参数进行替换）时，它们能够产生另一组数组和元组类型。

例如，我们可以像下面这样给`tail`函数添加类型，避免了“重载的折磨”。

```ts twoslash
function tail<T extends any[]>(arr: readonly [any, ...T]) {
  const [_ignored, ...rest] = arr;
  return rest;
}

const myTuple = [1, 2, 3, 4] as const;
const myArray = ["hello", "world"];

const r1 = tail(myTuple);
//    [2, 3, 4]

const r2 = tail([...myTuple, ...myArray] as const);
//    [2, 3, 4, ...string[]]
```

第二个改动是，剩余元素可以出现在元组中的任意位置上 - 不只是末尾位置！

```ts twoslash
type Strings = [string, string];
type Numbers = [number, number];

type StrStrNumNumBool = [...Strings, ...Numbers, boolean];
//   [string, string, number, number, boolean]
```

在以前，TypeScript会像下面这样产生一个错误：

```
剩余元素必须出现在元组类型的末尾。
```

但是在TypeScript 4.0中放开了这个限制。

注意，如果展开一个长度未知的类型，那么后面的所有元素都将被纳入到剩余元素类型。

```ts twoslash
type Strings = [string, string];
type Numbers = number[];

type Unbounded = [...Strings, ...Numbers, boolean];
//   [string, string, ...(number | boolean)[]]
```

结合使用这两种行为，我们能够为`concat`函数编写一个良好的类型签名：

```ts twoslash
type Arr = readonly any[];

function concat<T extends Arr, U extends Arr>(arr1: T, arr2: U): [...T, ...U] {
  return [...arr1, ...arr2];
}
```

虽然这个签名仍有点长，但是我们不再需要像重载那样重复多次，并且对于任何数组或元组它都能够给出期望的类型。

该功能本身已经足够好了，但是它的强大更体现在一些复杂的场景中。
例如，考虑有一个支持[部分参数应用](https://en.wikipedia.org/wiki/Partial_application)的函数`partialCall`。
`partialCall`接受一个函数（例如叫作`f`），以及函数`f`需要的一些初始参数。
它返回一个新的函数，该函数接受`f`需要的额外参数，并最终以初始参数和额外参数来调用`f`。

```js
function partialCall(f, ...headArgs) {
  return (...tailArgs) => f(...headArgs, ...tailArgs);
}
```

TypeScript 4.0改进了剩余参数和剩余元组元素的类型推断，因此我们可以为这种使用场景添加类型。

```ts twoslash
type Arr = readonly unknown[];

function partialCall<T extends Arr, U extends Arr, R>(
  f: (...args: [...T, ...U]) => R,
  ...headArgs: T
) {
  return (...tailArgs: U) => f(...headArgs, ...tailArgs);
}
```

此例中，`partialCall`知道能够接受哪些初始参数，并返回一个函数，它能够正确地选择接受或拒绝额外的参数。

```ts twoslash
// @errors: 2345 2554 2554 2345
type Arr = readonly unknown[];

function partialCall<T extends Arr, U extends Arr, R>(
  f: (...args: [...T, ...U]) => R,
  ...headArgs: T
) {
  return (...tailArgs: U) => f(...headArgs, ...tailArgs);
}
// ---cut---
const foo = (x: string, y: number, z: boolean) => {};

const f1 = partialCall(foo, 100);
//                          ~~~
// Argument of type 'number' is not assignable to parameter of type 'string'.

const f2 = partialCall(foo, "hello", 100, true, "oops");
//                                              ~~~~~~
// Expected 4 arguments, but got 5.(2554)

// This works!
const f3 = partialCall(foo, "hello");
//    (y: number, z: boolean) => void

// What can we do with f3 now?

// Works!
f3(123, true);

f3();

f3(123, "hello");
```

可变参元组类型支持了许多新的激动人心的模式，尤其是函数组合。
我们期望能够通过它来为JavaScript内置的`bind`函数进行更好的类型检查。
还有一些其它的类型推断改进以及模式引入进来，如果你想了解更多，请参考[PR](https://github.com/microsoft/TypeScript/pull/39094)。

## 标签元组元素

改进元组类型和参数列表使用体验的重要性在于它允许我们为JavaScript中惯用的方法添加强类型验证 - 例如对参数列表进行切片而后传递给其它函数。
这里至关重要的一点是我们可以使用元组类型作为剩余参数类型。

例如，下面的函数使用元组类型作为剩余参数：

```ts
function foo(...args: [string, number]): void {
  // ...
}
```

它与下面的函数基本没有区别：

```ts
function foo(arg0: string, arg1: number): void {
  // ...
}
```

对于`foo`函数的任意调用者：

```ts twoslash
function foo(arg0: string, arg1: number): void {
  // ...
}

foo("hello", 42);

foo("hello", 42, true); // Expected 2 arguments, but got 3.
foo("hello"); // Expected 2 arguments, but got 1.
```

但是，如果从代码可读性的角度来看，就能够看出两者之间的差别。
在第一个例子中，参数的第一个元素和第二个元素都没有参数名。
虽然这不影响类型检查，但是元组中元素位置上缺乏标签令它们难以使用 - 很难表达出代码的意图。

这就是为什么TypeScript 4.0中的元组可以提供标签。

```ts
type Range = [start: number, end: number];
```

为了加强参数列表和元组类型之间的联系，剩余元素和可选元素的语法采用了参数列表的语法。

```ts
type Foo = [first: number, second?: string, ...rest: any[]];
```

在使用标签元组时有一些规则要遵守。
其一是，如果一个元组元素使用了标签，那么所有元组元素必须都使用标签。

```ts twoslash
type Bar = [first: string, number];
// Tuple members must all have names or all not have names.(5084)
```

元组标签名不影响解构变量名，它们不必相同。
元组标签仅用于文档和工具目的。

```ts twoslash
function foo(x: [first: string, second: number]) {
    // ...

    // 注意：不需要命名为'first'和'second'
    const [a, b] = x;
    a
//  string
    b
//  number
}
```

总的来说，标签元组对于元组和参数列表模式以及实现类型安全的重载时是很便利的。
实际上，在代码编辑器中TypeScript会尽可能地将它们显示为重载。

![Signature help displaying a union of labeled tuples as in a parameter list as two signatures](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/08/signatureHelpLabeledTuples.gif)

更多详情请参考[PT](https://github.com/microsoft/TypeScript/pull/38234)。

## 从构造函数中推断类属性

在TypeScript 4.0中，当启用了`noImplicitAny`时，编译器能够根据基于控制流的分析来确定类中属性的类型

```ts twoslash
class Square {
  // 在旧版本中，以下两个属性均为any类型
  area; // number
  sideLength; // number

  constructor(sideLength: number) {
    this.sideLength = sideLength;
    this.area = sideLength ** 2;
  }
}
```

如果没有在构造函数中的所有代码执行路径上为实例成员进行赋值，那么该属性会被认为可能为`undefined`类型。

```ts twoslash
class Square {
  sideLength; // number | undefined

  constructor(sideLength: number) {
    if (Math.random()) {
      this.sideLength = sideLength;
    }
  }

  get area() {
    return this.sideLength ** 2;
    //     ~~~~~~~~~~~~~~~
    //     对象可能为'undefined'
  }
}
```

如果你清楚地知道属性类型（例如，类中存在类似于`initialize`的初始化方法），你仍需要明确地使用类型注解来指定类型，以及需要使用确切赋值断言（`!`）如果你启用了`strictPropertyInitialization`模式。

```ts twoslash
class Square {
  // 确切赋值断言
  //        v
  sideLength!: number;
  //         ^^^^^^^^
  //         类型注解

  constructor(sideLength: number) {
    this.initialize(sideLength);
  }

  initialize(sideLength: number) {
    this.sideLength = sideLength;
  }

  get area() {
    return this.sideLength ** 2;
  }
}
```

更多详情请参考[PR](https://github.com/microsoft/TypeScript/pull/379200).

## Short-Circuiting Assignment Operators

JavaScript, and a lot of other languages, support a set of operators called _compound assignment_ operators.
Compound assignment operators apply an operator to two arguments, and then assign the result to the left side.
You may have seen these before:

```ts
// Addition
// a = a + b
a += b;

// Subtraction
// a = a - b
a -= b;

// Multiplication
// a = a * b
a *= b;

// Division
// a = a / b
a /= b;

// Exponentiation
// a = a ** b
a **= b;

// Left Bit Shift
// a = a << b
a <<= b;
```

So many operators in JavaScript have a corresponding assignment operator!
Up until recently, however, there were three notable exceptions: logical _and_ (`&&`), logical _or_ (`||`), and nullish coalescing (`??`).

That's why TypeScript 4.0 supports a new ECMAScript feature to add three new assignment operators: `&&=`, `||=`, and `??=`.

These operators are great for substituting any example where a user might write code like the following:

```ts
a = a && b;
a = a || b;
a = a ?? b;
```

Or a similar `if` block like

```ts
// could be 'a ||= b'
if (!a) {
  a = b;
}
```

There are even some patterns we've seen (or, uh, written ourselves) to lazily initialize values, only if they'll be needed.

```ts
let values: string[];
(values ?? (values = [])).push("hello");

// After
(values ??= []).push("hello");
```

(look, we're not proud of _all_ the code we write...)

On the rare case that you use getters or setters with side-effects, it's worth noting that these operators only perform assignments if necessary.
In that sense, not only is the right side of the operator "short-circuited" - the assignment itself is too.

```ts
obj.prop ||= foo();

// roughly equivalent to either of the following

obj.prop || (obj.prop = foo());

if (!obj.prop) {
    obj.prop = foo();
}
```

[Try running the following example](https://www.typescriptlang.org/play?ts=Nightly#code/MYewdgzgLgBCBGArGBeGBvAsAKBnmA5gKawAOATiKQBQCUGO+TMokIANkQHTsgHUAiYlChFyMABYBDCDHIBXMANoBuHI2Z4A9FpgAlIqXZTgRGAFsiAQg2byJeeTAwAslKgSu5KWAAmIczoYAB4YAAYuAFY1XHwAXwAaWxgIEhgKKmoAfQA3KXYALhh4EA4iH3osWM1WCDKePkFUkTFJGTlFZRimOJw4mJwAM0VgKABLcBhB0qCqplr63n4BcjGCCVgIMd8zIjz2eXciXy7k+yhHZygFIhje7BwFzgblgBUJMdlwM3yAdykAJ6yBSQGAeMzNUTkU7YBCILgZUioOBIBGUJEAHwxUxmqnU2Ce3CWgnenzgYDMACo6pZxpYIJSOqDwSkSFCYXC0VQYFi0NMQHQVEA) to see how that differs from _always_ performing the assignment.

```ts twoslash
const obj = {
    get prop() {
        console.log("getter has run");

        // Replace me!
        return Math.random() < 0.5;
    },
    set prop(_val: boolean) {
        console.log("setter has run");
    }
};

function foo() {
    console.log("right side evaluated");
    return true;
}

console.log("This one always runs the setter");
obj.prop = obj.prop || foo();

console.log("This one *sometimes* runs the setter");
obj.prop ||= foo();
```

We'd like to extend a big thanks to community member [Wenlu Wang](https://github.com/Kingwl) for this contribution!

For more details, you can [take a look at the pull request here](https://github.com/microsoft/TypeScript/pull/37727).
You can also [check out TC39's proposal repository for this feature](https://github.com/tc39/proposal-logical-assignment/).

## `unknown` on `catch` Clause Bindings

Since the beginning days of TypeScript, `catch` clause variables have always been typed as `any`.
This meant that TypeScript allowed you to do anything you wanted with them.

```ts twoslash
try {
  // Do some work
} catch (x) {
  // x has type 'any' - have fun!
  console.log(x.message);
  console.log(x.toUpperCase());
  x++;
  x.yadda.yadda.yadda();
}
```

The above has some undesirable behavior if we're trying to prevent _more_ errors from happening in our error-handling code!
Because these variables have the type `any` by default, they lack any type-safety which could have errored on invalid operations.

That's why TypeScript 4.0 now lets you specify the type of `catch` clause variables as `unknown` instead.
`unknown` is safer than `any` because it reminds us that we need to perform some sorts of type-checks before operating on our values.

<!--prettier-ignore -->
```ts twoslash
// @errors: 2571
try {
  // ...
} catch (e: unknown) {
  // Can't access values on unknowns
  console.log(e.toUpperCase());

  if (typeof e === "string") {
    // We've narrowed 'e' down to the type 'string'.
    console.log(e.toUpperCase());
  }
}
```

While the types of `catch` variables won't change by default, we might consider a new `--strict` mode flag in the future so that users can opt in to this behavior.
In the meantime, it should be possible to write a lint rule to force `catch` variables to have an explicit annotation of either `: any` or `: unknown`.

For more details you can [peek at the changes for this feature](https://github.com/microsoft/TypeScript/pull/39015).

## Custom JSX Factories

When using JSX, a [_fragment_](https://reactjs.org/docs/fragments.html) is a type of JSX element that allows us to return multiple child elements.
When we first implemented fragments in TypeScript, we didn't have a great idea about how other libraries would utilize them.
Nowadays most other libraries that encourage using JSX and support fragments have a similar API shape.

In TypeScript 4.0, users can customize the fragment factory through the new `jsxFragmentFactory` option.

As an example, the following `tsconfig.json` file tells TypeScript to transform JSX in a way compatible with React, but switches each factory invocation to `h` instead of `React.createElement`, and uses `Fragment` instead of `React.Fragment`.

```json5
{
  compilerOptions: {
    target: "esnext",
    module: "commonjs",
    jsx: "react",
    jsxFactory: "h",
    jsxFragmentFactory: "Fragment",
  },
}
```

In cases where you need to have a different JSX factory on a per-file basis<!-- (maybe you like to ship React, Preact, and Inferno to give a blazing fast experience) -->, you can take advantage of the new `/** @jsxFrag */` pragma comment.
For example, the following...

```tsx twoslash
// @noErrors
// Note: these pragma comments need to be written
// with a JSDoc-style multiline syntax to take effect.

/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from "preact";

export const Header = (
  <>
    <h1>Welcome</h1>
  </>
);
```

...will get transformed to this output JavaScript...

```tsx twoslash
// @noErrors
// @showEmit
// Note: these pragma comments need to be written
// with a JSDoc-style multiline syntax to take effect.

/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from "preact";

export const Header = (
  <>
    <h1>Welcome</h1>
  </>
);
```

We'd like to extend a big thanks to community member [Noj Vek](https://github.com/nojvek) for sending this pull request and patiently working with our team on it.

You can see that [the pull request](https://github.com/microsoft/TypeScript/pull/38720) for more details!

## Speed Improvements in `build` mode with `--noEmitOnError`

Previously, compiling a program after a previous compile with errors under `--incremental` would be extremely slow when using the `--noEmitOnError` flag.
This is because none of the information from the last compilation would be cached in a `.tsbuildinfo` file based on the `--noEmitOnError` flag.

TypeScript 4.0 changes this which gives a great speed boost in these scenarios, and in turn improves `--build` mode scenarios (which imply both `--incremental` and `--noEmitOnError`).

For details, [read up more on the pull request](https://github.com/microsoft/TypeScript/pull/38853).

## `--incremental` with `--noEmit`

TypeScript 4.0 allows us to use the `--noEmit` flag when while still leveraging `--incremental` compiles.
This was previously not allowed, as `--incremental` needs to emit a `.tsbuildinfo` files; however, the use-case to enable faster incremental builds is important enough to enable for all users.

For more details, you can [see the implementing pull request](https://github.com/microsoft/TypeScript/pull/39122).

## Editor Improvements

The TypeScript compiler doesn't only power the editing experience for TypeScript itself in most major editors - it also powers the JavaScript experience in the Visual Studio family of editors and more.
For that reason, much of our work focuses on improving editor scenarios - the place you spend most of your time as a developer.

Using new TypeScript/JavaScript functionality in your editor will differ depending on your editor, but

- Visual Studio Code supports [selecting different versions of TypeScript](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-the-workspace-version-of-typescript). Alternatively, there's the [JavaScript/TypeScript Nightly Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) to stay on the bleeding edge (which is typically very stable).
- Visual Studio 2017/2019 have [the SDK installers above] and [MSBuild installs](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild).
- Sublime Text 3 supports [selecting different versions of TypeScript](https://github.com/microsoft/TypeScript-Sublime-Plugin#note-using-different-versions-of-typescript)

You can check out a partial [list of editors that have support for TypeScript](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) to learn more about whether your favorite editor has support to use new versions.

### Convert to Optional Chaining

Optional chaining is a recent feature that's received a lot of love.
That's why TypeScript 4.0 brings a new refactoring to convert common patterns to take advantage of [optional chaining](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7/#optional-chaining) and [nullish coalescing](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7/#nullish-coalescing)!

![Converting `a && a.b.c && a.b.c.d.e.f()` to `a?.b.c?.d.e.f.()`](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/08/convertToOptionalChain-4-0.gif)

Keep in mind that while this refactoring doesn't _perfectly_ capture the same behavior due to subtleties with truthiness/falsiness in JavaScript, we believe it should capture the intent for most use-cases, especially when TypeScript has more precise knowledge of your types.

For more details, [check out the pull request for this feature](https://github.com/microsoft/TypeScript/pull/39135).

### `/** @deprecated */` Support

TypeScript's editing support now recognizes when a declaration has been marked with a `/** @deprecated *` JSDoc comment.
That information is surfaced in completion lists and as a suggestion diagnostic that editors can handle specially.
In an editor like VS Code, deprecated values are typically displayed a strike-though style ~~like this~~.

![Some examples of deprecated declarations with strikethrough text in the editor](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/06/deprecated_4-0.png)

This new functionality is available thanks to [Wenlu Wang](https://github.com/Kingwl).
See [the pull request](https://github.com/microsoft/TypeScript/pull/38523) for more details.

### Partial Semantic Mode at Startup

We've heard a lot from users suffering from long startup times, especially on bigger projects.
The culprit is usually a process called _program construction_.
This is the process of starting with an initial set of root files, parsing them, finding their dependencies, parsing those dependencies, finding those dependencies' dependencies, and so on.
The bigger your project is, the longer you'll have to wait before you can get basic editor operations like go-to-definition or quick info.

That's why we've been working on a new mode for editors to provide a _partial_ experience until the full language service experience has loaded up.
The core idea is that editors can run a lightweight partial server that only looks at the current files that the editor has open.

It's hard to say precisely what sorts of improvements you'll see, but anecdotally, it used to take anywhere between _20 seconds to a minute_ before TypeScript would become fully responsive on the Visual Studio Code codebase.
In contrast, **our new partial semantic mode seems to bring that delay down to just a few seconds**.
As an example, in the following video, you can see two side-by-side editors with TypeScript 3.9 running on the left and TypeScript 4.0 running on the right.

<video loop autoplay muted style="width:100%;height:100%;" src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/08/partialModeFast.mp4">
</video>

When restarting both editors on a particularly large codebase, the one with TypeScript 3.9 can't provide completions or quick info at all.
On the other hand, the editor with TypeScript 4.0 can _immediately_ give us a rich experience in the current file we're editing, despite loading the full project in the background.

Currently the only editor that supports this mode is [Visual Studio Code](http://code.visualstudio.com/) which has some UX improvements coming up in [Visual Studio Code Insiders](http://code.visualstudio.com/insiders).
We recognize that this experience may still have room for polish in UX and functionality, and we have [a list of improvements](https://github.com/microsoft/TypeScript/issues/39035) in mind.
We're looking for more feedback on what you think might be useful.

For more information, you can [see the original proposal](https://github.com/microsoft/TypeScript/issues/37713), [the implementing pull request](https://github.com/microsoft/TypeScript/pull/38561), along with [the follow-up meta issue](https://github.com/microsoft/TypeScript/issues/39035).

### Smarter Auto-Imports

Auto-import is a fantastic feature that makes coding a lot easier; however, every time auto-import doesn't seem to work, it can throw users off a lot.
One specific issue that we heard from users was that auto-imports didn't work on dependencies that were written in TypeScript - that is, until they wrote at least one explicit import somewhere else in their project.

Why would auto-imports work for `@types` packages, but not for packages that ship their own types?
It turns out that auto-imports only work on packages your project _already_ includes.
Because TypeScript has some quirky defaults that automatically add packages in `node_modules/@types` to your project, _those_ packages would be auto-imported.
On the other hand, other packages were excluded because crawling through all your `node_modules` packages can be _really_ expensive.

All of this leads to a pretty lousy getting started experience for when you're trying to auto-import something that you've just installed but haven't used yet.

TypeScript 4.0 now does a little extra work in editor scenarios to include the packages you've listed in your `package.json`'s `dependencies` (and `peerDependencies`) fields.
The information from these packages is only used to improve auto-imports, and doesn't change anything else like type-checking.
This allows us to provide auto-imports for all of your dependencies that have types, without incurring the cost of a complete `node_modules` search.

In the rare cases when your `package.json` lists more than ten typed dependencies that haven't been imported yet, this feature automatically disables itself to prevent slow project loading.
To force the feature to work, or to disable it entirely, you should be able to configure your editor.
For Visual Studio Code, this is the "Include Package JSON Auto Imports" (or `typescript.preferences.includePackageJsonAutoImports`) setting.

![Configuring 'include package JSON auto imports'](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/08/configurePackageJsonAutoImports4-0.png)
For more details, you can see the [proposal issue](https://github.com/microsoft/TypeScript/issues/37812) along with [the implementing pull request](https://github.com/microsoft/TypeScript/pull/38923).

## Our New Website!

[The TypeScript website](https://www.typescriptlang.org/) has recently been rewritten from the ground up and rolled out!

![A screenshot of the new TypeScript website](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/08/ts-web.png)

[We already wrote a bit about our new site](https://devblogs.microsoft.com/typescript/announcing-the-new-typescript-website/), so you can read up more there; but it's worth mentioning that we're still looking to hear what you think!
If you have questions, comments, or suggestions, you can [file them over on the website's issue tracker](https://github.com/microsoft/TypeScript-Website).

## Breaking Changes

### `lib.d.ts` Changes

Our `lib.d.ts` declarations have changed - most specifically, types for the DOM have changed.
The most notable change may be the removal of [`document.origin`](https://developer.mozilla.org/en-US/docs/Web/API/Document/origin) which only worked in old versions of IE and Safari
MDN recommends moving to [`self.origin`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/origin).

### Properties Overriding Accessors (and vice versa) is an Error

Previously, it was only an error for properties to override accessors, or accessors to override properties, when using `useDefineForClassFields`; however, TypeScript now always issues an error when declaring a property in a derived class that would override a getter or setter in the base class.

```ts twoslash
// @errors: 1049 2610
class Base {
  get foo() {
    return 100;
  }
  set foo(value) {
    // ...
  }
}

class Derived extends Base {
  foo = 10;
}
```

```ts twoslash
// @errors: 2611
class Base {
  prop = 10;
}

class Derived extends Base {
  get prop() {
    return 100;
  }
}
```

See more details on [the implementing pull request](https://github.com/microsoft/TypeScript/pull/37894).

### Operands for `delete` must be optional.

When using the `delete` operator in `strictNullChecks`, the operand must now be `any`, `unknown`, `never`, or be optional (in that it contains `undefined` in the type).
Otherwise, use of the `delete` operator is an error.

```ts twoslash
// @errors: 2790
interface Thing {
  prop: string;
}

function f(x: Thing) {
  delete x.prop;
}
```

See more details on [the implementing pull request](https://github.com/microsoft/TypeScript/pull/37921).

### Usage of TypeScript's Node Factory is Deprecated

Today TypeScript provides a set of "factory" functions for producing AST Nodes; however, TypeScript 4.0 provides a new node factory API.
As a result, for TypeScript 4.0 we've made the decision to deprecate these older functions in favor of the new ones.

For more details, [read up on the relevant pull request for this change](https://github.com/microsoft/TypeScript/pull/35282).