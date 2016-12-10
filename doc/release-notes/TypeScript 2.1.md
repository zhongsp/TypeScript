## 改进`any`类型推断

以前，如果TypeScript无法确定变量的类型，它将选择`any`类型。

```typescript
let x;      // 隐式 'any'
let y = []; // 隐式 'any[]'

let z: any; // 显式 'any'.
```

使用TypeScript 2.1，TypeScript不是仅仅选择`any`类型，而是基于你后面的赋值来推断类型。

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

没有类型注解并且初始值为`[]`的变量被认为是一个隐式的`any[]`变量。变量会根据下面这些操作`x.push(value)`、`x.unshift(value)`或`x[n] = value`向其中添加的元素来*不断改变*自身的类型。

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

这样做的一个很大的好处是，当使用`--noImplicitAny`运行时，你将看到*较少*的隐式`any`错误。隐式`any`错误只会在编译器无法知道一个没有类型注解的变量的类型时才会报告。

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

## 低版本异步函数

该特性在TypeScript 2.1之前就已经支持了，但是只能编译为ES6或者ES2015。TypeScript 2.1使其该特性可以在ES3和ES5运行时上使用，这意味着无论您使用什么环境，都可以使用它。
>注：首先，我们需要确保我们的运行时提供全局的ECMAScript兼容性`Promise`。这可能需要获取`Promise`的[polyfill](https://github.com/stefanpenner/es6-promise)，或者依赖运行时的版本。我们还需要通过设置`lib`编译参数，比如`"dom","es2015"`或`"dom","es2015.promise","es5"`来确保TypeScript知道`Promise`可用。

#### 示例

##### tsconfig.json

```json
{
    "compilerOptions": {
        "lib": ["dom", "es2015.promise", "es5"]
    }
}
```

##### dramaticWelcome.ts

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

TypeScript注入了一些辅助函数，如继承`_extends`、JSX中的展开运算符`__assign`和异步函数`__awaiter`。以前有两个选择，1.在*每一个*需要辅助库的文件都注入辅助库或者2.使用`--noEmitHelpers`编译参数完全不使用辅助库。

TypeScript 2.1 允许这些辅助库作为单独的模块一次性添加到项目中，并且编译器根据需求导入它们。

首先，安装`tslib`：

```shell
npm install tslib
```

然后，使用`--importHelpers`编译你的文件：

```shell
tsc --module commonjs --importHelpers a.ts
```

## 更好的字面量类型推断

字符串、数字和布尔字面量类型（如：`"abc"`，`1`和`true`）之前仅在存在显式类型注释时才被推断。从TypeScript 2.1开始，字面量类型*总是*推断为默认值。

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

> 这在继承内置类如`Error`，`Array`，`Map`等的行为上有了破坏性的改变。请阅读[extending built-ins breaking change documnetation](https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)。

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

```json
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

`configs/tests.json`:

```json
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

```json
{
  "extends": "./configs/base",
  "files": [
    "main.ts",
    "supplemental.ts"
  ]
}
```

`tsconfig.nostrictnull.json`:

```json
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

## 支持`--target ES2016`和`--target ES2017`

TypeScript 2.1支持两个新的target值`--target ES2016`和`--target ES2017`。使用target`--target ES2016`将指示编译器不要编译ES2016特有的特性，比如`**`操作符。同样，`--target ES2017`将指示编译器不要编译ES2017特有的特性像`async/await`。