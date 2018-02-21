# TypeScript 2.7

## 更严格的类属性检查

TypeScript 2.7引入了一个新的控制严格性的标记`--strictPropertyInitialization`！

使用这个标记会确保类的每个实例属性都会在构造函数里或使用属性初始化器赋值。
在某种意义上，它会明确地进行从变量到类的实例属性的赋值检查。比如：

```ts
class C {
    foo: number;
    bar = "hello";
    baz: boolean;
//  ~~~
//  Error! Property 'baz' has no initializer and is not assigned directly in the constructor.
    constructor() {
        this.foo = 42;
    }
}
```

上例中，`baz`从未被赋值，因此TypeScript报错了。
如果我们的本意就是让`baz`可以为`undefined`，那么应该声明它的类型为`boolean | undefined`。

在某些场景下，属性会被间接地初始化（使用辅助方法或依赖注入库）。
这种情况下，你可以在属性上使用*显式赋值断言*来帮助类型系统识别类型。

```ts
class C {
    foo!: number;
    // ^
    // Notice this exclamation point!
    // This is the "definite assignment assertion" modifier.
    constructor() {
        this.initialize();
    }

    initialize() {
        this.foo = 0;
    }
}
```

注意，`--strictPropertyInitialization`会连同其它`--strict`模式标记一起被启用，这可能会影响你的工程。
你可以在`tsconfig.json`的`compilerOptions`里将`strictPropertyInitialization`设置为`false`，
或者在命令行上将`--strictPropertyInitialization`设置为`false`来关闭检查。

## 显式赋值断言

尽管我们尝试将类型系统做的更富表现力，但我们知道有时用户比TypeScript更加了解类型。

上面提到过，显式赋值断言是一个新语法，使用它来告诉TypeScript一个属性会被明确地赋值。
但是除了在类属性上使用它之外，在TypeScript 2.7里你还可以在变量声明上使用它！

```ts
let x!: number[];
initialize();
x.push(4);

function initialize() {
    x = [0, 1, 2, 3];
}
```

假设我们没有在`x`后面加上感叹号，那么TypeScript会报告`x`从未被初始化过。
它在延迟初始化或重新初始化的场景下很方便使用。

## 更便利的与ECMAScript模块的互通性

ECMAScript模块在ES2015里才被标准化，在这之前，JavaScript生态系统里存在几种不同的模块
格式，它们工作方式各有不同。
当新的标准通过后，社区遇到了一个难题，就是如何在已有的“老式”模块模式之间保证最佳的互通性。

TypeScript与Babel采取了不同的方案，并且直到现在，还没出现真正地固定标准。
简单地说，如果你使用Babel，Webpack或React Native，并期望与你以往使用地不同的导入行为，
我们提供了一个新的编译选项`--esModuleInterop`。

TypeScript与Babel都允许用户导入CommonJS模块做为默认导入，但是仍然在导入的命名空间上提
供了每个属性（除非模块使用了`__esModule`标记）。

```ts
import _, { pick } from "lodash";

_.pick(...);
pick(...);
```

由于TypeScript的不同行为，我们在TypeScript 1.8里增加了
`--allowSyntheticDefaultImports`标记，允许用户在这种行为下检查类型（并非输出）。

通常，在TypeScript视角下的CommonJS（和AMD）模块，命名空间导入总是相当于CommonJS模块对
象的结构，一个默认导入仅相当于模块上一个名字叫做`default`的成员。
在这种假定下，你可以创建一个命名导入

```ts
import { range } from "lodash";

for (let i of range(10)) {
    // ...
}
```

然而，ES命名空间导入不能被调用，因此这种方案并非总是可行。

```ts
import * as express from "express";

// Should be an error in any valid implementation.
let app = express();
```

为了允许用户使用与Babel或Webpack一致的运行时行为，TypeScript提供了一个新的
`--esModuleInterop`标记，它用于输出旧模块格式。

