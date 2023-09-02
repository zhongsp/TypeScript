# TypeScript 5.2

## `using` 声明与显式资源管理

TypeScript 5.2 支持了 ECMAScript 即将引入的新功能 [显式资源管理](https://github.com/tc39/proposal-explicit-resource-management)。
让我们探索一下引入该功能的一些动机，并理解这个功能给我们带来了什么。

在创建对象之后需要进行某种形式的“清理”是很常见的。例如，您可能需要关闭网络连接，删除临时文件，或者只是释放一些内存。
让我们来想象一个函数，它创建一个临时文件，对它进行多种操作的读写，然后关闭并删除它。

```ts
import * as fs from "fs";

export function doSomeWork() {
    const path = ".some_temp_file";
    const file = fs.openSync(path, "w+");

    // use file...

    // Close the file and delete it.
    fs.closeSync(file);
    fs.unlinkSync(path);
}
```

这看起来不错，但如果需要提前退出会发生什么？

```ts
export function doSomeWork() {
    const path = ".some_temp_file";
    const file = fs.openSync(path, "w+");

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
    const path = ".some_temp_file";
    const file = fs.openSync(path, "w+");

    try {
        // use file...

        if (someCondition()) {
            // do some more work...
            return;
        }
    }
    finally {
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
该提案的关键思想是将资源释放（我们试图处理的清理工作）作为JavaScript中的一等概念来支持。

首先，增加了一个新的 `symbol` 名字为 `Symbol.dispose`，然后可以定义包含 `Symbol.dispose` 方法的对象。
为了方便，TypeScript 为此定义了一个新的全局类型 `Disposable`。

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
```

之后可以调用这些方法

```ts
export function doSomeWork() {
    const file = new TempFile(".some_temp_file");

    try {
        // ...
    }
    finally {
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
Symbol.dispose ??= Symbol("Symbol.dispose");
Symbol.asyncDispose ??= Symbol("Symbol.asyncDispose");
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
