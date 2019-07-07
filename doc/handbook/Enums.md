# 枚举

使用枚举我们可以定义一些带名字的常量。
使用枚举可以清晰地表达意图或创建一组有区别的用例。
TypeScript支持数字的和基于字符串的枚举。

## 数字枚举

首先我们看看数字枚举，如果你使用过其它编程语言应该会很熟悉。

```ts
enum Direction {
    Up = 1,
    Down,
    Left,
    Right
}
```

如上，我们定义了一个数字枚举，`Up`使用初始化为`1`。
其余的成员会从`1`开始自动增长。
换句话说，`Direction.Up`的值为`1`，`Down`为`2`，`Left`为`3`，`Right`为`4`。

我们还可以完全不使用初始化器：

```ts
enum Direction {
    Up,
    Down,
    Left,
    Right,
}
```

现在，`Up`的值为`0`，`Down`的值为`1`等等。
当我们不在乎成员的值的时候，这种自增长的行为是很有用处的，但是要注意每个枚举成员的值都是不同的。

使用枚举很简单：通过枚举的属性来访问枚举成员，和枚举的名字来访问枚举类型：

```ts
enum Response {
    No = 0,
    Yes = 1,
}

function respond(recipient: string, message: Response): void {
    // ...
}

respond("Princess Caroline", Response.Yes)
```

