# 函数进阶

函数是任何应用程序的基本构建块，它们可以是本地函数、从另一个模块导入的函数或者类的方法。它们也是值，并且与其他值一样，TypeScript 有很多方法来描述函数的调用方式。让我们来学习如何编写用于描述函数的类型。

## 函数类型表达式

描述函数的最简单方式是使用*函数类型表达式*。这些类型在语法上类似于箭头函数：

```ts twoslash
function greeter(fn: (a: string) => void) {
  fn("Hello, World");
}

function printToConsole(s: string) {
  console.log(s);
}

greeter(printToConsole);
```

`(a: string) => void` 的语法表示“有一个名为 `a` 的参数，`a` 的类型为 `string`，且没有返回值的函数”。就像函数声明一样，如果没有指定参数类型，它会隐式地被推断为 `any` 类型。

> 注意，参数名是**必需的**。函数类型 `(string) => void` 的意思是“这个函数带有一个名为 `string` 的参数，这个参数的类型为 `any`”！

当然，我们可以使用类型别名为函数类型命名：

```ts twoslash
type GreetFunction = (a: string) => void;
function greeter(fn: GreetFunction) {
  // ...
}
```

## 调用签名

在 JavaScript 中，函数除了可以被调用之外，还可以有其他属性。然而，函数类型表达式语法不允许声明属性。如果我们想描述带有属性的可调用对象，可以在其对象类型中编写一个*调用签名（call signature）*：

```ts twoslash
type DescribableFunction = {
  description: string;
  (someArg: number): boolean;
};
function doSomething(fn: DescribableFunction) {
  console.log(fn.description + " 返回了 " + fn(6));
}

function myFunc(someArg: number) {
  return someArg > 3;
}
myFunc.description = "默认描述";

doSomething(myFunc);
```

请注意，其语法与函数类型表达式略有不同——在参数列表和返回类型之间使用 `:`，而不是 `=>`。

## 构造签名

JavaScript 函数还可以使用 `new` 运算符调用。TypeScript 将这些称为“构造函数”，因为它们通常会创建一个新对象。你可以在调用签名前面添加 `new` 关键字，以编写一个“构造签名”：

```ts twoslash
type SomeObject = any;
// ---cut---
type SomeConstructor = {
  new (s: string): SomeObject;
};
function fn(ctor: SomeConstructor) {
  return new ctor("你好");
}
```

某些对象，比如 JavaScript 的 `Date` 对象，既可以在使用也可以在不使用 `new` 的情况下调用。你可以任意组合调用和构造签名在同一类型中：

```ts twoslash
interface CallOrConstruct {
  new (s: string): Date;
  (n?: number): string;
}
```

## 泛型函数

通常我们会编写一些函数，其中输入的类型与输出的类型相关联，或者两个输入的类型以某种方式相关联。让我们考虑一个返回数组的第一个元素的函数：

```ts twoslash
function firstElement(arr: any[]) {
  return arr[0];
}
```

这个函数完成了它的工作，但不太好的是它的返回类型是 `any`。如果函数返回数组元素的类型会更好。

在 TypeScript 中，当我们想要描述两个值之间的对应关系时，我们使用*泛型*。我们可以在函数签名中声明*类型参数*：

```ts twoslash
function firstElement<Type>(arr: Type[]): Type | undefined {
  return arr[0];
}
```

通过在函数中添加类型参数 `Type`，并在两个地方使用它，我们在函数的输入（数组）和输出（返回值）之间建立了一个链接。现在当我们调用它时，会得到更具体的类型：

```ts twoslash
declare function firstElement<Type>(arr: Type[]): Type | undefined;
// ---cut---
// s 的类型是 'string'
const s = firstElement(["a", "b", "c"]);
// n 的类型是 'number'
const n = firstElement([1, 2, 3]);
// u 的类型是 undefined
const u = firstElement([]);
```

### 类型推断

请注意，在这个示例中我们不必指定 `Type`。TypeScript 会自动*推断*类型。

我们也可以使用多个类型参数。例如，`map` 函数的独立版本如下：

```ts twoslash
// prettier-ignore
function map<Input, Output>(arr: Input[], func: (arg: Input) => Output): Output[] {
  return arr.map(func);
}

// 参数 'n' 的类型是 'string'
// 'parsed' 的类型是 'number[]'
const parsed = map(["1", "2", "3"], (n) => parseInt(n));
```

