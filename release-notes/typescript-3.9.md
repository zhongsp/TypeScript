## 改进类型推断和`Promise.all`

TypeScript的最近几个版本（3.7前后）更新了像`Promise.all`和`Promise.race`等的函数声明。
不巧的是，它引入了一些回归问题，尤其是在和`null`或`undefined`混合使用的场景中。

```ts
interface Lion {
  roar(): void;
}

interface Seal {
  singKissFromARose(): void;
}

async function visitZoo(
  lionExhibit: Promise<Lion>,
  sealExhibit: Promise<Seal | undefined>
) {
  let [lion, seal] = await Promise.all([lionExhibit, sealExhibit]);
  lion.roar();
  //   ~~~~
  //  对象可能为'undefined'
}
```

这是一种奇怪的行为！
事实上，只有`sealExhibit`包含了`undefined`值，但是它却让`lion`也含有了`undefined`值。

得益于[Jack Bates](https://github.com/jablko)提交的[PR](https://github.com/microsoft/TypeScript/pull/34501)，这个问题已经被修复了，它改进了TypeScript 3.9中的类型推断流程。
上面的例子中已经不再产生错误。
如果你在旧版本的TypeScript中被`Promise`的这个问题所困扰，我们建议你尝试一下3.9版本！

### `awaited` 类型

如果你一直关注TypeScript，那么你可能会注意到[一个新的类型运算符`awaited`](https://github.com/microsoft/TypeScript/pull/35998)。
这个类型运算符的作用是准确地表达JavaScript中`Promise`的工作方式。

我们原计划在TypeScript 3.9中支持`awaited`，但在现有的代码中测试过该特性后，我们发现还需要进行一些设计，以便让所有人能够顺利地使用它。
因此，我们从主分支中暂时移除了这个特性。
我们将继续试验这个特性，它不会被包含进本次发布。

## 速度优化

TypeScript 3.9提供了多项速度优化。
TypeScript在`material-ui`和`styled-components`代码包中拥有非常慢的编辑速度和编译速度。在发现了这点后，TypeScript团队集中了精力解决性能问题。
TypeScript优化了大型联合类型、交叉类型、有条件类型和映射类型。

- https://github.com/microsoft/TypeScript/pull/36576
- https://github.com/microsoft/TypeScript/pull/36590
- https://github.com/microsoft/TypeScript/pull/36607
- https://github.com/microsoft/TypeScript/pull/36622
- https://github.com/microsoft/TypeScript/pull/36754
- https://github.com/microsoft/TypeScript/pull/36696

上面列出的每一个PR都能够减少5-10%的编译时间（对于某些代码库）。
对于`material-ui`库而言，现在能够节约大约40%的编译时间！

我们还调整了在编辑器中的文件重命名功能。
从Visual Studio Code团队处得知，当重命名一个文件时，计算出需要更新的`import`语句要花费5到10秒的时间。
TypeScript 3.9通过[改变编译器和语言服务缓存文件查询的内部实现](https://github.com/microsoft/TypeScript/pull/37055)解决了这个问题。

尽管仍有优化的空间，我们希望当前的改变能够为每个人带来更流畅的体验。

## `// @ts-expect-error` Comments

Imagine that we're writing a library in TypeScript and we're exporting some function called `doStuff` as part of our public API.
The function's types declare that it takes two `string`s so that other TypeScript users can get type-checking errors, but it also does a runtime check (maybe only in development builds) to give JavaScript users a helpful error.

```ts
function doStuff(abc: string, xyz: string) {
  assert(typeof abc === "string");
  assert(typeof xyz === "string");

  // do some stuff
}
```

So TypeScript users will get a helpful red squiggle and an error message when they misuse this function, and JavaScript users will get an assertion error.
We'd like to test this behavior, so we'll write a unit test.

```ts
expect(() => {
  doStuff(123, 456);
}).toThrow();
```

Unfortunately if our tests are written in TypeScript, TypeScript will give us an error!

```ts
doStuff(123, 456);
//          ~~~
// error: Type 'number' is not assignable to type 'string'.
```

That's why TypeScript 3.9 brings a new feature: `// @ts-expect-error` comments.
When a line is prefixed with a `// @ts-expect-error` comment, TypeScript will suppress that error from being reported;
but if there's no error, TypeScript will report that `// @ts-expect-error` wasn't necessary.

As a quick example, the following code is okay

```ts
// @ts-expect-error
console.log(47 * "octopus");
```

while the following code

```ts
// @ts-expect-error
console.log(1 + 1);
```

results in the error

```
Unused '@ts-expect-error' directive.
```

We'd like to extend a big thanks to [Josh Goldberg](https://github.com/JoshuaKGoldberg), the contributor who implemented this feature.
For more information, you can take a look at [the `ts-expect-error` pull request](https://github.com/microsoft/TypeScript/pull/36014).

### `ts-ignore` or `ts-expect-error`?

In some ways `// @ts-expect-error` can act as a suppression comment, similar to `// @ts-ignore`.
The difference is that `// @ts-ignore` will do nothing if the following line is error-free.

You might be tempted to switch existing `// @ts-ignore` comments over to `// @ts-expect-error`, and you might be wondering which is appropriate for future code.
While it's entirely up to you and your team, we have some ideas of which to pick in certain situations.

Pick `ts-expect-error` if:

- you're writing test code where you actually want the type system to error on an operation
- you expect a fix to be coming in fairly quickly and you just need a quick workaround
- you're in a reasonably-sized project with a proactive team that wants to remove suppression comments as soon affected code is valid again

Pick `ts-ignore` if:

- you have an a larger project and and new errors have appeared in code with no clear owner
- you are in the middle of an upgrade between two different versions of TypeScript, and a line of code errors in one version but not another.
- you honestly don't have the time to decide which of these options is better.

## Uncalled Function Checks in Conditional Expressions

In TypeScript 3.7 we introduced _uncalled function checks_ to report an error when you've forgotten to call a function.

```ts
function hasImportantPermissions(): boolean {
  // ...
}

// Oops!
if (hasImportantPermissions) {
  //  ~~~~~~~~~~~~~~~~~~~~~~~
  // This condition will always return true since the function is always defined.
  // Did you mean to call it instead?
  deleteAllTheImportantFiles();
}
```

However, this error only applied to conditions in `if` statements.
Thanks to [a pull request](https://github.com/microsoft/TypeScript/pull/36402) from [Alexander Tarasyuk](https://github.com/a-tarasyuk), this feature is also now supported in ternary conditionals (i.e. the `cond ? trueExpr : falseExpr` syntax).

```ts
declare function listFilesOfDirectory(dirPath: string): string[];
declare function isDirectory(): boolean;

function getAllFiles(startFileName: string) {
  const result: string[] = [];
  traverse(startFileName);
  return result;

  function traverse(currentPath: string) {
    return isDirectory
      ? //     ~~~~~~~~~~~
        // This condition will always return true
        // since the function is always defined.
        // Did you mean to call it instead?
        listFilesOfDirectory(currentPath).forEach(traverse)
      : result.push(currentPath);
  }
}
```

https://github.com/microsoft/TypeScript/issues/36048

## Editor Improvements

The TypeScript compiler not only powers the TypeScript editing experience in most major editors, it also powers the JavaScript experience in the Visual Studio family of editors and more.
Using new TypeScript/JavaScript functionality in your editor will differ depending on your editor, but

- Visual Studio Code supports [selecting different versions of TypeScript](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-the-workspace-version-of-typescript). Alternatively, there's the [JavaScript/TypeScript Nightly Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) to stay on the bleeding edge (which is typically very stable).
- Visual Studio 2017/2019 have [the SDK installers above] and [MSBuild installs](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild).
- Sublime Text 3 supports [selecting different versions of TypeScript](https://github.com/microsoft/TypeScript-Sublime-Plugin#note-using-different-versions-of-typescript)

### CommonJS Auto-Imports in JavaScript

One great new improvement is in auto-imports in JavaScript files using CommonJS modules.

In older versions, TypeScript always assumed that regardless of your file, you wanted an ECMAScript-style import like

```js
import * as fs from "fs";
```

However, not everyone is targeting ECMAScript-style modules when writing JavaScript files.
Plenty of users still use CommonJS-style `require(...)` imports like so

```js
const fs = require("fs");
```

TypeScript now automatically detects the types of imports you're using to keep your file's style clean and consistent.

<video src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/03/ERkaliGU0AA5anJ1.mp4"></video>

For more details on the change, see [the corresponding pull request](https://github.com/microsoft/TypeScript/pull/37027).

### Code Actions Preserve Newlines

TypeScript's refactorings and quick fixes often didn't do a great job of preserving newlines.
As a really basic example, take the following code.

```ts
const maxValue = 100;

/*start*/
for (let i = 0; i <= maxValue; i++) {
  // First get the squared value.
  let square = i ** 2;

  // Now print the squared value.
  console.log(square);
}
/*end*/
```

If we highlighted the range from `/*start*/` to `/*end*/` in our editor to extract to a new function, we'd end up with code like the following.

```ts
const maxValue = 100;

printSquares();

function printSquares() {
  for (let i = 0; i <= maxValue; i++) {
    // First get the squared value.
    let square = i ** 2;
    // Now print the squared value.
    console.log(square);
  }
}
```

![Extracting the for loop to a function in older versions of TypeScript. A newline is not preserved.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/03/printSquaresWithoutNewlines-3.9.gif.gif)

That's not ideal - we had a blank line between each statement in our `for` loop, but the refactoring got rid of it!
TypeScript 3.9 does a little more work to preserve what we write.

```ts
const maxValue = 100;

printSquares();

function printSquares() {
  for (let i = 0; i <= maxValue; i++) {
    // First get the squared value.
    let square = i ** 2;

    // Now print the squared value.
    console.log(square);
  }
}
```

![Extracting the for loop to a function in TypeScript 3.9. A newline is preserved.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/03/printSquaresWithNewlines-3.9.gif.gif)

You can see more about the implementation [in this pull request](https://github.com/microsoft/TypeScript/pull/36688)

### Quick Fixes for Missing Return Expressions

There are occasions where we might forget to return the value of the last statement in a function, especially when adding curly braces to arrow functions.

```ts
// before
let f1 = () => 42;

// oops - not the same!
let f2 = () => {
  42;
};
```

Thanks to [a pull request](https://github.com/microsoft/TypeScript/pull/26434) from community member [Wenlu Wang](https://github.com/Kingwl), TypeScript can provide a quick-fix to add missing `return` statements, remove curly braces, or add parentheses to arrow function bodies that look suspiciously like object literals.

![TypeScript fixing an error where no expression is returned by adding a `return` statement or removing curly braces.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/04/missingReturnValue-3-9.gif)

### Support for "Solution Style" `tsconfig.json` Files

Editors need to figure out which configuration file a file belongs to so that it can apply the appropriate options and figure out which other files are included in the current "project".
By default, editors powered by TypeScript's language server do this by walking up each parent directory to find a `tsconfig.json`.

One case where this slightly fell over is when a `tsconfig.json` simply existed to reference other `tsconfig.json` files.

```json5
// tsconfig.json
{
  files: [],
  references: [
    { path: "./tsconfig.shared.json" },
    { path: "./tsconfig.frontend.json" },
    { path: "./tsconfig.backend.json" },
  ],
}
```

This file that really does nothing but manage other project files is often called a "solution" in some environments.
Here, none of these `tsconfig.*.json` files get picked up by the server, but we'd really like the language server to understand that the current `.ts` file probably belongs to one of the mentioned projects in this root `tsconfig.json`.

TypeScript 3.9 adds support to editing scenarios for this configuration.
For more details, take a look at [the pull request that added this functionality](https://github.com/microsoft/TypeScript/pull/37239).

## Breaking Changes

### Parsing Differences in Optional Chaining and Non-Null Assertions

TypeScript recently implemented the optional chaining operator, but we've received user feedback that the behavior of optional chaining (`?.`) with the non-null assertion operator (`!`) is extremely counter-intuitive.

Specifically, in previous versions, the code

```ts
foo?.bar!.baz;
```

was interpreted to be equivalent to the following JavaScript.

```js
(foo?.bar).baz;
```

In the above code the parentheses stop the "short-circuiting" behavior of optional chaining, so if `foo` is `undefined`, accessing `baz` will cause a runtime error.

The Babel team who pointed this behavior out, and most users who provided feedback to us, believe that this behavior is wrong.
We do too!
The thing we heard the most was that the `!` operator should just "disappear" since the intent was to remove `null` and `undefined` from the type of `bar`.

In other words, most people felt that the original snippet should be interpreted as

```js
foo?.bar.baz;
```

which just evaluates to `undefined` when `foo` is `undefined`.

This is a breaking change, but we believe most code was written with the new interpretation in mind.
Users who want to revert to the old behavior can add explicit parentheses around the left side of the `!` operator.

```ts
foo?.bar!.baz;
```

### `}` and `>` are Now Invalid JSX Text Characters

The JSX Specification forbids the use of the `}` and `>` characters in text positions.
TypeScript and Babel have both decided to enforce this rule to be more comformant.
The new way to insert these characters is to use an HTML escape code (e.g. `<span> 2 &gt 1 </div>`) or insert an expression with a string literal (e.g. `<span> 2 {">"} 1 </div>`).

Luckily, thanks to the [pull request](https://github.com/microsoft/TypeScript/pull/36636) enforcing this from [Brad Zacher](https://github.com/bradzacher), you'll get an error message along the lines of

```
Unexpected token. Did you mean `{'>'}` or `&gt;`?
Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
```

For example:

```tsx
let directions = <span>Navigate to: Menu Bar > Tools > Options</div>
//                                           ~       ~
// Unexpected token. Did you mean `{'>'}` or `&gt;`?
```

That error message came with a handy quick fix, and thanks to [Alexander Tarasyuk](https://github.com/a-tarasyuk), [you can apply these changes in bulk](https://github.com/microsoft/TypeScript/pull/37436) if you have a lot of errors.

### Stricter Checks on Intersections and Optional Properties

Generally, an intersection type like `A & B` is assignable to `C` if either `A` or `B` is assignable to `C`; however, sometimes that has problems with optional properties.
For example, take the following:

```ts
interface A {
  a: number; // notice this is 'number'
}

interface B {
  b: string;
}

interface C {
  a?: boolean; // notice this is 'boolean'
  b: string;
}

declare let x: A & B;
declare let y: C;

y = x;
```

In previous versions of TypeScript, this was allowed because while `A` was totally incompatible with `C`, `B` _was_ compatible with `C`.

In TypeScript 3.9, so long as every type in an intersection is a concrete object type, the type system will consider all of the properties at once.
As a result, TypeScript will see that the `a` property of `A & B` is incompatible with that of `C`:

```
Type 'A & B' is not assignable to type 'C'.
  Types of property 'a' are incompatible.
    Type 'number' is not assignable to type 'boolean | undefined'.
```

For more information on this change, [see the corresponding pull request](https://github.com/microsoft/TypeScript/pull/37195).

### Intersections Reduced By Discriminant Properties

There are a few cases where you might end up with types that describe values that just don't exist.
For example

```ts
declare function smushObjects<T, U>(x: T, y: U): T & U;

interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

declare let x: Circle;
declare let y: Square;

let z = smushObjects(x, y);
console.log(z.kind);
```

This code is slightly weird because there's really no way to create an intersection of a `Circle` and a `Square` - they have two incompatible `kind` fields.
In previous versions of TypeScript, this code was allowed and the type of `kind` itself was `never` because `"circle" & "square"` described a set of values that could `never` exist.

In TypeScript 3.9, the type system is more aggressive here - it notices that it's impossible to intersect `Circle` and `Square` because of their `kind` properties.
So instead of collapsing the type of `z.kind` to `never`, it collapses the type of `z` itself (`Circle & Square`) to `never`.
That means the above code now errors with:

```
Property 'kind' does not exist on type 'never'.
```

Most of the breaks we observed seem to correspond with slightly incorrect type declarations.
For more details, [see the original pull request](https://github.com/microsoft/TypeScript/pull/36696).

### Getters/Setters are No Longer Enumerable

In older versions of TypeScript, `get` and `set` accessors in classes were emitted in a way that made them enumerable; however, this wasn't compliant with the ECMAScript specification which states that they must be non-enumerable.
As a result, TypeScript code that targeted ES5 and ES2015 could differ in behavior.

Thanks to [a pull request](https://github.com/microsoft/TypeScript/pull/32264) from GitHub user [pathurs](https://github.com/pathurs), TypeScript 3.9 now conforms more closely with ECMAScript in this regard.

### Type Parameters That Extend `any` No Longer Act as `any`

In previous versions of TypeScript, a type parameter constrained to `any` could be treated as `any`.

```ts
function foo<T extends any>(arg: T) {
  arg.spfjgerijghoied; // no error!
}
```

This was an oversight, so TypeScript 3.9 takes a more conservative approach and issues an error on these questionable operations.

```ts
function foo<T extends any>(arg: T) {
  arg.spfjgerijghoied;
  //  ~~~~~~~~~~~~~~~
  // Property 'spfjgerijghoied' does not exist on type 'T'.
}
```

### `export *` is Always Retained

In previous TypeScript versions, declarations like `export * from "foo"` would be dropped in our JavaScript output if `foo` didn't export any values.
This sort of emit is problematic because it's type-directed and can't be emulated by Babel.
TypeScript 3.9 will always emit these `export *` declarations.
In practice, we don't expect this to break much existing code.

### More libdom.d.ts refinements

We are continuing to move more of TypeScript's built-in .d.ts library (lib.d.ts and family) to be generated from Web IDL files directly from the DOM specification.
As a result some vendor-specific types related to media access have been removed.

Adding this file to an ambient `*.d.ts` to your project will bring them back:

<!-- prettier-ignore -->
```ts
interface AudioTrackList {
     [Symbol.iterator](): IterableIterator<AudioTrack>;
 }

interface HTMLVideoElement {
  readonly audioTracks: AudioTrackList

  msFrameStep(forward: boolean): void;
  msInsertVideoEffect(activatableClassId: string, effectRequired: boolean, config?: any): void;
  msSetVideoRectangle(left: number, top: number, right: number, bottom: number): void;
  webkitEnterFullScreen(): void;
  webkitEnterFullscreen(): void;
  webkitExitFullScreen(): void;
  webkitExitFullscreen(): void;

  msHorizontalMirror: boolean;
  readonly msIsLayoutOptimalForPlayback: boolean;
  readonly msIsStereo3D: boolean;
  msStereo3DPackingMode: string;
  msStereo3DRenderMode: string;
  msZoom: boolean;
  onMSVideoFormatChanged: ((this: HTMLVideoElement, ev: Event) => any) | null;
  onMSVideoFrameStepCompleted: ((this: HTMLVideoElement, ev: Event) => any) | null;
  onMSVideoOptimalLayoutChanged: ((this: HTMLVideoElement, ev: Event) => any) | null;
  webkitDisplayingFullscreen: boolean;
  webkitSupportsFullscreen: boolean;
}

interface MediaError {
  readonly msExtendedCode: number;
  readonly MS_MEDIA_ERR_ENCRYPTED: number;
}
```