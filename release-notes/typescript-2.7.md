# TypeScript 2.7

## TypeScript 2.7

### 常量名属性

TypeScript 2.7 新增了以常量（包括ECMAScript symbols）作为类属性名的类型推断支持。

#### 例子

```typescript
// Lib
export const SERIALIZE = Symbol("serialize-method-key");

export interface Serializable {
    [SERIALIZE](obj: {}): string;
}
```

```typescript
// consumer
import { SERIALIZE, Serializable } from "lib";

class JSONSerializableItem implements Serializable {
    [SERIALIZE](obj: {}) {
        return JSON.stringify(obj);
    }
}
```

这同样适用于数字和字符串的字面量

#### 例子

```typescript
const Foo = "Foo";
const Bar = "Bar";

let x = {
    [Foo]: 100,
    [Bar]: "hello",
};

let a = x[Foo]; // a类型为'number'; 在之前版本，类型为'number | string'，现在可以追踪到类型
let b = x[Bar]; // b类型为'string';
```

### `unique symbol`类型

为了将symbol变量视作有唯一值的字面量，我们新增了类型`unique symbol`。 `unique symbol`是`symbol`的子类型，仅由调用`Symbol()`或`Symbol.for()`或明确的类型注释生成。 该类型只允许在`const`声明或者 `readonly static` 属性声明中使用。如果要引用某个特定的`unique symbol`变量，你必须使用`typeof`操作符。 每个对`unique symbols`的引用都意味着一个完全唯一的声明身份，与被引用的变量声明绑定。

#### 例子

```typescript
// Works
declare const Foo: unique symbol;

// Error! 'Bar'不是const声明的
let Bar: unique symbol = Symbol();

// Works - 对变量Foo的引用，它的声明身份与Foo绑定
let Baz: typeof Foo = Foo;

// Also works.
class C {
    static readonly StaticSymbol: unique symbol = Symbol();
}
```

因为每个`unique symbols`都有个完全独立的身份，因此两个`unique symbols`类型之间不能赋值或比较。

#### Example

```typescript
const Foo = Symbol();
const Bar = Symbol();

// Error: 不能比较两个unique symbols.
if (Foo === Bar) {
    // ...
}
```

### 更严格的类属性检查

TypeScript 2.7引入了一个新的控制严格性的标记`--strictPropertyInitialization`。 使用这个标记后，TypeScript要求类的所有实例属性在构造函数里或属性初始化器中都得到初始化。比如：

```typescript
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

上例中，`baz`从未被赋值，因此TypeScript报错了。 如果我们的本意就是让`baz`可以为`undefined`，那么应该声明它的类型为`boolean | undefined`。

在某些场景下，属性会被间接地初始化（使用辅助方法或依赖注入库）。 这种情况下，你可以在属性上使用_显式赋值断言_（_definite assignment assertion modifiers_）来帮助类型系统识别类型（下面会讨论）

```typescript
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

注意，`--strictPropertyInitialization`会在其它`--strict`模式标记下被启用，这可能会影响你的工程。 你可以在`tsconfig.json`的`compilerOptions`里将`strictPropertyInitialization`设置为`false`， 或者在命令行上将`--strictPropertyInitialization`设置为`false`来关闭检查。

### 显式赋值断言

显式赋值断言允许你在实例属性和变量声明之后加一个感叹号`!`，来告诉TypeScript这个变量确实已被赋值，即使TypeScript不能分析出这个结果。

#### 例子

```typescript
let x: number;
initialize();
console.log(x + x);
//          ~   ~
// Error! Variable 'x' is used before being assigned.

function initialize() {
    x = 10;
}
```

使用显式类型断言在`x`的声明后加上`!`，Typescript可以认为变量`x`确实已被赋值

```typescript
// Notice the '!'
let x!: number;
initialize();

// No error!
console.log(x + x);

function initialize() {
    x = 10;
}
```

在某种意义上，显式类型断言运算符是非空断言运算符（在表达式后缀的`!`）的对偶，就像下面这个例子