请注意，在这个示例中，TypeScript 可以（根据给定的 `string` 数组）推断出 `Input` 类型参数的类型，同时根据函数表达式的返回值（`number`）推断出 `Output` 类型参数的类型。

### 约束

我们编写了一些泛型函数，可以适用于*任何*类型的值。有时候我们想要关联两个值，但只能对某个子集的类型的值进行操作。在这种情况下，我们可以使用*约束*来限制类型参数可以接受的类型的子集。

让我们编写一个返回两个值中较长的值的函数。为了做到这一点，我们需要值属于具有 `length` 属性的类型。我们通过编写 `extends` 子句将类型参数*约束*为该类型：

```ts twoslash
// @errors: 2345 2322
function longest<Type extends { length: number }>(a: Type, b: Type) {
  if (a.length >= b.length) {
    return a;
  } else {
    return b;
  }
}

// longerArray 的类型为 'number[]'
const longerArray = longest([1, 2], [1, 2, 3]);
// longerString 的类型为 'alice' | 'bob'
const longerString = longest("alice", "bob");
// 错误！数字没有 'length' 属性
const notOK = longest(10, 100);
```

这个例子中有几个有趣的地方。我们允许 TypeScript *推断* `longest` 的返回类型。返回类型推断也适用于泛型函数。

由于我们将 `Type` 约束为 `{ length: number }`，我们可以访问 `a` 和 `b` 参数的 `.length` 属性。如果没有类型约束，我们将无法访问这些属性，因为这些值可能是没有 length 属性的其他类型。

`longerArray` 和 `longerString` 的类型是基于参数推断的。记住，泛型主要是关于将两个或多个值与相同类型进行关联！

最后，正如我们所希望的，调用 `longest(10, 100)` 被拒绝，因为 `number` 类型没有 `.length` 属性。

### 使用受限值

在处理泛型约束时，以下是一个常见的错误：

```ts twoslash
// @errors: 2322
function minimumLength<Type extends { length: number }>(
  obj: Type,
  minimum: number
): Type {
  if (obj.length >= minimum) {
    return obj;
  } else {
    return { length: minimum };
  }
}
```

这个函数看起来可能没问题——`Type` 被约束为 `{ length: number }`，而函数要么返回 `Type` 类型的值，要么返回与该约束相匹配的值。问题在于该函数承诺返回与传入的对象*相同*类型的对象，而不仅仅是与约束匹配的*任意*对象。如果这段代码可以通过检查，那么你可以编写肯定不起作用的代码：

```ts twoslash
declare function minimumLength<Type extends { length: number }>(
  obj: Type,
  minimum: number
): Type;
// ---cut---
// 'arr' 得到值 { length: 6 }
const arr = minimumLength([1, 2, 3], 6);
// 然后在这里崩溃，因为数组有一个 'slice' 方法，但返回的对象没有！
console.log(arr.slice(0));
```

### 指定类型参数

TypeScript 通常可以推断出泛型函数调用中的类型参数，但并非总是如此。例如，假设你编写了一个函数来合并两个数组：

```ts twoslash
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2);
}
```

通常情况下，如果使用不匹配的数组调用该函数，会产生一个错误：

```ts twoslash
// @errors: 2322
declare function combine<Type>(arr1: Type[], arr2: Type[]): Type[];
// ---cut---
const arr = combine([1, 2, 3], ["hello"]);
```

然而，如果你打算这样做，可以手动指定 `Type`：

```ts twoslash
declare function combine<Type>(arr1: Type[], arr2: Type[]): Type[];
// ---cut---
const arr = combine<string | number>([1, 2, 3], ["hello"]);
```

### 编写良好的泛型函数的指南

编写泛型函数很有趣，但很容易过度使用类型参数。如果类型参数过多或在不需要的情况下使用约束，可能会导致类型推断不成功，从而使函数调用变得困难。

#### 将类型参数往下推

以下是两种看似相似的函数编写方式：

```ts twoslash
function firstElement1<Type>(arr: Type[]) {
  return arr[0];
}

function firstElement2<Type extends any[]>(arr: Type) {
  return arr[0];
}

// a: number（好）
const a = firstElement1([1, 2, 3]);
// b: any（差）
const b = firstElement2([1, 2, 3]);
```

