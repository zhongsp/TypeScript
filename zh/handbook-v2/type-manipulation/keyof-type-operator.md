# keyof 类型运算符

## `keyof` 类型运算符

`keyof` 运算符接受对象类型，并生成其键的字符串或数字字面量联合类型。下面的类型 `P` 与 `type P = "x" | "y"` 相同：

```ts twoslash
type Point = { x: number; y: number };
type P = keyof Point;
//   ^?
```

如果类型具有 `string` 或 `number` 索引签名，`keyof` 将返回相应的类型：

```ts twoslash
type Arrayish = { [n: number]: unknown };
type A = keyof Arrayish;
//   ^?

type Mapish = { [k: string]: boolean };
type M = keyof Mapish;
//   ^?
```

请注意，在此示例中，`M` 是 `string | number`——这是因为 JavaScript 对象的键总是被强制转换为字符串，所以 `obj[0]` 总是等同于 `obj["0"]`。

当与映射类型结合使用时，`keyof` 类型变得非常有用，我们稍后将详细了解。
