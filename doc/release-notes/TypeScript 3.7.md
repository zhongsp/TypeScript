* [Optional Chaining](#optional-chaining)
* [Nullish Coalescing](#nullish-coalescing)
* [Assertion Functions](#assertion-functions)
* [Better Support for `never`-Returning Functions](#better-support-for-never-returning-functions)
* [(More) Recursive Type Aliases](#more-recursive-type-aliases)
* [`--declaration` and `--allowJs`](#--declaration-and---allowjs)
* [The `useDefineForClassFields` Flag and The `declare` Property Modifier](#the-usedefineforclassfields-flag-and-the-declare-property-modifier)
* [Build-Free Editing with Project References](#build-free-editing-with-project-references)
* [Uncalled Function Checks](#uncalled-function-checks)
* [`// @ts-nocheck` in TypeScript Files](#-ts-nocheck-in-typescript-files)
* [Semicolon Formatter Option](#semicolon-formatter-option)
* [Breaking Changes](#37-breaking-changes)
	* [DOM Changes](#dom-changes)
	* [Function Truthy Checks](#function-truthy-checks)
	* [Local and Imported Type Declarations Now Conflict](#local-and-imported-type-declarations-now-conflict)
    * [API Changes](#37-api-changes)


## Optional Chaining

[Playground](/play/#example/optional-chaining)

Optional chaining is [issue #16](https://github.com/microsoft/TypeScript/issues/16) on our issue tracker. For context, there have been over 23,000 issues on the TypeScript issue tracker since then. 

At its core, optional chaining lets us write code where TypeScript can immediately stop running some expressions if we run into a `null` or `undefined`.
The star of the show in optional chaining is the new `?.` operator for *optional property accesses*.
When we write code like

```ts
let x = foo?.bar.baz();
```

this is a way of saying that when `foo` is defined, `foo.bar.baz()` will be computed; but when `foo` is `null` or `undefined`, stop what we're doing and just return `undefined`."

More plainly, that code snippet is the same as writing the following.

```ts
let x = (foo === null || foo === undefined) ?
    undefined :
    foo.bar.baz();
```

Note that if `bar` is `null` or `undefined`, our code will still hit an error accessing `baz`.
Likewise, if `baz` is `null` or `undefined`, we'll hit an error at the call site.
`?.` only checks for whether the value on the *left* of it is `null` or `undefined` - not any of the subsequent properties.

You might find yourself using `?.` to replace a lot of code that performs repetitive nullish checks using the `&&` operator.

```ts
// Before
if (foo && foo.bar && foo.bar.baz) {
    // ...
}

// After-ish
if (foo?.bar?.baz) {
    // ...
}
```

Keep in mind that `?.` acts differently than those `&&` operations since `&&` will act specially on "falsy" values (e.g. the empty string, `0`, `NaN`, and, well, `false`), but this is an intentional feature of the construct.
It doesn't short-circuit on valid data like `0` or empty strings.

Optional chaining also includes two other operations.
First there's the *optional element access* which acts similarly to optional property accesses, but allows us to access non-identifier properties (e.g. arbitrary strings, numbers, and symbols):

```ts
/**
 * Get the first element of the array if we have an array.
 * Otherwise return undefined.
 */
function tryGetFirstElement<T>(arr?: T[]) {
    return arr?.[0];
    // equivalent to
    //   return (arr === null || arr === undefined) ?
    //       undefined :
    //       arr[0];
}
```

There's also *optional call*, which allows us to conditionally call expressions if they're not `null` or `undefined`.

```ts
async function makeRequest(url: string, log?: (msg: string) => void) {
    log?.(`Request started at ${new Date().toISOString()}`);
    // roughly equivalent to
    //   if (log != null) {
    //       log(`Request started at ${new Date().toISOString()}`);
    //   }

    const result = (await fetch(url)).json();

    log?.(`Request finished at at ${new Date().toISOString()}`);

    return result;
}
```

The "short-circuiting" behavior that optional chains have is limited property accesses, calls, element accesses - it doesn't expand any further out from these expressions.
In other words,

```ts
let result = foo?.bar / someComputation()
```

doesn't stop the division or `someComputation()` call from occurring.
It's equivalent to

```ts
let temp = (foo === null || foo === undefined) ?
    undefined :
    foo.bar;

let result = temp / someComputation();
```

That might result in dividing `undefined`, which is why in `strictNullChecks`, the following is an error.

```ts
function barPercentage(foo?: { bar: number }) {
    return foo?.bar / 100;
    //     ~~~~~~~~
    // Error: Object is possibly undefined.
}
```

More more details, you can [read up on the proposal](https://github.com/tc39/proposal-optional-chaining/) and [view the original pull request](https://github.com/microsoft/TypeScript/pull/33294).

## Nullish Coalescing

[Playground](/play/#example/nullish-coalescing)

The *nullish coalescing operator* is another upcoming ECMAScript feature that goes hand-in-hand with optional chaining, and which our team has been involved with championing in TC39.

You can think of this feature - the `??` operator - as a way to "fall back" to a default value when dealing with `null` or `undefined`.
When we write code like

```ts
let x = foo ?? bar();
```

this is a new way to say that the value `foo` will be used when it's "present";
but when it's `null` or `undefined`, calculate `bar()` in its place.

Again, the above code is equivalent to the following.

```ts
let x = (foo !== null && foo !== undefined) ?
    foo :
    bar();
```

The `??` operator can replace uses of `||` when trying to use a default value.
For example, the following code snippet tries to fetch the volume that was last saved in [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) (if it ever was);
however, it has a bug because it uses `||`.

```ts
function initializeAudio() {
    let volume = localStorage.volume || 0.5

    // ...
}
```

When `localStorage.volume` is set to `0`, the page will set the volume to `0.5` which is unintended.
`??` avoids some unintended behavior from `0`, `NaN` and `""` being treated as falsy values.

We owe a large thanks to community members [Wenlu Wang](https://github.com/Kingwl) and [Titian Cernicova Dragomir](https://github.com/dragomirtitian) for implementing this feature!
For more details, [check out their pull request](https://github.com/microsoft/TypeScript/pull/32883) and [the nullish coalescing proposal repository](https://github.com/tc39/proposal-nullish-coalescing/).

## Assertion Functions

[Playground](/play/#example/assertion-functions)

There's a specific set of functions that `throw` an error if something unexpected happened.
They're called "assertion" functions.
As an example, Node.js has a dedicated function for this called `assert`.

```js
assert(someValue === 42);
```

In this example if `someValue` isn't equal to `42`, then `assert` will throw an `AssertionError`.

Assertions in JavaScript are often used to guard against improper types being passed in.
For example,

```js
function multiply(x, y) {
    assert(typeof x === "number");
    assert(typeof y === "number");

    return x * y;
}
```

Unfortunately in TypeScript these checks could never be properly encoded.
For loosely-typed code this meant TypeScript was checking less, and for slightly conservative code it often forced users to use type assertions.

```ts
function yell(str) {
    assert(typeof str === "string");

    return str.toUppercase();
    // Oops! We misspelled 'toUpperCase'.
    // Would be great if TypeScript still caught this!
}
```

The alternative was to instead rewrite the code so that the language could analyze it, but this isn't convenient.

```ts
function yell(str) {
    if (typeof str !== "string") {
        throw new TypeError("str should have been a string.")
    }
    // Error caught!
    return str.toUppercase();
}
```

Ultimately the goal of TypeScript is to type existing JavaScript constructs in the least disruptive way.
For that reason, TypeScript 3.7 introduces a new concept called "assertion signatures" which model these assertion functions.

The first type of assertion signature models the way that Node's `assert` function works.
It ensures that whatever condition is being checked must be true for the remainder of the containing scope.

```ts
function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new AssertionError(msg)
    }
}
```

`asserts condition` says that whatever gets passed into the `condition` parameter must be true if the `assert` returns (because otherwise it would throw an error).
That means that for the rest of the scope, that condition must be truthy.
As an example, using this assertion function means we *do* catch our original `yell` example.

```ts
function yell(str) {
    assert(typeof str === "string");

    return str.toUppercase();
    //         ~~~~~~~~~~~
    // error: Property 'toUppercase' does not exist on type 'string'.
    //        Did you mean 'toUpperCase'?
}

function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new AssertionError(msg)
    }
}
```

The other type of assertion signature doesn't check for a condition, but instead tells TypeScript that a specific variable or property has a different type.

```ts
function assertIsString(val: any): asserts val is string {
    if (typeof val !== "string") {
        throw new AssertionError("Not a string!");
    }
}
```

Here `asserts val is string` ensures that after any call to `assertIsString`, any variable passed in will be known to be a `string`.

```ts
function yell(str: any) {
    assertIsString(str);

    // Now TypeScript knows that 'str' is a 'string'.

    return str.toUppercase();
    //         ~~~~~~~~~~~
    // error: Property 'toUppercase' does not exist on type 'string'.
    //        Did you mean 'toUpperCase'?
}
```

These assertion signatures are very similar to writing type predicate signatures:

```ts
function isString(val: any): val is string {
    return typeof val === "string";
}

function yell(str: any) {
    if (isString(str)) {
        return str.toUppercase();
    }
    throw "Oops!";
}
```

And just like type predicate signatures, these assertion signatures are incredibly expressive.
We can express some fairly sophisticated ideas with these.

```ts
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
    if (val === undefined || val === null) {
        throw new AssertionError(
            `Expected 'val' to be defined, but received ${val}`
        );
    }
}
```

To read up more about assertion signatures, [check out the original pull request](https://github.com/microsoft/TypeScript/pull/32695).

## Better Support for `never`-Returning Functions

As part of the work for assertion signatures, TypeScript needed to encode more about where and which functions were being called.
This gave us the opportunity to expand support for another class of functions: functions that return `never`.

The intent of any function that returns `never` is that it never returns.
It indicates that an exception was thrown, a halting error condition occurred, or that the program exited.
For example, [`process.exit(...)` in `@types/node`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/5299d372a220584e75a031c13b3d555607af13f8/types/node/globals.d.ts#l874) is specified to return `never`.

In order to ensure that a function never potentially returned `undefined` or effectively returned from all code paths, TypeScript needed some syntactic signal - either a `return` or `throw` at the end of a function.
So users found themselves `return`-ing their failure functions.

```ts
function dispatch(x: string | number): SomeType {
    if (typeof x === "string") {
        return doThingWithString(x);
    }
    else if (typeof x === "number") {
        return doThingWithNumber(x);
    }
    return process.exit(1);
}
```

Now when these `never`-returning functions are called, TypeScript recognizes that they affect the control flow graph and accounts for them.

```ts
function dispatch(x: string | number): SomeType {
    if (typeof x === "string") {
        return doThingWithString(x);
    }
    else if (typeof x === "number") {
        return doThingWithNumber(x);
    }
    process.exit(1);
}
```

As with assertion functions, you can [read up more at the same pull request](https://github.com/microsoft/TypeScript/pull/32695).

## (More) Recursive Type Aliases

[Playground](/play/#example/recursive-type-references)

Type aliases have always had a limitation in how they could be "recursively" referenced.
The reason is that any use of a type alias needs to be able to substitute itself with whatever it aliases.
In some cases, that's not possible, so the compiler rejects certain recursive aliases like the following:

```ts
type Foo = Foo;
```

This is a reasonable restriction because any use of `Foo` would need to be replaced with `Foo` which would need to be replaced with `Foo` which would need to be replaced with `Foo` which... well, hopefully you get the idea!
In the end, there isn't a type that makes sense in place of `Foo`.

This is fairly [consistent with how other languages treat type aliases](https://en.wikipedia.org/w/index.php?title=Recursive_data_type&oldid=913091335#in_type_synonyms), but it does give rise to some slightly surprising scenarios for how users leverage the feature.
For example, in TypeScript 3.6 and prior, the following causes an error.

```ts
type ValueOrArray<T> = T | Array<ValueOrArray<T>>;
//   ~~~~~~~~~~~~
// error: Type alias 'ValueOrArray' circularly references itself.
```

This is strange because there is technically nothing wrong with any use  users could always write what was effectively the same code by introducing an interface.

```ts
type ValueOrArray<T> = T | ArrayOfValueOrArray<T>;

interface ArrayOfValueOrArray<T> extends Array<ValueOrArray<T>> {}
```

Because interfaces (and other object types) introduce a level of indirection and their full structure doesn't need to be eagerly built out, TypeScript has no problem working with this structure.

But workaround of introducing the interface wasn't intuitive for users.
And in principle there really wasn't anything wrong with the original version of `ValueOrArray` that used `Array` directly.
If the compiler was a little bit "lazier" and only calculated the type arguments to `Array` when necessary, then TypeScript could express these correctly.

That's exactly what TypeScript 3.7 introduces.
At the "top level" of a type alias, TypeScript will defer resolving type arguments to permit these patterns.

This means that code like the following that was trying to represent JSON...

```ts
type Json =
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonArray;

interface JsonObject {
    [property: string]: Json;
}

interface JsonArray extends Array<Json> {}
```

can finally be rewritten without helper interfaces.

```ts
type Json =
    | string
    | number
    | boolean
    | null
    | { [property: string]: Json }
    | Json[];
```

This new relaxation also lets us recursively reference type aliases in tuples as well.
The following code which used to error is now valid TypeScript code.

```ts
type VirtualNode =
    | string
    | [string, { [key: string]: any }, ...VirtualNode[]];

const myNode: VirtualNode =
    ["div", { id: "parent" },
        ["div", { id: "first-child" }, "I'm the first child"],
        ["div", { id: "second-child" }, "I'm the second child"]
    ];
```

For more information, you can [read up on the original pull request](https://github.com/microsoft/TypeScript/pull/33050).

## `--declaration` and `--allowJs`

The `--declaration` flag in TypeScript allows us to generate `.d.ts` files (declaration files) from TypeScript source files (i.e. `.ts` and `.tsx` files).
These `.d.ts` files are important for a couple of reasons.

First of all, they're important because they allow TypeScript to type-check against other projects without re-checking the original source code.
They're also important because they allow TypeScript to interoperate with existing JavaScript libraries that weren't built with TypeScript in mind.
Finally, a benefit that is often underappreciated: both TypeScript *and* JavaScript users can benefit from these files when using editors powered by TypeScript to get things like better auto-completion.

Unfortunately, `--declaration` didn't work with the `--allowJs` flag which allows mixing TypeScript and JavaScript input files.
This was a frustrating limitation because it meant users couldn't use the `--declaration` flag when migrating codebases, even if they were JSDoc-annotated.
TypeScript 3.7 changes that, and allows the two options to be used together!

The most impactful outcome of this feature might a bit subtle: with TypeScript 3.7, users can write libraries in JSDoc annotated JavaScript and support TypeScript users.

The way that this works is that when using `allowJs`, TypeScript has some best-effort analyses to understand common JavaScript patterns; however, the way that some patterns are expressed in JavaScript don't necessarily look like their equivalents in TypeScript.
When `declaration` emit is turned on, TypeScript figures out the best way to transform JSDoc comments and CommonJS exports into valid type declarations and the like in the output `.d.ts` files.

As an example, the following code snippet

```js
const assert = require("assert")

module.exports.blurImage = blurImage;

/**
 * Produces a blurred image from an input buffer.
 * 
 * @param input {Uint8Array}
 * @param width {number}
 * @param height {number}
 */
function blurImage(input, width, height) {
    const numPixels = width * height * 4;
    assert(input.length === numPixels);
    const result = new Uint8Array(numPixels);

    // TODO

    return result;
}
```

Will produce a `.d.ts` file like

```ts
/**
 * Produces a blurred image from an input buffer.
 *
 * @param input {Uint8Array}
 * @param width {number}
 * @param height {number}
 */
export function blurImage(input: Uint8Array, width: number, height: number): Uint8Array;
```

This can go beyond basic functions with `@param` tags too, where the following example:

```js
/**
 * @callback Job
 * @returns {void}
 */

/** Queues work */
export class Worker {
    constructor(maxDepth = 10) {
        this.started = false;
        this.depthLimit = maxDepth;
        /**
         * NOTE: queued jobs may add more items to queue
         * @type {Job[]}
         */
        this.queue = [];
    }
    /**
     * Adds a work item to the queue
     * @param {Job} work 
     */
    push(work) {
        if (this.queue.length + 1 > this.depthLimit) throw new Error("Queue full!");
        this.queue.push(work);
    }
    /**
     * Starts the queue if it has not yet started
     */
    start() {
        if (this.started) return false;
        this.started = true;
        while (this.queue.length) {
            /** @type {Job} */(this.queue.shift())();
        }
        return true;
    }
}
```

will be transformed into the following `.d.ts` file:

```ts
/**
 * @callback Job
 * @returns {void}
 */
/** Queues work */
export class Worker {
    constructor(maxDepth?: number);
    started: boolean;
    depthLimit: number;
    /**
     * NOTE: queued jobs may add more items to queue
     * @type {Job[]}
     */
    queue: Job[];
    /**
     * Adds a work item to the queue
     * @param {Job} work
     */
    push(work: Job): void;
    /**
     * Starts the queue if it has not yet started
     */
    start(): boolean;
}
export type Job = () => void;
```

Note that when using these flags together, TypeScript doesn't necessarily have to downlevel `.js` files.
If you simply want TypeScript to create `.d.ts` files, you can use the `--emitDeclarationOnly` compiler option.

For more details, you can [check out the original pull request](https://github.com/microsoft/TypeScript/pull/32372).

## The `useDefineForClassFields` Flag and The `declare` Property Modifier

Back when TypeScript implemented public class fields, we assumed to the best of our abilities that the following code

```ts
class C {
    foo = 100;
    bar: string;
}
```

would be equivalent to a similar assignment within a constructor body.

```ts
class C {
    constructor() {
        this.foo = 100;
    }
}
```

Unfortunately, while this seemed to be the direction that the proposal moved towards in its earlier days, there is an extremely strong chance that public class fields will be standardized differently.
Instead, the original code sample might need to de-sugar to something closer to the following:

```ts
class C {
    constructor() {
        Object.defineProperty(this, "foo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        Object.defineProperty(this, "bar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
```

While TypeScript 3.7 isn't changing any existing emit by default, we've been rolling out changes incrementally to help users mitigate potential future breakage.
We've provided a new flag called `useDefineForClassFields` to enable this emit mode with some new checking logic.

The two biggest changes are the following:

* Declarations are initialized with `Object.defineProperty`.
* Declarations are *always* initialized to `undefined`, even if they have no initializer.

This can cause quite a bit of fallout for existing code that use inheritance. First of all, `set` accessors from base classes won't get triggered - they'll be completely overwritten.

```ts
class Base {
    set data(value: string) {
        console.log("data changed to " + value);
    }
}

class Derived extends Base {
    // No longer triggers a 'console.log' 
    // when using 'useDefineForClassFields'.
    data = 10;
}
```

Secondly, using class fields to specialize properties from base classes also won't work.

```ts
interface Animal { animalStuff: any }
interface Dog extends Animal { dogStuff: any }

class AnimalHouse {
    resident: Animal;
    constructor(animal: Animal) {
        this.resident = animal;
    }
}

class DogHouse extends AnimalHouse {
    // Initializes 'resident' to 'undefined'
    // after the call to 'super()' when
    // using 'useDefineForClassFields'!
    resident: Dog;

    constructor(dog: Dog) {
        super(dog);
    }
}
```

What these two boil down to is that mixing properties with accessors is going to cause issues, and so will re-declaring properties with no initializers.

To detect the issue around accessors, TypeScript 3.7 will now emit `get`/`set` accessors in `.d.ts` files so that in TypeScript can check for overridden accessors.

Code that's impacted by the class fields change can get around the issue by converting field initializers to assignments in constructor bodies.

```ts
class Base {
    set data(value: string) {
        console.log("data changed to " + value);
    }
}

class Derived extends Base {
    constructor() {
        data = 10;
    }
}
```

To help mitigate the second issue, you can either add an explicit initializer or add a `declare` modifier to indicate that a property should have no emit.

```ts
interface Animal { animalStuff: any }
interface Dog extends Animal { dogStuff: any }

class AnimalHouse {
    resident: Animal;
    constructor(animal: Animal) {
        this.resident = animal;
    }
}

class DogHouse extends AnimalHouse {
    declare resident: Dog;
//  ^^^^^^^
// 'resident' now has a 'declare' modifier,
// and won't produce any output code.

    constructor(dog: Dog) {
        super(dog);
    }
}
```

Currently `useDefineForClassFields` is only available when targeting ES5 and upwards, since `Object.defineProperty` doesn't exist in ES3.
To achieve similar checking for issues, you can create a seperate project that targets ES5 and uses `--noEmit` to avoid a full build.

For more information, you can [take a look at the original pull request for these changes](https://github.com/microsoft/TypeScript/pull/33509).

We strongly encourage users to try the `useDefineForClassFields` flag and report back on our issue tracker or in the comments below.
This includes feedback on difficulty of adopting the flag so we can understand how we can make migration easier.

## Build-Free Editing with Project References

TypeScript's project references provide us with an easy way to break codebases up to give us faster compiles.
Unfortunately, editing a project whose dependencies hadn't been built (or whose output was out of date) meant that the editing experience wouldn't work well.

In TypeScript 3.7, when opening a project with dependencies, TypeScript will automatically use the source `.ts`/`.tsx` files instead.
This means projects using project references will now see an improved editing experience where semantic operations are up-to-date and "just work".
You can disable this behavior with the compiler option `disableSourceOfProjectReferenceRedirect` which may be appropriate when working in very large projects where this change may impact editing performance.

You can [read up more about this change by reading up on its pull request](https://github.com/microsoft/TypeScript/pull/32028).

## Uncalled Function Checks

A common and dangerous error is to forget to invoke a function, especially if the function has zero arguments or is named in a way that implies it might be a property rather than a function.

```ts
interface User {
    isAdministrator(): boolean;
    notify(): void;
    doNotDisturb?(): boolean;
}

// later...

// Broken code, do not use!
function doAdminThing(user: User) {
    // oops!
    if (user.isAdministrator) {
        sudo();
        editTheConfiguration();
    }
    else {
        throw new AccessDeniedError("User is not an admin");
    }
}
```

Here, we forgot to call `isAdministrator`, and the code incorrectly allows non-adminstrator users to edit the configuration!

In TypeScript 3.7, this is identified as a likely error:

```ts
function doAdminThing(user: User) {
    if (user.isAdministrator) {
    //  ~~~~~~~~~~~~~~~~~~~~
    // error! This condition will always return true since the function is always defined.
    //        Did you mean to call it instead?
```

This check is a breaking change, but for that reason the checks are very conservative.
This error is only issued in `if` conditions, and it is not issued on optional properties, if `strictNullChecks` is off, or if the function is later called within the body of the `if`:

```ts
interface User {
    isAdministrator(): boolean;
    notify(): void;
    doNotDisturb?(): boolean;
}

function issueNotification(user: User) {
    if (user.doNotDisturb) {
        // OK, property is optional
    }
    if (user.notify) {
        // OK, called the function
        user.notify();
    }
}
```

If you intended to test the function without calling it, you can correct the definition of it to include `undefined`/`null`, or use `!!` to write something like `if (!!user.isAdministrator)` to indicate that the coercion is intentional.

We owe a big thanks to GitHub user [@jwbay](https://github.com/jwbay) who took the initiative to create a [proof-of-concept](https://github.com/microsoft/TypeScript/pull/32802) and iterated to provide us with with [the current version](https://github.com/microsoft/TypeScript/pull/33178).

## `// @ts-nocheck` in TypeScript Files

TypeScript 3.7 allows us to add `// @ts-nocheck` comments to the top of TypeScript files to disable semantic checks.
Historically this comment was only respected in JavaScript source files in the presence of `checkJs`, but we've expanded support to TypeScript files to make migrations easier for all users.

## Semicolon Formatter Option

TypeScript's built-in formatter now supports semicolon insertion and removal at locations where a trailing semicolon is optional due to JavaScript's automatic semicolon insertion (ASI) rules. The setting is available now in [Visual Studio Code Insiders](https://code.visualstudio.com/insiders/), and will be available in Visual Studio 16.4 Preview 2 in the Tools Options menu.

<img width="833" alt="New semicolon formatter option in VS Code" src="https://user-images.githubusercontent.com/3277153/65913194-10066e80-e395-11e9-8a3a-4f7305c397d5.png">

Choosing a value of "insert" or "remove" also affects the format of auto-imports, extracted types, and other generated code provided by TypeScript services. Leaving the setting on its default value of "ignore" makes generated code match the semicolon preference detected in the current file.

## 3.7 Breaking Changes

### DOM Changes

[Types in `lib.dom.d.ts` have been updated](https://github.com/microsoft/TypeScript/pull/33627).
These changes are largely correctness changes related to nullability, but impact will ultimately depend on your codebase.

### Class Field Mitigations

[As mentioned above](#the-usedefineforclassfields-flag-and-the-declare-property-modifier), TypeScript 3.7 emits `get`/`set` accessors in `.d.ts` files which can cause breaking changes for consumers on older versions of TypeScript like 3.5 and prior.
TypeScript 3.6 users will not be impacted, since that version was future-proofed for this feature.

While not a breakage per se, opting in to the `useDefineForClassFields` flag can cause breakage when:

* overriding an accessor in a derived class with a property declaration
* re-declaring a property declaration with no initializer

To understand the full impact, read [the section above on the `useDefineForClassFields` flag](#the-usedefineforclassfields-flag-and-the-declare-property-modifier).

### Function Truthy Checks

As mentioned above, TypeScript now errors when functions appear to be uncalled within `if` statement conditions.
An error is issued when a function type is checked in `if` conditions unless any of the following apply:

* the checked value comes from an optional property
* `strictNullChecks` is disabled
* the function is later called within the body of the `if`

### Local and Imported Type Declarations Now Conflict

Due to a bug, the following construct was previously allowed in TypeScript:

```ts
// ./someOtherModule.ts
interface SomeType {
    y: string;
}

// ./myModule.ts
import { SomeType } from "./someOtherModule";
export interface SomeType {
    x: number;
}

function fn(arg: SomeType) {
    console.log(arg.x); // Error! 'x' doesn't exist on 'SomeType'
}
```

Here, `SomeType` appears to originate in both the `import` declaration and the local `interface` declaration.
Perhaps surprisingly, inside the module, `SomeType` refers exclusively to the `import`ed definition, and the local declaration `SomeType` is only usable when imported from another file.
This is very confusing and our review of the very small number of cases of code like this in the wild showed that developers usually thought something different was happening.

In TypeScript 3.7, [this is now correctly identified as a duplicate identifier error](https://github.com/microsoft/TypeScript/pull/31231).
The correct fix depends on the original intent of the author and should be addressed on a case-by-case basis.
Usually, the naming conflict is unintentional and the best fix is to rename the imported type.
If the intent was to augment the imported type, a proper module augmentation should be written instead.

### 3.7 API Changes

To enable the recursive type alias patterns described above, the `typeArguments` property has been removed from the `TypeReference` interface. Users should instead use the `getTypeArguments` function on `TypeChecker` instances.
