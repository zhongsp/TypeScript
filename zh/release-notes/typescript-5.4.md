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
        value = "missing!";
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
