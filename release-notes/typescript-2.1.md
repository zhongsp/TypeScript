# TypeScript 2.1

## `keyof`和查找类型

在JavaScript中属性名称作为参数的API是相当普遍的，但是到目前为止还没有表达在那些API中出现的类型关系。

输入索引类型查询或`keyof`，索引类型查询`keyof T`产生的类型是`T`的属性名称。`keyof T`的类型被认为是`string`的子类型。

#### 示例

```typescript
interface Person {
    name: string;
    age: number;
    location: string;
}

type K1 = keyof Person; // "name" | "age" | "location"
type K2 = keyof Person[];  // "length" | "push" | "pop" | "concat" | ...
type K3 = keyof { [x: string]: Person };  // string
```

与之相对应的是_索引访问类型_，也称为_查找类型_。在语法上，它们看起来像元素访问，但是写成类型：

#### 示例

```typescript
type P1 = Person["name"];  // string
type P2 = Person["name" | "age"];  // string | number
type P3 = string["charAt"];  // (pos: number) => string
type P4 = string[]["push"];  // (...items: string[]) => number
type P5 = string[][0];  // string
```

你可以将这种模式和类型系统的其它部分一起使用，以获取类型安全的查找。

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K) {
    return obj[key];  // 推断类型是T[K]
}

function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]) {
    obj[key] = value;
}

let x = { foo: 10, bar: "hello!" };

let foo = getProperty(x, "foo"); // number
let bar = getProperty(x, "bar"); // string

let oops = getProperty(x, "wargarbl"); // 错误！"wargarbl"不存在"foo" | "bar"中

setProperty(x, "foo", "string"); // 错误！, 类型是number而非string
```

## 映射类型

一个常见的任务是使用现有类型并使其每个属性完全可选。假设我们有一个`Person`：

```typescript
interface Person {
    name: string;
    age: number;
    location: string;
}
```

`Person`的可选属性类型将是这样：

```typescript
interface PartialPerson {
    name?: string;
    age?: number;
    location?: string;
}
```

使用映射类型，`PartialPerson`可以写成是`Person`类型的广义变换：

```typescript
type Partial<T> = {
    [P in keyof T]?: T[P];
};

type PartialPerson = Partial<Person>;
```

映射类型是通过使用字面量类型的集合而生成的，并为新对象类型计算一组属性。它们就像[Python中的列表推导式](https://docs.python.org/2/tutorial/datastructures.html#nested-list-comprehensions)，但不是在列表中产生新的元素，而是在类型中产生新的属性。

除`Partial`外，映射类型可以表示许多有用的类型转换：

```typescript
// 保持类型相同，但每个属性是只读的。
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

// 相同的属性名称，但使值是一个Promise，而不是一个具体的值
type Deferred<T> = {
    [P in keyof T]: Promise<T[P]>;
};

// 为T的属性添加代理
type Proxify<T> = {
    [P in keyof T]: { get(): T[P]; set(v: T[P]): void }
};
```

## `Partial`,`Readonly`,`Record`和`Pick`

`Partial`和`Readonly`，如前所述，是非常有用的结构。你可以使用它们来描述像一些常见的JS程序：

```typescript
function assign<T>(obj: T, props: Partial<T>): void;
function freeze<T>(obj: T): Readonly<T>;
```

因此，它们现在默认包含在标准库中。

我们还包括两个其他实用程序类型：`Record`和`Pick`。

```typescript
// 从T中选取一组属性K
declare function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;

const nameAndAgeOnly = pick(person, "name", "age");  // { name: string, age: number }
```

```typescript
// 对于类型T的每个属性K，将其转换为U
function mapObject<K extends string | number, T, U>(obj: Record<K, T>, f: (x: T) => U): Record<K, U>

