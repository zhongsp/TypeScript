# TypeScript 5.2

## `using` 声明与显式资源管理

TypeScript 5.2 支持了 ECMAScript 即将引入的新功能 [显式资源管理](https://github.com/tc39/proposal-explicit-resource-management)。
让我们探索一下引入该功能的一些动机，并理解这个功能给我们带来了什么。

在创建对象之后需要进行某种形式的“清理”是很常见的。例如，您可能需要关闭网络连接，删除临时文件，或者只是释放一些内存。
让我们来想象一个函数，它创建一个临时文件，对它进行多种操作的读写，然后关闭并删除它。

```ts
import * as fs from 'fs';

export function doSomeWork() {
  const path = '.some_temp_file';
  const file = fs.openSync(path, 'w+');

  // use file...

  // Close the file and delete it.
  fs.closeSync(file);
  fs.unlinkSync(path);
}
```

这看起来不错，但如果需要提前退出会发生什么？

```ts
export function doSomeWork() {
  const path = '.some_temp_file';
  const file = fs.openSync(path, 'w+');

  // use file...
  if (someCondition()) {
    // do some more work...

    // Close the file and delete it.
    fs.closeSync(file);
    fs.unlinkSync(path);
    return;
  }

  // Close the file and delete it.
  fs.closeSync(file);
  fs.unlinkSync(path);
}
```

我们可以看到存在重复的容易忘记的清理代码。
同时无法保证在代码抛出异常时，关闭和删除文件会被执行。
解决办法是用 `try`/`finally` 语句包裹整段代码。

```ts
export function doSomeWork() {
  const path = '.some_temp_file';
  const file = fs.openSync(path, 'w+');

  try {
    // use file...

    if (someCondition()) {
      // do some more work...
      return;
    }
  } finally {
    // Close the file and delete it.
    fs.closeSync(file);
    fs.unlinkSync(path);
  }
}
```

虽说这样写更加健壮，但是也为我们的代码增加了一些“噪音”。
如果我们在 `finally` 块中开始添加更多的清理逻辑，还可能遇到其他的自食其果的问题。
例如，异常可能会阻止其他资源的释放。
这些就是[显式资源管理](https://github.com/tc39/proposal-explicit-resource-management)想要解决的问题。
该提案的关键思想是将资源释放（我们试图处理的清理工作）作为 JavaScript 中的一等概念来支持。

首先，增加了一个新的 `symbol` 名字为 `Symbol.dispose`，然后可以定义包含 `Symbol.dispose` 方法的对象。
为了方便，TypeScript 为此定义了一个新的全局类型 `Disposable`。

```ts
class TempFile implements Disposable {
  #path: string;
  #handle: number;

  constructor(path: string) {
    this.#path = path;
    this.#handle = fs.openSync(path, 'w+');
  }

  // other methods

  [Symbol.dispose]() {
    // Close the file and delete it.
    fs.closeSync(this.#handle);
    fs.unlinkSync(this.#path);
  }
}
```

之后可以调用这些方法

```ts
export function doSomeWork() {
  const file = new TempFile('.some_temp_file');

  try {
    // ...
  } finally {
    file[Symbol.dispose]();
  }
}
```

将清理逻辑移动到 `TempFile` 本身没有带来多大的价值；仅仅是将清理的代码从 `finally` 提取到方法而已，你总是可以这样做。
但如果该方法有一个众所周知的名字那么 JavaScript 就可以基于此构造其它功能。

这将引出该功能的第一个亮点：`using` 声明！
`using` 是一个新的关键字，支持声明新的不可变绑定，像 `const` 一样。
不同点是 `using` 声明的变量在即将离开其作用域时，它的 `Symbol.dispose` 方法会被调用！

因此，我们可以这样编写代码：

```ts
export function doSomeWork() {
    using file = new TempFile(".some_temp_file");

    // use file...

    if (someCondition()) {
        // do some more work...
        return;
    }
}
```

看一下 - 没有 `try` / `finally` 代码块！至少，我们没有见到。
从功能上讲，这些正是 `using` 声明要帮我们做的事，但我们不必自己处理它。

你可能熟悉 C# 中的 `using`， Python 中的 `with`，Java 中的 `try-with-resource` 声明。
这些与 JavaScript 中的 `using` 关键字是相似的，都提供了一种明确的方式来“清理”对象，在它们即将离开作用域时。

`using` 声明在其所在的作用域的最后才执行清理工作，或在“提前返回”（如 `return` 语句或 `throw` 错误）之前执行清理工作。
释放的顺序是先入后出，像栈一样。

```ts
function loggy(id: string): Disposable {
    console.log(`Creating ${id}`);

    return {
        [Symbol.dispose]() {
            console.log(`Disposing ${id}`);
        }
    }
}

function func() {
    using a = loggy("a");
    using b = loggy("b");
    {
        using c = loggy("c");
        using d = loggy("d");
    }
    using e = loggy("e");
    return;

    // Unreachable.
    // Never created, never disposed.
    using f = loggy("f");
}

func();
// Creating a
// Creating b
// Creating c
// Creating d
// Disposing d
// Disposing c
// Creating e
// Disposing e
// Disposing b
// Disposing a
```

`using` 声明对异常具有适应性；如果抛出了一个错误，那么在资源释放后会重新抛出错误。
另一方面，一个函数体可能正常执行，但是 `Symbol.dispose` 可能抛出异常。
这种情况下，异常会被重新抛出。

但如果释放之前的逻辑以及释放时的逻辑都抛出了异常会发生什么？
为处理这类情况引入了一个新的类型 `SuppressedError`，它是 `Error` 类型的子类型。
`SuppressedError` 类型的 `suppressed` 属性保存了上一个错误，同时 `error` 属性保存了最后抛出的错误。

```ts
class ErrorA extends Error {
    name = "ErrorA";
}
class ErrorB extends Error {
    name = "ErrorB";
}

function throwy(id: string) {
    return {
        [Symbol.dispose]() {
            throw new ErrorA(`Error from ${id}`);
        }
    };
}

function func() {
    using a = throwy("a");
    throw new ErrorB("oops!")
}

try {
    func();
}
catch (e: any) {
    console.log(e.name); // SuppressedError
    console.log(e.message); // An error was suppressed during disposal.

    console.log(e.error.name); // ErrorA
    console.log(e.error.message); // Error from a

    console.log(e.suppressed.name); // ErrorB
    console.log(e.suppressed.message); // oops!
}
```

你可能已经注意到了，在这些例子中使用的都是同步方法。
然而，很多资源释放的场景涉及到*异步*操作，我们需要等待它们完成才能进行后续的操作。

这就是为什么现在还有一个新的 `Symbol.asyncDispose`，它带来了另一个亮点 -
`await using` 声明。
它与 `using` 声明相似，但关键是它查找需要 `await` 的资源。
它使用名为 `Symbol.asyncDispose` 的方法，尽管它们也可以操作在任何具有 `Symbol.dispose` 的对象上操作。
为了方便，TypeScript 引入了全局类型 `AsyncDisposable` 用来表示拥有异步 `dispose` 方法的对象。

```ts
async function doWork() {
    // Do fake work for half a second.
    await new Promise(resolve => setTimeout(resolve, 500));
}

function loggy(id: string): AsyncDisposable {
    console.log(`Constructing ${id}`);
    return {
        async [Symbol.asyncDispose]() {
            console.log(`Disposing (async) ${id}`);
            await doWork();
        },
    }
}

async function func() {
    await using a = loggy("a");
    await using b = loggy("b");
    {
        await using c = loggy("c");
        await using d = loggy("d");
    }
    await using e = loggy("e");
    return;

    // Unreachable.
    // Never created, never disposed.
    await using f = loggy("f");
}

func();
// Constructing a
// Constructing b
// Constructing c
// Constructing d
// Disposing (async) d
// Disposing (async) c
// Constructing e
// Disposing (async) e
// Disposing (async) b
// Disposing (async) a
```

如果你期望其他人能够一致地执行清理逻辑，通过使用 `Disposable` 和 `AsyncDisposable` 来定义类型可以使你的代码更易于使用。
实际上，存在许多现有的类型，它们拥有 `dispose()` 或 `close()` 方法。
例如，Visual Studio Code APIs 定义了 [自己的 `Disposable` 接口](https://code.visualstudio.com/api/references/vscode-api#Disposable)。
在浏览器和诸如 Node.js、Deno 和 Bun 等运行时中，API 也可以选择对已经具有清理方法（如文件句柄、连接等）的对象使用 `Symbol.dispose` 和 `Symbol.asyncDispose`。

现在也许对于库来说这听起来很不错，但对于你的场景来说可能有些过于复杂。如果你需要进行大量的临时清理，创建一个新类型可能会引入过度抽象和关于最佳实践的问题。
例如，再次以我们的 `TempFile` 示例为例。

```ts
class TempFile implements Disposable {
    #path: string;
    #handle: number;

    constructor(path: string) {
        this.#path = path;
        this.#handle = fs.openSync(path, "w+");
    }

    // other methods

    [Symbol.dispose]() {
        // Close the file and delete it.
        fs.closeSync(this.#handle);
        fs.unlinkSync(this.#path);
    }
}

export function doSomeWork() {
    using file = new TempFile(".some_temp_file");

    // use file...

    if (someCondition()) {
        // do some more work...
        return;
    }
}
```

我们只是想记住调用两个函数，但这是最好的写法吗？
我们应该在构造函数中调用 `openSync`，创建一个 `open()` 方法，还是自己传递句柄？
我们是否应该为每个需要执行的操作公开一个方法，还是只将属性公开？

这就引出了这个特性的最后亮点：`DisposableStack` 和 `AsyncDisposableStack`。
这些对象非常适用于一次性的清理工作，以及任意数量的清理工作。
`DisposableStack` 是一个对象，它具有多个方法用于跟踪 `Disposable` 对象，并且可以接受函数来执行任意的清理工作。
我们还可以将它们分配给 `using` 变量，因为它们也是 `Disposable`！所以下面是我们可以编写原始示例的方式。

```ts
function doSomeWork() {
    const path = ".some_temp_file";
    const file = fs.openSync(path, "w+");

    using cleanup = new DisposableStack();
    cleanup.defer(() => {
        fs.closeSync(file);
        fs.unlinkSync(path);
    });

    // use file...

    if (someCondition()) {
        // do some more work...
        return;
    }

    // ...
}
```

在这里，`defer()` 方法只需要一个回调函数，该回调函数将在 `cleanup` 释放后运行。
通常，在创建资源后应立即调用 `defer`（以及其他 `DisposableStack` 方法，如 `use` 和 `adopt`）。
顾名思义，`DisposableStack` 以类似堆栈的方式处理它所跟踪的所有内容，按照先进后出的顺序进行处理，因此在创建值后立即进行 `defer` 处理有助于避免奇怪的依赖问题。
`AsyncDisposableStack` 的工作原理类似，但可以跟踪异步函数和 `AsyncDisposable`，并且本身也是 `AsyncDisposable`。

在许多方面，`defer` 方法与 Go、Swift、Zig、Odin 等语言中的 `defer` 关键字类似，因此其使用约定应该相似。

由于这个特性非常新，大多数运行时环境不会原生支持它。要使用它，您需要为以下内容提供运行时的 polyfills：

- Symbol.dispose
- Symbol.asyncDispose
- DisposableStack
- AsyncDisposableStack
- SuppressedError

然而，如果您只对使用 `using` 和 `await using` 感兴趣，您只需要为内置的 `symbol` 提供 polyfill，通常以下简单的方法可适用于大多数情况：

```ts
Symbol.dispose ??= Symbol('Symbol.dispose');
Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');
```

你还需要将编译 `target` 设置为 `es2022` 或以下，配置 `lib` 为 `"esnext"` 或 `"esnext.disposable"`。

```ts
{
    "compilerOptions": {
        "target": "es2022",
        "lib": ["es2022", "esnext.disposable", "dom"]
    }
}
```

更多详情请参考[PR](https://github.com/microsoft/TypeScript/pull/54505)。

## Decorator Metadata

TypeScript 5.2 实现了 ECMAScript 即将引入的新功能 [Decorator Metadata](https://github.com/tc39/proposal-decorator-metadata)。

这个功能的关键思想是使装饰器能够轻松地在它们所使用或嵌套的任何类上创建和使用元数据。

在任意的装饰器函数上，现在可以访问上下文对象的 `metadata` 属性。
`metadata` 属性是一个普通的对象。
由于 JavaScript 允许我们对其任意添加属性，它可以被用作可由每个装饰器更新的字典。
或者，由于每个 `metadata` 对象对于每个被装饰的部分来讲是等同的，它可以被用作 `Map` 的键。
当类的装饰器运行时，这个对象可以通过 `Symbol.metadata` 访问。

```ts
interface Context {
  name: string;
  metadata: Record;
}

function setMetadata(_target: any, context: Context) {
  context.metadata[context.name] = true;
}

class SomeClass {
  @setMetadata
  foo = 123;

  @setMetadata
  accessor bar = 'hello!';

  @setMetadata
  baz() {}
}

const ourMetadata = SomeClass[Symbol.metadata];

console.log(JSON.stringify(ourMetadata));
// { "bar": true, "baz": true, "foo": true }
```

它可以被应用在不同的场景中。
`Metadata` 信息可以附加在调试、序列化或者依赖注入的场景中。
由于每个被装饰的类都会生成 `metadata` 对象，框架可以选择用它们做为 `key` 来访问 `Map` 或 `WeakMap`，或者跟踪它的属性。

例如，我们想通过装饰器来跟踪哪些属性和存取器是可以通过 `Json.stringify` 序列化的：

```ts
import { serialize, jsonify } from './serializer';

class Person {
  firstName: string;
  lastName: string;

  @serialize
  age: number;

  @serialize
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    return jsonify(this);
  }

  constructor(firstName: string, lastName: string, age: number) {
    // ...
  }
}
```

此处的意图是，只有 `age` 和 `fullName` 可以被序列化，因为它们应用了 `@serialize` 装饰器。
我们定义了 `toJSON` 方法来做这件事，但它只是调用了 `jsonfy`，它会使用 `@serialize` 创建的 `metadata`。

下面是 `./serialize.ts` 可能的定义：

```ts
const serializables = Symbol();

type Context =
  | ClassAccessorDecoratorContext
  | ClassGetterDecoratorContext
  | ClassFieldDecoratorContext;

export function serialize(_target: any, context: Context): void {
  if (context.static || context.private) {
    throw new Error('Can only serialize public instance members.');
  }
  if (typeof context.name === 'symbol') {
    throw new Error('Cannot serialize symbol-named properties.');
  }

  const propNames = ((context.metadata[serializables] as
    | string[]
    | undefined) ??= []);
  propNames.push(context.name);
}

export function jsonify(instance: object): string {
  const metadata = instance.constructor[Symbol.metadata];
  const propNames = metadata?.[serializables] as string[] | undefined;
  if (!propNames) {
    throw new Error('No members marked with @serialize.');
  }

  const pairStrings = propNames.map(key => {
    const strKey = JSON.stringify(key);
    const strValue = JSON.stringify((instance as any)[key]);
    return `${strKey}: ${strValue}`;
  });

  return `{ ${pairStrings.join(', ')} }`;
}
```

该方法有一个局部 `symbol` 名字为 `serializables` 用于保存和获取使用 `@serializable` 标记的属性。
当每次调用 `@serializable` 时，它都会在 `metadata` 上保存这些属性名。
当 `jsonfy` 被调用时，从 `metadata` 上获取属性列表，之后从实例上获取实际值，最后序列化名和值。

使用 `symbol` 意味着该数据可以被他人访问。
另一选择是使用 `WeakMap` 并用该 `metadata` 对象做为键。
这样可以保持数据的私密性，并且在这种情况下使用更少的类型断言，但其他方面类似。

```ts
const serializables = new WeakMap();

type Context =
  | ClassAccessorDecoratorContext
  | ClassGetterDecoratorContext
  | ClassFieldDecoratorContext;

export function serialize(_target: any, context: Context): void {
  if (context.static || context.private) {
    throw new Error('Can only serialize public instance members.');
  }
  if (typeof context.name !== 'string') {
    throw new Error('Can only serialize string properties.');
  }

  let propNames = serializables.get(context.metadata);
  if (propNames === undefined) {
    serializables.set(context.metadata, (propNames = []));
  }
  propNames.push(context.name);
}

export function jsonify(instance: object): string {
  const metadata = instance.constructor[Symbol.metadata];
  const propNames = metadata && serializables.get(metadata);
  if (!propNames) {
    throw new Error('No members marked with @serialize.');
  }
  const pairStrings = propNames.map(key => {
    const strKey = JSON.stringify(key);
    const strValue = JSON.stringify((instance as any)[key]);
    return `${strKey}: ${strValue}`;
  });

  return `{ ${pairStrings.join(', ')} }`;
}
```

注意，这里的实现没有考虑子类和继承。
留给读者作为练习。

由于该功能比较新，大多数运行时都没实现它。
如果想要使用，则需要使用 `Symbol.metadata` 的 `polyfill`。
例如像下面这样就可以适用大部分场景：

```ts
Symbol.metadata ??= Symbol('Symbol.metadata');
```

你还需要将编译 `target` 设为 `es2022` 或以下，配置 `lib` 为 `"esnext"` 或者 `"esnext.decorators"`。

```
{
    "compilerOptions": {
        "target": "es2022",
        "lib": ["es2022", "esnext.decorators", "dom"]
    }
}
```

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk)的[贡献](https://github.com/microsoft/TypeScript/pull/54657)。

## 命名的和匿名的元组元素

元组类型已经支持了为每个元素定义可选的标签和命名。

```ts
type Pair = [first: T, second: T];
```

这些标签不改变功能 - 它们只是用于增强可读性和工具支持。

然而，TypeScript 之前有个限制是不允许混用有标签和无标签的元素。
换句话说，要么所有元素都没有标签，要么所有元素都有标签。

```ts
// ✅ fine - no labels
type Pair1 = [T, T];

// ✅ fine - all fully labeled
type Pair2 = [first: T, second: T];

// ❌ previously an error
type Pair3 = [first: T, T];
//                         ~
// Tuple members must all have names
// or all not have names.
```

如果是剩余元素就比较烦人了，我们必须要添加标签 `rest` 或者 `tail`。

```ts
// ❌ previously an error
type TwoOrMore_A = [first: T, second: T, ...T[]];
//                                          ~~~~~~
// Tuple members must all have names
// or all not have names.

// ✅
type TwoOrMore_B = [first: T, second: T, rest: ...T[]];
```

这也意味着这个限制必须在类型系统内部进行强制执行，这意味着 TypeScript 将失去标签。

```ts
type HasLabels = [a: string, b: string];
type HasNoLabels = [number, number];
type Merged = [...HasNoLabels, ...HasLabels];
//   ^ [number, number, string, string]
//
//     'a' and 'b' were lost in 'Merged'
```

在 TypeScript 5.2 中，对元组标签的全有或全无限制已经被取消。
而且现在可以在展开的元组中保留标签。

感谢 [Josh Goldberg](https://github.com/JoshuaKGoldberg) 和 [Mateusz Burzyński](https://github.com/Andarist) 的贡献。

## 更容易地使用联合数组上的方法

在之前版本的 TypeScript 中，在联合数组上调用方法可能很痛苦。

```ts
declare let array: string[] | number[];

array.filter(x => !!x);
//    ~~~~~~ error!
// This expression is not callable.
//   Each member of the union type '...' has signatures,
//   but none of those signatures are compatible
//   with each other.
```

此例中，TypeScript 会检查是否每个版本的 `filter` 都与 `string[]` 和 `number[]` 兼容。
在没有一个连贯的策略的情况下，TypeScript 会束手无策地说：“我无法使其工作”。

在 TypeScript 5.2 里，在放弃之前，联合数组会被特殊对待。
使用每个元素类型构造一个新数组，然后在其上调用方法。

对于上例来说，`string[] | number[]` 被转换为 `(string | number)[]`（或者是 `Array<string | number>`），然后在该类型上调用 `filter`。
有一个注意事项，`filter` 会产生 `Array<string | number>` 而不是 `string[] | number[]`；
但对于新产生的值，出现“出错”的风险较小。

这意味着在以前不能使用的情况下，许多方法如 `filter`、`find`、`some`、`every` 和 `reduce` 都可以在数组的联合类型上调用。

更多详情请参考[PR](https://github.com/microsoft/TypeScript/pull/53489)。

## 拷贝的数组方法

TypeScript 5.2 支持了 ECMAScript 提案 [Change Array by Copy](https://github.com/tc39/proposal-change-array-by-copy)。

JavaScript 中的数组有很多有用的方法如 `sort()`，`splice()`，以及 `reverse()`，这些方法在数组中原地修改元素。
通常，我们想创建一个新数组，还想影响原来的数组。
为达到此目的，你可以使用 `slice()` 或者展开数组（例如 `[...myArray]`）获取一份拷贝，然后再执行操作。
例如，你可以用 `myArray.slice().reverse()` 来获取反转的数组的拷贝。

还有一个典型的例子 - 创建一份拷贝，但是修改其中的一个元素。
有许多方法可以实现这一点，但最明显的方法要么是由多个语句组成的...

```ts
const copy = myArray.slice();
copy[someIndex] = updatedValue;
doSomething(copy);
```

要么意图不明显...

```ts
doSomething(
  myArray.map((value, index) => (index === someIndex ? updatedValue : value))
);
```

所有这些对于如此常见的操作来说都很繁琐。
这就是为什么 JavaScript 现在有了 4 个新的方法，执行相同的操作，但不影响原始数据：`toSorted`、`toSpliced`、`toReversed` 和 `with`。
前三个方法执行与它们的变异版本相同的操作，但返回一个新的数组。
`with` 也返回一个新的数组，但其中一个元素被更新（如上所述）。

| 修改                                         | 拷贝                                            |
| -------------------------------------------- | ----------------------------------------------- |
| myArray.reverse()                            | myArray.toReversed()                            |
| myArray.sort((a, b) => ...)                  | myArray.toSorted((a, b) => ...)                 |
| myArray.splice(start, deleteCount, ...items) | myArray.toSpliced(start, deleteCount, ...items) |
| myArray[index] = updatedValue                | myArray.with(index, updatedValue)               |

请注意，复制方法始终创建一个新的数组，而修改操作则不一致。

这些方法不仅存在于普通数组上 - 它们还存在于 `TypedArray` 上，例如 `Int32Array`，`Uint8Array`，等。

感谢 [Carter Snook](https://github.com/sno2) 的 [PR](https://github.com/microsoft/TypeScript/pull/51367)。

## 将 `symbol` 用于 `WeakMap` 和 `WeakSet` 的键

现在可以将 `symbol` 用于 `WeakMap` 和 `WeakSet` 的键，它也是 ECMAScript 的[新功能](https://github.com/tc39/proposal-symbols-as-weakmap-keys)。

```ts
const myWeakMap = new WeakMap();

const key = Symbol();
const someObject = { /*...*/ };

// Works! ✅
myWeakMap.set(key, someObject);
myWeakMap.has(key);
```

[这个更新](https://github.com/microsoft/TypeScript/pull/54195)是由 [Leo Elmecker-Plakolm](https://github.com/leoelm) 代表 Bloomberg 提供的。我们想向他们表示感谢！

## 类型导入路径里使用 TypeScript 实现文件扩展名

TypeScript 支持在类型导入路径里使用声明文件扩展名和实现文件扩展名，不论是否启用了 `allowImportingTsExtensions`。

也意味着你现在可以编写 `import type` 语句并使用 `.ts`, `.mts`, `.cts` 以及 `.tsx` 文件扩展。

```ts
import type { JustAType } from "./justTypes.ts";

export function f(param: JustAType) {
    // ...
}
```

这也意味着，`import()` 类型（用在 TypeScript 和 JavaScript 的 JSDoc 中） 也可以使用这些扩展名。

```ts
/**
 * @param {import("./justTypes.ts").JustAType} param
 */
export function f(param) {
    // ...
}
```

更多详情请查看 [PR](https://github.com/microsoft/TypeScript/pull/54746)。
