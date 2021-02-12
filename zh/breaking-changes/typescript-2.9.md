# TypeScript 2.9

## `keyof` 现在包括 `string`、`number` 和 `symbol` 键名

TypeScript 2.9 将索引类型泛化为包括 `number` 和 `symbol` 命名属性。以前，`keyof` 运算符和映射类型仅支持 `string` 命名属性。

```typescript
function useKey<T, K extends keyof T>(o: T, k: K) {
  var name: string = k;  // 错误: keyof T 不能分配给 `string`
}
```

### 建议

* 如果你的函数只能处理名字符串属性的键，请在声明中使用 `Extract<keyof T，string>`：

  ```typescript
  function useKey<T, K extends Extract<keyof T, string>>(o: T, k: K) {
    var name: string = k;  // OK
  }
  ```

* 如果你的函数可以处理所有属性键，那么更改应该是顺畅的：

  ```typescript
  function useKey<T, K extends keyof T>(o: T, k: K) {
    var name: string | number | symbol = k;
  }
  ```

* 除此之外，还可以使用 `--keyofStringsOnly` 编译器选项禁用新行为。

## 剩余参数后面不允许尾后逗号

以下代码是一个自 [\#22262](https://github.com/Microsoft/TypeScript/pull/22262) 开始的编译器错误：

```typescript
function f(
  a: number,
  ...b: number[], // 违规的尾随逗号
) {}
```

剩余参数上的尾随逗号不是有效的 JavaScript，并且，这个语法现在在 TypeScript 中也是一个错误。

## 在 `strictNullChecks` 中，无类型约束参数不再分配给 `object`

以下代码是自[24013](https://github.com/microsoft/typescript/issues/24013)起在 `strickNullChecks` 下出现的编译器错误：

```typescript
function f<T>(x: T) {
  const y: object | null | undefined = x;
}
```

它可以用任意类型（例如，`string` 或 `number` ）来实现，因此允许它是不正确的。 如果您遇到此问题，请将您的类型参数约束为 `object` 以仅允许对象类型。如果想允许任何类型，使用 `{}` 进行比较而不是 `object`。

## 参考

* [原文](https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#typescript-29)

