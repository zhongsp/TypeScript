# TypeScript 5.4

## 从最后一次赋值以后，在闭包中保留类型细化

TypeScript 通常可以根据您进行的检查来确定变量更具体的类型。
这个过程被称为类型细化。

```ts
function uppercaseStrings(x: string | number) {
  if (typeof x === 'string') {
    // TypeScript 知道 'x' 是 'string' 类型
    return x.toUpperCase();
  }
}
```

一个常见的痛点是被细化的类型不总会在闭包函数中保留。

```ts
function getUrls(url: string | URL, names: string[]) {
  if (typeof url === 'string') {
    url = new URL(url);
  }

  return names.map(name => {
    url.searchParams.set('name', name);
    //  ~~~~~~~~~~~~
    // error!
    // Property 'searchParams' does not exist on type 'string | URL'.

    return url.toString();
  });
}
```

在这里，TypeScript 决定在我们的回调函数中不“安全”地假设 `url` *实际上*是一个 `URL` 对象，因为它在其他地方发生了变化；
然而，在这种情况下，箭头函数总是在对 `url` 的赋值之后创建的，并且它也是对 `url` 的最后一次赋值。

TypeScript 5.4 利用这一点使类型细化变得更加智能。
当在非[提升](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)的函数中使用参数和 `let` 变量时，类型检查器将寻找最后一次赋值点。
如果找到了这样的点，TypeScript 可以安全地从包含函数的外部进行类型细化。
这意味着上面的例子现在可以正常工作了。

请注意，如果变量在嵌套函数的任何地方被赋值，类型细化分析将不会生效。
这是因为无法确定该函数是否会在后续被调用。

```ts
function printValueLater(value: string | undefined) {
  if (value === undefined) {
    value = 'missing!';
  }

  setTimeout(() => {
    // Modifying 'value', even in a way that shouldn't affect
    // its type, will invalidate type refinements in closures.
    value = value;
  }, 500);

  setTimeout(() => {
    console.log(value.toUpperCase());
    //          ~~~~~
    // error! 'value' is possibly 'undefined'.
  }, 1000);
}
```

这将使许多典型的 JavaScript 代码更容易表达出来。
更多详情请参考[PR](https://github.com/microsoft/TypeScript/pull/56908)。

## `NoInfer` 工具类型

当调用泛型函数时，TypeScript 能够从实际参数推断出类型参数的值。

```ts
function doSomething<T>(arg: T) {
  // ...
}

// We can explicitly say that 'T' should be 'string'.
doSomething<string>('hello!');

// We can also just let the type of 'T' get inferred.
doSomething('hello!');
```

然而，一个挑战是并不总能够清楚推断出“最佳”的类型是什么。
这可能导致 TypeScript 拒绝合理的调用，接受有问题的调用，或者在捕捉到 bug 时报告较差的错误消息。

例如，假设 `createStreetLight` 函数接收一系列颜色名，以及一个默认颜色名。

```ts
function createStreetLight<C extends string>(colors: C[], defaultColor?: C) {
  // ...
}

createStreetLight(['red', 'yellow', 'green'], 'red');
```

当我们传入的 `defaultColor` 不在 `colors` 数组里会发生什么？
在这个函数中，`colors` 被当成“事实来源”，并描述了可以传递给 `defaultColor`。

```ts
// Oops! This undesirable, but is allowed!
createStreetLight(['red', 'yellow', 'green'], 'blue');
```

在这个调用中，类型推断决定 `"blue"` 与 `"red"`、`"yellow"` 或 `"green"` 一样有效。
因此，TypeScript 推断 `C` 的类型为 `"red" | "yellow" | "green" | "blue"`。
可以说推断结果让我们感到十分惊讶！

目前人们处理这个问题的一种方式是添加一个独立的类型参数，该参数受现有类型参数的限制。

```ts
function createStreetLight<C extends string, D extends C>(
  colors: C[],
  defaultColor?: D
) {}

createStreetLight(['red', 'yellow', 'green'], 'blue');
//                                            ~~~~~~
// error!
// Argument of type '"blue"' is not assignable to parameter of type '"red" | "yellow" | "green" | undefined'.
```

这种方法可以解决问题，但有点尴尬，因为在 `createStreetLight` 的签名中可能不会在其他地方使用 `D`。
虽然这种情况不算糟糕，但在签名中只使用一次类型参数通常是一种代码坏味道。

这就是为什么 TypeScript 5.4 引入了一个新的 `NoInfer<T>` 实用类型。
将一个类型包裹在 `NoInfer<...>` 中向 TypeScript 发出一个信号，告诉它不要深入匹配内部类型以寻找类型推断的候选项。

使用 `NoInfer`，我们可以将 `createStreetLight` 重写为以下形式：

```ts
function createStreetLight<C extends string>(
  colors: C[],
  defaultColor?: NoInfer<C>
) {
  // ...
}

createStreetLight(['red', 'yellow', 'green'], 'blue');
//                                            ~~~~~~
// error!
// Argument of type '"blue"' is not assignable to parameter of type '"red" | "yellow" | "green" | undefined'.
```

排除对 `defaultColor` 类型进行推断的探索意味着 `"blue"` 永远不会成为推断的候选项，类型检查器可以拒绝它。

具体实现请参考 [PR](https://github.com/microsoft/TypeScript/pull/56794)，以及最初实现 [PR](https://github.com/microsoft/TypeScript/pull/52968)，感谢[Mateusz Burzyński](https://github.com/Andarist)
