## 模版字面量类型

使用字符串字面量类型能够表示仅接受特定字符串参数的函数和 API。

```ts twoslash
function setVerticalAlignment(location: 'top' | 'middle' | 'bottom') {
    // ...
}

setVerticalAlignment('middel');
//                   ^^^^^^^^
// Argument of type '"middel"' is not assignable to parameter of type '"top" | "middle" | "bottom"'.
```

使用字符串字面量类型的好处是它能够对字符串进行拼写检查。

此外，字符串字面量还能用于映射类型中的属性名。
从这个意义上来讲，它们可被当作构件使用。

```ts
type Options = {
    [K in
        | 'noImplicitAny'
        | 'strictNullChecks'
        | 'strictFunctionTypes']?: boolean;
};
// same as
//   type Options = {
//       noImplicitAny?: boolean,
//       strictNullChecks?: boolean,
//       strictFunctionTypes?: boolean
//   };
```

还有一处字符串字面量类型可被当作构件使用，那就是在构造其它字符串字面量类型时。

这也是 TypeScript 4.1 支持模版字面量类型的原因。
它的语法与[JavaScript 中的模版字面量](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)的语法是一致的，但是是用在表示类型的位置上。
当将其与具体类型结合使用时，它会将字符串拼接并产生一个新的字符串字面量类型。

```ts twoslash
type World = 'world';

type Greeting = `hello ${World}`;
//   ^^^^^^^^^
//   "hello world"
```

如果在替换的位置上使用了联合类型会怎么样呢？
它将生成由各个联合类型成员所表示的字符串字面量类型的联合。

```ts twoslash
type Color = 'red' | 'blue';
type Quantity = 'one' | 'two';

type SeussFish = `${Quantity | Color} fish`;
//   ^^^^^^^^^
//   "one fish" | "two fish" | "red fish" | "blue fish"
```

除此之外，我们也可以在其它场景中应用它。
例如，有些 UI 组件库提供了指定垂直和水平对齐的 API，通常会使用类似于`"bottom-right"`的字符串来同时指定。
在垂直对齐的选项`"top"`，`"middle"`和`"bottom"`，以及水平对齐的选项`"left"`，`"center"`和`"right"`之间，共有 9 种可能的字符串，前者选项之一与后者选项之一之间使用短横线连接。

```ts twoslash
type VerticalAlignment = 'top' | 'middle' | 'bottom';
type HorizontalAlignment = 'left' | 'center' | 'right';

// Takes
//   | "top-left"    | "top-center"    | "top-right"
//   | "middle-left" | "middle-center" | "middle-right"
//   | "bottom-left" | "bottom-center" | "bottom-right"

declare function setAlignment(
    value: `${VerticalAlignment}-${HorizontalAlignment}`
): void;

setAlignment('top-left'); // works!
setAlignment('top-middel'); // error!
setAlignment('top-pot'); // error! but good doughnuts if you're ever in Seattle
```

这样的例子还有很多，但它仍只是小例子而已，因为我们可以直接写出所有可能的值。
实际上，对于 9 个字符串来讲还算可以；但是如果需要大量的字符串，你就得考虑如何去自动生成（或者简单地使用`string`）。

有些值实际上是来自于动态创建的字符串字面量。
例如，假设 `makeWatchedObject` API 接收一个对象，并生成一个几乎等同的对象，但是带有一个新的`on`方法来检测属性的变化。

```ts
let person = makeWatchedObject({
    firstName: 'Homer',
    age: 42,
    location: 'Springfield',
});

person.on('firstNameChanged', () => {
    console.log(`firstName was changed!`);
});
```

注意，`on`监听的是`"firstNameChanged"`事件，而非仅仅是`"firstName"`。
那么我们如何定义类型？

```ts twslash
type PropEventSource<T> = {
    on(eventName: `${string & keyof T}Changed`, callback: () => void): void;
};

/// Create a "watched object" with an 'on' method
/// so that you can watch for changes to properties.
declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;
```

这样做的话，如果传入了错误的属性会产生一个错误！

```ts twoslash
type PropEventSource<T> = {
    on(eventName: `${string & keyof T}Changed`, callback: () => void): void;
};
declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;
let person = makeWatchedObject({
    firstName: 'Homer',
    age: 42,
    location: 'Springfield',
});

// error!
person.on('firstName', () => {});

// error!
person.on('frstNameChanged', () => {});
```

