# 缩小类型范围

假设我们有一个名为 `padLeft` 的函数。

```ts twoslash
function padLeft(padding: number | string, input: string): string {
  throw new Error("尚未实现！");
}
```

如果 `padding` 是一个 `number`，它将把它作为我们想要在 `input` 前面添加的空格数。如果 `padding` 是一个 `string`，它应该只是将 `padding` 添加到 `input` 前面。让我们尝试为当向 `padLeft` 的 `padding` 参数传递一个 `number` 时实现逻辑。

```ts twoslash
// @errors: 2345
function padLeft(padding: number | string, input: string) {
  return " ".repeat(padding) + input;
}
```

糟糕，我们得到 `padding` 相关的错误。TypeScript 警告我们正在将类型为 `number | string` 的值传递给 `repeat` 函数，而该函数只接受一个 `number` 参数，而它是正确的。换句话说，我们没有明确检查 `padding` 是否为 `number`，也没有处理它是 `string` 的情况，所以我们来做一下。

```ts twoslash
function padLeft(padding: number | string, input: string) {
  if (typeof padding === "number") {
    return " ".repeat(padding) + input;
  }
  return padding + input;
}
```

如果这看起来像无聊的 JavaScript 代码，那就是目的所在。除了我们放置的注解之外，这段 TypeScript 代码看起来像 JavaScript。这是因为 TypeScript 的类型系统旨在尽可能地让你编写典型的 JavaScript 代码，而无需费力地获取类型安全性。

虽然它看起来可能不起眼，但在这里实际上发生了很多事情。就像 TypeScript 使用静态类型分析运行时值一样，它还在 JavaScript 的运行时控制流构造（如 `if/else`、条件三元运算符、循环、真值检查等）上叠加了类型分析，这些构造都可以影响这些类型。

在我们的 `if` 检查中，TypeScript 看到 `typeof padding === "number"` 并将其理解为特殊形式的代码，称为*类型守卫*。TypeScript 沿着程序可能采取的路径来分析值在给定位置的最具体可能类型。它查看这些特殊的检查（称为*类型守卫*）和赋值，并将类型细化为比声明更具体的类型的过程称为*缩小*。在许多编辑器中，我们可以观察到这些类型在变化，我们在示例中也将这样做。

```ts twoslash
function padLeft(padding: number | string, input: string) {
  if (typeof padding === "number") {
    return " ".repeat(padding) + input;
    //                ^?
  }
  return padding + input;
  //     ^?
}
```

TypeScript 可以理解几种不同的缩小类型的构造。

## `typeof` 类型守卫

正如我们已经看到的，JavaScript 支持 `typeof` 运算符，它可以在运行时提供关于值类型的基本信息。TypeScript 期望它返回一组特定的字符串：

- `"string"`
- `"number"`
- `"bigint"`
- `"boolean"`
- `"symbol"`
- `"undefined"`
- `"object"`
- `"function"`

就像我们在 `padLeft` 中看到的那样，这个运算符在许多 JavaScript 库中经常出现，而 TypeScript 可以理解它以在不同的分支中缩小类型。

在 TypeScript 中，针对 `typeof` 返回值的检查是一种类型守卫。因为 TypeScript 对 `typeof` 在不同值上的操作方式进行了编码，所以它了解 JavaScript 中的一些怪异之处。例如，请注意在上面的列表中，`typeof` 不会返回字符串 `null`。请看下面的示例：

```ts twoslash
// @errors: 2531 18047
function printAll(strs: string | string[] | null) {
  if (typeof strs === "object") {
    for (const s of strs) {
      console.log(s);
    }
  } else if (typeof strs === "string") {
    console.log(strs);
  } else {
    // 什么都不做
  }
}
```

在 `printAll` 函数中，我们尝试检查 `strs` 是否是一个对象，以确定它是否为数组类型（现在是一个加强记忆的好时机，数组在 JavaScript 中是对象类型）。但事实证明，在 JavaScript 中，`typeof null` 实际上是 `"object"`！太不幸了。