当使用这个新的`--esModuleInterop`标记时，可调用的CommonJS模块必须被做为默认导入：

```ts
import express from "express";

let app = express();
```

我们强烈建议Node.js用户利用这个标记，当一个库的模块输出目标为commonjs时，例如express，它会导入一个可调用/可构造的模块。

Webpack用户也可以使用它；然而，你们代码应该将目标设置为`esnext`且`moduleResolution`
策略为`node`。
使用`esnext`模块和`--esModuleInterop`等同于启用了`--allowSyntheticDefaultImports`。

## `unique symbol`类型和常量名属性

TypeScript 2.7对ECMAScript里的`symbols`有了更深入的了解，你可以更灵活地使用它们。

一个需求很大的用例是使用`symbols`来声明一个类型良好的属性。
比如，看下面的例子：

```ts
const Foo = Symbol("Foo");
const Bar = Symbol("Bar");

let x = {
    [Foo]: 100,
    [Bar]: "hello",
};

let a = x[Foo]; // has type 'number'
let b = x[Bar]; // has type 'string'
```

你可以看到，TypeScript可以追踪到`x`拥有使用符号`Foo`和`Bar`声明的属性，因为`Foo`和`Bar`被声明成常量。
TypeScript利用了这一点，让`Foo`和`Bar`具有了一种新类型：`unique symbols`。

`unique symbols`是`symbols`的子类型，仅可通过调用`Symbol()`或`Symbol.for()`或由明确的类型注释生成。
它们仅出现在常量声明和只读的静态属性上，并且为了引用一个存在的`unique symbols`类型，你必须使用`typeof`操作符。
每个对`unique symbols`的引用都意味着一个完全唯一的声明身份。

```ts
// Works
declare const Foo: unique symbol;

// Error! 'Bar' isn't a constant.
let Bar: unique symbol = Symbol();

// Works - refers to a unique symbol, but its identity is tied to 'Foo'.
let Baz: typeof Foo = Foo;

// Also works.
class C {
    static readonly StaticSymbol: unique symbol = Symbol();
}
```

因为每个`unique symbols`都有个完全独立的身份，因此两个`unique symbols`类型之前不能赋值和比较。

```ts
const Foo = Symbol();
const Bar = Symbol();

// Error: can't compare two unique symbols.
if (Foo === Bar) {
    // ...
}
```

另一个可能的用例是使用`symbols`做为联合标记。

```ts
// ./ShapeKind.ts
export const Circle = Symbol("circle");
export const Square = Symbol("square");

// ./ShapeFun.ts
import * as ShapeKind from "./ShapeKind";

interface Circle {
    kind: typeof ShapeKind.Circle;
    radius: number;
}

interface Square {
    kind: typeof ShapeKind.Square;
    sideLength: number;
}

function area(shape: Circle | Square) {
    if (shape.kind === ShapeKind.Circle) {
        // 'shape' has type 'Circle'
        return Math.PI * shape.radius ** 2;
    }
    // 'shape' has type 'Square'
    return shape.sideLength ** 2;
}
```

## `--watch`模式下具有更简洁的输出

在TypeScript的`--watch`模式下进行重新编译后会清屏。
这样就更方便阅读最近这次编译的输出信息。

## 更漂亮的`--pretty`输出

TypeScript的`--pretty`标记可以让错误信息更易阅读和管理。
我们对这个功能进行了两个主要的改进。
首先，`--pretty`对文件名，诊段代码和行数添加了颜色（感谢Joshua Goldberg）。
其次，格式化了文件名和位置，以变于在常用的终端里使用Ctrl+Click，Cmd+Click，Alt+Click等来跳转到编译器里的相应位置。

## 数字分隔符

TypeScript 2.7支持ECMAScript的数字分隔符提案。
这个特性允许用户在数字之间使用下划线（\_）来对数字分组（就像使用逗号和点来对数字分组那样）。

