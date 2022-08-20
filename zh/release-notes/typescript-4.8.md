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

## 改进模版字符串类型中 `infer` 类型的类型推断

近期，TypeScript 支持了在有条件类型中的 `infer` 类型变量上添加 `extends` 约束。

```ts
// 提取元组类型中的第一个元素，若其能够赋值给 'number'，
// 返回 'never' 若无这样的元素。
type TryGetNumberIfFirst<T> =
    T extends [infer U extends number, ...unknown[]] ? U : never;
```

若 `infer` 类型出现在模版字符串类型中且被原始类型所约束，则 TypeScript 会尝试将其解析为字面量类型。

```ts
// SomeNum 以前是 'number'；现在是 '100'。
type SomeNum = "100" extends `${infer U extends number}` ? U : never;

// SomeBigInt 以前是 'bigint'；现在是 '100n'。
type SomeBigInt = "100" extends `${infer U extends bigint}` ? U : never;

// SomeBool 以前是 'boolean'；现在是 'true'。
type SomeBool = "true" extends `${infer U extends boolean}` ? U : never;
```

现在它能更好地表达代码库在运行时的行为，提供更准确的类型。

要注意的一点是当 TypeScript 解析这些字面量类型时会使用贪心策略，尽可能多地提取原始类型；
然后再回头检查解析出的原始类型是否匹配字符串的内容。
也就是说，TypeScript 检查从字符串到原始类型再到字符串是否匹配。
如果发现字符串前后对不上了，那么回退到基本的原始类型。

```ts
// JustNumber 为 `number` 因为 TypeScript 解析 出 `"1.0"`，但 `String(Number("1.0"))` 为 `"1"` 不匹配。
type JustNumber = "1.0" extends `${infer T extends number}` ? T : never; 
```

更多详情请参考[这里](https://github.com/microsoft/TypeScript/pull/48094)。

## `--build`, `--watch`, 和 `--incremental` 的性能优化

TypeScript 4.8 优化了使用 `--watch` 和 `--incremental` 时的速度，以及使用 `--build` 构建工程引用时的速度。
例如，现在在 `--watch` 模式下 TypeScript 不会去更新未改动文件的时间戳，
这使得重新构建更快，避免与其它监视 TypeScript 输出文件的构建工具之间产生干扰。
此外，TypeScript 也能够重用 `--build`, `--watch` 和 `--incremental` 之间的信息。

这些优化有多大效果？在一个相当大的代码库上，对于简单常用的操作有 10%-25% 的改进，对于无改动操作的场景节省了 40% 的时间。
在 TypeScript 代码库中我们也看到了相似的结果。

更多详情请参考[这里](https://github.com/microsoft/TypeScript/pull/48784)。

## 比较对象和数组字面量时报错

在许多语言中，`==` 操作符在对象上比较的是“值”。
例如，在 Python 语言中想检查列表是否为空时可以使用 `==` 检查该值是否与空列表相等。

```py
if people_at_home == []:
    print("that's where she lies, broken inside. </3")
```

在 JavaScript 里却不是这样，使用 `==` 和 `===` 比较对象和数组时比较的是引用。
我们确信这会让 JavaScript 程序员搬起石头砸自己脚，且最坏的情况是在生产环境中存在 bug。
因此，TypeScript 现在不允许如下的代码：

```ts
let peopleAtHome = [];

if (peopleAtHome === []) {
//  ~~~~~~~~~~~~~~~~~~~
// This condition will always return 'false' since JavaScript compares objects by reference, not value.
    console.log("that's where she lies, broken inside. </3")
}
```

非常感谢[Jack Works](https://github.com/Jack-Works)的贡献。
更多详情请参考[这里](https://github.com/microsoft/TypeScript/pull/45978)。
