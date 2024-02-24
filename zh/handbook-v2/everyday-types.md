# 常见类型

在本章中，我们将介绍一些在 JavaScript 代码中最常见的值的类型，并说明在 TypeScript 中描述这些类型相应的方法。这不是一个详尽的列表，后续章节将描述命名和使用其他类型的更多方法。

类型还可以出现在许多*地方*，而不仅仅是类型注释。在我们了解类型本身的同时，我们还将了解在哪些地方可以引用这些类型来形成新的结构。

我们将首先回顾一下你在编写 JavaScript 或 TypeScript 代码时可能遇到的最基本和最常见的类型。这些将在稍后形成更复杂类型的核心构建块。

## 基本类型：`string`，`number` 和 `boolean`

JavaScript 有三种非常常用的[基本类型](https://developer.mozilla.org/zh-CN/docs/Glossary/Primitive)：`string`，`number` 和 `boolean`。在 TypeScript 中，每种 JS 基本类型都有其对应的类型。如果在一个值上使用 JavaScript 的 `typeof` 运算符，会看到这些类型的名称：

- `string`表示字符串值，如 `"Hello, world"`
- `number`用于数字，如 `42`。JavaScript 没有针对整数的特殊运行时值，所以没有类似 `int` 或 `float` 的等价物——一切都是 `number`
- `boolean` 用于 `true` 和 `false` 这两个值

> 类型名称 `String`、`Number` 和 `Boolean`（以大写字母开头）是合法的，但是它们指向的是一些特殊的内置类型，其在代码中很少出现。请始终使用 `string`，`number` 或 `boolean` 作为类型。

## 数组

要指定类似 `[1, 2, 3]` 的数组的类型，可以使用语法 `number[]`；这个语法适用于任何类型（例如 `string[]` 是字符串数组，依此类推）。你可能还会看到其写作 `Array<number>`，它们的意思是一样的。当我们学习*泛型*时，将更多地了解到 `T<U>` 语法的含义。

> 请注意，`[number]` 是不同的东西；请参阅关于*元组类型*的部分。

## `any`

TypeScript 还有一种特殊的类型 `any`，你如果不希望特定值引起类型检查错误的话，可以使用它。

当一个值的类型是 `any` 时，你可以访问它的任何属性（其属性的类型也将是 `any`），像调用函数一样调用它，将其赋值给任何类型的值，或者将任何类型的值赋给它，或者几乎任何其他在语法上合法的操作：

```ts twoslash
let obj: any = { x: 0 };
// 以下代码行都不会引发编译器错误。
// 用 `any` 就禁用所有进一步的类型检查，意味着你比 TypeScript 更了解环境。
obj.foo();
obj();
obj.bar = 100;
obj = "hello";
const n: number = obj;
```

如果你不想费力编写出一个很长的类型，就只是为了让 TypeScript 相信某一行代码是正确的，`any` 类型就非常有用。

### `noImplicitAny`

当你没有指定类型，并且 TypeScript 无法从上下文中推断出类型时，编译器通常会默认为`any`。

然而，通常情况下，你最好避免使用 `any`，因为 `any` 不会进行类型检查。编译器标志 [`noImplicitAny`](/tsconfig#noImplicitAny) 可以将任何隐式的 `any` 标记为错误。

## 变量的类型注解

使用 `const`、`var` 或 `let` 声明变量时，你可以选择性地添加类型注解来显式指定变量的类型：

```ts twoslash
let myName: string = "Alice";
//        ^^^^^^^^ 类型注解
```

> TypeScript 不使用类似 `int x = 0;` 的“左侧类型”声明。
> 类型注解总是放在被注解的内容*之后*。

但在大多数情况下，并不是必须要这样。TypeScript 会尽可能自动根据代码推断出类型。例如，以下变量的类型是根据其初始化的值推断出来的：

```ts twoslash
// 不需要类型注解——“myName”推断为 “string” 类型
let myName = "Alice";
```

在大多数情况下，你不需要学习推断规则。如果你刚开始使用，尝试少使用一些类型注解——实际上仅需要了解少量的类型注解，就能让 TypeScript 完全理解代码的含义。

## 函数

在 JavaScript 中数据的传递主要通过函数进行。TypeScript 允许你指定函数的输入和输出值的类型。

### 参数类型注解

声明函数时，你可以在每个参数后面添加类型注解，以声明函数的参数类型。参数类型注解放在参数名后面：

```ts twoslash
// 参数类型注解
function greet(name: string) {
  //                 ^^^^^^^^
  console.log("你好，" + name.toUpperCase() + "！！");
}
```

当参数具有类型注解时，传递给该函数的参数将被检查：

```ts twoslash
// @errors: 2345
declare function greet(name: string): void;
// ---cut---
// 如果执行，将会产生运行时错误！
greet(42);
```

> 即使参数没有类型注解，TypeScript 仍然会检查你传递参数的数量是否正确。

### 返回类型注解

你也可以添加返回类型注解。返回类型注解出现在参数列表之后：

```ts twoslash
function getFavoriteNumber(): number {
  //                        ^^^^^^^^
  return 26;
}
```

和变量类型注解一样，通常情况下你不需要返回类型注解，因为 TypeScript 会根据 `return` 语句自动推断函数的返回值类型。上面示例中的类型注解并没有任何影响。有些代码库显式指定返回类型是为了记录，也有些是为了防止意外更改或仅仅出于个人偏好。

### 匿名函数

匿名函数与函数声明有些不同。如果在 TypeScript 能够确定其调用方式的位置使用一个函数，该函数的参数会自动获得类型。

以下是例子：

```ts twoslash
// @errors: 2551
// 这里没有类型注解，但 TypeScript 可以发现错误
const names = ["Alice", "Bob", "Eve"];

// 函数的上下文类型推断
names.forEach(function (s) {
  console.log(s.toUppercase());
});

// 箭头函数也适用上下文类型推断
names.forEach((s) => {
  console.log(s.toUppercase());
});
```

尽管参数 `s` 没有类型注解，但 TypeScript 使用了 `forEach` 函数的类型以及数组的推断类型，来确定 `s` 的类型。

这个过程被称为*上下文类型推断*，因为函数出现的*上下文*告诉它应该具有的类型。类似于推断规则，你不需要显式地学习这个过程是如何发生的，但了解它发生的事实可以帮助你注意到不需要类型注解的情况。稍后，我们将看到更多关于值所处的上下文如何影响其类型的示例。

## 对象类型

除了基本类型之外，最常见的类型是*对象类型*。任何具有属性的 JavaScript 值都是对象类型，其几乎包括所有值！要定义一个对象类型，我们只需要列出其属性及其属性的类型。

例如，这是一个以类似于点的对象为参数的函数：

```ts twoslash
// 参数的类型注解是对象类型
function printCoord(pt: { x: number; y: number }) {
  //                      ^^^^^^^^^^^^^^^^^^^^^^^^
  console.log("坐标的 x 值是 " + pt.x);
  console.log("坐标的 y 值是 " + pt.y);
}
printCoord({ x: 3, y: 7 });
```

本例中，我们使用具有两个属性 `x` 和 `y` 的类型注解来注解参数，两个属性都是 `number` 类型。你可以使用 `,` 或 `;` 来分隔属性，最后一个分隔符可以省略。

每个属性的类型部分也是可选的。如果你不指定类型，它将被默认为是 `any` 类型。

### 可选属性

对象类型还可以指定它们的某些或所有属性是*可选的*。要实现这一点，可以在属性名后面加上 `?`：

```ts twoslash
function printName(obj: { first: string; last?: string }) {
  // ...
}
// 都是有效的
printName({ first: "Bob" });
printName({ first: "Alice", last: "Alisson" });
```

在 JavaScript 中，如果访问一个不存在的属性，你会得到 `undefined` 而不是运行时错误。因此，如果你*读取*的是一个可选属性的话，那么在使用它之前，你需要检查其是否为 `undefined`。

```ts twoslash
// @errors: 2532
function printName(obj: { first: string; last?: string }) {
  // 错误——如果没有提供 'obj.last'，可能会崩溃！
  console.log(obj.last.toUpperCase());
  if (obj.last !== undefined) {
    // 正常运行
    console.log(obj.last.toUpperCase());
  }

  // 一种使用现代 JavaScript 语法的安全替代方法：
  console.log(obj.last?.toUpperCase());
}
```

## 联合类型

TypeScript 的类型系统允许你使用各种运算符从现有类型构建新类型。现在我们了解了如何编写一些类型，是时候开始以有趣的方式*组合（combine）*它们了。

### 定义联合类型

*联合*（Union）类型是组合类型的一种方式。联合类型是由两个或更多其他类型形成的类型，表示值可以是这些类型中的*任意一个*。我们将每个类型都称为联合的*成员*。

以下是可以操作字符串或数字的函数：

```ts twoslash
// @errors: 2345
function printId(id: number | string) {
  console.log("你的 ID 是：" + id);
}
// 正常运行
printId(101);
// 正常运行
printId("202");
// 错误
printId({ myID: 22342 });
```

### 使用联合类型

提供与联合类型匹配的值很容易——只需提供与联合的成员之一匹配的类型即可。但是如果你*有*一个联合类型的值，你该如何使用它呢？

只有当某个操作对联合的每个成员都有效时，TypeScript 才允许你对联合类型值进行操作。例如，如果你有一个 `string | number` 的联合类型，那么你不能使用仅适用于 `string` 的方法：

```ts twoslash
// @errors: 2339
function printId(id: number | string) {
  console.log(id.toUpperCase());
}
```

解决方法是使用代码来*紧缩*联合类型的范围，就像在没有类型注解的 JavaScript 中一样。如果 TypeScript 可以根据代码的结构推断出更具体的类型的值的话，就会发生*紧缩*。

例如，TypeScript 知道只有 `string` 的 `typeof` 值为 `"string"`：

```ts twoslash
function printId(id: number | string) {
  if (typeof id === "string") {
    // 在这个分支中，id 的类型是 'string'
    console.log(id.toUpperCase());
  } else {
    // 在这里，id 的类型是 'number'
    console.log(id);
  }
}
```

另一个例子是 `Array.isArray` 函数：

```ts twoslash
function welcomePeople(x: string[] | string) {
  if (Array.isArray(x)) {
    // 在这里：'x' 的类型是 'string[]'
    console.log("你好，" + x.join(" 和 "));
  } else {
    // 在这里：'x' 的类型是 'string'
    console.log("欢迎，孤独旅行者 " + x);
  }
}
```

请注意，在 `else` 分支中，我们不需要做任何特殊处理（如果 `x` 不是 `string[]`，那么它肯定是 `string`）。

有时你会遇到一个联合类型，其中所有成员都具有共同的特征。例如，数组和字符串都有一个 `slice` 方法。如果联合的每个成员都有一个共同的属性，你可以在不紧缩类型的情况下使用该属性：

```ts twoslash
// 返回类型被推断为 number[] | string
function getFirstThree(x: number[] | string) {
  return x.slice(0, 3);
}
```

> *联合*类型的名字可能会让人困惑，因为它实际上是这些类型的属性的*交集*。（译注：联合类型的英文是“Union”，和并集是同一个单词）
> 这是有意为之（名称*联合类型*来自于类型理论）。
> 联合类型 `number | string` 是通过将每个类型的*值*合并而组成的。
> 注意，给定两个集合，每个集合有相应特征，只有这些特征的*交集*适用于这些集合的*合集*。
> 例如，假设有一个房间，里面的人都是戴帽子的高个，而另一个房间里的人都戴帽子且说西班牙语，将这些房间组合在一起后，我们只知道*每个*人都戴着帽子。

## 类型别名

可以直接在类型注解中编写对象类型和联合类型来使用它们。这虽然很方便，但是我们常常会有一个需求，就是如果多次使用同一个类型的话，可以通过一个名称来引用它。

*类型别名*正是如此（任意*类型*的*名称*）。类型别名的语法是：

```ts twoslash
type Point = {
  x: number;
  y: number;
};

// 与前面的示例完全相同
function printCoord(pt: Point) {
  console.log("x 的坐标值是 " + pt.x);
  console.log("y 的坐标值是 " + pt.y);
}

printCoord({ x: 100, y: 100 });
```

实际上，不只是对象类型，你可以使用类型别名为任何类型命名。例如，类型别名可以命名联合类型：

```ts twoslash
type ID = number | string;
```

请注意，别名*只是*别名（你不能使用类型别名来创建同一类型的不同“版本”）。当你使用别名时，它与你编写的别名所对应的类型完全一样。换句话说，这段代码可能*看起来*是非法的，但是对于 TypeScript 来说是正确的，因为这两种类型都是同一类型的别名：

```ts twoslash
declare function getInput(): string;
declare function sanitize(str: string): string;
// ---cut---
type UserInputSanitizedString = string;

function sanitizeInput(str: string): UserInputSanitizedString {
  return sanitize(str);
}

// 创建一个经过清理的输入框
let userInput = sanitizeInput(getInput());

// 仍然可以使用字符串重新赋值
userInput = "新的输入";
```

## 接口

*接口声明*是命名对象类型的另一种方式：

```ts twoslash
interface Point {
  x: number;
  y: number;
}

function printCoord(pt: Point) {
  console.log("x 的坐标值是 " + pt.x);
  console.log("y 的坐标值是 " + pt.y);
}

printCoord({ x: 100, y: 100 });
```

就像我们上面使用类型别名时一样，这个示例的工作方式就像我们使用了匿名对象类型一样。TypeScript 只关心我们传递给 `printCoord` 的值的结构——它只关心它是否具有预期的属性。只关心类型的结构和功能，这就是为什么我们说 TypeScript 是一个*结构化类型*的类型系统。

### 类型别名和接口之间的区别

类型别名和接口非常相似，在大多数情况下你可以在它们之间自由选择。几乎所有的 `interface` 功能都可以在 `type` 中使用，关键区别在于不能重新开放类型以添加新的属性，而接口始终是可扩展的。

<table class='full-width-table'>
  <tbody>
    <tr>
      <th><code>Interface</code></th>
      <th><code>Type</code></th>
    </tr>
    <tr>
      <td>
        <p>扩展接口</p>
        <code><pre>
interface Animal {
  name: string
}<br/>
interface Bear extends Animal {
  honey: boolean
}<br/>
const bear = getBear() 
bear.name
bear.honey
        </pre></code>
      </td>
      <td>
        <p>通过 "&" 扩展类型</p>
        <code><pre>
type Animal = {
  name: string
}<br/>
type Bear = Animal & { 
  honey: Boolean 
}<br/>
const bear = getBear();
bear.name;
bear.honey;
        </pre></code>
      </td>
    </tr>
    <tr>
      <td>
        <p>向现有接口添加新字段</p>
        <code><pre>
interface Window {
  title: string
}<br/>
interface Window {
  ts: TypeScriptAPI
}<br/>
const src = 'const a = "Hello World"';
window.ts.transpileModule(src, {});
        </pre></code>
      </td>
      <td>
        <p>类型创建后不能更改</p>
        <code><pre>
type Window = {
  title: string
}<br/>
type Window = {
  ts: TypeScriptAPI
}<br/>
<span style="color: #A31515"> // Error: Duplicate identifier 'Window'.</span><br/>
        </pre></code>
      </td>
    </tr>
    </tbody>
</table>

在后面的章节中你会学到更多关于这些概念的知识，所以如果你没有立即理解这些知识，请不要担心。

- 在 TypeScript 4.2 之前，类型别名命名[*可能* 会出现在错误消息中](/play?#code/PTAEGEHsFsAcEsA2BTATqNrLusgzngIYDm+oA7koqIYuYQJ56gCueyoAUCKAC4AWHAHaFcoSADMaQ0PCG80EwgGNkALk6c5C1EtWgAsqOi1QAb06groEbjWg8vVHOKcAvpokshy3vEgyyMr8kEbQJogAFND2YREAlOaW1soBeJAoAHSIkMTRmbbI8e6aPMiZxJmgACqCGKhY6ABGyDnkFFQ0dIzMbBwCwqIccabcYLyQoKjIEmh8kwN8DLAc5PzwwbLMyAAeK77IACYaQSEjUWZWhfYAjABMAMwALA+gbsVjoADqgjKESytQPxCHghAByXigYgBfr8LAsYj8aQMUASbDQcRSExCeCwFiIQh+AKfAYyBiQFgOPyIaikSGLQo0Zj-aazaY+dSaXjLDgAGXgAC9CKhDqAALxJaw2Ib2RzOISuDycLw+ImBYKQflCkWRRD2LXCw6JCxS1JCdJZHJ5RAFIbFJU8ADKC3WzEcnVZaGYE1ABpFnFOmsFhsil2uoHuzwArO9SmAAEIsSFrZB-GgAjjA5gtVN8VCEc1o1C4Q4AGlR2AwO1EsBQoAAbvB-gJ4HhPgB5aDwem-Ph1TCV3AEEirTp4ELtRbTPD4vwKjOfAuioSQHuDXBcnmgACC+eCONFEs73YAPGGZVT5cRyyhiHh7AAON7lsG3vBggB8XGV3l8-nVISOgghxoLq9i7io-AHsayRWGaFrlFauq2rg9qaIGQHwCBqChtKdgRo8TxRjeyB3o+7xAA)，有时代替等效的匿名类型（可能需要也可能不需要）。接口在错误消息中将始终被命名。
- 类型别名不能参与[声明合并，但接口可以](/play?#code/PTAEEEDtQS0gXApgJwGYEMDGjSfdAIx2UQFoB7AB0UkQBMAoEUfO0Wgd1ADd0AbAK6IAzizp16ALgYM4SNFhwBZdAFtV-UAG8GoPaADmNAcMmhh8ZHAMMAvjLkoM2UCvWad+0ARL0A-GYWVpA29gyY5JAWLJAwGnxmbvGgALzauvpGkCZmAEQAjABMAMwALLkANBl6zABi6DB8okR4Jjg+iPSgABboovDk3jjo5pbW1d6+dGb5djLwAJ7UoABKiJTwjThpnpnGpqPBoTLMAJrkArj4kOTwYmycPOhW6AR8IrDQ8N04wmo4HHQCwYi2Waw2W1S6S8HX8gTGITsQA)。
- 接口只能用于[声明对象的形状，不能重命名基本类型](/play?#code/PTAEAkFMCdIcgM6gC4HcD2pIA8CGBbABwBtIl0AzUAKBFAFcEBLAOwHMUBPQs0XFgCahWyGBVwBjMrTDJMAshOhMARpD4tQ6FQCtIE5DWoixk9QEEWAeV37kARlABvaqDegAbrmL1IALlAEZGV2agBfampkbgtrWwMAJlAAXmdXdy8ff0Dg1jZwyLoAVWZ2Lh5QVHUJflAlSFxROsY5fFAWAmk6CnRoLGwmILzQQmV8JmQmDzI-SOiKgGV+CaYAL0gBBdyy1KCQ-Pn1AFFplgA5enw1PtSWS+vCsAAVAAtB4QQWOEMKBuYVUiVCYvYQsUTQcRSBDGMGmKSgAAa-VEgiQe2GLgKQA)。
- 接口名称将[*始终*以其原始形式出现](/play?#code/PTAEGEHsFsAcEsA2BTATqNrLusgzngIYDm+oA7koqIYuYQJ56gCueyoAUCKAC4AWHAHaFcoSADMaQ0PCG80EwgGNkALk6c5C1EtWgAsqOi1QAb06groEbjWg8vVHOKcAvpokshy3vEgyyMr8kEbQJogAFND2YREAlOaW1soBeJAoAHSIkMTRmbbI8e6aPMiZxJmgACqCGKhY6ABGyDnkFFQ0dIzMbBwCwqIccabcYLyQoKjIEmh8kwN8DLAc5PzwwbLMyAAeK77IACYaQSEjUWY2Q-YAjABMAMwALA+gbsVjNXW8yxySoAADaAA0CCaZbPh1XYqXgOIY0ZgmcK0AA0nyaLFhhGY8F4AHJmEJILCWsgZId4NNfIgGFdcIcUTVfgBlZTOWC8T7kAJ42G4eT+GS42QyRaYbCgXAEEguTzeXyCjDBSAAQSE8Ai0Xsl0K9kcziExDeiQs1lAqSE6SyOTy0AKQ2KHk4p1V6s1OuuoHuzwArMagA)在错误消息中，但*只有*在按名称使用时才会出现。

在大多数情况下，你可以根据个人喜好进行选择，TypeScript 会告诉你它是否需要其他类型的声明。如果你想要启发式方法，可以使用 `interface` 直到你需要使用 `type` 中的功能。

## 类型断言

有时候你会遇到一种情况，就是 TypeScript 无法确定一些类型。

例如，如果你使用 `document.getElementById`，TypeScript 只能知道它返回*某种* `HTMLElement`，但是可能你希望 TypeScript 知道的更具体一点，例如让它知道这个 ID 指向的应当是一个 `HTMLCanvasElement`。

在这种情况下，你可以使用*类型断言*来指定更具体的类型：

```ts twoslash
const myCanvas = document.getElementById("main_canvas") as HTMLCanvasElement;
```

与类型注解类似，类型断言会在编译时移除，不会影响代码的运行行为。

你也可以使用尖括号语法（除非代码在 `.tsx` 文件中），效果是一样的：

```ts twoslash
const myCanvas = <HTMLCanvasElement>document.getElementById("main_canvas");
```

> 提醒：由于类型断言在编译时被移除，因此没有与类型断言相关的运行时检查。
> 如果类型断言错误，不会生成异常或 `null`。

TypeScript 只允许将类型断言为*更具体*或*更不具体*的类型。这个规则阻止了一些“不可能”的强制转换，比如：

```ts twoslash
// @errors: 2352
const x = "hello" as number;
```

有时这个规则可能过于保守，会禁止一些更复杂的强制转换，尽管这些转换可能是有效的。如果遇到这种情况，你可以使用两个断言，先断言为 `any`（或者后面我们会介绍的 `unknown`），然后再断言为目标类型：

```ts twoslash
declare const expr: any;
type T = { a: 1; b: 2; c: 3 };
// ---cut---
const a = expr as any as T;
```

## 字面类型（literal type）

除了通用的 `string` 和 `number` 类型之外，我们还可以在类型位置引用*特定的*字符串和数字。

可以这样想，JavaScript 提供了不同的声明变量的方式。`var` 和 `let` 都允许改变变量中保存的值，而 `const` 则不允许。这体现在 TypeScript 创建字面类型的方式上。

```ts twoslash
let changingString = "Hello World";
changingString = "Olá Mundo";
// `changingString` 可以表示任意可能的字符串，所以 TypeScript 在类型系统中这样描述它
changingString;
// ^?

const constantString = "Hello World";
// `constantString` 只能表示一个可能的字符串，它有字面类型的表示形式
constantString;
// ^?
```

单独来看，字面类型并没有多大价值：

```ts twoslash
// @errors: 2322
let x: "hello" = "hello";
// OK
x = "hello";
// ...
x = "howdy";
```

只能是固定一个值的变量并没有多大用处！

但是如果将字面类型*组合*成联合类型，就可以表达更有用的概念，例如，只接受一组特定已知值的函数：

```ts twoslash
// @errors: 2345
function printText(s: string, alignment: "left" | "right" | "center") {
  // ...
}
printText("Hello, world", "left");
printText("G'day, mate", "centre");
```

数字字面类型的工作方式相同：

```ts twoslash
function compare(a: string, b: string): -1 | 0 | 1 {
  return a === b ? 0 : a > b ? 1 : -1;
}
```

当然，你可以将其与非字面类型组合使用：

```ts twoslash
// @errors: 2345
interface Options {
  width: number;
}
function configure(x: Options | "auto") {
  // ...
}
configure({ width: 100 });
configure("auto");
configure("automatic");
```

还有一种字面类型：布尔字面类型。只有两种布尔字面类型，`true` 和 `false`。`boolean` 类型本身实际上只是 `true | false` 的联合类型的别名。

### 字面量推断

如果你使用对象来初始化变量，TypeScript 会假设该对象的属性可能会在后续的代码中发生变化。例如，如果你编写了如下代码：

```ts twoslash
declare const someCondition: boolean;
// ---cut---
const obj = { counter: 0 };
if (someCondition) {
  obj.counter = 1;
}
```

TypeScript 不会认为将 `1` 赋值给之前为 `0` 的字段是一个错误。换句话说，`obj.counter` 必须具有类型 `number`，而不是 `0`，因为类型用于确定*读取*和*写入*行为。

字符串也是同样的情况：

```ts twoslash
// @errors: 2345
declare function handleRequest(url: string, method: "GET" | "POST"): void;
// ---cut---
const req = { url: "https://example.com", method: "GET" };
handleRequest(req.url, req.method);
```

在上面的例子中，`req.method` 被推断为 `string`，而不是 `"GET"`。因为创建 `req` 和调用 `handleRequest` 之间可能会有代码对 `req.method` 进行赋值，例如将 `"GUESS"` 赋给 `req.method`，TypeScript 认为此代码存在错误。

有两种方法可以解决这个问题。

1. 可以通过在任一位置添加类型断言来改变推断结果：

   ```ts twoslash
   declare function handleRequest(url: string, method: "GET" | "POST"): void;
   // ---cut---
   // 改变 1：
   const req = { url: "https://example.com", method: "GET" as "GET" };
   // 改变 2：
   handleRequest(req.url, req.method as "GET");
   ```

   改变 1 的意思是 "我打算让 `req.method` 始终具有字面量类型 `"GET"`"，阻止在之后将 `"GUESS"` 赋值给该字段。
   改变 2 的意思是 "我出于某些原因知道 `req.method` 的值为 `"GET"`"。

2. 可以使用 `as const` 将整个对象转换为字面量类型：

   ```ts twoslash
   declare function handleRequest(url: string, method: "GET" | "POST"): void;
   // ---cut---
   const req = { url: "https://example.com", method: "GET" } as const;
   handleRequest(req.url, req.method);
   ```

   `as const` 后缀的作用类似于 `const`，但是针对的是类型系统，确保所有属性都被赋予字面量类型，而不是更一般的类型，如 `string` 或 `number`。

## `null` 和 `undefined`

JavaScript 有两个基本值，用于表示缺失或未初始化的值：`null` 和 `undefined`。

TypeScript 也有两个相应的*类型*，名称相同。这些类型的特性取决于是否打开了 `strictNullChecks` 选项。

### `strictNullChecks` 关闭

如果 `strictNullChecks` *关闭*，可能为 `null` 或 `undefined` 的值仍然可以正常访问，并且可以将 `null` 和 `undefined` 赋值给任何类型的属性。这类似于没有空值检查的语言（例如 C#、Java）的行为。不检查这些值的缺失往往是错误的主要来源；建议尽可能打开 `strictNullChecks`。

### `strictNullChecks` 打开

如果 `strictNullChecks` *打开*，当一个值为 `null` 或 `undefined` 时，你需要在使用该值的方法或属性之前进行检查。就像在使用可选属性之前检查 `undefined` 一样，我们可以使用*缩小类型*来检查可能为 `null` 的值：

```ts twoslash
function doSomething(x: string | null) {
  if (x === null) {
    // 什么都不做
  } else {
    console.log("Hello, " + x.toUpperCase());
  }
}
```

### 非空断言操作符（后缀 `!`）

TypeScript 还有一个特殊的语法，用于在不进行任何显式检查的情况下去除类型中的 `null` 和 `undefined`。在任何表达式后面写 `!` 实际上是断言该值不是 `null` 或 `undefined`：

```ts twoslash
function liveDangerously(x?: number | null) {
  // 没有错误
  console.log(x!.toFixed());
}
```

与其他类型断言一样，这不会改变你的代码的运行行为，因此只有在你知道该值*不可能*为 `null` 或 `undefined` 时才使用 `!`。

## 枚举

枚举是 TypeScript 添加到 JavaScript 中的功能，它允许描述一个值，该值可以是一组可能的命名常量之一。与大多数 TypeScript 特性不同，这*不是* JavaScript 类型级别的添加，而是添加到语言和运行时的功能。因此，你应该知道这个特性的存在，但除非你确定，否则最好不要使用。你可以在[枚举参考页面](https://www.typescriptlang.org/docs/handbook/enums.html)上阅读更多关于枚举的信息。

## 不常见的原始类型

值得一提的是 JavaScript 中的其他基本类型，在类型系统中也有相应的表示。我们在这里不会深入讨论。

##### `bigint`

从 ES2020 开始，JavaScript 中有一个用于表示非常大整数的基本类型 `BigInt`：

```ts twoslash
// @target: es2020

// 通过 BigInt 函数创建一个 bigint
const oneHundred: bigint = BigInt(100);

// 通过字面量语法创建一个 BigInt
const anotherHundred: bigint = 100n;
```

你可以在 [TypeScript 3.2 发布说明](/docs/handbook/release-notes/typescript-3-2.html#bigint)中了解更多关于 `BigInt` 的信息。

##### `symbol`

JavaScript 中有一个用于通过 `Symbol()` 函数创建全局唯一引用的基本类型：

```ts twoslash
// @errors: 2367
const firstName = Symbol("name");
const secondName = Symbol("name");

if (firstName === secondName) {
  // 永远不会发生
}
```

你可以在 [Symbols 参考页面](https://www.typescriptlang.org/docs/handbook/symbols.html)中了解更多相关信息。
