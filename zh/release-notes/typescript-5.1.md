# TypeScript 5.1

## 更易用的隐式返回 `undefined` 的函数

在 `JavaScript` 中，如果一个函数运行结束时没有遇到 `return` 语句，它会返回 `undefined` 值。

```js
function foo() {
    // no return
}

// x = undefined
let x = foo();
```

然而，在之前版本的 TypeScript 中，*只有*返回值类型为 `void` 和 `any` 的函数可以不带 `return` 语句。
这意味着，就算明知函数返回 `undefined`，你也必须包含 `return` 语句。

```ts
//  fine - we inferred that 'f1' returns 'void'
function f1() {
    // no returns
}

//  fine - 'void' doesn't need a return statement
function f2(): void {
    // no returns
}

//  fine - 'any' doesn't need a return statement
function f3(): any {
    // no returns
}

//  error!
// A function whose declared type is neither 'void' nor 'any' must return a value.
function f4(): undefined {
    // no returns
}
```

如果某些 API 期望函数返回 `undefined` 值，这可能会让人感到痛苦 —— 你需要至少有一个显式的返回 `undefined` 语句，或者一个带有显式注释的 `return` 语句。

```ts
declare function takesFunction(f: () => undefined): undefined;

//  error!
// Argument of type '() => void' is not assignable to parameter of type '() => undefined'.
takesFunction(() => {
    // no returns
});

//  error!
// A function whose declared type is neither 'void' nor 'any' must return a value.
takesFunction((): undefined => {
    // no returns
});

//  error!
// Argument of type '() => void' is not assignable to parameter of type '() => undefined'.
takesFunction(() => {
    return;
});

//  works
takesFunction(() => {
    return undefined;
});

//  works
takesFunction((): undefined => {
    return;
});
```

这种行为非常令人沮丧和困惑，尤其是在调用自己无法控制的函数时。
理解推断 `void`与 `undefined` 之间的相互作用，以及一个返回 `undefined` 的函数是否需要 `return` 语句等等，似乎会分散注意力。

首先，TypeScript 5.1 允许返回 `undefined` 的函数不包含返回语句。

```ts
//  Works in TypeScript 5.1!
function f4(): undefined {
    // no returns
}

//  Works in TypeScript 5.1!
takesFunction((): undefined => {
    // no returns
});
```

其次，如果一个函数没有返回表达式，并且被传递给期望返回 `undefined` 值的函数的地方，TypeScript 会推断该函数的返回类型为 `undefined`。

```ts
//  Works in TypeScript 5.1!
takesFunction(function f() {
    //                 ^ return type is undefined

    // no returns
});

//  Works in TypeScript 5.1!
takesFunction(function f() {
    //                 ^ return type is undefined

    return;
});
```

为了解决另一个类似的痛点，在 TypeScript 的 `--noImplicitReturns` 选项下，只返回 `undefined` 的函数现在有了类似于 `void` 的例外情况，在这种情况下，并不是每个代码路径都必须以显式的返回语句结束。

```ts
//  Works in TypeScript 5.1 under '--noImplicitReturns'!
function f(): undefined {
    if (Math.random()) {
        // do some stuff...
        return;
    }
}
```

更多详情请参考 [Issue](https://github.com/microsoft/TypeScript/issues/36288)，[PR](https://github.com/microsoft/TypeScript/pull/53607)
