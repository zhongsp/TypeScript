# 对象类型

在 JavaScript 中，对象是我们最基本的组织和传递数据的方式。在 TypeScript 中，我们通过*对象类型*来表示它们。

正如我们所见，它们可以是匿名的：

```ts twoslash
function greet(person: { name: string; age: number }) {
  //                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  return "Hello " + person.name;
}
```

或者可以通过接口来命名：

```ts twoslash
interface Person {
  //      ^^^^^^
  name: string;
  age: number;
}

function greet(person: Person) {
  return "Hello " + person.name;
}
```

或者使用类型别名来命名：

```ts twoslash
type Person = {
  // ^^^^^^
  name: string;
  age: number;
};

function greet(person: Person) {
  return "Hello " + person.name;
}
```

在上面的三个示例中，我们编写了接受包含属性 `name`（必须是 `string` 类型）和 `age`（必须是 `number` 类型）的对象的函数。

## 快速参考

我们为 [`type` 和 `interface`](https://www.typescriptlang.org/cheatsheets) 都提供了备忘单，如果你想快速查看重要的常用语法，可以看一下。

## 属性修饰符

对象类型中的每个属性可以指定一些内容：类型、属性是否可选以及属性是否可写。

### 可选属性

大部分情况下，我们处理的对象*可能*会有某些属性设置。在这种情况下，我们可以通过在属性名称末尾添加问号（`?`）来将这些属性标记为*可选*。

```ts twoslash
interface Shape {}
declare function getShape(): Shape;

// ---cut---
interface PaintOptions {
  shape: Shape;
  xPos?: number;
  //  ^
  yPos?: number;
  //  ^
}

function paintShape(opts: PaintOptions) {
  // ...
}

const shape = getShape();
paintShape({ shape });
paintShape({ shape, xPos: 100 });
paintShape({ shape, yPos: 100 });
paintShape({ shape, xPos: 100, yPos: 100 });
```

在此示例中，`xPos` 和 `yPos` 都被视为可选的。我们可以选择提供其中任意一个，因此上面对 `paintShape` 的每个调用都是有效的。可选性实际上表示，如果属性被设置，它必须具有特定的类型。

我们也可以读取这些属性的值——但是在 [`strictNullChecks`](/tsconfig#strictNullChecks) 下，TypeScript 会告诉我们它们可能是 `undefined`。

```ts twoslash
interface Shape {}
declare function getShape(): Shape;

interface PaintOptions {
  shape: Shape;
  xPos?: number;
  yPos?: number;
}

// ---cut---
function paintShape(opts: PaintOptions) {
  let xPos = opts.xPos;
  //              ^?
  let yPos = opts.yPos;
  //              ^?
  // ...
}
```

在 JavaScript 中，即使属性从未被设置，我们仍然可以访问它——它只会给我们返回 `undefined` 的值。我们只需要通过检查 `undefined` 来特殊处理它。

```ts twoslash
interface Shape {}
declare function getShape(): Shape;

interface PaintOptions {
  shape: Shape;
  xPos?: number;
  yPos?: number;
}

// ---cut---
function paintShape(opts: PaintOptions) {
  let xPos = opts.xPos === undefined ? 0 : opts.xPos;
  //  ^?
  let yPos = opts.yPos === undefined ? 0 : opts.yPos;
  //  ^?
  // ...
}
```

需要注意的是，设置未指定值的默认值的这种模式非常常见，JavaScript 提供了相应的语法来支持它。

```ts twoslash
interface Shape {}
declare function getShape(): Shape;

interface PaintOptions {
  shape: Shape;
  xPos?: number;
  yPos?: number;
}

// ---cut---
function paintShape({ shape, xPos = 0, yPos = 0 }: PaintOptions) {
  console.log("x 坐标为", xPos);
  //                      ^?
  console.log("y 坐标为", yPos);
  //                      ^?
  // ...
}
```

在这里，我们使用了[解构赋值模式](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) 来定义 `paintShape` 的参数，并为 `xPos` 和 `yPos` 提供了[默认值](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#默认值)。现在，在 `paintShape` 函数体内，`xPos` 和 `yPos` 都是必然存在的，但对于 `paintShape` 的调用者来说是可选的。

> 注意，目前无法在解构赋值模式中放置类型注解。
> 这是因为在 JavaScript 中，以下语法已经具有不同的含义。
>
> ```ts twoslash
> // @noImplicitAny: false
> // @errors: 2552 2304
> interface Shape {}
> declare function render(x: unknown);
> // ---cut---
> function draw({ shape: Shape, xPos: number = 100 /*...*/ }) {
>   render(shape);
>   render(xPos);
> }
> ```
>
> 在对象解构赋值模式中，`shape: Shape` 的意思是“获取属性 `shape` 并在本地重新定义为名为 `Shape` 的变量。
> 同样，`xPos: number` 创建一个名为 `number` 的变量，其值基于参数的 `xPos`。

### 只读属性

在 TypeScript 中，属性也可以标记为 `readonly`。虽然在运行时不会改变任何行为，但标记为 `readonly` 的属性在类型检查期间无法被写入。

```ts twoslash
// @errors: 2540
interface SomeType {
  readonly prop: string;
}

function doSomething(obj: SomeType) {
  // 我们可以读取‘obj.prop’的值。
  console.log(`prop 的值为 '${obj.prop}'。`);

  // 但是我们无法重新赋值。
  obj.prop = "hello";
}
```

使用 `readonly` 修饰符并不一定意味着一个值是完全不可变的，或者换句话说，它的内部内容无法改变。它只是表示该属性本身无法被改变。

```ts twoslash
// @errors: 2540
interface Home {
  readonly resident: { name: string; age: number };
}

function visitForBirthday(home: Home) {
  // 我们可以读取和更新‘home.resident’的属性。
  console.log(`生日快乐，${home.resident.name}！`);
  home.resident.age++;
}

function evict(home: Home) {
  // 但是我们无法直接写入‘Home’的‘resident’属性本身。
  home.resident = {
    name: "Victor the Evictor",
    age: 42,
  };
}
```

适当调整对 `readonly` 的预期非常重要。在开发期间，它有助于 TypeScript 明确对象的使用方式。当检查两种类型是否兼容时，TypeScript 不会考虑这两种类型的属性是否为 `readonly`，所以通过别名，`readonly` 属性也可以发生变化。

```ts twoslash
interface Person {
  name: string;
  age: number;
}

interface ReadonlyPerson {
  readonly name: string;
  readonly age: number;
}

let writablePerson: Person = {
  name: "Person McPersonface",
  age: 42,
};

// 可行
let readonlyPerson: ReadonlyPerson = writablePerson;

console.log(readonlyPerson.age); // 输出 '42'
writablePerson.age++;
console.log(readonlyPerson.age); // 输出 '43'
```

使用[映射修饰符](/zh/docs/handbook/2/mapped-types.html#mapping-modifiers)，可以去除 `readonly` 特性。

### 索引签名

有时候你预先并不知道所有属性的名称，但是你知道这些值的大致信息。

在这种情况下，你可以使用索引签名来描述可能的值类型，例如：

```ts twoslash
declare function getStringArray(): StringArray;
// ---cut---
interface StringArray {
  [index: number]: string;
}

const myArray: StringArray = getStringArray();
const secondItem = myArray[1];
//     ^?
```

上面的例子中，我们有一个 `StringArray` 接口，它具有一个索引签名。这个索引签名表示当使用 `number` 值对 `StringArray` 进行索引时，它将返回 `string` 类型的值。

索引签名属性只允许某些类型：`string`、`number`、`symbol`、模板字符串模式，以及只包含这些类型的联合类型。

<details>
    <summary>它是可以同时支持两种类型的索引器的...</summary>
    <p>它是可以同时支持两种类型的索引器的，但是数字索引器返回的类型必须是字符串索引器返回类型的子类型。这是因为在使用 <code>number</code> 进行索引时，JavaScript 实际上会将其转换为 <code>string</code>，然后再对对象进行索引。这意味着使用 <code>100</code>（一个 `number`）进行索引与使用 <code>"100"</code>（一个 <code>string</code>）进行索引是一样的，所以两者需要保持一致。</p>

```ts twoslash
// @errors: 2413
// @strictPropertyInitialization: false
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

// 错误：使用数字字符串进行索引可能会得到一个完全不同类型的 Animal！
interface NotOkay {
  [x: number]: Animal;
  [x: string]: Dog;
}
```

</details>

虽然字符串索引签名是描述“字典”模式的强大方式，但它也强制要求所有属性与它们的返回类型匹配。这是因为字符串索引声明了 `obj.property` 也可以使用 `obj["property"]` 访问。在下面的例子中，`name` 的类型与字符串索引的类型不匹配，类型检查器会报错：

```ts twoslash
// @errors: 2411
// @errors: 2411
interface NumberDictionary {
  [index: string]: number;

  length: number; // 可行
  name: string;
}
```

然而，如果索引签名是属性类型的联合类型，不同类型的属性是可以接受的：

```ts twoslash
interface NumberOrStringDictionary {
  [index: string]: number | string;
  length: number; // 可行，length 是一个数字
  name: string; // 可行，name 是一个字符串
}
```

最后，你可以将索引签名设置为 `readonly`，以防止对索引项进行赋值：

```ts twoslash
declare function getReadOnlyStringArray(): ReadonlyStringArray;
// ---cut---
// @errors: 2542
interface ReadonlyStringArray {
  readonly [index: number]: string;
}

let myArray: ReadonlyStringArray = getReadOnlyStringArray();
myArray[2] = "Mallory";
```

你不能设置 `myArray[2]`，因为索引签名是 `readonly` 的。

## 多余属性检查

对象被赋予类型的位置和方式会对类型系统产生影响。其中一个关键例子是多余属性检查（excess property checking），它在对象创建并赋值给对象类型时更加彻底地验证对象。

```ts twoslash
// @errors: 2345 2739
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  return {
    color: config.color || "red",
    area: config.width ? config.width * config.width : 20,
  };
}

let mySquare = createSquare({ colour: "red", width: 100 });
```

注意，传递给 `createSquare` 的参数中将 `color` 拼写为 *`colour`* 而不是 `color`。在普通的 JavaScript 中，这种情况会悄无声息地失败。

你可以认为这个程序是正确类型化的，因为 `width` 属性是兼容的，没有 `color` 属性存在，并且额外的 `colour` 属性是无关紧要的。

然而，TypeScript 认为这段代码可能存在 bug。对象字面量在赋值给其他变量或作为实参传递时会经历*额外的属性检查*。如果对象字面量具有任何目标类型不具备的属性，就会产生错误：

```ts twoslash
// @errors: 2345 2739
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  return {
    color: config.color || "red",
    area: config.width ? config.width * config.width : 20,
  };
}
// ---cut---
let mySquare = createSquare({ colour: "red", width: 100 });
```

绕过这些检查实际上非常简单。最简单的方法是使用类型断言：

```ts twoslash
// @errors: 2345 2739
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  return {
    color: config.color || "red",
    area: config.width ? config.width * config.width : 20,
  };
}
// ---cut---
let mySquare = createSquare({ width: 100, opacity: 0.5 } as SquareConfig);
```

然而，如果你确定该对象可以具有一些额外的属性，并且这些属性在某种特殊方式下使用，一种更好的方法是在对象上添加字符串索引签名。如果 `SquareConfig` 可以具有上述类型的 `color` 和 `width` 属性，但*还*可以具有任意数量的其他属性，那么我们可以这样定义它：

```ts twoslash
interface SquareConfig {
  color?: string;
  width?: number;
  [propName: string]: any;
}
```

在这里，我们表示 `SquareConfig` 可以具有任意数量的属性，只要它们不是 `color` 或 `width`，它们的类型就无关紧要。

最后一种绕过这些检查的方式可能有点令人惊讶，那就是将对象赋值给另一个变量：由于对 `squareOptions` 进行赋值不会进行多余属性检查，编译器不会报错：

```ts twoslash
interface SquareConfig {
  color?: string;
  width?: number;
  [propName: string]: any;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  return {
    color: config.color || "red",
    area: config.width ? config.width * config.width : 20,
  };
}
// ---cut---
let squareOptions = { colour: "red", width: 100 };
let mySquare = createSquare(squareOptions);
```

上述解决方法只适用于 `squareOptions` 和 `SquareConfig` 之间存在公共属性的情况。在这个例子中，公共属性是 `width`。然而，如果变量没有任何公共对象属性，这种解决方法将失败。例如：

```ts twoslash
// @errors: 2559
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  return {
    color: config.color || "red",
    area: config.width ? config.width * config.width : 20,
  };
}
// ---cut---
let squareOptions = { colour: "red" };
let mySquare = createSquare(squareOptions);
```

请记住，对于上述简单的代码，你最好不应该试图绕过这些检查。对于具有方法和状态的更复杂的对象字面量，你可能需要牢记这些技巧，但是绝大多数多余属性错误实际上是 bug。

这意味着，如果你在处理诸如选项包（option bags）之类的问题时遇到多余属性检查问题，你可能需要重新检查一些类型声明。在这种情况下，如果将同时具有 `color` 或 `colour` 属性的对象传递给 `createSquare` 是允许的，那么你应该修正 `SquareConfig` 的定义以反映这一点。

## 拓展类型

在类型系统中，有时候会存在一些更具体版本的类型。例如，我们可能有一个 `BasicAddress` 类型，用于描述在美国发送信函和包裹所需的字段。

```ts twoslash
interface BasicAddress {
  name?: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}
```

在某些情况下，这已经足够了，但是地址经常会有一个单元号与之关联，比如某个地址对应的建筑物有多个单元。我们可以描述 `AddressWithUnit` 类型。

<!-- prettier-ignore -->
```ts twoslash
interface AddressWithUnit {
  name?: string;
  unit: string;
//^^^^^^^^^^^^^
  street: string;
  city: string;
  country: string;
  postalCode: string;
}
```

这样做是可以的，但是这里的缺点是，我们不得不在我们的更改中重复所有其他来自 `BasicAddress` 的字段，然而我们想要做的更改只是简单地添加。相反，我们可以扩展原始的 `BasicAddress` 类型来达到同样的效果，这样只需添加唯一属于 `AddressWithUnit` 的新字段就可以了。

```ts twoslash
interface BasicAddress {
  name?: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

interface AddressWithUnit extends BasicAddress {
  unit: string;
}
```

在 `interface` 上使用 `extends` 关键字可以让我们有效地复制其他命名类型的成员，并添加任何我们想要的新成员。这可以减少我们必须编写的类型声明的样板代码量，并且可以表明多个对同一属性的不同声明可能相关联。例如，`AddressWithUnit` 不需要重复 `street` 属性，并且因为 `street` 来源于 `BasicAddress`，读者会知道这两个类型在某种程度上是相关的。

`interface` 也可以从多个类型进行扩展。

```ts twoslash
interface Colorful {
  color: string;
}

interface Circle {
  radius: number;
}

interface ColorfulCircle extends Colorful, Circle {}

const cc: ColorfulCircle = {
  color: "red",
  radius: 42,
};
```

## 交叉类型

在 TypeScript 中，除了使用 `interface` 来扩展已有类型外，还提供了另一种构造方式，称为*交叉类型（intersection types）*，主要用于组合现有的对象类型。

交叉类型使用 `&` 运算符进行定义。

```ts twoslash
interface Colorful {
  color: string;
}
interface Circle {
  radius: number;
}

type ColorfulCircle = Colorful & Circle;
```

在这个例子中，我们对 `Colorful` 和 `Circle` 进行了交叉，生成了新类型，该类型具有 `Colorful` *和* `Circle` 的所有成员。

```ts twoslash
// @errors: 2345
interface Colorful {
  color: string;
}
interface Circle {
  radius: number;
}
// ---cut---
function draw(circle: Colorful & Circle) {
  console.log(`颜色是：${circle.color}`);
  console.log(`半径是：${circle.radius}`);
}

// 正常
draw({ color: "蓝", radius: 42 });

// 错误
draw({ color: "红", raidus: 42 });
```

## 接口 vs. 交叉类型

我们刚刚讨论了两种将相似但实际上略有不同的类型组合在一起的方法。使用接口，我们可以使用 `extends` 子句从其他类型进行扩展，而交叉类型后给结果起类型别名也与之相似，并且我们可以。两者之间的主要区别在于如何处理冲突，而这种区别通常是你选择接口还是交叉类型的主要依据之一。

<!--
例如，两个类型可以在接口中声明相同的属性。

TODO -->

## 泛型对象类型

让我们想象 `Box` 类型，它可以包含任何值——`string` 值、`number` 值、`Giraffe` 值，或者其他任何类型的值。

```ts twoslash
interface Box {
  contents: any;
}
```

目前，`contents` 属性的类型为 `any`，这样也不是不能工作，但可能会在后续操作中导致错误。

我们可以使用 `unknown`，但这意味着在我们已经知道 `contents` 的类型的情况下，我们需要进行预防性检查，或者使用容易出错的类型断言。

```ts twoslash
interface Box {
  contents: unknown;
}

let x: Box = {
  contents: "hello world",
};

// 我们可以检查‘x.contents’
if (typeof x.contents === "string") {
  console.log(x.contents.toLowerCase());
}

// 或者我们可以使用类型断言
console.log((x.contents as string).toLowerCase());
```

一种类型安全的方法是为每种类型的 `contents` 创建不同的 `Box` 类型。

```ts twoslash
// @errors: 2322
interface NumberBox {
  contents: number;
}

interface StringBox {
  contents: string;
}

interface BooleanBox {
  contents: boolean;
}
```

但这样的话，我们将不得不创建不同的函数或函数的重载来操作这些类型。

```ts twoslash
interface NumberBox {
  contents: number;
}

interface StringBox {
  contents: string;
}

interface BooleanBox {
  contents: boolean;
}
// ---cut---
function setContents(box: StringBox, newContents: string): void;
function setContents(box: NumberBox, newContents: number): void;
function setContents(box: BooleanBox, newContents: boolean): void;
function setContents(box: { contents: any }, newContents: any) {
  box.contents = newContents;
}
```

有很多样板代码。而且，以后我们可能需要引入新的类型和重载。这很令人沮丧，因为我们的盒子类型和重载实际上是相同的。

相反，我们可以创建声明*类型参数*的*泛型* `Box` 类型。

```ts twoslash
interface Box<Type> {
  contents: Type;
}
```

你可以将其理解为“`Type` 类型的 `Box` 是具有类型为 `Type` 的 `contents` 的东西”。在稍后引用 `Box` 时，我们必须在 `Type` 的位置上给出一个*类型参数*。

```ts twoslash
interface Box<Type> {
  contents: Type;
}
// ---cut---
let box: Box<string>;
```

将 `Box` 视为一个真实类型的模板，其中 `Type` 是一个占位符，将被替换为其他类型。当 TypeScript 看到 `Box<string>` 时，它将用 `string` 替换 `Box<Type>` 中的每个 `Type` 实例，最终使用类似 `{ contents: string }` 的东西进行处理。换句话说，`Box<string>` 和我们之前的 `StringBox` 完全相同。

```ts twoslash
interface Box<Type> {
  contents: Type;
}
interface StringBox {
  contents: string;
}

let boxA: Box<string> = { contents: "hello" };
boxA.contents;
//   ^?

let boxB: StringBox = { contents: "world" };
boxB.contents;
//   ^?
```

`Box` 是可重用的，因为 `Type` 可以替换为任何类型。这意味着当我们需要一个新类型的盒子时，我们根本不需要声明新的 `Box` 类型（尽管如果我们愿意，确实可以声明新的类型）。

```ts twoslash
interface Box<Type> {
  contents: Type;
}

interface Apple {
  // ....
}

// 等同于‘{ contents: Apple }’。
type AppleBox = Box<Apple>;
```

这也意味着我们可以通过使用[泛型函数](/zh/docs/handbook/2/functions.html#泛型函数)来完全避免重载。

```ts twoslash
interface Box<Type> {
  contents: Type;
}

// ---cut---
function setContents<Type>(box: Box<Type>, newContents: Type) {
  box.contents = newContents;
}
```

值得注意的是，类型别名也可以是泛型的。假如我们有 `Box<Type>` 接口，它是：

```ts twoslash
interface Box<Type> {
  contents: Type;
}
```

可以使用类型别名来替代：

```ts twoslash
type Box<Type> = {
  contents: Type;
};
```

由于类型别名不像接口那样只能描述对象类型，因此我们还可以使用它们来编写其他类型的通用辅助类型。

```ts twoslash
// @errors: 2575
type OrNull<Type> = Type | null;

type OneOrMany<Type> = Type | Type[];

type OneOrManyOrNull<Type> = OrNull<OneOrMany<Type>>;
//   ^?

type OneOrManyOrNullStrings = OneOrManyOrNull<string>;
//   ^?
```

稍后我们会回到类型别名。

### `Array` 类型

泛型对象类型通常是独立于其包含元素类型的容器类型。这样设计数据结构可以使其在不同的数据类型之间可重用。

事实上，在整个手册中我们一直在使用一种类似的类型：`Array` 类型。当我们写出像 `number[]` 或 `string[]` 这样的类型时，实际上它们是 `Array<number>` 和 `Array<string>` 的简写形式。

```ts twoslash
function doSomething(value: Array<string>) {
  // ...
}

let myArray: string[] = ["hello", "world"];

// 以下两种方式都可以！
doSomething(myArray);
doSomething(new Array("hello", "world"));
```

与上面的 `Box` 类型类似，`Array` 本身也是泛型类型。

```ts twoslash
// @noLib: true
interface Number {}
interface String {}
interface Boolean {}
interface Symbol {}
// ---cut---
interface Array<Type> {
  /**
   * 获取或设置数组的长度。
   */
  length: number;

  /**
   * 从数组中移除最后一个元素并返回它。
   */
  pop(): Type | undefined;

  /**
   * 向数组追加新元素，并返回数组的新长度。
   */
  push(...items: Type[]): number;

  // ...
}
```

现代 JavaScript 还提供了其他泛型的数据结构，如 `Map<K, V>`、`Set<T>` 和 `Promise<T>`。所有这些都意味着由于 `Map`、`Set` 和 `Promise` 的行为方式，它们可以适用于任何类型的集合。

### `ReadonlyArray` 类型

`ReadonlyArray` 是一种特殊类型，用于描述不应该被修改的数组。

```ts twoslash
// @errors: 2339
function doStuff(values: ReadonlyArray<string>) {
  // 我们可以从‘values’中读取...
  const copy = values.slice();
  console.log(`The first value is ${values[0]}`);

  // ...但是我们不能修改‘values’。
  values.push("hello!");
}
```

与属性的 `readonly` 修饰符类似，它主要是一个用于表达意图的工具。当我们看到返回 `ReadonlyArray` 的函数时，它告诉我们不应该对其内容进行任何修改；而当我们看到接受 `ReadonlyArray` 的函数时，它告诉我们可以将任何数组传递给该函数，而不必担心它会更改其内容。

与 `Array` 不同，`ReadonlyArray` 没有构造函数。

```ts twoslash
// @errors: 2693
new ReadonlyArray("red", "green", "blue");
```

相反，我们可以将普通的 `Array` 赋值给 `ReadonlyArray`。

```ts twoslash
const roArray: ReadonlyArray<string> = ["red", "green", "blue"];
```

正如 TypeScript 提供了 `Array<Type>` 的简写语法 `Type[]`，它还提供了 `ReadonlyArray<Type>` 的简写语法 `readonly Type[]`。

```ts twoslash
// @errors: 2339
function doStuff(values: readonly string[]) {
  //                     ^^^^^^^^^^^^^^^^^
  // 我们可以从‘values’中读取...
  const copy = values.slice();
  console.log(`The first value is ${values[0]}`);

  // ...但是我们不能修改‘values’。
  values.push("hello!");
}
```

最后需要注意的是，与属性的 `readonly` 修饰符不同，普通的 `Array` 和 `ReadonlyArray` 之间的可赋值性不是双向的。

```ts twoslash
// @errors: 4104
let x: readonly string[] = [];
let y: string[] = [];

x = y;
y = x;
```

### 元组类型

*元组类型*是另一种 `Array` 类型，它确切地知道它包含多少个元素，以及在特定位置包含的确切类型。

```ts twoslash
type StringNumberPair = [string, number];
//                      ^^^^^^^^^^^^^^^^
```

在这里，`StringNumberPair` 是一个包含 `string` 和 `number` 的元组类型。与 `ReadonlyArray` 类似，它在运行时没有表示，但对于 TypeScript 来说非常重要。对于类型系统来说，`StringNumberPair` 描述了一个数组，其 `0` 索引包含一个 `string`，而 `1` 索引包含一个 `number`。

```ts twoslash
function doSomething(pair: [string, number]) {
  const a = pair[0];
  //    ^?
  const b = pair[1];
  //    ^?
  // ...
}

doSomething(["hello", 42]);
```

如果我们尝试超出元素数量的索引，将会得到一个错误。

```ts twoslash
// @errors: 2493
function doSomething(pair: [string, number]) {
  // ...

  const c = pair[2];
}
```

我们还可以使用 JavaScript 的数组解构来[解构元组](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#解构数组)。

```ts twoslash
function doSomething(stringHash: [string, number]) {
  const [inputString, hash] = stringHash;

  console.log(inputString);
  //          ^?

  console.log(hash);
  //          ^?
}
```

> 元组类型在高度基于约定的 API 中非常有用，这种 API 中每个元素的含义是“显而易见的”。
> 这使得我们在解构它们时可以根据需要为变量命名。
> 在上面的示例中，我们能够将元素 `0` 和 `1` 命名为任何我们想要的名称。
>
> 然而，由于不是每个用户都对什么是显而易见的持有相同的观点，因此再三考虑是否为你的 API 使用具有描述性属性名称的对象比较好。

除了长度检查外，简单的元组类型与声明具有特定索引属性和使用数字字面类型声明 `length` 的 `Array` 版本的类型是等效的。

```ts twoslash
interface StringNumberPair {
  // 特别的属性
  length: 2;
  0: string;
  1: number;

  // 其他‘Array<string | number>’的成员...
  slice(start?: number, end?: number): Array<string | number>;
}
```

另一个你可能感兴趣的是，元组可以通过在元素类型后面写一个问号 (`?`) 来拥有可选属性。可选的元组元素只能出现在末尾，并且也会影响 `length` 的类型。

```ts twoslash
type Either2dOr3d = [number, number, number?];

function setCoordinate(coord: Either2dOr3d) {
  const [x, y, z] = coord;
  //           ^?

  console.log(`所给坐标有 ${coord.length} 个维度`);
  //                             ^?
}
```

元组还可以拥有剩余元素，它们必须是数组/元组类型。

```ts twoslash
type StringNumberBooleans = [string, number, ...boolean[]];
type StringBooleansNumber = [string, ...boolean[], number];
type BooleansStringNumber = [...boolean[], string, number];
```

- `StringNumberBooleans` 描述了一个元组，其前两个元素分别是 `string` 和 `number`，但后面可以有任意数量的 `boolean`。
- `StringBooleansNumber` 描述了一个元组，其第一个元素是 `string`，然后是任意数量的 `boolean`，最后是一个 `number`。
- `BooleansStringNumber` 描述了一个元组，其起始元素是任意数量的 `boolean`，然后是一个 `string`，最后是一个 `number`。

带有剩余元素的元组没有固定的“length”——它只有一组在不同位置上的已知元素。

```ts twoslash
type StringNumberBooleans = [string, number, ...boolean[]];
// ---cut---
const a: StringNumberBooleans = ["hello", 1];
const b: StringNumberBooleans = ["beautiful", 2, true];
const c: StringNumberBooleans = ["world", 3, true, false, true, false, true];
```

为什么可选和剩余元素会有用呢？这使得 TypeScript 能够将元组与参数列表相对应。元组类型可以在[剩余参数和剩余实参](/zh/docs/handbook/2/functions.html#剩余参数和剩余实参) 中使用，因此以下代码：

```ts twoslash
function readButtonInput(...args: [string, number, ...boolean[]]) {
  const [name, version, ...input] = args;
  // ...
}
```

基本上等同于：

```ts twoslash
function readButtonInput(name: string, version: number, ...input: boolean[]) {
  // ...
}
```

这在你想要使用剩余参数接收可变数量的实参，并且你需要确保有最小数量的元素，但又不想引入中间变量时非常方便。

<!--
TODO 我们是否需要这个例子？

例如，想象我们需要编写一个函数，根据传入的参数将数字相加。

```ts twoslash
function sum(...args: number[]) {
    // ...
}
```

我们可能觉得，至少需要传入 2 个元素才有意义，所以我们希望要求调用者至少提供 2 个参数。
第一个尝试可能是：

```ts twoslash
function foo(a: number, b: number, ...args: number[]) {
    args.unshift(a, b);

    let result = 0;
    for (const value of args) {
        result += value;
    }
    return result;
}
```

-->

### `readonly` 元组类型

关于元组类型，最后还有一个要注意的地方——元组类型有 `readonly` 变体，可以通过在前面加上 `readonly` 修饰符来指定，就像数组简写语法一样。

```ts twoslash
function doSomething(pair: readonly [string, number]) {
  //                       ^^^^^^^^^^^^^^^^^^^^^^^^^
  // ...
}
```

正如你所预期的，不允许在 `readonly` 元组的任何属性上进行写操作。

```ts twoslash
// @errors: 2540
function doSomething(pair: readonly [string, number]) {
  pair[0] = "hello!";
}
```

在大多数代码中，元组通常被创建后不会被修改，因此在可能的情况下将类型注释为 `readonly` 元组是一个很好的默认选择。这一点也很重要，因为带有 `const` 断言的数组字面量将被推断为具有 `readonly` 元组类型。

```ts twoslash
// @errors: 2345
let point = [3, 4] as const;

function distanceFromOrigin([x, y]: [number, number]) {
  return Math.sqrt(x ** 2 + y ** 2);
}

distanceFromOrigin(point);
```

在这个例子中，`distanceFromOrigin` 从不修改其元素，但它期望一个可变的元组。由于 `point` 的类型被推断为 `readonly [3, 4]`，它与 `[number, number]` 不兼容，因为这个类型无法保证 `point` 的元素不会被修改。

<!-- ## 其他种类的对象成员

大多数对象类型的声明包括：

### 方法语法

### 调用签名

### 构造签名

### 索引签名 -->