数字枚举可以被混入到[计算过的和常量成员（如下所示）](#computed-and-constant-members)。
简短地说，不带初始化器的枚举或者被放在第一的位置，或者被放在使用了数字常量或其它常量初始化了的枚举后面。
换句话说，下面的情况是不被允许的：

```ts
enum E {
    A = getSomeValue(),
    B, // error! 'A' is not constant-initialized, so 'B' needs an initializer
}
```

## 字符串枚举

字符串枚举的概念很简单，但是有细微的[运行时的差别](#enums-at-runtime)。
在一个字符串枚举里，每个成员都必须用字符串字面量，或另外一个字符串枚举成员进行初始化。

```ts
enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}
```

由于字符串枚举没有自增长的行为，字符串枚举可以很好的序列化。
换句话说，如果你正在调试并且必须要读一个数字枚举的运行时的值，这个值通常是很难读的 - 它并不能表达有用的信息（尽管[反向映射](#enums-at-runtime)会有所帮助），字符串枚举允许你提供一个运行时有意义的并且可读的值，独立于枚举成员的名字。

## 异构枚举（Heterogeneous enums）

从技术的角度来说，枚举可以混合字符串和数字成员，但是似乎你并不会这么做：

```ts
enum BooleanLikeHeterogeneousEnum {
    No = 0,
    Yes = "YES",
}
```

除非你真的想要利用JavaScript运行时的行为，否则我们不建议这样做。

## 计算的和常量成员

每个枚举成员都带有一个值，它可以是*常量*或*计算出来的*。
当满足如下条件时，枚举成员被当作是常量：

* 它是枚举的第一个成员且没有初始化器，这种情况下它被赋予值`0`：

  ```ts
  // E.X is constant:
  enum E { X }
  ```

* 它不带有初始化器且它之前的枚举成员是一个*数字*常量。
  这种情况下，当前枚举成员的值为它上一个枚举成员的值加1。

  ```ts
  // All enum members in 'E1' and 'E2' are constant.

  enum E1 { X, Y, Z }

  enum E2 {
      A = 1, B, C
  }
  ```

* 枚举成员使用*常量枚举表达式*初始化。
  常量枚举表达式是TypeScript表达式的子集，它可以在编译阶段求值。
  当一个表达式满足下面条件之一时，它就是一个常量枚举表达式：

  1. 一个枚举表达式字面量（主要是字符串字面量或数字字面量）
  2. 一个对之前定义的常量枚举成员的引用（可以是在不同的枚举类型中定义的）
  3. 带括号的常量枚举表达式
  4. 一元运算符`+`, `-`, `~`其中之一应用在了常量枚举表达式
  5. 常量枚举表达式做为二元运算符`+`, `-`, `*`, `/`, `%`, `<<`, `>>`, `>>>`, `&`, `|`, `^`的操作对象。

  若常量枚举表达式求值后为`NaN`或`Infinity`，则会在编译阶段报错。

所有其它情况的枚举成员被当作是需要计算得出的值。

```ts
enum FileAccess {
    // constant members
    None,
    Read    = 1 << 1,
    Write   = 1 << 2,
    ReadWrite  = Read | Write,
    // computed member
    G = "123".length
}
```

## 联合枚举与枚举成员的类型

存在一种特殊的非计算的常量枚举成员的子集：字面量枚举成员。
字面量枚举成员是指不带有初始值的常量枚举成员，或者是值被初始化为

* 任何字符串字面量（例如：`"foo"`，`"bar"`，`"baz"`）
* 任何数字字面量（例如：`1`, `100`）
* 应用了一元`-`符号的数字字面量（例如：`-1`, `-100`）

当所有枚举成员都拥有字面量枚举值时，它就带有了一种特殊的语义。

首先，枚举成员成为了类型！
例如，我们可以说某些成员*只能*是枚举成员的值：

```ts
enum ShapeKind {
    Circle,
    Square,
}

interface Circle {
    kind: ShapeKind.Circle;
    radius: number;
}

interface Square {
    kind: ShapeKind.Square;
    sideLength: number;
}

let c: Circle = {
    kind: ShapeKind.Square,
    //    ~~~~~~~~~~~~~~~~ Error!
    radius: 100,
}
```

另一个变化是枚举类型本身变成了每个枚举成员的*联合*。
虽然我们还没有讨论[联合类型](./Advanced%20Types.md#union-types)，但你只要知道通过联合枚举，类型系统能够利用这样一个事实，它可以知道枚举里的值的集合。
因此，TypeScript能够捕获在比较值的时候犯的愚蠢的错误。
例如：

```ts
enum E {
    Foo,
    Bar,
}

function f(x: E) {
    if (x !== E.Foo || x !== E.Bar) {
        //             ~~~~~~~~~~~
        // Error! Operator '!==' cannot be applied to types 'E.Foo' and 'E.Bar'.
    }
}
```

这个例子里，我们先检查`x`是否不是`E.Foo`。
如果通过了这个检查，然后`||`会发生短路效果，`if`语句体里的内容会被执行。
然而，这个检查没有通过，那么`x`则*只能*为`E.Foo`，因此没理由再去检查它是否为`E.Bar`。

## 运行时的枚举

枚举是在运行时真正存在的对象。
例如下面的枚举：

```ts
enum E {
    X, Y, Z
}
```

can actually be passed around to functions

```ts
function f(obj: { X: number }) {
    return obj.X;
}

// Works, since 'E' has a property named 'X' which is a number.
f(E);
```

### 反向映射

除了创建一个以属性名做为对象成员的对象之外，数字枚举成员还具有了*反向映射*，从枚举值到枚举名字。
例如，在下面的例子中：

```ts
enum Enum {
    A
}
let a = Enum.A;
let nameOfA = Enum[a]; // "A"
```

TypeScript可能会将这段代码编译为下面的JavaScript：

```js
var Enum;
(function (Enum) {
    Enum[Enum["A"] = 0] = "A";
})(Enum || (Enum = {}));
var a = Enum.A;
var nameOfA = Enum[a]; // "A"
```

生成的代码中，枚举类型被编译成一个对象，它包含了正向映射（`name` -> `value`）和反向映射（`value` -> `name`）。
引用枚举成员总会生成为对属性访问并且永远也不会内联代码。

要注意的是*不会*为字符串枚举成员生成反向映射。

### `const`枚举

大多数情况下，枚举是十分有效的方案。
然而在某些情况下需求很严格。
为了避免在额外生成的代码上的开销和额外的非直接的对枚举成员的访问，我们可以使用`const`枚举。
常量枚举通过在枚举上使用`const`修饰符来定义。

```ts
const enum Enum {
    A = 1,
    B = A * 2
}
```

常量枚举只能使用常量枚举表达式，并且不同于常规的枚举，它们在编译阶段会被删除。
常量枚举成员在使用的地方会被内联进来。
之所以可以这么做是因为，常量枚举不允许包含计算成员。

```ts
const enum Directions {
    Up,
    Down,
    Left,
    Right
}

let directions = [Directions.Up, Directions.Down, Directions.Left, Directions.Right]
```

生成后的代码为：

```js
var directions = [0 /* Up */, 1 /* Down */, 2 /* Left */, 3 /* Right */];
```

# 外部枚举

外部枚举用来描述已经存在的枚举类型的形状。

```ts
declare enum Enum {
    A = 1,
    B,
    C = 2
}
```

外部枚举和非外部枚举之间有一个重要的区别，在正常的枚举里，没有初始化方法的成员被当成常量成员。
对于非常量的外部枚举而言，没有初始化方法时被当做需要经过计算的。