这两个函数乍一看可能相同，但是 `firstElement1` 是编写该函数的更好方式。它的推断返回类型是 `Type`，但是 `firstElement2` 的推断返回类型是 `any`，因为 TypeScript 必须使用约束类型解析 `arr[0]` 表达式，而不是在调用期间“等待”解析元素。

> **规则**：在可能的情况下，使用类型参数本身而不是对其进行约束。

#### 使用较少的类型参数

以下是另一对类似的函数：

```ts twoslash
function filter1<Type>(arr: Type[], func: (arg: Type) => boolean): Type[] {
  return arr.filter(func);
}

function filter2<Type, Func extends (arg: Type) => boolean>(
  arr: Type[],
  func: Func
): Type[] {
  return arr.filter(func);
}
```

我们创建了一个类型参数 `Func`，它*没有将任何两个值进行关联*。这总是一个警告信号，因为这意味着调用者想要指定类型参数时，必须手动为无关的类型参数指定额外的类型参数。`Func` 没有任何用处，只是让函数变得更难阅读和理解！

> **规则**：使用尽可能少的类型参数。

#### 类型参数应该出现两次

有时候我们会忘记函数可能没有必要是泛型的：

```ts twoslash
function greet<Str extends string>(s: Str) {
  console.log("你好，" + s);
}

greet("世界");
```

我们也可以写一个更简单的版本：

```ts twoslash
function greet(s: string) {
  console.log("你好，" + s);
}
```

记住，类型参数是用于*关联多个值的类型*。如果类型参数在函数签名中只被使用一次，它就没有在关联任何内容。这包括推断的返回类型；例如，如果 `Str` 是 `greet` 的推断返回类型的一部分，它将关联参数和返回类型，因此在写入的代码中只出现一次，但实际上使用了两次。

> **规则**：如果一个类型参数只出现在一个位置，请仔细考虑是否真的需要它。

## 可选参数

JavaScript 中的函数通常可以接受可变数量的参数。例如，`number` 的 `toFixed` 方法接受一个可选的数字位数：

```ts twoslash
function f(n: number) {
  console.log(n.toFixed()); // 0 个参数
  console.log(n.toFixed(3)); // 1 个参数
}
```

我们可以在 TypeScript 中使用 `?` 将参数标记为*可选*：

```ts twoslash
function f(x?: number) {
  // ...
}
f(); // 可以
f(10); // 可以
```

尽管参数的类型被指定为 `number`，但是因为 JavaScript 中未指定的参数其值被当作 `undefined`，所以 `x` 参数实际上具有类型 `number | undefined`。

你还可以提供参数的*默认值*：

```ts twoslash
function f(x = 10) {
  // ...
}
```

现在在 `f` 的函数体中，`x` 将具有类型 `number`，因为任何 `undefined` 的参数将被替换为 `10`。请注意，如果参数是可选的，调用者始终可以传递 `undefined`，因为这只是模拟了一个“缺失”的参数：

```ts twoslash
declare function f(x?: number): void;
// cut
// 全部正常
f();
f(10);
f(undefined);
```

### 回调函数中的可选参数

一旦你了解了可选参数和函数类型表达式，编写调用回调函数的函数时很容易犯以下错误：

```ts twoslash
function myForEach(arr: any[], callback: (arg: any, index?: number) => void) {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i], i);
  }
}
```

当把 `index?` 作为可选参数时，人们通常希望这两种调用都是合法的：

```ts twoslash
// @errors: 2532 18048
declare function myForEach(
  arr: any[],
  callback: (arg: any, index?: number) => void
): void;
// ---cut---
myForEach([1, 2, 3], (a) => console.log(a));
myForEach([1, 2, 3], (a, i) => console.log(a, i));
```

然而，*实际上*这样的话 *`callback` 只可能会被传递一个参数*。换句话说，函数定义表示其实现可能如下所示：

```ts twoslash
// @errors: 2532 18048
function myForEach(arr: any[], callback: (arg: any, index?: number) => void) {
  for (let i = 0; i < arr.length; i++) {
    // 我今天不想提供 index
    callback(arr[i]);
  }
}
```

然后，TypeScript 将强制执行这个含义，并发出实际上不可能的错误：

<!-- prettier-ignore -->
```ts twoslash
// @errors: 2532 18048
declare function myForEach(
  arr: any[],
  callback: (arg: any, index?: number) => void
): void;
// ---cut---
myForEach([1, 2, 3], (a, i) => {
  console.log(i.toFixed());
});
```