我们还可以在模版字面量上做一些其它的事情：可以从替换的位置来*推断*类型。
我们将上面的例子改写成泛型，由`eventName`字符串来推断关联的属性名。

```ts twoslash
type PropEventSource<T> = {
    on<K extends string & keyof T>(
        eventName: `${K}Changed`,
        callback: (newValue: T[K]) => void
    ): void;
};

declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;

let person = makeWatchedObject({
    firstName: 'Homer',
    age: 42,
    location: 'Springfield',
});

// works! 'newName' is typed as 'string'
person.on('firstNameChanged', (newName) => {
    // 'newName' has the type of 'firstName'
    console.log(`new name is ${newName.toUpperCase()}`);
});

// works! 'newAge' is typed as 'number'
person.on('ageChanged', (newAge) => {
    if (newAge < 0) {
        console.log('warning! negative age');
    }
});
```

这里我们将`on`定义为泛型方法。
当用户使用`"firstNameChanged'`来调用该方法，TypeScript 会尝试去推断出`K`所表示的类型。
为此，它尝试将`K`与`"Changed"`之前的内容进行匹配并推断出`"firstName"`。
一旦 TypeScript 得到了结果，`on`方法就能够从原对象上获取`firstName`的类型，此例中是`string`。
类似地，当使用`"ageChanged"`调用时，它会找到属性`age`的类型为`number`。

类型推断可以用不同的方式组合，常见的是解构字符串，再使用其它方式重新构造它们。
实际上，为了便于修改字符串字面量类型，我们引入了一些新的工具类型来修改字符大小写。

```ts twoslash
type EnthusiasticGreeting<T extends string> = `${Uppercase<T>}`;

type HELLO = EnthusiasticGreeting<'hello'>;
//   ^^^^^
//   "HELLO"
```

新的类型别名为`Uppercase`，`Lowercase`，`Capitalize`和`Uncapitalize`。
前两个会转换字符串中的所有字符，而后面两个只转换字符串的首字母。

更多详情，[查看原 PR](https://github.com/microsoft/TypeScript/pull/40336)以及[正在进行中的切换类型别名助手的 PR](https://github.com/microsoft/TypeScript/pull/40580).

## 在映射类型中更改映射的键

让我们先回顾一下，映射类型可以使用任意的键来创建新的对象类型。

```ts
type Options = {
    [K in
        | 'noImplicitAny'
        | 'strictNullChecks'
        | 'strictFunctionTypes']?: boolean;
};
// same as
//   type Options = {
//       noImplicitAny?: boolean,
//       strictNullChecks?: boolean,
//       strictFunctionTypes?: boolean
//   };
```

或者，基于任意的对象类型来创建新的对象类型。

```ts
/// 'Partial<T>' 等同于 'T'，只是把每个属性标记为可选的。
type Partial<T> = {
    [K in keyof T]?: T[K];
};
```

到目前为止，映射类型只能使用提供给它的键来创建新的对象类型；然而，很多时候我们想要创建新的键，或者过滤掉某些键。

这就是 TypeScript 4.1 允许更改映射类型中的键的原因。它使用了新的`as`语句。

```ts
type MappedTypeWithNewKeys<T> = {
    [K in keyof T as NewKeyType]: T[K];
    //            ^^^^^^^^^^^^^
    //            这里是新的语法！
};
```

通过`as`语句，你可以利用例如模版字面量类型，并基于原属性名来轻松地创建新属性名。

```ts twoslash
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
    name: string;
    age: number;
    location: string;
}

type LazyPerson = Getters<Person>;
// type LazyPerson = {
//     getName: () => string;
//     getAge: () => number;
//     getLocation: () => string;
// }
```

此外，你可以巧用`never`类型来过滤掉某些键。
也就是说，在某些情况下你不必使用`Omit`工具类型。

```ts twoslash
// 删除 'kind' 属性
type RemoveKindField<T> = {
    [K in keyof T as Exclude<K, 'kind'>]: T[K];
};

interface Circle {
    kind: 'circle';
    radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;

type RemoveKindField<T> = {
    [K in keyof T as Exclude<K, 'kind'>]: T[K];
};

interface Circle {
    kind: 'circle';
    radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;
// type KindlessCircle = {
//     radius: number;
// }
```

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/40336)。

