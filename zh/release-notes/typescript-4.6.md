# TypeScript 4.6

### 允许在构造函数中的 `super()` 调用之前插入代码

在 JavaScript 的类中，在引用 `this` 之前必须先调用 `super()`。
在 TypeScript 中同样有这个限制，只不过在检查时过于严格。
在之前版本的 TypeScript 中，如果类中存在**属性初始化器**，
那么在构造函数里，在 `super()` 调用之前不允许出现任何其它代码。

```ts
class Base {
    // ...
}

class Derived extends Base {
    someProperty = true;

    constructor() {
        // 错误！
        // 必须先调用 'super()' 因为需要初始化 'someProperty'。
        doSomeStuff();
        super();
    }
}
```

这样做是因为程序实现起来容易，但这样做也会拒绝很多合法的代码。
TypeScript 4.6 放宽了限制，它允许在 `super()` 之前出现其它代码，
与此同时仍然会检查在引用 `this` 之前顶层的`super()` 已经被调用。

感谢 [Joshua Goldberg](https://github.com/JoshuaKGoldberg) 的 [PR](https://github.com/microsoft/TypeScript/pull/29374)。

### 基于控制流来分析解构的可辨识联合类型

TypeScript 可以根据判别式属性来细化类型。
例如，在下面的代码中，TypeScript 能够在检查 `kind` 的类型后细化 `action` 的类型。

```ts
type Action =
    | { kind: "NumberContents", payload: number }
    | { kind: "StringContents", payload: string };

function processAction(action: Action) {
    if (action.kind === "NumberContents") {
        // `action.payload` is a number here.
        let num = action.payload * 2
        // ...
    }
    else if (action.kind === "StringContents") {
        // `action.payload` is a string here.
        const str = action.payload.trim();
        // ...
    }
}
```

这样就可以使用持有不同数据的对象，但通过共同的字段来区分它们。

这在 TypeScript 是很常见的；然而，根据个人的喜好，你可能想对上例中的 `kind` 和 `payload` 进行解构。
就像下面这样：

```ts
type Action =
    | { kind: "NumberContents", payload: number }
    | { kind: "StringContents", payload: string };

function processAction(action: Action) {
    const { kind, payload } = action;
    if (kind === "NumberContents") {
        let num = payload * 2
        // ...
    }
    else if (kind === "StringContents") {
        const str = payload.trim();
        // ...
    }
}
```

此前，TypeScript 会报错 - 当 `kind` 和 `payload` 是由同一个对象解构为变量时，它们会被独立对待。

在 TypeScript 4.6 中可以正常工作！

当解构独立的属性为 const 声明，或当解构参数到变量且没有重新赋值时，TypeScript 会检查被解构的类型是否为可辨识联合。
如果是的话，TypeScript 就能够根据类型检查来细化变量的类型。
因此上例中，通过检查 `kind` 的类型可以细化 `payload` 的类型。

更多详情请查看 [PR](https://github.com/microsoft/TypeScript/pull/46266)。

WIP.. https://devblogs.microsoft.com/typescript/announcing-typescript-4-6/