```typescript
let x: number;
initialize();

// No error!
console.log(x! + x!);

function initialize() {
    x = 10;
```

在上面的例子中，我们知道`x`都会被初始化，因此使用显式类型断言比使用非空断言更合适。

### 固定长度元组

TypeScript 2.6之前，`[number, string, string]`被当作`[number, string]`的子类型。 这对于TypeScript的结构性而言是合理的——`[number, string, string]`的前两个元素各自是`[number, string]`里前两个元素的子类型。 但是，我们注意到在在实践中的大多数情形下，这并不是开发者所希望的。

在TypeScript 2.7中，具有不同元数的元组不再允许相互赋值。感谢[Tycho Grouwstra](https://github.com/tycho01)提交的PR，元组类型现在会将它们的元数编码进它们对应的`length`属性的类型里。原理是利用数字字面量类型区分出不同长度的元组。

概念上讲，你可以把`[number, string]`类型等同于下面的`NumStrTuple`声明：

```typescript
interface NumStrTuple extends Array<number | string> {
    0: number;
    1: string;
    length: 2; // 注意length的类型是字面量'2'，而不是'number'
}
```

请注意，这是一个破坏性改动。 如果你想要和以前一样，让元组仅限制最小长度，那么你可以使用一个类似的声明但不显式指定`length`属性，这样`length`属性的类型就会回退为`number`

```typescript
interface MinimumNumStrTuple extends Array<number | string> {
    0: number;
    1: string;
}
```

注：这并不意味着元组是不可变长的数组，而仅仅是一个约定。

### 更优的对象字面量推断

TypeScript 2.7改进了在同一上下文中的多对象字面量的类型推断。 当多个对象字面量类型组成一个联合类型，TypeScript现在会将它们_规范化_为一个对象类型，该对象类型包含联合类型中的每个对象的所有属性，以及属性对应的推断类型。

考虑这样的情形:

```typescript
const obj = test ? { text: "hello" } : {};  // { text: string } | { text?: undefined }
const s = obj.text;  // string | undefined
```

以前`obj`会被推断为`{}`，第二行会报错因为`obj`没有属性。但这显然并不理想。

**例子**

```typescript
// let obj: { a: number, b: number } |
//     { a: string, b?: undefined } |
//     { a?: undefined, b?: undefined }
let obj = [{ a: 1, b: 2 }, { a: "abc" }, {}][0];
obj.a;  // string | number | undefined
obj.b;  // number | undefined
```

多个对象字面量中的同一属性的所有推断类型，会合并成一个规范化的联合类型：

```typescript
declare function f<T>(...items: T[]): T;
// let obj: { a: number, b: number } |
//     { a: string, b?: undefined } |
//     { a?: undefined, b?: undefined }
let obj = f({ a: 1, b: 2 }, { a: "abc" }, {});
obj.a;  // string | number | undefined
obj.b;  // number | undefined
```

### 结构相同的类和`instanceof`表达式的处理方式改进

TypeScript 2.7对联合类型中结构相同的类和`instanceof`表达式的处理方式改进如下：

* 联合类型中，结构相同的不同类都会保留（而不是只保留一个）
* 联合类型中的子类型简化仅在一种情况下发生——若一个类继承自联合类型中另一个类，该子类会被简化。
* 用于类型检查的`instanceof`操作符基于继承关系来判断，而不是结构兼容来判断。

这意味着联合类型和`instanceof`能够区分结构相同的类。

**例子**

```typescript
class A {}
class B extends A {}
class C extends A {}
class D extends A { c: string }
class E extends D {}

let x1 = !true ? new A() : new B();  // A
let x2 = !true ? new B() : new C();  // B | C (previously B)
let x3 = !true ? new C() : new D();  // C | D (previously C)

let a1 = [new A(), new B(), new C(), new D(), new E()];  // A[]
let a2 = [new B(), new C(), new D(), new E()];  // (B | C | D)[] (previously B[])

function f1(x: B | C | D) {
    if (x instanceof B) {
        x;  // B (previously B | D)
    }
    else if (x instanceof C) {
        x;  // C
    }
    else {
        x;  // D (previously never)
    }
}
```

### `in`运算符实现类型保护

`in`运算符现在会起到类型细化的作用。

对于一个`n in x`的表达式，当`n`是一个字符串字面量或者字符串字面量类型，并且`x`是一个联合类型： 在值为"true"的分支中，`x`会有一个推断出来可选或被赋值的属性`n`；在值为"false"的分支中，`x`根据推断仅有可选的属性`n`或没有属性`n`。

#### 例子

```typescript
interface A { a: number };
interface B { b: string };

function foo(x: A | B) {
    if ("a" in x) {
        return x.a;
    }
    return x.b; // 此时x的类型推断为B, 属性a不存在
}
```

## 使用标记`--esModuleInterop`引入非ES模块

在TypeScript 2.7使用`--esModuleInterop`标记后，为_CommonJS/AMD/UMD_模块生成基于`__esModule`指示器的命名空间记录。这次更新使得TypeScript编译后的输出与Babel的输出更加接近。

之前版本中，TypeScript处理_CommonJS/AMD/UMD_模块的方式与处理ES6模块一致，导致了一些问题，比如：

* TypeScript之前处理CommonJS/AMD/UMD模块的命名空间导入（如`import * as foo from "foo"`）时等同于`const foo = require("foo")`。这样做很简单，但如果引入的主要对象（比如这里的foo）是基本类型、类或者函数，就有问题。ECMAScript标准规定了命名空间记录是一个纯粹的对象，并且引入的命名空间（比如前面的`foo`）应该是不可调用的，然而在TypeScript却中可以。
* 同样地，一个CommonJS/AMD/UMD模块的默认导入（如`import d from "foo"`）被处理成等同于 `const d = require("foo").default`的形式。然而现在大多数可用的CommonJS/AMD/UMD模块并没有默认导出，导致这种引入语句在实践中不适用于非ES模块。比如 `import fs from "fs"` or `import express from "express"` 都不可用。

在使用标签`--esModuleInterop`后，这两个问题都得到了解决：

* 命名空间导入（如`import * as foo from "foo"`）的对象现在被修正为不可调用的。调用会报错。
* 对CommonJS/AMD/UMD模块可以使用默认导入（如`import d from "foo"`）且能正常工作了。

> 注: 这个新特性有可能对现有的代码产生破坏，因此以标记的方式引入。但无论是新项目还是之前的项目，**我们都强烈建议使用它**。对于之前的项目，命名空间导入 \(`import * as express from "express"; express();`\) 需要被改写成默认引入 \(`import express from "express"; express();`\).

#### 例子

使用 `--esModuleInterop` 后，会生成两个新的辅助量 `__importStar` and `__importDefault` ，分别对应导入`*`和导入`default`，比如这样的输入：

```typescript
import * as foo from "foo";
import b from "bar";
```

会生成：

```typescript
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
exports.__esModule = true;
var foo = __importStar(require("foo"));
var bar_1 = __importDefault(require("bar"));
```

### 数字分隔符

TypeScript 2.7支持ECMAScript的[数字分隔符提案](https://github.com/tc39/proposal-numeric-separator)。 这个特性允许用户在数字之间使用下划线`_`来对数字分组。

```typescript
const million = 1_000_000;
const phone = 555_734_2231;
const bytes = 0xFF_0C_00_FF;
const word = 0b1100_0011_1101_0001;
```

### --watch模式下具有更简洁的输出

在TypeScript的`--watch`模式下进行重新编译后会清屏。 这样就更方便阅读最近这次编译的输出信息。

### 更漂亮的`--pretty`输出

TypeScript的`--pretty`标记可以让错误信息更易阅读和管理。 我们对这个功能进行了两个主要的改进。 首先，`--pretty`对文件名，诊段代码和行数添加了颜色（感谢Joshua Goldberg）。 其次，格式化了文件名和位置，以便于在常用的终端里使用Ctrl+Click，Cmd+Click，Alt+Click等来跳转到编译器里的相应位置。