const names = { foo: "hello", bar: "world", baz: "bye" };
const lengths = mapObject(names, s => s.length);  // { foo: number, bar: number, baz: number }
```

## 对象扩展运算符和rest运算符

TypeScript 2.1带来了[ESnext扩展运算符和rest运算符](https://github.com/sebmarkbage/ecmascript-rest-spread)的支持。

类似于数组扩展，展开对象可以方便得到浅拷贝：

```typescript
let copy = { ...original };
```

同样，您可以合并几个不同的对象。在以下示例中，合并将具有来自`foo`，`bar`和`baz`的属性。

```typescript
let merged = { ...foo, ...bar, ...baz };
```

还可以重写现有属性并添加新属性.：

```typescript
let obj = { x: 1, y: "string" };
var newObj = {...obj, z: 3, y: 4}; // { x: number, y: number, z: number }
```

指定展开操作的顺序确定哪些属性在最终的结果对象中。相同的属性，后面的属性会“覆盖”前面的属性。

与对象扩展运算符相对的是对象rest运算符，因为它可以提取解构元素中剩余的元素：

```typescript
let obj = { x: 1, y: 1, z: 1 };
let { z, ...obj1 } = obj;
obj1; // {x: number, y: number};
```

## 低版本异步函数

该特性在TypeScript 2.1之前就已经支持了，但是只能编译为ES6或者ES2015。TypeScript 2.1使其该特性可以在ES3和ES5运行时上使用，这意味着无论您使用什么环境，都可以使用它。

> 注：首先，我们需要确保我们的运行时提供全局的ECMAScript兼容性`Promise`。这可能需要获取`Promise`的[polyfill](https://github.com/stefanpenner/es6-promise)，或者依赖运行时的版本。我们还需要通过设置`lib`编译参数，比如`"dom","es2015"`或`"dom","es2015.promise","es5"`来确保TypeScript知道`Promise`可用。

#### 示例

**tsconfig.json**

```javascript
{
    "compilerOptions": {
        "lib": ["dom", "es2015.promise", "es5"]
    }
}
```

**dramaticWelcome.ts**

```typescript
function delay(milliseconds: number) {
    return new Promise<void>(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function dramaticWelcome() {
    console.log("Hello");

    for (let i = 0; i < 3; i++) {
        await delay(500);
        console.log(".");
    }

    console.log("World!");
}

dramaticWelcome();
```

编译和运行输出应该会在ES3/ES5引擎上产生正确的行为。

## 支持外部辅助库（`tslib`）

TypeScript注入了一些辅助函数，如继承`_extends`、JSX中的展开运算符`__assign`和异步函数`__awaiter`。

以前有两个选择：

1. 在_每一个_需要辅助库的文件都注入辅助库或者
2. 使用`--noEmitHelpers`编译参数完全不使用辅助库。

这两项还有待改进。将帮助文件捆绑在每个文件中对于试图保持其包尺寸小的客户而言是一个痛点。不使用辅助库，那么客户就必须自己维护辅助库。

TypeScript 2.1 允许这些辅助库作为单独的模块一次性添加到项目中，并且编译器根据需求导入它们。

首先，安装`tslib`：

```text
npm install tslib
```

然后，使用`--importHelpers`编译你的文件：

```text
tsc --module commonjs --importHelpers a.ts
```

因此下面的输入，生成的`.js`文件将包含`tslib`的导入和使用`__assign`辅助函数替代内联操作。

```typescript
export const o = { a: 1, name: "o" };
export const copy = { ...o };
```

```javascript
"use strict";
var tslib_1 = require("tslib");
exports.o = { a: 1, name: "o" };
exports.copy = tslib_1.__assign({}, exports.o);
```

## 无类型导入

TypeScript历来对于如何导入模块过于严格。这是为了避免输入错误，并防止用户错误地使用模块。

但是，很多时候你可能只想导入的现有模块，但是这些模块可能没有`.d.ts`文件。以前这是错误的。从TypeScript 2.1开始，这更容易了。

使用TypeScript 2.1，您可以导入JavaScript模块，而不需要类型声明。如果类型声明（如`declare module "foo" { ... }`或`node_modules/@types/foo`）存在，则仍然优先。

对于没有声明文件的模块的导入，在使用了`--noImplicitAny`编译参数后仍将被标记为错误。

```typescript
// Succeeds if `node_modules/asdf/index.js` exists
import { x } from "asdf";
```

## 支持`--target ES2016`,`--target ES2017`和`--target ESNext`

TypeScript 2.1支持三个新的编译版本值`--target ES2016`,`--target ES2017`和`--target ESNext`。

使用target`--target ES2016`将指示编译器不要编译ES2016特有的特性，比如`**`操作符。

同样，`--target ES2017`将指示编译器不要编译ES2017特有的特性像`async/await`。

`--target ESNext`则对应最新的[ES提议特性](https://github.com/tc39/proposals)支持.

## 改进`any`类型推断

以前，如果TypeScript无法确定变量的类型，它将选择`any`类型。

```typescript
let x;      // 隐式 'any'
let y = []; // 隐式 'any[]'

let z: any; // 显式 'any'.
```

使用TypeScript 2.1，TypeScript不是仅仅选择`any`类型，而是基于你后面的赋值来推断类型。

仅当设置了`--noImplicitAny`编译参数时，才会启用此选项。

#### 示例

```typescript
let x;

// 你仍然可以给'x'赋值任何你需要的任何值。
x = () => 42;

// 在刚赋值后，TypeScript 2.1 知道'x'的类型是'() => number'。
let y = x();

// 感谢，现在它会告诉你，你不能添加一个数字到一个函数！
console.log(x + y);
//          ~~~~~
// 错误！运算符 '+' 不能应用于类型`() => number`和'number'。

// TypeScript仍然允许你给'x'赋值你需要的任何值。
x = "Hello world!";

// 并且现在它也知道'x'是'string'类型的！
x.toLowerCase();
```

现在对空数组也进行同样的跟踪。

没有类型注解并且初始值为`[]`的变量被认为是一个隐式的`any[]`变量。变量会根据下面这些操作`x.push(value)`、`x.unshift(value)`或`x[n] = value`向其中添加的元素来_不断改变_自身的类型。

```typescript
function f1() {
    let x = [];
    x.push(5);
    x[1] = "hello";
    x.unshift(true);
    return x;  // (string | number | boolean)[]
}

function f2() {
    let x = null;
    if (cond()) {
        x = [];
        while (cond()) {
            x.push("hello");
        }
    }
    return x;  // string[] | null
}
```

### 隐式any错误

这样做的一个很大的好处是，当使用`--noImplicitAny`运行时，你将看到_较少_的隐式`any`错误。隐式`any`错误只会在编译器无法知道一个没有类型注解的变量的类型时才会报告。

#### 示例

```typescript
function f3() {
    let x = [];  // 错误：当变量'x'类型无法确定时，它隐式具有'any[]'类型。
    x.push(5);
    function g() {
        x;    // 错误：变量'x'隐式具有'any【】'类型。
    }
}
```

## 更好的字面量类型推断

字符串、数字和布尔字面量类型（如：`"abc"`，`1`和`true`）之前仅在存在显式类型注释时才被推断。从TypeScript 2.1开始，字面量类型_总是_推断为默认值。

不带类型注解的`const`变量或`readonly`属性的类型推断为字面量初始化的类型。已经初始化且不带类型注解的`let`变量、`var`变量、形参或非`readonly`属性的类型推断为初始值的扩展字面量类型。字符串字面量扩展类型是`string`，数字字面量扩展类型是`number`,`true`或`false`的字面量类型是`boolean`，还有枚举字面量扩展类型是枚举。

#### 示例

```typescript
const c1 = 1;  // Type 1
const c2 = c1;  // Type 1
const c3 = "abc";  // Type "abc"
const c4 = true;  // Type true
const c5 = cond ? 1 : "abc";  // Type 1 | "abc"

let v1 = 1;  // Type number
let v2 = c2;  // Type number
let v3 = c3;  // Type string
let v4 = c4;  // Type boolean
let v5 = c5;  // Type number | string
```

字面量类型扩展可以通过显式类型注解来控制。具体来说，当为不带类型注解的`const`局部变量推断字面量类型的表达式时，`var`变量获得扩展字面量类型推断。但是当`const`局部变量有显式字面量类型注解时，`var`变量获得非扩展字面量类型。

#### 示例

```typescript
const c1 = "hello";  // Widening type "hello"
let v1 = c1;  // Type string

const c2: "hello" = "hello";  // Type "hello"
let v2 = c2;  // Type "hello"
```

## 将基类构造函数的返回值作为'this'

在ES2015中，构造函数的返回值（它是一个对象）隐式地将`this`的值替换为`super()`的任何调用者。因此，有必要捕获任何潜在的`super()`的返回值并替换为`this`。此更改允许[使用自定义元素](https://w3c.github.io/webcomponents/spec/custom/#htmlelement-constructor)，利用此元素可以使用用户编写的构造函数初始化浏览器分配的元素。

#### 示例

```typescript
class Base {
    x: number;
    constructor() {
        // 返回一个除“this”之外的新对象
        return {
            x: 1,
        };
    }
}

class Derived extends Base {
    constructor() {
        super();
        this.x = 2;
    }
}
```

生成：

```javascript
var Derived = (function (_super) {
    __extends(Derived, _super);
    function Derived() {
        var _this = _super.call(this) || this;
        _this.x = 2;
        return _this;
    }
    return Derived;
}(Base));
```

> 这在继承内置类如`Error`，`Array`，`Map`等的行为上有了破坏性的改变。请阅读[extending built-ins breaking change documentation](https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)。

## 配置继承

通常一个项目有多个输出版本，比如`ES5`和`ES2015`，调试和生产或`Commonjs`和`System`。只有几个配置选项在这两个版本之间改变，并且维护多个`tsconfig.json`文件是麻烦的。

TypeScript 2.1支持使用`extends`来继承配置，其中：

* `extends`在`tsconfig.json`是新的顶级属性（与`compilerOptions`、`files`、`include`和`exclude`一起）。
* `extends`的值是包含继承自其它`tsconfig.json`路径的字符串。
* 首先加载基本文件中的配置，然后由继承配置文件重写。
* 如果遇到循环，我们报告错误。
* 继承配置文件中的`files`、`include`和`exclude`会重写基本配置文件中相应的值。
* 在配置文件中找到的所有相对路径将相对于它们来源的配置文件来解析。

#### 示例

`configs/base.json`:

```javascript
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

`configs/tests.json`:

```javascript
{
  "compilerOptions": {
    "preserveConstEnums": true,
    "stripComments": false,
    "sourceMaps": true
  },
  "exclude": [
    "../tests/baselines",
    "../tests/scenarios"
  ],
  "include": [
    "../tests/**/*.ts"
  ]
}
```

`tsconfig.json`:

```javascript
{
  "extends": "./configs/base",
  "files": [
    "main.ts",
    "supplemental.ts"
  ]
}
```

`tsconfig.nostrictnull.json`:

```javascript
{
  "extends": "./tsconfig",
  "compilerOptions": {
    "strictNullChecks": false
  }
}
```

## 新编译参数`--alwaysStrict`

使用`--alwaysStrict`调用编译器原因：1.在严格模式下解析的所有代码。2.在每一个生成文件上输出`"use strict";`指令;

模块会自动使用严格模式解析。对于非模块代码，建议使用该编译参数。

