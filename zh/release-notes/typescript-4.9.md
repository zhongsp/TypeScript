# TypeScript 4.9

## `satisfies` 运算符

TypeScript 开发者有时会感到进退两难：既想要确保表达式能够*匹配*某种类型，也想要表达式获得最确切的类型用作类型推断。

例如：

```ts
// 每个属性可能是 string 或 RGB 元组。
const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    bleu: [0, 0, 255]
//  ^^^^ 拼写错误
};

// 我们想要在 'red' 上调用数组的方法
const redComponent = palette.red.at(0);

// 或者在 'green' 上调用字符串的方法
const greenNormalized = palette.green.toUpperCase();
```

注意，这里写成了 `bleu`，但我们想写的是 `blue`。
通过给 `palette` 添加类型注释就能够捕获 `bleu` 拼写错误，
但同时我们也失去了属性各自的信息。

```ts
type Colors = "red" | "green" | "blue";

type RGB = [red: number, green: number, blue: number];

const palette: Record<Colors, string | RGB> = {
    red: [255, 0, 0],
    green: "#00ff00",
    bleu: [0, 0, 255]
//  ~~~~ 能够检测到拼写错误
};

// 意想不到的错误 - 'palette.red' 可能为 string
const redComponent = palette.red.at(0);
```

新的 `satisfies` 运算符让我们可以验证表达式是否匹配某种类型，同时不改变表达式自身的类型。
例如，可以使用 `satisfies` 来检验 `palette` 的所有属性与 `string | number[]` 是否兼容：

```ts
type Colors = "red" | "green" | "blue";

type RGB = [red: number, green: number, blue: number];

const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    bleu: [0, 0, 255]
//  ~~~~ 捕获拼写错误
} satisfies Record<Colors, string | RGB>;

// 依然可以访问这些方法
const redComponent = palette.red.at(0);
const greenNormalized = palette.green.toUpperCase();
```

`satisfies` 可以用来捕获许多错误。
例如，检查一个对象是否包含了某个类型要求的所有的键，并且没有多余的：

```ts
type Colors = "red" | "green" | "blue";

// 确保仅包含 'Colors' 中定义的键
const favoriteColors = {
    "red": "yes",
    "green": false,
    "blue": "kinda",
    "platypus": false
//  ~~~~~~~~~~ 错误 - "platypus" 不在 'Colors' 中
} satisfies Record<Colors, unknown>;

// 'red', 'green', and 'blue' 的类型信息保留下来
const g: boolean = favoriteColors.green;
```

有可能我们不太在乎属性名，在乎的是属性值的类型。
在这种情况下，我们也能够确保对象属性值的类型是匹配的。

```ts
type RGB = [red: number, green: number, blue: number];

const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    blue: [0, 0]
    //    ~~~~~~ 错误！
} satisfies Record<string, string | RGB>;

// 类型信息保留下来
const redComponent = palette.red.at(0);
const greenNormalized = palette.green.toUpperCase();
```

更多示例请查看[这里](https://github.com/microsoft/TypeScript/issues/47920)和[这里](https://github.com/microsoft/TypeScript/pull/46827)。
感谢[Oleksandr Tarasiuk](https://github.com/a-tarasyuk)对该属性的贡献。