有足够经验的用户可能不会感到惊讶，但并不是每个人在 JavaScript 中都遇到过这个问题；幸运的是，TypeScript 让我们知道了 `strs` 的类型会被缩小为 `string[] | null`，而不仅仅是 `string[]`。

这可能是一个好的过渡点，让我们谈谈所谓的“真值”检查。

# 真值缩小类型

“真值”是你不太可能会在英文词典中找到的词，但在 JavaScript 中却非常常见。

在 JavaScript 中，我们可以在条件语句、`&&`、`||`、`if` 语句、布尔否定 (`!`)语句等中使用任何表达式。例如，`if` 语句并不要求其条件始终具有 `boolean` 类型。

```ts twoslash
function getUsersOnlineMessage(numUsersOnline: number) {
  if (numUsersOnline) {
    return `现在有 ${numUsersOnline} 人在线！`;
  }
  return "这里没有人。 :(";
}
```

在 JavaScript 中，诸如 `if` 的结构首先将其条件“强制转换”为 `boolean` 类型，然后根据结果是 `true` 还是 `false` 选择相应的分支。像以下这些值

- `0`
- `NaN`
- `""`（空字符串）
- `0n`（`bigint` 版本的零）
- `null`
- `undefined`

都会被强制转换为 `false`，其他值则被强制转换为 `true`。你可以通过将值传递给 `Boolean` 函数，或者使用更简洁的双重布尔否定来将值强制转换为 `boolean` 类型。（后者的优点是 TypeScript 推断出一个狭窄的字面量布尔类型 `true`，而前者则推断为 `boolean` 类型。）

```ts twoslash
// 这两个都会得到 ‘true’
Boolean("hello"); // 类型: boolean, 值: true
!!"world"; // 类型: true,    值: true
```

利用这种行为是相当流行的，特别是用于防范 `null` 或 `undefined` 等值。例如，让我们尝试将其应用于我们的 `printAll` 函数。

```ts twoslash
function printAll(strs: string | string[] | null) {
  if (strs && typeof strs === "object") {
    for (const s of strs) {
      console.log(s);
    }
  } else if (typeof strs === "string") {
    console.log(strs);
  }
}
```

你会注意到，通过检查 `strs` 是否为真值，我们消除了上面的错误。这至少可以避免我们在运行代码时遇到以下可怕的错误：

```txt
TypeError: null is not iterable
```

然而请记住，对基本类型进行真值检查往往容易出错。例如，考虑另一种编写 `printAll` 的尝试。

```ts twoslash {class: "do-not-do-this"}
function printAll(strs: string | string[] | null) {
  // !!!!!!!!!!!!!!!!
  //  不要这样做！
  //  继续阅读下去
  // !!!!!!!!!!!!!!!!
  if (strs) {
    if (typeof strs === "object") {
      for (const s of strs) {
        console.log(s);
      }
    } else if (typeof strs === "string") {
      console.log(strs);
    }
  }
}
```

我们将整个函数体都包装在一个真值检查中，但这有一个微妙的缺点：我们可能不再能正确处理空字符串的情况。

TypeScript 对我们来说没有任何问题，但如果你对 JavaScript 不太熟悉，这种行为值得注意。TypeScript 经常可以帮助你尽早发现错误，但如果你选择对一个值*什么也不做*，那么它能做的就有限了，而不会过于武断。如果你愿意，你可以通过使用一个代码检查工具来确保处理这类情况。

关于通过真值缩小类型的最后一点是，带有 `!` 的布尔否定会将被否定的值过滤到否定分支。

```ts twoslash
function multiplyAll(
  values: number[] | undefined,
  factor: number
): number[] | undefined {
  if (!values) {
    return values;
  } else {
    return values.map((x) => x * factor);
  }
}
```

## 等式缩小类型

TypeScript 还使用 `switch` 语句和等式检查，如 `===`、`!==`、`==` 和 `!=` 来缩小类型。例如：

