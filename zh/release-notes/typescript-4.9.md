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

## 使用 `in` 运算符来细化并未列出其属性的对象类型

开发者经常需要处理在运行时不完全已知的值。
事实上，我们常常不能确定对象的某个属性是否存在，是否从服务端得到了响应或者读取到了某个配置文件。
JavaScript 的 `in` 运算符能够检查对象上是否存在某个属性。

从前，TypeScript 能够根据没有明确列出的属性来细化类型。

```ts
interface RGB {
    red: number;
    green: number;
    blue: number;
}

interface HSV {
    hue: number;
    saturation: number;
    value: number;
}

function setColor(color: RGB | HSV) {
    if ("hue" in color) {
        // 'color' 类型为 HSV
    }
    // ...
}
```

此处，`RGB` 类型上没有列出 `hue` 属性，因此被细化掉了，剩下了 `HSV` 类型。

那如果每个类型上都没有列出这个属性呢？
在这种情况下，语言无法提供太多的帮助。
看下面的 JavaScript 示例：

```ts
function tryGetPackageName(context) {
    const packageJSON = context.packageJSON;
    // Check to see if we have an object.
    if (packageJSON && typeof packageJSON === "object") {
        // Check to see if it has a string name property.
        if ("name" in packageJSON && typeof packageJSON.name === "string") {
            return packageJSON.name;
        }
    }

    return undefined;
}
```

将上面的代码改写为合适的 TypeScript，我们会给 `context` 定义一个类型；
然而，在旧版本的 TypeScript 中如果声明 `packageJSON` 属性的类型为安全的 `unknown` 类型会有问题。

```ts
interface Context {
    packageJSON: unknown;
}

function tryGetPackageName(context: Context) {
    const packageJSON = context.packageJSON;
    // Check to see if we have an object.
    if (packageJSON && typeof packageJSON === "object") {
        // Check to see if it has a string name property.
        if ("name" in packageJSON && typeof packageJSON.name === "string") {
        //                                              ~~~~
        // error! Property 'name' does not exist on type 'object.
            return packageJSON.name;
        //                     ~~~~
        // error! Property 'name' does not exist on type 'object.
        }
    }

    return undefined;
}
```

这是因为当 `packageJSON` 的类型从 `unknown` 细化为 `object` 类型后，
`in` 运算符会严格地将类型细化为包含了所检查属性的某个类型。
因此，`packageJSON` 的类型仍为 `object`。

TypeScript 4.9 增强了 `in` 运算符的类型细化功能，它能够更好地处理没有列出属性的类型。
现在 TypeScript 不是什么也不做，而是将其类型与 `Record<"property-key-being-checked", unknown>` 进行类型交叉运算。

因此在上例中，`packageJSON` 的类型将从 `unknown` 细化为 `object` 再细化为 `object & Record<"name", unknown>`。
这样就允许我们访问并细化类型 `packageJSON.name`。

```ts
interface Context {
    packageJSON: unknown;
}

function tryGetPackageName(context: Context): string | undefined {
    const packageJSON = context.packageJSON;
    // Check to see if we have an object.
    if (packageJSON && typeof packageJSON === "object") {
        // Check to see if it has a string name property.
        if ("name" in packageJSON && typeof packageJSON.name === "string") {
            // Just works!
            return packageJSON.name;
        }
    }

    return undefined;
}
```

TypeScript 4.9 还会严格限制 `in` 运算符的使用，以确保左侧的操作数能够赋值给 `string | number | symbol`，右侧的操作数能够赋值给 `object`。
它有助于检查是否使用了合法的属性名，以及避免在原始类型上进行检查。

更多详情请查看 [PR](https://github.com/microsoft/TypeScript/pull/50666).

## 类中的自动存取器

TypeScript 4.9 支持了 ECMAScript 即将引入的“自动存取器”功能。
自动存取器的声明如同定义一个类的属性，只不过是需要使用 `accessor` 关键字。

```ts
class Person {
    accessor name: string;

    constructor(name: string) {
        this.name = name;
    }
}
```

在底层实现中，自动存取器会被展开为 `get` 和 `set` 存取器，以及一个无法访问的私有成员。

```ts
class Person {
    #__name: string;

    get name() {
        return this.#__name;
    }
    set name(value: string) {
        this.#__name = name;
    }

    constructor(name: string) {
        this.name = name;
    }
}
```

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/49705)。