在 JavaScript 中，如果你用比参数多的实参调用一个函数，多余的实参会被忽略。TypeScript 的行为也是一样的。参数较少（类型相同）的函数总是可以替代参数较多的函数。

> **规则**：在编写回调函数的函数类型时，除非你打算在*调用*函数时不传递该参数，否则*永远不要*编写可选参数。

## 函数重载

某些 JavaScript 函数可以以不同数量或类型的实参进行调用。例如，你可以编写函数来创建 `Date` 对象，它既可以接受时间戳作为参数（一个实参），也可以接受月份/日期/年份作为参数（三个实参）。

在 TypeScript 中，我们可以通过编写*重载签名*来指定可以以不同方式调用的函数。为此，我们先编写一些函数签名（通常是两个或更多），然后再编写函数的具体实现：

```ts twoslash
// @errors: 2575
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) {
    return new Date(y, mOrTimestamp, d);
  } else {
    return new Date(mOrTimestamp);
  }
}
const d1 = makeDate(12345678);
const d2 = makeDate(5, 5, 5);
const d3 = makeDate(1, 3);
```

在这个示例中，我们编写了两个重载：一个接受一个参数，另一个接受三个参数。这两个签名被称为*重载签名*。

然后，我们编写了一个具体的函数实现，其签名与重载签名是兼容的。函数有一个*具体实现*签名，但这个签名不能直接调用。尽管我们在函数必需的参数后面写了两个可选参数，但它不能用两个参数调用！

### 重载签名和具体实现签名

这是一个常见的困惑来源。通常人们会编写这样的代码，并不理解为什么会出错：

```ts twoslash
// @errors: 2554
function fn(x: string): void;
function fn() {
  // ...
}
// 期望可以使用零个参数调用
fn();
```

同样，函数体的签名在外部是“看”不到的。

> 外部无法看到*具体实现*的签名。
> 当编写重载函数时，你应该始终在函数实现之前编写*两个*或更多的签名。

具体实现的签名也必须与重载签名*兼容*。例如，下面的函数存在错误，因为具体实现的签名与重载签名不匹配：

```ts twoslash
// @errors: 2394
function fn(x: boolean): void;
// 参数类型不正确
function fn(x: string): void;
function fn(x: boolean) {}
```

```ts twoslash
// @errors: 2394
function fn(x: string): string;
// 返回类型不正确
function fn(x: number): boolean;
function fn(x: string | number) {
  return "oops";
}
```

### 编写良好的重载函数

与泛型一样，使用函数重载时应遵循一些准则。遵循这些原则将使你的函数更易于调用、理解和实现。

让我们考虑一个返回字符串或数组的长度的函数：

```ts twoslash
function len(s: string): number;
function len(arr: any[]): number;
function len(x: any) {
  return x.length;
}
```

这个函数是无错误的；我们可以用字符串或数组调用它。然而，我们不能用可能是字符串*或*数组的值调用它，因为 TypeScript 只能解析函数调用为单个重载：

```ts twoslash
// @errors: 2769
declare function len(s: string): number;
declare function len(arr: any[]): number;
// ---cut---
len(""); // OK
len([0]); // OK
len(Math.random() > 0.5 ? "hello" : [0]);
```

由于两个重载具有相同的参数数量和相同的返回类型，我们可以使用非重载版本的函数：

```ts twoslash
function len(x: any[] | string) {
  return x.length;
}
```

这好多了！调用者可以使用任一类型的值调用它，而且作为额外的好处，我们不必找出一个正确的实现签名。

> 尽可能使用带有联合类型的参数，而不是重载

### 在函数中声明 `this`

TypeScript 通过代码流分析推断出函数中的 `this` 应该是什么，例如在下面的代码中：

```ts twoslash
const user = {
  id: 123,

  admin: false,
  becomeAdmin: function () {
    this.admin = true;
  },
};
```

TypeScript 理解到 `user.becomeAdmin` 函数有一个对应的 `this`，即外部对象 `user`。`this` 在很多情况下已经足够，但也有很多情况下你需要更多地掌控 `this` 表示的对象。JavaScript 规范规定你不能有一个名为 `this` 的参数，因此 TypeScript 使用该语法空间来让你在函数体中声明 `this` 的类型。