```ts twoslash
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // 现在我们可以在 'x' 或 'y' 上调用任何 'string' 方法。
    x.toUpperCase();
    // ^?
    y.toLowerCase();
    // ^?
  } else {
    console.log(x);
    //          ^?
    console.log(y);
    //          ^?
  }
}
```

在上面的例子中，当我们检查 `x` 和 `y` 是否相等时，TypeScript 知道它们的类型也必须相等。由于 `string` 是唯一 `x` 和 `y` 都可能具有的公共类型，TypeScript 知道在第一个分支中 `x` 和 `y` 一定是 `string` 类型。

检查特定字面值（而不是变量）也可以工作。在我们关于真值缩小类型的部分，我们编写了一个 `printAll` 函数，它容易出错，因为它意外地没有正确处理空字符串。相反，我们可以进行特定的检查来排除 `null`，而 TypeScript 仍然可以正确地从 `strs` 的类型中移除 `null`。

```ts twoslash
function printAll(strs: string | string[] | null) {
  if (strs !== null) {
    if (typeof strs === "object") {
      for (const s of strs) {
        //            ^?
        console.log(s);
      }
    } else if (typeof strs === "string") {
      console.log(strs);
      //          ^?
    }
  }
}
```

JavaScript 的宽松等式检查 `==` 和 `!=` 也可以正确缩小类型。如果你对它们不熟悉，检查某些东西是否 `== null` 实际上不仅检查它是否是具体的值 `null`，还检查它是否可能是 `undefined`。同样的规则适用于 `== undefined`：它检查一个值是否为 `null` 或 `undefined`。

```ts twoslash
interface Container {
  value: number | null | undefined;
}

function multiplyValue(container: Container, factor: number) {
  // 从类型中移除 'null' 和 'undefined'。
  if (container.value != null) {
    console.log(container.value);
    //                    ^?

    // 现在我们可以安全地将 'container.value' 乘以 'factor'。
    container.value *= factor;
  }
}
```

## `in` 运算符缩小类型

JavaScript 有一个的运算符，用于确定对象或其原型链中是否存在具有指定名称的属性：`in` 运算符。TypeScript 将其视为一种缩小类型的方法。

例如，在代码中使用：`"value" in x`，其中 `"value"` 是一个字符串字面量，而 `x` 是一个联合类型。“true”分支会缩小 `x` 的类型，该类型具有可选或必需的 `value` 属性，而“false”分支会缩小到 `value` 属性可选或缺失的类型。

```ts twoslash
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    return animal.swim();
  }

  return animal.fly();
}
```

需要强调的是，可选属性在缩小类型时将出现在两个分支中。例如，人类既可以游泳又可以飞行（通过正确的装备），因此应该在 `in` 检查的两个分支中都出现：

<!-- prettier-ignore -->
```ts twoslash
type Fish = { swim: () => void };
type Bird = { fly: () => void };
type Human = { swim?: () => void; fly?: () => void };

function move(animal: Fish | Bird | Human) {
  if ("swim" in animal) {
    animal;
//  ^?
  } else {
    animal;
//  ^?
  }
}
```

## `instanceof` 缩小类型

JavaScript 中有一个运算符可以检查一个值是否是另一个值的“实例”。具体来说，在 JavaScript 中，`x instanceof Foo` 检查 `x` 的*原型链*是否包含 `Foo.prototype`。虽然我们不会在这里深入讨论，而且在我们介绍类时会更多地涉及到它，但它仍然对大多数可以使用 `new` 构造的值非常有用。正如你可能已经猜到的那样，`instanceof` 也是一种类型护卫，在由 `instanceof` 保护的分支中，TypeScript 会缩小类型范围。

```ts twoslash
function logValue(x: Date | string) {
  if (x instanceof Date) {
    console.log(x.toUTCString());
    //          ^?
  } else {
    console.log(x.toUpperCase());
    //          ^?
  }
}
```