## Recursive Conditional Types

In JavaScript it's fairly common to see functions that can flatten and build up container types at arbitrary levels.
For example, consider the `.then()` method on instances of `Promise`.
`.then(...)` unwraps each promise until it finds a value that's not "promise-like", and passes that value to a callback.
There's also a relatively new `flat` method on `Array`s that can take a depth of how deep to flatten.

Expressing this in TypeScript's type system was, for all practical intents and purposes, not possible.
While there were hacks to achieve this, the types ended up looking very unreasonable.

That's why TypeScript 4.1 eases some restrictions on conditional types - so that they can model these patterns.
In TypeScript 4.1, conditional types can now immediately reference themselves within their branches, making it easier to write recursive type aliases.

For example, if we wanted to write a type to get the element types of nested arrays, we could write the following `deepFlatten` type.

```ts
type ElementType<T> = T extends ReadonlyArray<infer U> ? ElementType<U> : T;

function deepFlatten<T extends readonly unknown[]>(x: T): ElementType<T>[] {
    throw 'not implemented';
}

// All of these return the type 'number[]':
deepFlatten([1, 2, 3]);
deepFlatten([[1], [2, 3]]);
deepFlatten([[1], [[2]], [[[3]]]]);
```

Similarly, in TypeScript 4.1 we can write an `Awaited` type to deeply unwrap `Promise`s.

```ts
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

/// Like `promise.then(...)`, but more accurate in types.
declare function customThen<T, U>(
    p: Promise<T>,
    onFulfilled: (value: Awaited<T>) => U
): Promise<Awaited<U>>;
```

Keep in mind that while these recursive types are powerful, but they should be used responsibly and sparingly.

First off, these types can do a lot of work which means that they can increase type-checking time.
Trying to model numbers in the Collatz conjecture or Fibonacci sequence might be fun, but don't ship that in `.d.ts` files on npm.

But apart from being computationally intensive, these types can hit an internal recursion depth limit on sufficiently-complex inputs.
When that recursion limit is hit, that results in a compile-time error.
In general, it's better not to use these types at all than to write something that fails on more realistic examples.

