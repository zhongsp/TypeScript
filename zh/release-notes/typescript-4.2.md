## 更智能地保留类型别名

在 TypeScript 中，使用类型别名能够给某个类型起个新名字。
倘若你定义了一些函数，并且它们全都使用了 `string | number | boolean` 类型，那么你就可以定义一个类型别名来避免重复。

```ts
type BasicPrimitive = number | string | boolean;
```

TypeScript 使用了一系列规则来推测是否该在显示类型时使用类型别名。
例如，有如下的代码。

```ts
export type BasicPrimitive = number | string | boolean;

export function doStuff(value: BasicPrimitive) {
    let x = value;
    return x;
}
```

如果在 Visual Studio，Visual Studio Code 或者 [TypeScript 演练场](https://www.typescriptlang.org/play?ts=4.1.3#code/KYDwDg9gTgLgBDAnmYcBCBDAzgSwMYAKUOAtjjDgG6oC8cAdgK4kBGwUcAPnFjMfQHMucFhAgAbYBnoBuAFBzQkWHABmjengoR6cACYQAyjEarVACkoZxjYAC502fEVLkqwAJRwA3nLj+4SXgQODorG2B5ALgoYBMoXRB5AF8gA)编辑器中把鼠标光标放在 `x` 上，我们就会看到信息面板中显示出了 `BasicPrimitive` 类型。
同样地，如果我们查看由该文件生成的声明文件（`.d.ts`），那么 TypeScript 会显示出 `doStuff` 的返回值类型为 `BasicPrimitive` 类型。

那么你猜一猜，如果返回值类型为 `BasicPrimitive` 或 `undefined` 时会发生什么？

```ts
export type BasicPrimitive = number | string | boolean;

export function doStuff(value: BasicPrimitive) {
    if (Math.random() < 0.5) {
        return undefined;
    }

    return value;
}
```

可以在[TypeScript 4.1 演练场](https://www.typescriptlang.org/play?ts=4.1.3#code/KYDwDg9gTgLgBDAnmYcBCBDAzgSwMYAKUOAtjjDgG6oC8cAdgK4kBGwUcAPnFjMfQHMucFhAgAbYBnoBuALAAoRQHplcABIRqHCPTgByACYQAyjEYAzC-pHBxEAO4IIPYKgcALDPAAqyYCZ4xGDwhjhYYOIYiFhwFtAIHqhQwOZQekgoAHQqagDqqGQCHvBe1HCgKHgwwIZw5M5wYPzw2Lm5cJ2YuITEZBTl3Iz0hsAWOPS1HR0sjPBs9k5+KIHB8AAsWQBMADT18BO8UnVhEVExcG0Kqh2dTKzswrz8QtyiElJ6QyNjE1PXykUlWg8Asw2qOF0cGMZksFgAFJQMOJGMAAFzobD4IikchUYAASjgAG9FJ1yTgLHB4QBZbweLJQaTGEjwokAHjgAAYsgBWImkhTk4WdFJpPTDUbjSaGeRC4UAX0UZOFYsY6TgSJRwDlcAVQA)中查看结果。
虽然我们希望 TypeScript 将 `doStuff` 的返回值类型显示为 `BasicPrimitive | undefined`，但是它却显示成了 `string | number | boolean | undefined` 类型！
这是怎么回事？

这与 TypeScript 内部的类型表示方式有关。
当基于一个联合类型来创建另一个联合类型时，TypeScript 会将类型*标准化*，也就是把类型展开为一个新的联合类型 - 但这么做也可能会丢失信息。
类型检查器不得不根据 `string | number | boolean | undefined` 类型来尝试每一种可能的组合并查看使用了哪些类型别名，即便这样也可能会有多个类型别名指向 `string | number | boolean` 类型。

TypeScript 4.2 的内部实现更加智能了。
我们会记录类型是如何被构造的，会记录它们原本的编写方式和之后的构造方式。
我们同样会记录和区分不同的类型别名！

有能力根据类型使用的方式来回显这个类型就意味着，对于 TypeScript 用户来讲能够避免显示很长的类型；同时也意味着会生成更友好的 `.d.ts` 声明文件、错误消息和编辑器内显示的类型及签名帮助信息。
这会让 TypeScript 对于初学者来讲更友好一些。

更多详情，请参考[PR：改进保留类型别名的联合](https://github.com/microsoft/TypeScript/pull/42149)，以及[PR：保留间接的类型别名](https://github.com/microsoft/TypeScript/pull/42284)。

## Leading/Middle Rest Elements in Tuple Types

In TypeScript, tuple types are meant to model arrays with specific lengths and element types.

```ts
// A tuple that stores a pair of numbers
let a: [number, number] = [1, 2];

// A tuple that stores a string, a number, and a boolean
let b: [string, number, boolean] = ['hello', 42, true];
```

Over time, TypeScript's tuple types have become more and more sophisticated, since they're also used to model things like parameter lists in JavaScript.
As a result, they can have optional elements and rest elements, and can even have labels for tooling and readability.

```ts twoslash
// A tuple that has either one or two strings.
let c: [string, string?] = ['hello'];
c = ['hello', 'world'];

// A labeled tuple that has either one or two strings.
let d: [first: string, second?: string] = ['hello'];
d = ['hello', 'world'];

// A tuple with a *rest element* - holds at least 2 strings at the front,
// and any number of booleans at the back.
let e: [string, string, ...boolean[]];

e = ['hello', 'world'];
e = ['hello', 'world', false];
e = ['hello', 'world', true, false, true];
```

In TypeScript 4.2, rest elements specifically been expanded in how they can be used.
In prior versions, TypeScript only allowed `...rest` elements at the very last position of a tuple type.

However, now rest elements can occur _anywhere_ within a tuple - with only a few restrictions.

```ts twoslash
let foo: [...string[], number];

foo = [123];
foo = ['hello', 123];
foo = ['hello!', 'hello!', 'hello!', 123];

let bar: [boolean, ...string[], boolean];

bar = [true, false];
bar = [true, 'some text', false];
bar = [true, 'some', 'separated', 'text', false];
```

The only restriction is that a rest element can be placed anywhere in a tuple, so long as it's not followed by another optional element or rest element.
In other words, only one rest element per tuple, and no optional elements after rest elements.

```ts twoslash
// @errors: 1265 1266
interface Clown {
    /*...*/
}
interface Joker {
    /*...*/
}

let StealersWheel: [...Clown[], 'me', ...Joker[]];

let StringsAndMaybeBoolean: [...string[], boolean?];
```

These non-trailing rest elements can be used to model functions that take any number of leading arguments, followed by a few fixed ones.

```ts twoslash
declare function doStuff(
    ...args: [...names: string[], shouldCapitalize: boolean]
): void;

doStuff(/*shouldCapitalize:*/ false);
doStuff('fee', 'fi', 'fo', 'fum', /*shouldCapitalize:*/ true);
```

Even though JavaScript doesn't have any syntax to model leading rest parameters, we were still able to declare `doStuff` as a function that takes leading arguments by declaring the `...args` rest parameter with _a tuple type that uses a leading rest element_.
This can help model lots of existing JavaScript out there!

For more details, [see the original pull request](https://github.com/microsoft/TypeScript/pull/41544).

## Stricter Checks For The `in` Operator

In JavaScript, it is a runtime error to use a non-object type on the right side of the `in` operator.
TypeScript 4.2 ensures this can be caught at design-time.

```ts twoslash
// @errors: 2361
'foo' in 42;
```

This check is fairly conservative for the most part, so if you have received an error about this, it is likely an issue in the code.

A big thanks to our external contributor [Jonas Hübotter](https://github.com/jonhue) for [their pull request](https://github.com/microsoft/TypeScript/pull/41928)!

## `--noPropertyAccessFromIndexSignature`

Back when TypeScript first introduced index signatures, you could only get properties declared by them with "bracketed" element access syntax like `person["name"]`.

```ts twoslash
interface SomeType {
    /** This is an index signature. */
    [propName: string]: any;
}

function doStuff(value: SomeType) {
    let x = value['someProperty'];
}
```

This ended up being cumbersome in situations where we need to work with objects that have arbitrary properties.
For example, imagine an API where it's common to misspell a property name by adding an extra `s` character at the end.

```ts twoslash
interface Options {
    /** File patterns to be excluded. */
    exclude?: string[];

    /**
     * It handles any extra properties that we haven't declared as type 'any'.
     */
    [x: string]: any;
}

function processOptions(opts: Options) {
    // Notice we're *intentionally* accessing `excludes`, not `exclude`
    if (opts.excludes) {
        console.error(
            'The option `excludes` is not valid. Did you mean `exclude`?'
        );
    }
}
```

To make these types of situations easier, a while back, TypeScript made it possible to use "dotted" property access syntax like `person.name` when a type had a string index signature.
This also made it easier to transition existing JavaScript code over to TypeScript.

However, loosening the restriction also meant that misspelling an explicitly declared property became much easier.

```ts twoslash
interface Options {
    /** File patterns to be excluded. */
    exclude?: string[];

    /**
     * It handles any extra properties that we haven't declared as type 'any'.
     */
    [x: string]: any;
}
// ---cut---
function processOptions(opts: Options) {
    // ...

    // Notice we're *accidentally* accessing `excludes` this time.
    // Oops! Totally valid.
    for (const excludePattern of opts.excludes) {
        // ...
    }
}
```

In some cases, users would prefer to explicitly opt into the index signature - they would prefer to get an error message when a dotted property access doesn't correspond to a specific property declaration.

That's why TypeScript introduces a new flag called `--noPropertyAccessFromIndexSignature`.
Under this mode, you'll be opted in to TypeScript's older behavior that issues an error.
This new setting is not under the `strict` family of flags, since we believe users will find it more useful on certain codebases than others.

You can understand this feature in more detail by reading up on the corresponding [pull request](https://github.com/microsoft/TypeScript/pull/40171/).
We'd also like to extend a big thanks to [Wenlu Wang](https://github.com/Kingwl) who sent us this pull request!

## `abstract` Construct Signatures

TypeScript allows us to mark a class as _abstract_.
This tells TypeScript that the class is only meant to be extended from, and that certain members need to be filled in by any subclass to actually create an instance.

```ts twoslash
// @errors: 2511
abstract class Shape {
    abstract getArea(): number;
}

new Shape();

class Square extends Shape {
    #sideLength: number;

    constructor(sideLength: number) {
        super();
        this.#sideLength = sideLength;
    }

    getArea() {
        return this.#sideLength ** 2;
    }
}

// Works fine.
new Square(42);
```

To make sure this restriction in `new`-ing up `abstract` classes is consistently applied, you can't assign an `abstract` class to anything that expects a construct signature.

```ts twoslash
// @errors: 2322
abstract class Shape {
    abstract getArea(): number;
}
// ---cut---
interface HasArea {
    getArea(): number;
}

let Ctor: new () => HasArea = Shape;
```

This does the right thing in case we intend to run code like `new Ctor`, but it's overly-restrictive in case we want to write a subclass of `Ctor`.

````ts
// @errors: 2345
abstract class Shape {
  abstract getArea(): number;
}

interface HasArea {
  getArea(): number;
}

function makeSubclassWithArea(Ctor: new () => HasArea) {
  return class extends Ctor {
    getArea() {
      return 42
    }
  };
}

let MyShape = makeSubclassWithArea(Shape);```

It also doesn't work well with built-in helper types like `InstanceType`.

```ts
// Error!
// Type 'typeof Shape' does not satisfy the constraint 'new (...args: any) => any'.
//   Cannot assign an abstract constructor type to a non-abstract constructor type.
type MyInstance = InstanceType<typeof Shape>;
````

That's why TypeScript 4.2 allows you to specify an `abstract` modifier on constructor signatures.

```ts twoslash {5}
abstract class Shape {
  abstract getArea(): number;
}
// ---cut---
interface HasArea {
    getArea(): number;
}

// Works!
let Ctor: abstract new () => HasArea = Shape;
```

Adding the `abstract` modifier to a construct signature signals that you can pass in `abstract` constructors.
It doesn't stop you from passing in other classes/constructor functions that are "concrete" - it really just signals that there's no intent to run the constructor directly, so it's safe to pass in either class type.

This feature allows us to write _mixin factories_ in a way that supports abstract classes.
For example, in the following code snippet, we're able to use the mixin function `withStyles` with the `abstract` class `SuperClass`.

```ts twoslash
abstract class SuperClass {
    abstract someMethod(): void;
    badda() {}
}

type AbstractConstructor<T> = abstract new (...args: any[]) => T

function withStyles<T extends AbstractConstructor<object>>(Ctor: T) {
    abstract class StyledClass extends Ctor {
        getStyles() {
            // ...
        }
    }
    return StyledClass;
}

class SubClass extends withStyles(SuperClass) {
    someMethod() {
        this.someMethod()
    }
}
```

Note that `withStyles` is demonstrating a specific rule, where a class (like `StyledClass`) that extends a value that's generic and bounded by an abstract constructor (like `Ctor`) has to also be declared `abstract`.
This is because there's no way to know if a class with _more_ abstract members was passed in, and so it's impossible to know whether the subclass implements all the abstract members.

You can read up more on abstract construct signatures [on its pull request](https://github.com/microsoft/TypeScript/pull/36392).

## Understanding Your Project Structure With `--explainFiles`

A surprisingly common scenario for TypeScript users is to ask "why is TypeScript including this file?".
Inferring the files of your program turns out to be a complicated process, and so there are lots of reasons why a specific combination of `lib.d.ts` got used, why certain files in `node_modules` are getting included, and why certain files are being included even though we thought specifying `exclude` would keep them out.

That's why TypeScript now provides an `--explainFiles` flag.

```sh
tsc --explainFiles
```

When using this option, the TypeScript compiler will give some very verbose output about why a file ended up in your program.
To read it more easily, you can forward the output to a file, or pipe it to a program that can easily view it.

```sh
# Forward output to a text file
tsc --explainFiles > expanation.txt

# Pipe output to a utility program like `less`, or an editor like VS Code
tsc --explainFiles | less

tsc --explainFiles | code -
```

Typically, the output will start out by listing out reasons for including `lib.d.ts` files, then for local files, and then `node_modules` files.

```
TS_Compiler_Directory/4.2.2/lib/lib.es5.d.ts
  Library referenced via 'es5' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2015.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2015.d.ts
  Library referenced via 'es2015' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2016.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2016.d.ts
  Library referenced via 'es2016' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2017.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2017.d.ts
  Library referenced via 'es2017' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2018.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2018.d.ts
  Library referenced via 'es2018' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2019.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2019.d.ts
  Library referenced via 'es2019' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2020.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2020.d.ts
  Library referenced via 'es2020' from file 'TS_Compiler_Directory/4.2.2/lib/lib.esnext.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.esnext.d.ts
  Library 'lib.esnext.d.ts' specified in compilerOptions

... More Library References...

foo.ts
  Matched by include pattern '**/*' in 'tsconfig.json'
```

Right now, we make no guarantees about the output format - it might change over time.
On that note, we're interested in improving this format if you have any suggestions!

For more information, [check out the original pull request](https://github.com/microsoft/TypeScript/pull/40011)!

## Improved Uncalled Function Checks in Logical Expressions

Thanks to further improvements from [Alex Tarasyuk](https://github.com/a-tarasyuk), TypeScript's uncalled function checks now apply within `&&` and `||` expressions.

Under `--strictNullChecks`, the following code will now error.

```ts
function shouldDisplayElement(element: Element) {
    // ...
    return true;
}

function getVisibleItems(elements: Element[]) {
    return elements.filter((e) => shouldDisplayElement && e.children.length);
    //                          ~~~~~~~~~~~~~~~~~~~~
    // This condition will always return true since the function is always defined.
    // Did you mean to call it instead.
}
```

For more details, [check out the pull request here](https://github.com/microsoft/TypeScript/issues/40197).

## Destructured Variables Can Be Explicitly Marked as Unused

Thanks to another pull request from [Alex Tarasyuk](https://github.com/a-tarasyuk), you can now mark destructured variables as unused by prefixing them with an underscore (the `_` character).

```ts
let [_first, second] = getValues();
```

Previously, if `_first` was never used later on, TypeScript would issue an error under `noUnusedLocals`.
Now, TypeScript will recognize that `_first` was intentionally named with an underscore because there was no intent to use it.

For more details, take a look at [the full change](https://github.com/microsoft/TypeScript/pull/41378).

## Relaxed Rules Between Optional Properties and String Index Signatures

String index signatures are a way of typing dictionary-like objects, where you want to allow access with arbitrary keys:

```ts twoslash
const movieWatchCount: { [key: string]: number } = {};

function watchMovie(title: string) {
    movieWatchCount[title] = (movieWatchCount[title] ?? 0) + 1;
}
```

Of course, for any movie title not yet in the dictionary, `movieWatchCount[title]` will be `undefined` (TypeScript 4.1 added the option [`--noUncheckedIndexedAccess`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#checked-indexed-accesses---nouncheckedindexedaccess) to include `undefined` when reading from an index signature like this).
Even though it's clear that there must be some strings not present in `movieWatchCount`, previous versions of TypeScript treated optional object properties as unassignable to otherwise compatible index signatures, due to the presence of `undefined`.

```ts twoslash
type WesAndersonWatchCount = {
    'Fantastic Mr. Fox'?: number;
    'The Royal Tenenbaums'?: number;
    'Moonrise Kingdom'?: number;
    'The Grand Budapest Hotel'?: number;
};

declare const wesAndersonWatchCount: WesAndersonWatchCount;
const movieWatchCount: { [key: string]: number } = wesAndersonWatchCount;
//    ~~~~~~~~~~~~~~~ error!
// Type 'WesAndersonWatchCount' is not assignable to type '{ [key: string]: number; }'.
//    Property '"Fantastic Mr. Fox"' is incompatible with index signature.
//      Type 'number | undefined' is not assignable to type 'number'.
//        Type 'undefined' is not assignable to type 'number'. (2322)
```

TypeScript 4.2 allows this assignment. However, it does _not_ allow the assignment of non-optional properties with `undefined` in their types, nor does it allow writing `undefined` to a specific key:

```ts twoslash
// @errors: 2322
type BatmanWatchCount = {
    'Batman Begins': number | undefined;
    'The Dark Knight': number | undefined;
    'The Dark Knight Rises': number | undefined;
};

declare const batmanWatchCount: BatmanWatchCount;

// Still an error in TypeScript 4.2.
const movieWatchCount: { [key: string]: number } = batmanWatchCount;

// Still an error in TypeScript 4.2.
// Index signatures don't implicitly allow explicit `undefined`.
movieWatchCount["It's the Great Pumpkin, Charlie Brown"] = undefined;
```

The new rule also does not apply to number index signatures, since they are assumed to be array-like and dense:

```ts twoslash
// @errors: 2322
declare let sortOfArrayish: { [key: number]: string };
declare let numberKeys: { 42?: string };

sortOfArrayish = numberKeys;
```

You can get a better sense of this change [by reading up on the original PR](https://github.com/microsoft/TypeScript/pull/41921).

## Declare Missing Helper Function

Thanks to [a community pull request](https://github.com/microsoft/TypeScript/pull/41215) from [Alexander Tarasyuk](https://github.com/a-tarasyuk), we now have a quick fix for declaring new functions and methods based on the call-site!

![An un-declared function `foo` being called, with a quick fix scaffolding out the new contents of the file](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/01/addMissingFunction-4.2.gif)

## Breaking Changes

We always strive to minimize breaking changes in a release.
TypeScript 4.2 contains some breaking changes, but we believe they should be manageable in an upgrade.

### `lib.d.ts` Updates

As with every TypeScript version, declarations for `lib.d.ts` (especially the declarations generated for web contexts), have changed.
There are various changes, though `Intl` and `ResizeObserver`'s may end up being the most disruptive.

### `noImplicitAny` Errors Apply to Loose `yield` Expressions

When the value of a `yield` expression is captured, but TypeScript can't immediately figure out what type you intend for it to receive (i.e. the `yield` expression isn't contextually typed), TypeScript will now issue an implicit `any` error.

```ts twoslash
// @errors: 7057
function* g1() {
    const value = yield 1;
}

function* g2() {
    // No error.
    // The result of `yield 1` is unused.
    yield 1;
}

function* g3() {
    // No error.
    // `yield 1` is contextually typed by 'string'.
    const value: string = yield 1;
}

function* g4(): Generator<number, void, string> {
    // No error.
    // TypeScript can figure out the type of `yield 1`
    // from the explicit return type of `g3`.
    const value = yield 1;
}
```

See more details in [the corresponding changes](https://github.com/microsoft/TypeScript/pull/41348).

### Expanded Uncalled Function Checks

As described above, uncalled function checks will now operate consistently within `&&` and `||` expressions when using `--strictNullChecks`.
This can be a source of new breaks, but is typically an indication of a logic error in existing code.

### Type Arguments in JavaScript Are Not Parsed as Type Arguments

Type arguments were already not allowed in JavaScript, but in TypeScript 4.2, the parser will parse them in a more spec-compliant way.
So when writing the following code in a JavaScript file:

```ts
f<T>(100);
```

TypeScript will parse it as the following JavaScript:

```js
f < T > 100;
```

This may impact you if you were leveraging TypeScript's API to parse type constructs in JavaScript files, which may have occurred when trying to parse Flow files.

See [the pull request](https://github.com/microsoft/TypeScript/pull/41928) for more details on what's checked.

### Tuple size limits for spreads

Tuple types can be made by using any sort of spread syntax (`...`) in TypeScript.

```ts
// Tuple types with spread elements
type NumStr = [number, string];
type NumStrNumStr = [...NumStr, ...NumStr];

// Array spread expressions
const numStr = [123, 'hello'] as const;
const numStrNumStr = [...numStr, ...numStr] as const;
```

Sometimes these tuple types can accidentally grow to be huge, and that can make type-checking take a long time.
Instead of letting the type-checking process hang (which is especially bad in editor scenarios), TypeScript has a limiter in place to avoid doing all that work.

You can [see this pull request](https://github.com/microsoft/TypeScript/pull/42448) for more details.

### `.d.ts` Extensions Cannot Be Used In Import Paths

In TypeScript 4.2, it is now an error for your import paths to contain `.d.ts` in the extension.

```ts
// must be changed something like
//   - "./foo"
//   - "./foo.js"
import { Foo } from './foo.d.ts';
```

Instead, your import paths should reflect whatever your loader will do at runtime.
Any of the following imports might be usable instead.

```ts
import { Foo } from './foo';
import { Foo } from './foo.js';
import { Foo } from './foo/index.js';
```

### Reverting Template Literal Inference

This change removed a feature from TypeScript 4.2 beta.
If you haven't yet upgraded past our last stable release, you won't be affected, but you may still be interested in the change.

The beta version of TypeScript 4.2 included a change in inference to template strings.
In this change, template string literals would either be given template string types or simplify to multiple string literal types.
These types would then _widen_ to `string` when assigning to mutable variables.

```ts
declare const yourName: string;

// 'bar' is constant.
// It has type '`hello ${string}`'.
const bar = `hello ${yourName}`;

// 'baz' is mutable.
// It has type 'string'.
let baz = `hello ${yourName}`;
```

This is similar to how string literal inference works.

```ts
// 'bar' has type '"hello"'.
const bar = 'hello';

// 'baz' has type 'string'.
let baz = 'hello';
```

For that reason, we believed that making template string expressions have template string types would be "consistent";
however, from what we've seen and heard, that isn't always desirable.

In response, we've reverted this feature (and potential breaking change).
If you _do_ want a template string expression to be given a literal-like type, you can always add `as const` to the end of it.

```ts
declare const yourName: string;

// 'bar' has type '`hello ${string}`'.
const bar = `hello ${yourName}` as const;
//                              ^^^^^^^^

// 'baz' has type 'string'.
const baz = `hello ${yourName}`;
```

### TypeScript's `lift` Callback in `visitNode` Uses a Different Type

TypeScript has a `visitNode` function that takes a `lift` function.
`lift` now expects a `readonly Node[]` instead of a `NodeArray<Node>`.
This is technically an API breaking change which you can read more on [here](https://github.com/microsoft/TypeScript/pull/42000).