## 赋值语句

正如我们之前提到的，当我们对任何变量进行赋值时，TypeScript 会查看赋值语句的右侧，并相应地缩小左侧的类型。

```ts twoslash
let x = Math.random() < 0.5 ? 10 : "hello world!";
//  ^?
x = 1;

console.log(x);
//          ^?
x = "goodbye!";

console.log(x);
//          ^?
```

请注意，每个赋值都有效。尽管在第一次赋值后，`x` 的观察类型变为 `number`，但我们仍然可以将 `string` 值赋值给 `x`。这是因为 `x` 的*声明类型*（`x` 起始的类型）是 `string | number`，而可赋值性始终根据声明类型进行检查。

如果我们将 `boolean` 值赋值给 `x`，就会看到错误，因为它不是声明类型的一部分。

```ts twoslash
// @errors: 2322
let x = Math.random() < 0.5 ? 10 : "hello world!";
//  ^?
x = 1;

console.log(x);
//          ^?
x = true;

console.log(x);
//          ^?
```

## 控制流分析

到目前为止，我们已经通过一些基本示例演示了 TypeScript 在特定分支中如何缩小类型。但实际上，TypeScript 并不仅仅是从每个变量开始向上查找类型守卫的 `if`、`while` 或者条件语句。例如：

```ts twoslash
function padLeft(padding: number | string, input: string) {
  if (typeof padding === "number") {
    return " ".repeat(padding) + input;
  }
  return padding + input;
}
```

`padLeft` 在其第一个 `if` 块中返回。TypeScript 能够分析这段代码，并看到在 `padding` 是 `number` 的情况下，函数体的其余部分（`return padding + input;`）是*不可达*的。因此，在函数的剩余部分中，它能够将 `number` 从 `padding` 的类型中移除（将 `string | number` 缩小为 `string`）。

这种基于可达性的代码分析称为*控制流分析*，TypeScript 在遇到类型守卫和赋值时使用这种流分析来缩小类型。分析变量时，控制流可以一次又一次地分裂和重新合并，并且该变量在每个点上都可能具有不同的类型。

```ts twoslash
function example() {
  let x: string | number | boolean;

  x = Math.random() < 0.5;

  console.log(x);
  //          ^?

  if (Math.random() < 0.5) {
    x = "hello";
    console.log(x);
    //          ^?
  } else {
    x = 100;
    console.log(x);
    //          ^?
  }

  return x;
  //     ^?
}
```

## 使用类型断言

到目前为止，我们已经使用现有的 JavaScript 构造来处理类型缩小，但有时你可能希望更直接地控制代码中的类型变化。

要定义用户自定义的类型守卫，我们只需定义一个返回类型为*类型断言*的函数：

```ts twoslash
type Fish = { swim: () => void };
type Bird = { fly: () => void };
declare function getSmallPet(): Fish | Bird;
// ---cut---
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
```

在这个示例中，`pet is Fish` 是我们的类型断言。断言采用 `parameterName is Type` 的形式，其中 `parameterName` 必须是当前函数签名中的参数名称。

每当使用某个变量调用 `isFish` 时，TypeScript 将会根据原始类型是否兼容，将该变量*缩小*为特定类型。

```ts twoslash
type Fish = { swim: () => void };
type Bird = { fly: () => void };
declare function getSmallPet(): Fish | Bird;
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
// ---cut---
// “swim”和“fly”的调用现在都没问题。
let pet = getSmallPet();

if (isFish(pet)) {
  pet.swim();
} else {
  pet.fly();
}
```

请注意，TypeScript 不仅知道在 `if` 分支中 `pet` 是 `Fish`；它还知道在 `else` 分支中，其*并非*`Fish`，所以它肯定是 `Bird`。

你可以使用类型守卫 `isFish` 来过滤 `Fish | Bird` 数组，并获得 `Fish` 数组：

