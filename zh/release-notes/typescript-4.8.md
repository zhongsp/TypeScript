# TypeScript 4.8

## 改进的交叉类型化简、联合类型兼容性以及类型细化

TypeScript 4.8 为 `--strictNullChecks` 带来了一系列修正和改进。
这些变化会影响交叉类型和联合类型的工作方式，也作用于 TypeScript 的类型细化。

例如，`unknown` 与 `{} | null | undefined` 类型神似，
因为它接受 `null`，`undefined` 以及任何其它类型。
TypeScript 现在能够识别出这种情况，允许将 `unknown` 赋值给 `{} | null | undefined`。

> 译者注：除 `null` 和 `undefined` 类型外，其它任何类型都可以赋值给 `{}` 类型。

```ts
function f(x: unknown, y: {} | null | undefined) {
    x = y; // 可以工作
    y = x; // 以前会报错，现在可以工作
}
```

另一个变化是 `{}` 与任何其它对象类型交叉会得到那个对象类型。
因此，我们可以重写 `NonNullable` 类型为与 `{}` 的交叉类型，
因为 `{} & null` 和 `{} & undefined` 会被消掉。

```diff
- type NonNullable<T> = T extends null | undefined ? never : T;
+ type NonNullable<T> = T & {};
```

之所以称其为一项改进，是因为交叉类型可以被化简和赋值了，
而有条件类型目前是不支持的。
因此，`NonNullable<NonNullable<T>>` 至少可以简化为 `NonNullable<T>`，在以前这是不行的。

```ts
function foo<T>(x: NonNullable<T>, y: NonNullable<NonNullable<T>>) {
    x = y; // 一直没问题
    y = x; // 以前会报错，现在没问题
}
```

这些变化还为我们带来了更合理的控制流分析和类型细化。
比如，`unknown` 在条件为“真”的分支中被细化为 `{} | null | undefined`。

```ts
function narrowUnknownishUnion(x: {} | null | undefined) {
    if (x) {
        x;  // {}
    }
    else {
        x;  // {} | null | undefined
    }
}

function narrowUnknown(x: unknown) {
    if (x) {
        x;  // 以前是 'unknown'，现在是 '{}'
    }
    else {
        x;  // unknown
    }
}
```

泛型也会进行类似的细化。
当检查一个值不为 `null` 或 `undefined` 时，
TypeScript 会将其与 `{}` 进行交叉 - 等同于使用 `NonNullable`。
把所有变化放在一起，我们就可以在不使用类型断言的情况下定义下列函数。

```ts
function throwIfNullable<T>(value: T): NonNullable<T> {
    if (value === undefined || value === null) {
        throw Error("Nullable value!");
    }

    // 以前会报错，因为 'T' 不能赋值给 'NonNullable<T>'。
    // 现在会细化为 'T & {}' 并且不报错，因为它等同于 'NonNullable<T>'。
    return value;
}
```

`value` 细化为了 `T & {}`，此时它与 `NonNullable<T>` 等同 -
因此在函数体中不再需要使用 TypeScript 的特定语法。

就该改进本身而言可能是一个很小的变化 - 但它却实实在在地修复了在过去几年中报告的大量问题。

更多详情，请参考[这里](https://github.com/microsoft/TypeScript/pull/49119)。