```ts twoslash
interface User {
  id: number;
  admin: boolean;
}
declare const getDB: () => DB;
// ---cut---
interface DB {
  filterUsers(filter: (this: User) => boolean): User[];
}

const db = getDB();
const admins = db.filterUsers(function (this: User) {
  return this.admin;
});
```

这种模式在回调式 API 中很常见，其中另一个对象通常控制何时调用你的函数。请注意，你需要使用 `function` 而不是箭头函数来获得这种行为：

```ts twoslash
// @errors: 7041 7017
interface User {
  id: number;
  isAdmin: boolean;
}
declare const getDB: () => DB;
// ---cut---
interface DB {
  filterUsers(filter: (this: User) => boolean): User[];
}

const db = getDB();
const admins = db.filterUsers(() => this.admin);
```

## 其他需要了解的类型

在处理函数类型时，有一些额外的类型需要你认识。虽然所有类型都可以在任何地方使用，但这些类型在函数的上下文中尤其相关。

### `void`

`void` 表示不返回任何值的函数的返回类型。当一个函数没有任何 `return` 语句，或者 `return` 语句中没有明确的返回值时，它是推断出的返回类型。

```ts twoslash
// 推断的返回类型是 void
function noop() {
  return;
}
```

在 JavaScript 中，不返回任何值的函数会隐式返回 `undefined` 值。然而，在 TypeScript 中，`void` 和 `undefined` 并不相同。有关此问题的更多细节将会在本章末尾介绍。

> `void` 和 `undefined` 不是相同的类型。

### `object`

特殊类型 `object` 指代任何非原始类型（`string`、`number`、`bigint`、`boolean`、`symbol`、`null` 或 `undefined`）的值。这与 *空对象类型* `{ }` 不同，也不同于全局类型 `Object`。你可能永远不会使用 `Object`。

> `object` 不是 `Object`。请**总是**使用 `object`！

需要注意的是，在 JavaScript 中，函数值也是对象：它们具有属性，在原型链中包含 `Object.prototype`，是 `instanceof Object`，可以对它们调用 `Object.keys` 等等。因此，在 TypeScript 中，函数类型被认为是 `object` 类型。

### `unknown`

`unknown` 类型表示*任意*值。这与 `any` 类型类似，但更安全，因为无法对 `unknown` 值进行任何操作：

```ts twoslash
// @errors: 2571 18046
function f1(a: any) {
  a.b(); // OK
}
function f2(a: unknown) {
  a.b();
}
```

在描述函数类型时，这有大作用，因为你可以描述接受任意值的函数，而不需要在函数体中使用 `any` 值。

相反地，你可以描述返回未知类型值的函数：

```ts twoslash
declare const someRandomString: string;
// ---cut---
function safeParse(s: string): unknown {
  return JSON.parse(s);
}

// 需要小心处理 'obj'！
const obj = safeParse(someRandomString);
```

### `never`

有些函数永远不会返回值：

```ts twoslash
function fail(msg: string): never {
  throw new Error(msg);
}
```

`never` 类型表示永远不会观察到的值。在返回类型中，这意味着函数会抛出异常或终止程序的执行。

当 TypeScript 确定联合类型中没有剩余的选项时，也会出现 `never`。

```ts twoslash
function fn(x: string | number) {
  if (typeof x === "string") {
    // 做一些操作
  } else if (typeof x === "number") {
    // 做另一些操作
  } else {
    x; // 的类型为 'never'!
  }
}
```

### `Function`

全局类型 `Function` 描述了 JavaScript 中所有函数值的属性，如 `bind`、`call`、`apply` 等。它还具有特殊属性，这些属性 `Function` 类型的值总是可以调用；这些调用返回 `any`：

```ts twoslash
function doSomething(f: Function) {
  return f(1, 2, 3);
}
```

这是一个*无类型的函数调用*，一般最好避免使用，因为它具有不安全的 `any` 返回类型。

如果你需要接受任意函数但不打算调用它，类型 `() => void` 通常更安全。

### 剩余参数和剩余实参

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/rest_parameters'>剩余参数</a><br/>
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Spread_syntax'>Spread Syntax</a><br/>
   </p>
</blockquote>

### 剩余参数

除了使用可选参数或重载来创建可以接受各种固定参数数量的函数之外，我们还可以使用*剩余参数*定义可以接受**不确定数量**实参的函数。

剩余参数位于其他参数之后，使用 `...` 语法：