```ts twoslash
type Fish = { swim: () => void; name: string };
type Bird = { fly: () => void; name: string };
declare function getSmallPet(): Fish | Bird;
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
// ---cut---
const zoo: (Fish | Bird)[] = [getSmallPet(), getSmallPet(), getSmallPet()];
const underWater1: Fish[] = zoo.filter(isFish);
// 或者等价地
const underWater2: Fish[] = zoo.filter(isFish) as Fish[];

// 对于更复杂的示例，可能需要重复使用类型断言
const underWater3: Fish[] = zoo.filter((pet): pet is Fish => {
  if (pet.name === "sharkey") return false;
  return isFish(pet);
});
```

此外，类可以使用 [`this is Type`](/zh/docs/handbook/2/classes.html#this-based-type-guards) 来缩小其类型。

## 断言函数

类型也可以使用[断言函数](/zh/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)来缩小。

# 辨识联合类型

到目前为止，我们所讨论的大多数示例都集中在缩小包含简单类型（如 `string`、`boolean` 和 `number`）的单个变量上。虽然这很常见，但在 JavaScript 中，我们通常会处理稍微复杂一些的结构。

为了说明这一点，让我们假设我们正在尝试编码圆形和正方形这样的形状。圆形保持其半径，而正方形保持其边长。我们将使用一个名为 `kind` 的字段来告诉我们正在处理的形状。下面是定义 `Shape` 的第一次尝试。

```ts twoslash
interface Shape {
  kind: "circle" | "square";
  radius?: number;
  sideLength?: number;
}
```

请注意，我们使用了字符串字面量类型的联合：“circle” 和 “square”，以告诉我们应该将形状视为圆形还是正方形。通过使用 `"circle" | "square"` 而不是 `string`，我们可以避免拼写错误问题。

```ts twoslash
// @errors: 2367
interface Shape {
  kind: "circle" | "square";
  radius?: number;
  sideLength?: number;
}

// ---cut---
function handleShape(shape: Shape) {
  // 出错了！
  if (shape.kind === "rect") {
    // ...
  }
}
```

我们可以编写 `getArea` 函数，根据处理的是圆形还是正方形应用相应的逻辑。我们首先尝试处理圆形。

```ts twoslash
// @errors: 2532 18048
interface Shape {
  kind: "circle" | "square";
  radius?: number;
  sideLength?: number;
}

// ---cut---
function getArea(shape: Shape) {
  return Math.PI * shape.radius ** 2;
}
```

在 [`strictNullChecks`](/tsconfig#strictNullChecks) 下，这将引发一个错误——这是合适的，因为 `radius` 可能未定义。但是，如果我们对 `kind` 属性进行适当的检查，会发生什么呢？

```ts twoslash
// @errors: 2532 18048
interface Shape {
  kind: "circle" | "square";
  radius?: number;
  sideLength?: number;
}

// ---cut---
function getArea(shape: Shape) {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius ** 2;
  }
}
```

嗯，TypeScript 仍然不知道该怎么处理这里的情况。我们已经达到了一个我们对值的了解比类型检查器更多的点。我们可以尝试使用非空断言（在 `shape.radius` 后面加上`！`）来表示 `radius` 肯定存在。

```ts twoslash
interface Shape {
  kind: "circle" | "square";
  radius?: number;
  sideLength?: number;
}

// ---cut---
function getArea(shape: Shape) {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius! ** 2;
  }
}
```

但这并不是理想的解决方法。我们不得不在类型检查器面前大声喊出这些非空断言（`!`），以说服它 `shape.radius` 是定义过的，但是如果我们开始调整代码，这些断言就容易出错。此外，在[`strictNullChecks`](/tsconfig#strictNullChecks) 之外，我们仍然可以意外访问这些字段（因为在读取它们时，可选属性被假定为始终存在）。我们肯定可以做得更好。

这种 `Shape` 的编码方式的问题在于，类型检查器无法根据 `kind` 属性知道 `radius` 或 `sideLength` 是否存在。我们需要将*我们*所了解的信息传达给类型检查器。考虑到这一点，让我们尝试另一种方法来定义 `Shape`。

```ts twoslash
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;
```

在这里，我们将 `Shape` 适当地分成了两种类型，这两种类型在 `kind` 属性上有不同的值，但是 `radius` 和 `sideLength` 在各自的类型中被声明为必需属性。

让我们看看当我们尝试访问 `Shape` 的 `radius` 时会发生什么。

```ts twoslash
// @errors: 2339
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;

// ---cut---
function getArea(shape: Shape) {
  return Math.PI * shape.radius ** 2;
}
```

就像我们对 `Shape` 的第一个定义一样，这仍然是一个错误。当 `radius` 是可选的时候，我们遇到了错误（在启用了 [`strictNullChecks`](/tsconfig#strictNullChecks) 的情况下），因为 TypeScript 无法确定属性是否存在。现在 `Shape` 是一个联合类型，TypeScript 告诉我们 `shape` 可能是一个 `Square`，而 `Square` 上没有定义 `radius`！这两种解释都是正确的，但只要 `Shape` 是联合类型，无论 [`strictNullChecks`](/tsconfig#strictNullChecks) 如何配置，都会导致错误。

但是如果我们再次尝试检查 `kind` 属性呢？

```ts twoslash
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;

// ---cut---
function getArea(shape: Shape) {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius ** 2;
    //               ^?
  }
}
```

这样就消除了错误！当联合类型的每个成员都包含具有字面类型的共同属性时，TypeScript 将其视为*可辨识联合*，并可以排除联合的成员。

在这种情况下，`kind` 就是这个共同属性（被认为是 `Shape` 的*辨识属性*）。检查 `kind` 属性是否为 `"circle"` 可以排除 `Shape` 中没有具有类型为 `"circle"` 的 `kind` 属性的类型。这将 `shape` 缩小为类型 `Circle`。

相同的检查也适用于 `switch` 语句。现在我们可以尝试编写完整的 `getArea` 函数，而无需使用烦人的 `!` 非空断言。

```ts twoslash
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;

// ---cut---
function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    //                 ^?
    case "square":
      return shape.sideLength ** 2;
    //       ^?
  }
}
```

这里重要的是对 `Shape` 的编码。向 TypeScript 传达正确的信息——`Circle` 和 `Square` 实际上是具有特定 `kind` 字段的两种不同类型——是至关重要的。通过这样做，我们可以编写与我们本来会编写的 JavaScript 没有任何区别的类型安全的 TypeScript 代码。从那里，类型系统能够做出“正确”的事情，并确定我们 `switch` 语句中每个分支的类型。

> 顺便说一句，尝试玩弄上面的示例并删除一些 `return` 关键字。
> 你会发现，在 `switch` 语句的不同子句之间意外“掉落”时，类型检查可以帮助避免错误。

可辨识联合不仅适用于描述圆圈和正方形。它们适用于表示 JavaScript 中的任何一种消息方案，例如在网络上发送消息（客户端/服务器通信）或在状态管理框架中编码变更。

# `never` 类型

在缩小类型时，你可以将联合类型的选项减少到没有剩余选项的程度。在这种情况下，TypeScript 将使用 `never` 类型来表示一个不应存在的状态。

# 完备性检查

`never` 类型可以赋值给任何类型；然而，没有类型可以赋值给 `never`（除了 `never` 本身）。这意味着你可以使用缩小操作，并依赖于 `never` 来进行 `switch` 语句的完备性检查。

例如，在我们的 `getArea` 函数中添加一个 `default` 分支，尝试将形状赋值给 `never`，当处理了所有可能的情况时不会引发错误。

```ts twoslash
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}
// ---cut---
type Shape = Circle | Square;

function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

如果向 `Shape` 联合类型添加一个新成员，将会引发 TypeScript 错误：

```ts twoslash
// @errors: 2322
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}
// ---cut---
interface Triangle {
  kind: "triangle";
  sideLength: number;
}

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```
