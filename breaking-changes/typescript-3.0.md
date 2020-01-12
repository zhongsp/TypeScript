# TypeScript 3.0

## 保留关键字 `unknown`

`unknown` 现在是一个保留类型名称，因为它现在是一个内置类型。为了支持新引入的 `unknown` 类型，取决于你对 `unknown` 的使用方式，你可能需要完全移除变量申明，或者将其重命名。

## 未开启 `strictNullChecks` 时，与 `null`/`undefined` 交叉的类型会简化到 `null`/`undefined`

关闭 `strictNullChecks` 时，下例中 `A` 的类型为 `null`，而 `B` 的类型为 `undefined`：

```typescript
type A = { a: number } & null;      // null
type B = { a: number } & undefined; // undefined
```

这是因为 TypeScript 3.0 更适合分别简化交叉类型和联合类型中的子类型和超类型。但是，因为当 `strictNullChecks` 关闭时，`null` 和 `undefined` 都被认为是所有其他类型的子类型，与某种对象类型的交集将始终简化为 `null` 或 `undefined`。

### 建议

如果你在类型交叉的情况下依赖 `null` 和 `undefined` 作为[单位元](https://baike.baidu.com/item/%E5%8D%95%E4%BD%8D%E5%85%83)，你应该寻找一种方法来使用 `unknown` 而不是无论它们在哪里都是 `null` 或 `undefined`。

## 参考

* [原文](https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#typescript-30)

