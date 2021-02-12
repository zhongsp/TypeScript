# TypeScript 3.7

## 可选链（Optional Chaining）

[Playground](http://www.typescriptlang.org/play/#example/optional-chaining)

在我们的 issue 列表上，可选链是 [issue #16](https://github.com/microsoft/TypeScript/issues/16)。感受一下，从那之后 TypeScript 的 issue 列表中新增了 23,000 条 issues。

可选链的核心是，在我们编写代码中，当遇到 `null` 或 `undefined`，TypeScript 可以立即停止解析一部分表达式。
可选链的关键点是一个为 _可选属性访问_ 提供的新的运算符 `?.`。
比如我们可以这样写代码：

```ts
let x = foo?.bar.baz();
```

意思是，当 `foo` 有定义时，执行 `foo.bar.baz()` 的计算；但是当 `foo` 是 `null` 或 `undefined` 时，停止后续的解析，直接返回 `undefined`。

更明确地说，上面的代码和下面的代码等价。

```ts
let x = (foo === null || foo === undefined) ?
    undefined :
    foo.bar.baz();
```

注意，当 `bar` 是 `null` 或 `undefined`，我们的代码访问 `baz` 依然会报错。
同理，当 `baz` 是 `null` 或 `undefined`，在调用时也会报错。
`?.` 只检查它 _左边_ 的值是不是 `null` 或 `undefined`，不检查后续的属性。

你会发现自己可以使用 `?.` 来替换用了 `&&` 的大量空值检查代码。

```ts
// 以前
if (foo && foo.bar && foo.bar.baz) {
    // ...
}

// 以后
if (foo?.bar?.baz) {
    // ...
}
```

注意，`?.` 与 `&&` 的行为略有不同，因为 `&&` 会作用在所有“假”值上（例如，空字符串、`0`、`NaN` 以及 `false`），但 `?.` 是一个仅作用于结构上的特性。
它不会在有效数据（比如 `0` 或空字符串）上进行短路计算。

可选链还包括两个另外的用法。
首先是 _可选元素访问_，表现类似于可选属性访问，但是也允许我们访问非标识符属性（例如：任意字符串、数字和 symbol）：

```ts
/**
 * 如果 arr 是一个数组，返回第一个元素
 * 否则返回 undefined
 */
function tryGetFirstElement<T>(arr?: T[]) {
    return arr?.[0];
    // 等价于：
    //   return (arr === null || arr === undefined) ?
    //       undefined :
    //       arr[0];
}
```

另一个是 _可选调用_，判断条件是当该表达式不是 `null` 或 `undefined`，我们就可以调用它。

```ts
async function makeRequest(url: string, log?: (msg: string) => void) {
    log?.(`Request started at ${new Date().toISOString()}`);
    // 基本等价于：
    //   if (log != null) {
    //       log(`Request started at ${new Date().toISOString()}`);
    //   }

    const result = (await fetch(url)).json();

    log?.(`Request finished at at ${new Date().toISOString()}`);

    return result;
}
```

可选链的“短路计算”行为仅限于属性访问、调用、元素访问——它不会延伸到后续的表达式中。
也就是说，

```ts
let result = foo?.bar / someComputation()
```

可选链不会阻止除法运算或 `someComputation()` 的进行。
上面这段代码实际上等价于：

```ts
let temp = (foo === null || foo === undefined) ?
    undefined :
    foo.bar;

let result = temp / someComputation();
```

当然，这可能会使得 `undefined` 参与了除法运算，导致在 `strictNullChecks` 编译选项下产生报错。

```ts
function barPercentage(foo?: { bar: number }) {
    return foo?.bar / 100;
    //     ~~~~~~~~
    // Error: Object is possibly undefined.
}
```

想了解更多细节，你可以 [检阅完整的草案](https://github.com/tc39/proposal-optional-chaining/) 以及 [查看原始的 PR](https://github.com/microsoft/TypeScript/pull/33294)。

## 空值合并（Nullish Coalescing）

[Playground](http://www.typescriptlang.org/play/#example/nullish-coalescing)

_空值合并运算符_ 是另一个即将到来的 ECMAScript 特性（与可选链一起），我们的团队也参与了 TC39 的的讨论工作。

你可以考虑使用 `??` 运算符来实现：当字段是 `null` 或 `undefined` 时，“回退”到默认值。
比如我们可以这样写代码：

```ts
let x = foo ?? bar();
```

这种新方式的意思是，当 `foo` “存在”时 x 等于 foo；
但假如 `foo` 是 `null` 或 `undefined` ，x 等于 `bar()` 的计算结果。

同样的，上面的代码可以写出等价代码。

```ts
let x = (foo !== null && foo !== undefined) ?
    foo :
    bar();
```

当尝试使用默认值时，`??` 运算符可以代替 `||` 的作用。
例如，下面的代码片段尝试获取上一次储存在 [`localStorage`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage) 中的 volume（如果它已保存）;
但是因为使用了 `||` ，留下一个 bug。

```ts
function initializeAudio() {
    let volume = localStorage.volume || 0.5

    // ...
}
```

如果 `localStorage.volume` 的值是 `0`，这段代码将会把 volume 的值设置为 `0.5`，这是一个意外情况。
而 `??` 避免了将 `0`、`NaN` 和 `""` 视为假值的意外情况。

我们非常感谢社区成员 [Wenlu Wang](https://github.com/Kingwl) 和 [Titian Cernicova Dragomir](https://github.com/dragomirtitian) 实现了这个特性！
想了解更多细节，你可以 [查看他们的 PR](https://github.com/microsoft/TypeScript/pull/32883) 和 [空值合并草案的 Repo](https://github.com/tc39/proposal-nullish-coalescing/)。

## 断言函数

[Playground](http://www.typescriptlang.org/play/#example/assertion-functions)

有一类特定的函数，用于在出现非预期结果时抛出一个错误。
这样的函数叫做“断言”函数（Assertion Function）。
比方说，Node.js 中就有一个名为 `assert` 的断言函数。

```js
assert(someValue === 42);
```

在上面的例子中，如果 `someValue` 不等于 42，那么 `assert` 就会抛出一个 `AssertionError` 错误。

在 JavaScript 中，断言经常被用于防止不正确传参。
举个例子：

```js
function multiply(x, y) {
    assert(typeof x === "number");
    assert(typeof y === "number");

    return x * y;
}
```

很遗憾，在 TypeScript 中，这些检查没办法正确编码。
对于类型宽松的代码，意味着 TypeScript 检查得更少，而对于更加规范的代码，通常迫使使用者添加类型断言。

```ts
function yell(str) {
    assert(typeof str === "string");

    return str.toUppercase();
    // 糟了！我们拼错了 'toUpperCase'。
    // 如果 TypeScript 依然能检查出来就太棒了！
}
```

有一个替代的写法，可以让 TypeScript 能够分析出问题，不过这样并不方便。

```ts
function yell(str) {
    if (typeof str !== "string") {
        throw new TypeError("str should have been a string.")
    }
    // 发现错误！
    return str.toUppercase();
}
```

归根结底，TypeScript 的目标是以最小的改动为现存的 JavaScript 结构添加上类型声明。
因此，TypeScript 3.7 引入了一个称为“断言签名”的新概念，用于模拟这些断言函数。

第一种断言签名模拟了 Node 中 `assert` 函数的功能。
它确保在断言的范围内，无论什么判断条件都为必须真。

```ts
function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new AssertionError(msg)
    }
}
```

`asserts condition` 表示：如果 `assert` 函数成功返回，则传入的 `condition` 参数必须为真（否则它应该抛出一个 Error）。
这意味着对于同作用域中的后续代码，条件必须为真。
回到例子上，用这个断言函数意味着我们 _能够_ 捕获之前 `yell` 示例中的错误。

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

另一种类型的断言签名不通过检查条件语句实现，而是在 TypeScript 里显式指定某个变量或属性具有不同的类型。

```ts
function assertIsString(val: any): asserts val is string {
    if (typeof val !== "string") {
        throw new AssertionError("Not a string!");
    }
}
```

这里的 `asserts val is string` 保证了在 `assertIsString` 调用之后，传入的任何变量都有可以被视为是 `string` 类型的。

```ts
function yell(str: any) {
    assertIsString(str);

    // 现在 TypeScript 知道 'str' 是一个 'string'。

    return str.toUppercase();
    //         ~~~~~~~~~~~
    // error: Property 'toUppercase' does not exist on type 'string'.
    //        Did you mean 'toUpperCase'?
}
```

这些断言方法签名类似于类型谓词（type predicate）签名：

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

就像类型谓词签名一样，这些断言签名具有清晰的表现力。
我们可以用它们表达一些非常复杂的想法。

```ts
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
    if (val === undefined || val === null) {
        throw new AssertionError(
            `Expected 'val' to be defined, but received ${val}`
        );
    }
}
```

想了解更多断言签名的细节，可以 [查看原始的 PR](https://github.com/microsoft/TypeScript/pull/32695)。

## 更好地支持返回 `never` 的函数

作为断言签名实现的一部分，TypeScript 需要编码更多关于调用位置和调用函数的细节。
这给了我们机会扩展对另一类函数的支持——返回 `never` 的函数。

返回 `never` 的函数，即永远不会返回的函数。
它表明抛出了异常、触发了停止错误条件、或程序退出的情况。
例如，[`@types/node` 中的 `process.exit(...)`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/5299d372a220584e75a031c13b3d555607af13f8/types/node/globals.d.ts#l874) 就被指定为返回 `never`。

为了确保函数永远不会潜在地返回 `undefined`、或者从所有代码路径中有效地返回，TypeScript 需要借助一些语法标志——函数结尾处的 `return` 或 `throw`。
这样，使用者就会发现自己的代码在“返回”一个停机函数。

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

现在，这些返回 `never` 的函数被调用时，TypeScript 能识别出它们将影响代码执行流程，同时说明原因。

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

你可以和在断言函数的 [同一个 PR 中查看更多细节](https://github.com/microsoft/TypeScript/pull/32695)。

## （更加）递归的类型别名

[Playground](http://www.typescriptlang.org/play/#example/recursive-type-references)

类型别名在“递归”引用方面一直存在局限性。
原因是，类型别名必须能用它代表的东西来代替自己。
这在某些情况下是不可能的，因此编译器会拒绝某些递归别名，比如下面这个：

```ts
type Foo = Foo;
```

这是一个合理的限制，因为任何对 `Foo` 的使用都可以替换为 `Foo`，同时这个 `Foo` 能够替换为 `Foo`，而这个 `Foo` 应该……（产生了无限循环）希望你理解到这个意思了！
到最后，没有类型可以用来代替 `Foo`。

[其他语言也是这么处理类型别名的](https://en.wikipedia.org/w/index.php?title=Recursive_data_type&oldid=913091335#in_type_synonyms)，但是它确实会产生一些令人困惑的情形，影响类型别名的使用。
例如，在 TypeScript 3.6 和更低的版本中，下面的代码会报错：

```ts
type ValueOrArray<T> = T | Array<ValueOrArray<T>>;
//   ~~~~~~~~~~~~
// error: Type alias 'ValueOrArray' circularly references itself.
```

这很令人困惑，因为使用者总是可以用接口来编写具有相同作用的代码，那么从技术上讲这没什么问题。

```ts
type ValueOrArray<T> = T | ArrayOfValueOrArray<T>;

interface ArrayOfValueOrArray<T> extends Array<ValueOrArray<T>> {}
```

因为接口（以及其他对象 type）引入了一个间接的层级，并且它们的完整结构不需要立即建立，所以 TypeScript 可以处理这种结构。

但是，对于使用者而言，引入接口的方案并不直观。
并且，用了 `Array` 的初始版 `ValueOrArray` 没什么原则性问题。
如果编译器多一点“惰性”，并且只按需计算 `Array` 的类型参数，那么 TypeScript 就可以正确地表示出这些了。

这正是 TypeScript 3.7 引入的。
在类型别名的“顶层”，TypeScript 将推迟解析类型参数以便支持这些模式。

这意味着，用于表示 JSON 的以下代码……

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

终于可以重写成不需要借助 interface 的形式。

```ts
type Json =
    | string
    | number
    | boolean
    | null
    | { [property: string]: Json }
    | Json[];
```

这个新的机制让我们在元组中，同样也可以递归地使用类型别名。
下面的 TypeScript 代码在以前会报错，但现在是合法的：

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

想了解更多细节，你可以 [查看原始的 PR](https://github.com/microsoft/TypeScript/pull/33050)。

## `--declaration` 和 `--allowJs`

`--declaration` 选项允许我们从 TypeScript 源文件（诸如 `.ts` 和 `.tsx` 文件）生成 `.d.ts` 文件（声明文件）。
`.d.ts` 文件的重要性有几个方面：

首先，它们使得 TypeScript 能够对外部项目进行类型检查，同时避免重复检查其源代码。
另一方面，它们使得 TypeScript 能够与现存的 JavaScript 库相互配合，即使这些库构建时并未使用 TypeScript。
最后，还有一个通常被忽略的好处：在使用支持 TypeScript 的编辑器时，TypeScript _和_ JavaScript 使用者都可以从这些文件中受益，例如更高级的自动完成。

不幸的是，`--declaration` 不能与 `--allowJs` 选项一起使用，`--allowJs` 选项允许混合使用 TypeScript 和 JavaScript 文件。
这是一个令人沮丧的限制，因为它意味着使用者在迁移代码库时无法使用 `--declaration` 选项，即使代码包含了 JSDoc 注释。
TypeScript 3.7 对此进行了改进，允许这两个选项一起使用！

这个功能最大的影响可能比较微妙：在 TypeScript 3.7 中，编写带有 JSDoc 注释的 JavaScript 库，也能帮助 TypeScript 的使用者。

它的实现原理是，在启用 `allowJs` 时，TypeScript 会尽可能地分析并理解常见的 JavaScript 模式；然而，用 JavaScript 表达的某些模式看起来不一定像它们在 TypeScript 中的等效形式。
启用 `declaration` 选项后，TypeScript 会尽力识别 JSDoc 注释和 CommonJS 形式的模块输出，并转换为有效的类型声明输出到 `.d.ts` 文件上。

比如下面这个代码片段

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

将会生成如下 `.d.ts` 文件

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

除了基本的带有 `@param` 标记的函数，也支持其他情形, 请看下面这个例子：

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

会生成如下 `.d.ts` 文件：

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

注意，当同时启用这两个选项时，TypeScript 不一定必须得编译成 `.js` 文件。
如果只是简单的想让 TypeScript 创建 `.d.ts` 文件，你可以启用 `--emitDeclarationOnly` 编译选项。

想了解更多细节，你可以 [查看原始的 PR](https://github.com/microsoft/TypeScript/pull/32372)。

## `useDefineForClassFields` 编译选项和 `declare` 属性修饰符

当在 TypeScript 中写类公共字段时，我们尽力保证以下代码

```ts
class C {
    foo = 100;
    bar: string;
}
```

等价于构造函数中的相似语句

```ts
class C {
    constructor() {
        this.foo = 100;
    }
}
```

不幸的是，虽然这符合该提案早期的发展方向，但类公共字段极有可能以不同的方式进行标准化。
所以取而代之的，原始代码示例可能需要进行脱糖处理，变成类似下面的代码：

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

当然，TypeScript 3.7 在默认情况下的编译结果与之前版本没有变化，我们增量地发布改动，以便帮助使用者减少未来潜在的破坏性变更。
我们提供了一个新的编译选项 `useDefineForClassFields`，根据一些新的检查逻辑使用上面这种编译模式。

最大的两个改变如下：

- 声明通过 `Object.defineProperty` 完成。
- 声明 _总是_ 被初始化为 `undefined`，即使原有代码中没有显式的初始值。

对于现存的含有继承的代码，这可能会造成一些问题。首先，基类的 `set` 访问器不再被触发——它们将被完全覆写。

```ts
class Base {
    set data(value: string) {
        console.log("data changed to " + value);
    }
}

class Derived extends Base {
    // 当启用 'useDefineForClassFields' 时
    // 不再触发 'console.log'
    data = 10;
}
```

其次，基类中的属性设定也将不起作用。

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
    // 当启用 'useDefineForClassFields' 时
    // 调用 'super()' 后
    // 'resident' 只会被初始化成 'undefined'！
    resident: Dog;

    constructor(dog: Dog) {
        super(dog);
    }
}
```

这两个问题归结为，继承时混合覆写属性与访问器，以及属性不带初始值的重新声明。

为了检测这个访问器的问题，TypeScript 3.7 现在可以在 `.d.ts` 文件中编译出 `get`/`set`，这样 TypeScript 就能检查出访问器覆写的情况。

对于改变类字段的代码，将字段初始化写成构造函数内的语句，就可以解决此问题。

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

而解决第二个问题，你可以显式地提供一个初始值，或添加一个`declare` 修饰符来表示这个属性不要被编译。

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

目前，只有当编译目标是 ES5 及以上时 `useDefineForClassFields` 才可用，因为 ES3 中不支持 `Object.defineProperty`。
要检查类似的问题，你可以创建一个分离的项目，设定编译目标为 ES5 并使用 `--noEmit` 来避免完全构建。

想了解更多细节，你可以 [去原始的 PR 查看这些改动](https://github.com/microsoft/TypeScript/pull/33509)。

我们强烈建议使用者尝试 `useDefineForClassFields`，并在 issues 或下面的评论区域中提供反馈。
应该碰到编译选项在使用难度上的反馈，这样我们就能够了解如何使迁移变得更容易。

## 利用项目引用实现无构建编辑

TypeScript 的项目引用功能，为我们提供了一种简单的方法来分解代码库，从而使编译速度更快。
遗憾的是，当我们编辑一个依赖未曾构建（或者构建结果过时）的项目时，体验不好。

在 TypeScript 3.7 中，当打开一个带有依赖的项目时，TypeScript 将自动切换为使用依赖中的 `.ts`/`.tsx` 源码文件。
这意味着在带有外部引用的项目中，代码的修改会即时同步和生效，编码体验会得到提升。
你也可以适当地打开编译器选项 `disableSourceOfProjectReferenceRedirect` 来禁用这个引用的功能，因为在超大型项目中这个功能可能会影响性能。

你可以 [阅读这个 PR 来了解这个改动的更多细节](https://github.com/microsoft/TypeScript/pull/32028)。

## 检查未调用的函数

一个常见且危险的错误是：忘记调用一个函数，特别是当该函数不需要参数，或者它的命名容易被误认为是一个属性而不是函数时。

```ts
interface User {
    isAdministrator(): boolean;
    notify(): void;
    doNotDisturb?(): boolean;
}

// 之后…

// 有问题的代码，别用！
function doAdminThing(user: User) {
    // 糟了！
    if (user.isAdministrator) {
        sudo();
        editTheConfiguration();
    }
    else {
        throw new AccessDeniedError("User is not an admin");
    }
}
```

在这段代码中，我们忘了调用 `isAdministrator`，导致该代码错误地允许非管理员用户修改配置！

在 TypeScript 3.7 中，它会被识别成一个潜在的错误：

```ts
function doAdminThing(user: User) {
    if (user.isAdministrator) {
    //  ~~~~~~~~~~~~~~~~~~~~
    // error! This condition will always return true since the function is always defined.
    //        Did you mean to call it instead?
```

这个检查功能是一个破坏性变更，基于这个因素，检查会非常保守。
因此对这类错误的提示仅限于 `if` 条件语句中。当问题函数是可选属性、或未开启 `strictNullChecks` 选项、或该函数在 `if` 的代码块中有被调用，在这些情况下不会被视为错误：

```ts
interface User {
    isAdministrator(): boolean;
    notify(): void;
    doNotDisturb?(): boolean;
}

function issueNotification(user: User) {
    if (user.doNotDisturb) {
        // OK，属性是可选的
    }
    if (user.notify) {
        // OK，调用了该函数
        user.notify();
    }
}
```

如果你打算对该函数进行测试但不调用它，你可以修改它的类型定义，让它可能是 `undefined`/`null`，或使用 `!!` 来编写类似 `if (!!user.isAdministrator)` 的代码，表示代码逻辑确实是这样的。

我们非常感谢社区成员 [@jwbay](https://github.com/jwbay) 提出了 [这个问题的概念](https://github.com/microsoft/TypeScript/pull/32802) 并持续跟进实现了 [这个需求的当前版本](https://github.com/microsoft/TypeScript/pull/33178)。

## TypeScript 文件中的 `// @ts-nocheck`

TypeScript 3.7 允许我们在 TypeScript 文件的顶部添加一行 `// @ts-nocheck` 注释来关闭语义检查。
这个注释原本只在 `checkJs` 选项启用时的 JavaScript 源文件中有效，但我们扩展了它，让它能够支持 TypeScript 文件，这样所有使用者在迁移的时候会更方便。

## 分号格式化选项

JavaScript 有一个自动分号插入（ASI，automatic semicolon insertion）规则，TypeScript 内置的格式化程序现在能支持在可选的尾分号位置插入或删除分号。该设置现在在 [Visual Studio Code Insiders](https://code.visualstudio.com/insiders/) ，以及 Visual Studio 16.4 Preview 2 中的“工具选项”菜单中可用。

<img width="833" alt="New semicolon formatter option in VS Code" src="https://user-images.githubusercontent.com/3277153/65913194-10066e80-e395-11e9-8a3a-4f7305c397d5.png">

将值设定为 “insert” 或 “remove” 同时也会影响自动导入、类型提取、以及其他 TypeScript 服务提供的自动生成代码的格式。将设置保留为默认值 “ignore” 可以使生成代码的分号自动配置匹配当前文件的风格。

## 3.7 的破坏性变更

### DOM 变更

[`lib.dom.d.ts` 中的类型声明已更新](https://github.com/microsoft/TypeScript/pull/33627)。
这些变更大部分是与空值检查有关的检测准确性变更，最终的影响取决于你的代码库。

### 类字段处理

[正如上文提到的](#usedefineforclassfields-%e7%bc%96%e8%af%91%e9%80%89%e9%a1%b9%e5%92%8c-declare-%e5%b1%9e%e6%80%a7%e4%bf%ae%e9%a5%b0%e7%ac%a6)，TypeScript 3.7 现在能够在 `.d.ts` 文件中编译出 `get`/`set`，这可能对 3.5 和更低版本的 TypeScript 使用者来说是破坏性变更。
TypeScript 3.6 的使用者不会受影响，因为该版本对这个功能已经进行了预兼容。

`useDefineForClassFields` 选项虽然自身没有破坏性变更，但不排除以下情形：

- 在派生类中用属性声明覆盖了基类的访问器
- 覆盖声明属性，但是没有初始值

要了解全部的影响，请查看 [上面关于 `useDefineForClassFields` 的章节](#usedefineforclassfields-%e7%bc%96%e8%af%91%e9%80%89%e9%a1%b9%e5%92%8c-declare-%e5%b1%9e%e6%80%a7%e4%bf%ae%e9%a5%b0%e7%ac%a6)。

### 函数真值检查

正如上文提到的，现在当函数在 `if` 条件语句中未被调用时 TypeScript 会报错。
当 `if` 条件语句中判断的是函数时将会报错，除非符合以下情形：

- 该函数是可选属性
- 未开启 `strictNullChecks` 选项
- 该函数在 `if` 的代码块中有被调用

### 本地和导入的类型声明现在会产生冲突

TypeScript 之前有一个 bug，导致允许以下代码结构：

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

这里，`SomeType` 同时来源于 `import` 声明和本地 `interface` 声明。
出人意料的是，在模块内部，`SomeType` 只会指向 `import` 的定义，而本地声明的 `SomeType` 仅在另一个文件的导入中起效。
这很令人困惑，我们对类似的个例进行的调查表明，广大开发者通常理解的情况不一样。

在 TypeScript 3.7 中，[这个问题中的重复声明现在可以被正确地识别为一个错误](https://github.com/microsoft/TypeScript/pull/31231)。
合理的修复方案取决于开发者的原始意图，并应该逐案解决。
通常，命名冲突不是故意的，最好的办法是重命名导入的那个类型。
如果是要扩展导入的类型，则可以编写模块扩展（module augmentation）来代替。

### 3.7 API 变化

为了实现上文中提到的递归的类型别名模式，`TypeReference` 接口已经移除了 `typeArguments` 属性。开发者应该在 `TypeChecker` 实例上使用 `getTypeArguments` 函数来代替。