See more [at the implementation](https://github.com/microsoft/TypeScript/pull/40002).

## Checked Indexed Accesses (`--noUncheckedIndexedAccess`)

TypeScript has a feature called _index signatures_.
These signatures are a way to signal to the type system that users can access arbitrarily-named properties.

```ts twoslash
interface Options {
    path: string;
    permissions: number;

    // Extra properties are caught by this index signature.
    [propName: string]: string | number;
}

function checkOptions(opts: Options) {
    opts.path; // string
    opts.permissions; // number

    // These are all allowed too!
    // They have the type 'string | number'.
    opts.yadda.toString();
    opts['foo bar baz'].toString();
    opts[Math.random()].toString();
}
```

In the above example, `Options` has an index signature that says any accessed property that's not already listed should have the type `string | number`.
This is often convenient for optimistic code that assumes you know what you're doing, but the truth is that most values in JavaScript do not support every potential property name.
Most types will not, for example, have a value for a property key created by `Math.random()` like in the previous example.
For many users, this behavior was undesirable, and felt like it wasn't leveraging the full strict-checking of `--strictNullChecks`.

That's why TypeScript 4.1 ships with a new flag called `--noUncheckedIndexedAccess`.
Under this new mode, every property access (like `foo.bar`) or indexed access (like `foo["bar"]`) is considered potentially undefined.
That means that in our last example, `opts.yadda` will have the type `string | number | undefined` as opposed to just `string | number`.
If you need to access that property, you'll either have to check for its existence first or use a non-null assertion operator (the postfix `!` character).

```ts twoslash
// @errors: 2532
// @noUncheckedIndexedAccess
interface Options {
    path: string;
    permissions: number;

    // Extra properties are caught by this index signature.
    [propName: string]: string | number;
}
// ---cut---
function checkOptions(opts: Options) {
    opts.path; // string
    opts.permissions; // number

    // These are not allowed with noUncheckedIndexedAccess
    opts.yadda.toString();
    opts['foo bar baz'].toString();
    opts[Math.random()].toString();

    // Checking if it's really there first.
    if (opts.yadda) {
        console.log(opts.yadda.toString());
    }

    // Basically saying "trust me I know what I'm doing"
    // with the '!' non-null assertion operator.
    opts.yadda!.toString();
}
```

One consequence of using `--noUncheckedIndexedAccess` is that indexing into an array is also more strictly checked, even in a bounds-checked loop.

```ts twoslash
// @errors: 2532
// @noUncheckedIndexedAccess
function screamLines(strs: string[]) {
    // This will have issues
    for (let i = 0; i < strs.length; i++) {
        console.log(strs[i].toUpperCase());
    }
}
```

If you don't need the indexes, you can iterate over individual elements by using a `for`-`of` loop or a `forEach` call.

```ts twoslash
// @noUncheckedIndexedAccess
function screamLines(strs: string[]) {
    // This works fine
    for (const str of strs) {
        console.log(str.toUpperCase());
    }

    // This works fine
    strs.forEach((str) => {
        console.log(str.toUpperCase());
    });
}
```

This flag can be handy for catching out-of-bounds errors, but it might be noisy for a lot of code, so it is not automatically enabled by the `--strict` flag; however, if this feature is interesting to you, you should feel free to try it and determine whether it makes sense for your team's codebase!

You can learn more [at the implementing pull request](https://github.com/microsoft/TypeScript/pull/39560).

## `paths` without `baseUrl`

Using path-mapping is fairly common - often it's to have nicer imports, often it's to simulate monorepo linking behavior.

Unfortunately, specifying `paths` to enable path-mapping required also specifying an option called `baseUrl`, which allows bare specifier paths to be reached relative to the `baseUrl` too.
This also often caused poor paths to be used by auto-imports.

In TypeScript 4.1, the `paths` option can be used without `baseUrl`.
This helps avoid some of these issues.

## `checkJs` Implies `allowJs`

Previously if you were starting a checked JavaScript project, you had to set both `allowJs` and `checkJs`.
This was a slightly annoying bit of friction in the experience, so `checkJs` now implies `allowJs` by default.

[See more details at the pull request](https://github.com/microsoft/TypeScript/pull/40275).

## React 17 JSX Factories

TypeScript 4.1 supports React 17's upcoming `jsx` and `jsxs` factory functions through two new options for the `jsx` compiler option:

-   `react-jsx`
-   `react-jsxdev`

These options are intended for production and development compiles respectively.
Often, the options from one can extend from the other.
For example, a `tsconfig.json` for production builds might look like the following:

```json tsconfig
// ./src/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "es2015",
        "jsx": "react-jsx",
        "strict": true
    },
    "include": ["./**/*"]
}
```

and one for development builds might look like the following:

```json tsconfig
// ./src/tsconfig.dev.json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "jsx": "react-jsxdev"
    }
}
```

For more information, [check out the corresponding PR](https://github.com/microsoft/TypeScript/pull/39199).

## Editor Support for the JSDoc `@see` Tag

The JSDoc tag `@see` tag now has better support in editors for TypeScript and JavaScript.
This allows you to use functionality like go-to-definition in a dotted name following the tag.
For example, going to definition on `first` or `C` in the JSDoc comment just works in the following example:

```ts
// @filename: first.ts
export class C {}

// @filename: main.ts
import * as first from './first';

/**
 * @see first.C
 */
function related() {}
```

Thanks to frequent contributor [Wenlu Wang](https://github.com/Kingwl) [for implementing this](https://github.com/microsoft/TypeScript/pull/39760)!

## Breaking Changes

### `lib.d.ts` Changes

`lib.d.ts` may have a set of changed APIs, potentially in part due to how the DOM types are automatically generated.
One specific change is that `Reflect.enumerate` has been removed, as it was removed from ES2016.

### `abstract` Members Can't Be Marked `async`

Members marked as `abstract` can no longer be marked as `async`.
The fix here is to remove the `async` keyword, since callers are only concerned with the return type.

### `any`/`unknown` Are Propagated in Falsy Positions

Previously, for an expression like `foo && somethingElse`, the type of `foo` was `any` or `unknown`, the type of the whole that expression would be the type of `somethingElse`.

For example, previously the type for `x` here was `{ someProp: string }`.

```ts
declare let foo: unknown;
declare let somethingElse: { someProp: string };

let x = foo && somethingElse;
```

However, in TypeScript 4.1, we are more careful about how we determine this type.
Since nothing is known about the type on the left side of the `&&`, we propagate `any` and `unknown` outward instead of the type on the right side.

The most common pattern we saw of this tended to be when checking compatibility with `boolean`s, especially in predicate functions.

```ts
function isThing(x: any): boolean {
    return x && typeof x === 'object' && x.blah === 'foo';
}
```

Often the appropriate fix is to switch from `foo && someExpression` to `!!foo && someExpression`.

### `resolve`'s Parameters Are No Longer Optional in `Promise`s

When writing code like the following

```ts
new Promise((resolve) => {
    doSomethingAsync(() => {
        doSomething();
        resolve();
    });
});
```

You may get an error like the following:

```
  resolve()
  ~~~~~~~~~
error TS2554: Expected 1 arguments, but got 0.
  An argument for 'value' was not provided.
```

This is because `resolve` no longer has an optional parameter, so by default, it must now be passed a value.
Often this catches legitimate bugs with using `Promise`s.
The typical fix is to pass it the correct argument, and sometimes to add an explicit type argument.

```ts
new Promise<number>((resolve) => {
    //     ^^^^^^^^
    doSomethingAsync((value) => {
        doSomething();
        resolve(value);
        //      ^^^^^
    });
});
```

However, sometimes `resolve()` really does need to be called without an argument.
In these cases, we can give `Promise` an explicit `void` generic type argument (i.e. write it out as `Promise<void>`).
This leverages new functionality in TypeScript 4.1 where a potentially-`void` trailing parameter can become optional.

```ts
new Promise<void>((resolve) => {
    //     ^^^^^^
    doSomethingAsync(() => {
        doSomething();
        resolve();
    });
});
```

TypeScript 4.1 ships with a quick fix to help fix this break.

### Conditional Spreads Create Optional Properties

In JavaScript, object spreads (like `{ ...foo }`) don't operate over falsy values.
So in code like `{ ...foo }`, `foo` will be skipped over if it's `null` or `undefined`.

Many users take advantage of this to spread in properties "conditionally".

```ts
interface Person {
    name: string;
    age: number;
    location: string;
}

interface Animal {
    name: string;
    owner: Person;
}

function copyOwner(pet?: Animal) {
    return {
        ...(pet && pet.owner),
        otherStuff: 123,
    };
}

// We could also use optional chaining here:

function copyOwner(pet?: Animal) {
    return {
        ...pet?.owner,
        otherStuff: 123,
    };
}
```

Here, if `pet` is defined, the properties of `pet.owner` will be spread in - otherwise, no properties will be spread into the returned object.

The return type of `copyOwner` was previously a union type based on each spread:

```
{ x: number } | { x: number, name: string, age: number, location: string }
```

This modeled exactly how the operation would occur: if `pet` was defined, all the properties from `Person` would be present; otherwise, none of them would be defined on the result.
It was an all-or-nothing operation.

However, we've seen this pattern taken to the extreme, with hundreds of spreads in a single object, each spread potentially adding in hundreds or thousands of properties.
It turns out that for various reasons, this ends up being extremely expensive, and usually for not much benefit.

In TypeScript 4.1, the returned type sometimes uses all-optional properties.

```
{
    x: number;
    name?: string;
    age?: number;
    location?: string;
}
```

This ends up performing better and generally displaying better too.

For more details, [see the original change](https://github.com/microsoft/TypeScript/pull/40778).
While this behavior is not entirely consistent right now, we expect a future release will produce cleaner and more predictable results.

### Unmatched parameters are no longer related

TypeScript would previously relate parameters that didn't correspond to each other by relating them to the type `any`.
With [changes in TypeScript 4.1](https://github.com/microsoft/TypeScript/pull/41308), the language now skips this process entirely.
This means that some cases of assignability will now fail, but it also means that some cases of overload resolution can fail as well.
For example, overload resolution on `util.promisify` in Node.js may select a different overload in TypeScript 4.1, sometimes causing new or different errors downstream.

As a workaround, you may be best using a type assertion to squelch errors.
