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

WIP.. https://devblogs.microsoft.com/typescript/announcing-typescript-4-6/