```ts
// Constants
const COULOMB = 8.957_551_787e9; // N-m^2 / C^2
const PLANCK = 6.626_070_040e-34; // J-s
const JENNY = 867_5309; // C-A-L^2
```

这些分隔符对于二进制和十六进制同样有用。

```ts
let bits = 0b0010_1010;
let routine = 0xC0FFEE_F00D_BED;
let martin = 0xF0_1E_
```

注意，可能有些反常识，JavaScript里的数字表示信用卡和电话号并不适当。
这种情况下使用字符串更好。

## 固定长度元组

TypeScript 2.6之前，`[number, string, string]`被当作`[number, string]`的子类型。
这是由于TypeScript的结构性类型系统而造成的；
`[number, string, string]`的第一个和第二个元素是`[number, string]`里相应的第一个和第
二个元素的子类型，并且“末尾的”字符串类型是可以赋值给`[number, string]`里元素的联合类型的。
然而，在查看了现实中元组的真实用法后，我们注意到大多数情况下这是不被允许的。

感谢Tycho Grouwstra提交的PR，元组类型会考虑它的长度，不同长度的元组不再允许相互赋值。
它通过数字字面量类型实现，因此现在可以区分出不同长度的元组了。

概念上讲，你可以把`[number, string]`类型等同于下面的`NumStrTuple`声明：

```ts
interface NumStrTuple extends Array<number | string> {
    0: number;
    1: string;
    length: 2; // using the numeric literal type '2'
}
```

请注意，这是一个破坏性改动。
如果你想要以前的行为，让元组仅限制最小的长度，那么你可以使用一个类似的声明但不明确地指定长
度属性，回退到数字。

```ts
interface MinimumNumStrTuple extends Array<number | string> {
    0: number;
    1: string;
}

```

## `in`操作符细化和精确的`instanceof`

TypeScript 2.7带来了两处类型细化方面的改动 - 通过执行“类型保护”确定更详细类型的能力。

首先，`instanceof`操作符现在利用继承链而非依赖于结构兼容性，
能更准确地反映出`instanceof`操作符在运行时的行为。
这可以帮助避免一些复杂的问题，当使用`instanceof`去细化结构上相似（但无关）的类型时。

其次，感谢GitHub用户IdeaHunter，`in`操作符现在做为类型保护使用，会细化掉没有明确声明的属性名。

```ts
interface A { a: number };
interface B { b: string };

function foo(x: A | B) {
    if ("a" in x) {
        return x.a;
    }
    return x.b;
}
```

## 更智能的对象字面量推断

在JavaScript里有一种模式，用户会忽略掉一些属性，稍后在使用的时候那些属性的值为`undefined`。

```ts
let foo = someTest ? { value: 42 } : {};
```

在以前TypeScript会查找`{ value: number }`和`{}`的最佳超类型，结果是`{}`。
这从技术角度上讲是正确的，但并不是很有用。

从2.7版本开始，TypeScript会“规范化”每个对象字面量类型记录每个属性，
为每个`undefined`类型属性插入一个可选属性，并将它们联合起来。

在上例中，`foo`的最类型是`{ value: number } | { value?: undefined }`。
结合了TypeScript的细化类型，这让我们可以编写更具表达性的代码且TypeScript也可理解。
看另外一个例子：

```ts
// Has type
//  | { a: boolean, aData: number, b?: undefined }
//  | { b: boolean, bData: string, a?: undefined }
let bar = Math.random() < 0.5 ?
    { a: true, aData: 100 } :
    { b: true, bData: "hello" };

if (bar.b) {
    // TypeScript now knows that 'bar' has the type
    //
    //   '{ b: boolean, bData: string, a?: undefined }'
    //
    // so it knows that 'bData' is available.
    bar.bData.toLowerCase()
}
```

这里，TypeScript可以通过检查`b`属性来细化`bar`的类型，然后允许我们访问`bData`属性。