```ts twoslash
function multiply(n: number, ...m: number[]) {
  return m.map((x) => n * x);
}
// 'a' 的值为 [10, 20, 30, 40]
const a = multiply(10, 1, 2, 3, 4);
```

在 TypeScript 中，这些参数的类型注解隐式地是 `any[]` 而不是 `any`，而且任何给定的类型注解必须是 `Array<T>`、`T[]` 的形式，或者是元组类型（我们稍后会学习到元组类型）。

### 剩余实参

相反地，我们可以使用扩展语法从可迭代对象（例如数组）中*提供*可变数量的实参。例如，数组的 `push` 方法接受任意数量的实参：

```ts twoslash
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
arr1.push(...arr2);
```

请注意，通常情况下，TypeScript 不会假设数组是不可变的。这可能会导致一些令人惊讶的行为：

```ts twoslash
// @errors: 2556
// 推断的类型是 number[]——“一个包含零个或多个数字的数组”，而不是特定的两个数字
const args = [8, 5];
const angle = Math.atan2(...args);
```

对于这种情况，最佳解决方案有点依赖于你的代码，但通常来说，在 `const` 上下文中是最直接的解决方案：

```ts twoslash
// 推断为长度为 2 的元组
const args = [8, 5] as const;
// OK
const angle = Math.atan2(...args);
```

在使用剩余参数时，可能需要在针对较旧的运行时环境时启用 [`downlevelIteration`](/tsconfig#downlevelIteration)。

<!-- TODO link to downlevel iteration -->

### 参数解构

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment'>解构赋值</a><br/>
   </p>
</blockquote>

你可以使用参数解构将作为参数提供的对象方便地解构到函数体中的一个或多个局部变量中。在 JavaScript 中，它的样子如下：

```js
function sum({ a, b, c }) {
  console.log(a + b + c);
}
sum({ a: 10, b: 3, c: 9 });
```

对象的类型注解位于解构语法之后：

```ts twoslash
function sum({ a, b, c }: { a: number; b: number; c: number }) {
  console.log(a + b + c);
}
```

这可能看起来有点冗长，但你也可以在这里使用命名类型：

```ts twoslash
// 与之前的示例相同
type ABC = { a: number; b: number; c: number };
function sum({ a, b, c }: ABC) {
  console.log(a + b + c);
}
```

## 函数的可赋值性

### 返回类型为 `void`

对于返回类型为 `void` 的函数，它们可能会产生一些不寻常但是符合预期的行为。

使用返回类型为 `void` 的上下文类型并**不会**强制函数**不**返回任何值。换句话说，当实现一个带有 `void` 返回类型的上下文函数类型（`type voidFunc = () => void`）时，它可以返回*任何*其他值，但是该返回值会被忽略。

因此，以下 `() => void` 类型的实现是有效的：

```ts twoslash
type voidFunc = () => void;

const f1: voidFunc = () => {
  return true;
};

const f2: voidFunc = () => true;

const f3: voidFunc = function () {
  return true;
};
```

当将其中一个函数的返回值赋给另一个变量时，它将保持 `void` 类型：

```ts twoslash
type voidFunc = () => void;

const f1: voidFunc = () => {
  return true;
};

const f2: voidFunc = () => true;

const f3: voidFunc = function () {
  return true;
};
// ---cut---
const v1 = f1();

const v2 = f2();

const v3 = f3();
```

这个行为的存在使得以下代码是有效的，即使 `Array.prototype.push` 返回一个数字，而 `Array.prototype.forEach` 方法期望的是一个返回类型为 `void` 的函数。

```ts twoslash
const src = [1, 2, 3];
const dst = [0];

src.forEach((el) => dst.push(el));
```

还有另一种特殊情况需要注意，当字面函数定义的返回类型为 `void` 时，该函数必须**不**返回任何内容。

```ts twoslash
function f2(): void {
  // @ts-expect-error
  return true;
}

const f3 = function (): void {
  // @ts-expect-error
  return true;
};
```

有关 `void` 的更多信息，请参考以下其他文档条目：

- [v2 手册](https://ts-zh-docs.vercel.app/zh/docs/handbook/2/functions.html#void)
- [FAQ——“为什么返回非 void 的函数可以分配给返回 void 的函数？”](https://github.com/Microsoft/TypeScript/wiki/FAQ#why-are-functions-returning-non-void-assignable-to-function-returning-void)
