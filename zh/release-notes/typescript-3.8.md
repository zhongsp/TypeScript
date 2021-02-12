# TypeScript 3.8

* [Type-Only Imports and Exports](#type-only-imports-exports)
* [ECMAScript Private Fields](#ecmascript-private-fields)
* [`export * as ns` Syntax](#export-star-as-namespace-syntax)
* [Top-Level `await`](#top-level-await)
* [JSDoc Property Modifiers](#jsdoc-modifiers)
* [Better Directory Watching on Linux and `watchOptions`](#better-directory-watching)
* ["Fast and Loose" Incremental Checking](#assume-direct-dependencies)

## <span id="type-only-imports-exports" /> 类型导入和导出（Type-Only Imports and Exports）

This feature is something most users may never have to think about; however, if you've hit issues under `--isolatedModules`, TypeScript's `transpileModule` API, or Babel, this feature might be relevant.

TypeScript 3.8 adds a new syntax for type-only imports and exports.

```ts
import type { SomeThing } from "./some-module.js";

export type { SomeThing };
```

`import type` only imports declarations to be used for type annotations and declarations.
It *always* gets fully erased, so there's no remnant of it at runtime.
Similarly, `export type` only provides an export that can be used for type contexts, and is also erased from TypeScript's output.

It's important to note that classes have a value at runtime and a type at design-time, and the use is context-sensitive.
When using `import type` to import a class, you can't do things like extend from it.

```ts
import type { Component } from "react";

interface ButtonProps {
    // ...
}

class Button extends Component<ButtonProps> {
    //               ~~~~~~~~~
    // error! 'Component' only refers to a type, but is being used as a value here.

    // ...
}
```

If you've used Flow before, the syntax is fairly similar.
One difference is that we've added a few restrictions to avoid code that might appear ambiguous.

```ts
// Is only 'Foo' a type? Or every declaration in the import?
// We just give an error because it's not clear.

import type Foo, { Bar, Baz } from "some-module";
//     ~~~~~~~~~~~~~~~~~~~~~~
// error! A type-only import can specify a default import or named bindings, but not both.
```

In conjunction with `import type`, TypeScript 3.8 also adds a new compiler flag to control what happens with imports that won't be utilized at runtime: `importsNotUsedAsValues`.
This flag takes 3 different values:

* `remove`: this is today's behavior of dropping these imports. It's going to continue to be the default, and is a non-breaking change.
* `preserve`: this *preserves* all imports whose values are never used. This can cause imports/side-effects to be preserved.
* `error`: this preserves all imports (the same as the `preserve` option), but will error when a value import is only used as a type. This might be useful if you want to ensure no values are being accidentally imported, but still make side-effect imports explicit.

For more information about the feature, you can [take a look at the pull request](https://github.com/microsoft/TypeScript/pull/35200), and [relevant changes](https://github.com/microsoft/TypeScript/pull/36092/) around broadening where imports from an `import type` declaration can be used.

## <span id="ecmascript-private-fields" /> ECMAScript 私有变量（ECMAScript Private Fields

TypeScript 3.8 brings support for ECMAScript's private fields, part of the [stage-3 class fields proposal](https://github.com/tc39/proposal-class-fields/).

```ts
class Person {
    #name: string

    constructor(name: string) {
        this.#name = name;
    }

    greet() {
        console.log(`Hello, my name is ${this.#name}!`);
    }
}

let jeremy = new Person("Jeremy Bearimy");

jeremy.#name
//     ~~~~~
// Property '#name' is not accessible outside class 'Person'
// because it has a private identifier.
```

Unlike regular properties (even ones declared with the `private` modifier), private fields have a few rules to keep in mind.
Some of them are:

* Private fields start with a `#` character. Sometimes we call these *private names*.
* Every private field name is uniquely scoped to its containing class.
* TypeScript accessibility modifiers like `public` or `private` can't be used on private fields.
* Private fields can't be accessed or even detected outside of the containing class - even by JS users! Sometimes we call this *hard privacy*.

Apart from "hard" privacy, another benefit of private fields is that uniqueness we just mentioned.
For example, regular property declarations are prone to being overwritten in subclasses.

```ts
class C {
    foo = 10;

    cHelper() {
        return this.foo;
    }
}

class D extends C {
    foo = 20;

    dHelper() {
        return this.foo;
    }
}

let instance = new D();
// 'this.foo' refers to the same property on each instance.
console.log(instance.cHelper()); // prints '20'
console.log(instance.dHelper()); // prints '20'
```

With private fields, you'll never have to worry about this, since each field name is unique to the containing class.

```ts
class C {
    #foo = 10;

    cHelper() {
        return this.#foo;
    }
}

class D extends C {
    #foo = 20;

    dHelper() {
        return this.#foo;
    }
}

let instance = new D();
// 'this.#foo' refers to a different field within each class.
console.log(instance.cHelper()); // prints '10'
console.log(instance.dHelper()); // prints '20'
```

Another thing worth noting is that accessing a private field on any other type will result in a `TypeError`!

```ts
class Square {
    #sideLength: number;

    constructor(sideLength: number) {
        this.#sideLength = sideLength;
    }

    equals(other: any) {
        return this.#sideLength === other.#sideLength;
    }
}

const a = new Square(100);
const b = { sideLength: 100 };

// Boom!
// TypeError: attempted to get private field on non-instance
// This fails because 'b' is not an instance of 'Square'.
console.log(a.equals(b));
```

Finally, for any plain `.js` file users, private fields *always* have to be declared before they're assigned to.

```js
class C {
    // No declaration for '#foo'
    // :(

    constructor(foo: number) {
        // SyntaxError!
        // '#foo' needs to be declared before writing to it.
        this.#foo = foo;
    }
}
```

JavaScript has always allowed users to access undeclared properties, whereas TypeScript has always required declarations for class properties.
With private fields, declarations are always needed regardless of whether we're working in `.js` or `.ts` files.

```js
class C {
    /** @type {number} */
    #foo;

    constructor(foo: number) {
        // This works.
        this.#foo = foo;
    }
}
```

For more information about the implementation, you can [check out the original pull request](https://github.com/Microsoft/TypeScript/pull/30829)

### Which should I use?

We've already received many questions on which type of privates you should use as a TypeScript user: most commonly, "should I use the `private` keyword, or ECMAScript's hash/pound (`#`) private fields?"
It depends!

When it comes to properties, TypeScript's `private` modifiers are fully erased - that means that at runtime, it acts entirely like a normal property and there's no way to tell that it was declared with a `private modifier.
When using the `private` keyword, privacy is only enforced at compile-time/design-time, and for JavaScript consumers it's entirely intent-based.

```ts
class C {
    private foo = 10;
}

// This is an error at compile time,
// but when TypeScript outputs .js files,
// it'll run fine and print '10'.
console.log(new C().foo);    // prints '10'
//                  ~~~
// error! Property 'foo' is private and only accessible within class 'C'.

// TypeScript allows this at compile-time
// as a "work-around" to avoid the error.
console.log(new C()["foo"]); // prints '10'
```

The upside is that this sort of "soft privacy" can help your consumers temporarily work around not having access to some API, and also works in any runtime.

On the other hand, ECMAScript's `#` privates are completely inaccessible outside of the class.

```ts
class C {
    #foo = 10;
}

console.log(new C().#foo); // SyntaxError
//                  ~~~~
// TypeScript reports an error *and*
// this won't work at runtime!

console.log(new C()["#foo"]); // prints undefined
//          ~~~~~~~~~~~~~~~
// TypeScript reports an error under 'noImplicitAny',
// and this prints 'undefined'.
```

This hard privacy is really useful for strictly ensuring that nobody can take use of any of your internals.
If you're a library author, removing or renaming a private field should never cause a breaking change.

As we mentioned, another benefit is that subclassing can be easier with ECMAScript's `#` privates because they *really* are private.
When using ECMAScript `#` private fields, no subclass ever has to worry about collisions in field naming.
When it comes to TypeScript's `private` property declarations, users still have to be careful not to trample over properties declared in superclasses.

One more thing to think about is where you intend for your code to run.
TypeScript currently can't support this feature unless targeting ECMAScript 2015 (ES6) targets or higher.
This is because our downleveled implementation uses `WeakMap`s to enforce privacy, and `WeakMap`s can't be polyfilled in a way that doesn't cause memory leaks.
In contrast, TypeScript's `private`-declared properties work with all targets - even ECMAScript 3!

A final consideration might be speed: `private` properties are no different from any other property, so accessing them is as fast as any other property access no matter which runtime you target.
In contrast, because `#` private fields are downleveled using `WeakMap`s, they may be slower to use.
While some runtimes might optimize their actual implementations of `#` private fields, and even have speedy `WeakMap` implementations, that might not be the case in all runtimes.

## <span id="export-star-as-namespace-syntax" /> `export * as ns` Syntax

It's often common to have a single entry-point that exposes all the members of another module as a single member.

```ts
import * as utilities from "./utilities.js";
export { utilities };
```

This is so common that ECMAScript 2020 recently added a new syntax to support this pattern!

```ts
export * as utilities from "./utilities.js";
```

This is a nice quality-of-life improvement to JavaScript, and TypeScript 3.8 implements this syntax.
When your module target is earlier than `es2020`, TypeScript will output something along the lines of the first code snippet.

## <span id="top-level-await" /> 顶层await（Top-Level await）

TypeScript 3.8 provides support for a handy upcoming ECMAScript feature called "top-level `await`".

JavaScript users often introduce an `async` function in order to use `await`, and then immediately called the function after defining it.

```js
async function main() {
    const response = await fetch("...");
    const greeting = await response.text();
    console.log(greeting);
}

main()
    .catch(e => console.error(e))
```

This is because previously in JavaScript (along with most other languages with a similar feature), `await` was only allowed within the body of an `async` function.
However, with top-level `await`, we can use `await` at the top level of a module.

```ts
const response = await fetch("...");
const greeting = await response.text();
console.log(greeting);

// Make sure we're a module
export {};
```

Note there's a subtlety: top-level `await` only works at the top level of a *module*, and files are only considered modules when TypeScript finds an `import` or an `export`.
In some basic cases, you might need to write out `export {}` as some boilerplate to make sure of this.

Top level `await` may not work in all environments where you might expect at this point.
Currently, you can only use top level `await` when the `target` compiler option is `es2017` or above, and `module` is `esnext` or `system`.
Support within several environments and bundlers may be limited or may require enabling experimental support.

For more information on our implementation, you can [check out the original pull request](https://github.com/microsoft/TypeScript/pull/35813).

## <span id="es2020-for-target-and-module" /> `es2020` for `target` and `module`

TypeScript 3.8 supports `es2020` as an option for `module` and `target`.
This will preserve newer ECMAScript 2020 features like optional chaining, nullish coalescing, `export * as ns`, and dynamic `import(...)` syntax.
It also means `bigint` literals now have a stable `target` below `esnext`.

## <span id="jsdoc-modifiers" /> JSDoc 属性修饰词(JSDoc Property Modifiers)

TypeScript 3.8 supports JavaScript files by turning on the `allowJs` flag, and also supports *type-checking* those JavaScript files via the `checkJs` option or by adding a `// @ts-check` comment to the top of your `.js` files.

Because JavaScript files don't have dedicated syntax for type-checking, TypeScript leverages JSDoc.
TypeScript 3.8 understands a few new JSDoc tags for properties.

First are the accessibility modifiers: `@public`, `@private`, and `@protected`.
These tags work exactly like `public`, `private`, and `protected` respectively work in TypeScript.

```js
// @ts-check

class Foo {
    constructor() {
        /** @private */
        this.stuff = 100;
    }

    printStuff() {
        console.log(this.stuff);
    }
}

new Foo().stuff;
//        ~~~~~
// error! Property 'stuff' is private and only accessible within class 'Foo'.
```

* `@public` 是默认的，可以省略，它代表了一个属性可以从任何地方访问它
* `@private` 表示一个属性只能在包含的类中访问
* `@protected` 表示该属性只能在所包含的类及子类中访问，但不能在类的实例中访问

下一步，我们计划添加 `@readonly` 修饰符，来确保一个属性只能在初始化时被修改：

```js
// @ts-check

class Foo {
    constructor() {
        /** @readonly */
        this.stuff = 100;
    }

    writeToStuff() {
        this.stuff = 200;
        //   ~~~~~
        // Cannot assign to 'stuff' because it is a read-only property.
    }
}

new Foo().stuff++;
//        ~~~~~
// Cannot assign to 'stuff' because it is a read-only property.
```

## <span id="better-directory-watching" /> Better Directory Watching on Linux and `watchOptions`

TypeScript 3.8 ships a new strategy for watching directories, which is crucial for efficiently picking up changes to `node_modules`.

For some context, on operating systems like Linux, TypeScript installs directory watchers (as opposed to file watchers) on `node_modules` and many of its subdirectories to detect changes in dependencies.
This is because the number of available file watchers is often eclipsed by the of files in `node_modules`, whereas there are way fewer directories to track.

Older versions of TypeScript would *immediately* install directory watchers on folders, and at startup that would be fine; however, during an npm install, a lot of activity will take place within `node_modules` and that can overwhelm TypeScript, often slowing editor sessions to a crawl.
To prevent this, TypeScript 3.8 waits slightly before installing directory watchers to give these highly volatile directories some time to stabilize.

Because every project might work better under different strategies, and this new approach might not work well for your workflows, TypeScript 3.8 introduces a new `watchOptions` field in `tsconfig.json` and `jsconfig.json` which allows users to tell the compiler/language service which watching strategies should be used to keep track of files and directories.

```json5
{
    // Some typical compiler options
    "compilerOptions": {
        "target": "es2020",
        "moduleResolution": "node",
        // ...
    },

    // NEW: Options for file/directory watching
    "watchOptions": {
        // Use native file system events for files and directories
        "watchFile": "useFsEvents",
        "watchDirectory": "useFsEvents",

        // Poll files for updates more frequently
        // when they're updated a lot.
        "fallbackPolling": "dynamicPriority"
    }
}
```

`watchOptions` 包含四种新的选项:

* `watchFile`: 监听单个文件的策略，它可以有以下值 
    * `fixedPollingInterval`: 以固定的时间间隔，检查文件的更改
    * `priorityPollingInterval`: 以固定的时间间隔，检查文件的更改，但是使用「heuristics」检查某些类型的文件的频率比其他文件低（heuristics 怎么翻？）
    * `dynamicPriorityPolling`: 使用动态队列，在该队列中，较少检查不经常修改的文件
    * `useFsEvents` （默认）: 尝试使用操作系统/文件系统原生事件来监听文件更改
    * `useFsEventsOnParentDirectory`: 尝试使用操作系统/文件系统原生事件来监听文件、目录的更改，这样可以使用较小的文件监听程序，但是准确性可能较低
* `watchDirectory`: 在缺少递归文件监听功能的系统中，使用哪种策略监听整个目录树，它可以有以下值 :
    * `fixedPollingInterval`: 以固定的时间间隔，检查目录树的更改
    * `dynamicPriorityPolling`: 使用动态队列，在该队列中，较少检查不经常修改的目录
    * `useFsEvents` （默认）: 尝试使用操作系统/文件系统原生事件来监听目录更改
* `fallbackPolling`: 当使用文件系统的事件，该选项用来指定使用特定策略，它可以有以下值 
    * `fixedPollingInterval`: *(同上)*
    * `priorityPollingInterval`: *(同上)*
    * `dynamicPriorityPolling`: *(同上)*
* `synchronousWatchDirectory`: 在目录上禁用延迟监听功能。在可能一次发生大量文件（如 `node_modules`）更改时，它非常有用，但是你可能需要一些不太常见的设置时，禁用它。


For more information on these changes, [head over to GitHub to see the pull request](https://github.com/microsoft/TypeScript/pull/35615) to read more.

## <span id="assume-direct-dependencies" /> "Fast and Loose" Incremental Checking

TypeScript 3.8 introduces a new compiler option called `assumeChangesOnlyAffectDirectDependencies`.
When this option is enabled, TypeScript will avoid rechecking/rebuilding all truly possibly-affected files, and only recheck/rebuild files that have changed as well as files that directly import them.

For example, consider a file `fileD.ts` that imports `fileC.ts` that imports `fileB.ts` that imports `fileA.ts` as follows:

```
fileA.ts <- fileB.ts <- fileC.ts <- fileD.ts
```

In `--watch` mode, a change in `fileA.ts` would typically mean that TypeScript would need to at least re-check `fileB.ts`, `fileC.ts`, and `fileD.ts`.
Under `assumeChangesOnlyAffectDirectDependencies`, a change in `fileA.ts` means that only `fileA.ts` and `fileB.ts` need to be re-checked.

In a codebase like Visual Studio Code, this reduced rebuild times for changes in certain files from about 14 seconds to about 1 second.
While we don't necessarily recommend this option for all codebases, you might be interested if you have an extremely large codebase and are willing to defer full project errors until later (e.g. a dedicated build via a `tsconfig.fullbuild.json` or in CI).

For more details, you can [see the original pull request](https://github.com/microsoft/TypeScript/pull/35711).