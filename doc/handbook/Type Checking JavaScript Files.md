TypeScript 2.3以后的版本支持使用`--checkJs`对`.js`文件进行类型检查和错误提示。

你可以通过添加`// @ts-nocheck`注释来忽略类型检查；相反，你可以通过去掉`--checkJs`设置并添加一个`// @ts-check`注释来选则检查某些`.js`文件。
你还可以使用`// @ts-ignore`来忽略本行的错误。
如果你使用了`tsconfig.json`，JS检查将遵照一些严格检查标记，如`noImplicitAny`，`strictNullChecks`等。
但因为JS检查是相对宽松的，在使用严格标记时可能会有些出乎意料的情况。

对比`.js`文件和`.ts`文件在类型检查上的差异，有如下几点需要注意：

## 用JSDoc类型表示类型信息

`.js`文件里，类型可以和在`.ts`文件里一样被推断出来。
同样地，当类型不能被推断时，它们可以通过JSDoc来指定，就好比在`.ts`文件里那样。
如同TypeScript，`--noImplicitAny`会在编译器无法推断类型的位置报错。
（除了对象字面量的情况；后面会详细介绍）

JSDoc注解修饰的声明会被设置为这个声明的类型。比如：

```js
/** @type {number} */
var x;

x = 0;      // OK
x = false;  // Error: boolean is not assignable to number
```

你可以在这里找到所有JSDoc支持的模式，[JSDoc文档](https://github.com/Microsoft/TypeScript/wiki/JSDoc-support-in-JavaScript)。

## 属性的推断来自于类内的赋值语句

ES2015没提供声明类属性的方法。属性是动态赋值的，就像对象字面量一样。

在`.js`文件里，编译器从类内部的属性赋值语句来推断属性类型。
属性的类型是在构造函数里赋的值的类型，除非它没在构造函数里定义或者在构造函数里是`undefined`或`null`。
若是这种情况，类型将会是所有赋的值的类型的联合类型。
在构造函数里定义的属性会被认为是一直存在的，然而那些在方法，存取器里定义的属性被当成可选的。

```js
class C {
    constructor() {
        this.constructorOnly = 0
        this.constructorUnknown = undefined
    }
    method() {
        this.constructorOnly = false // error, constructorOnly is a number
        this.constructorUnknown = "plunkbat" // ok, constructorUnknown is string | undefined
        this.methodOnly = 'ok'  // ok, but y could also be undefined
    }
    method2() {
        this.methodOnly = true  // also, ok, y's type is string | boolean | undefined
    }
}
```

如果一个属性从没在类内设置过，它们会被当成未知的。

如果类的属性只是读取用的，那么就在构造函数里用JSDoc声明它的类型。
如果它稍后会被初始化，你甚至都不需要在构造函数里给它赋值：

```js
class C {
    constructor() {
        /** @type {number | undefined} */
        this.prop = undefined;
        /** @type {number | undefined} */
        this.count;
    }
}

let c = new C();
c.prop = 0;          // OK
c.count = "string";  // Error: string is not assignable to number|undefined
```

## 构造函数等同于类

ES2015以前，Javascript使用构造函数代替类。
编译器支持这种模式并能够将构造函数识别为ES2015的类。
属性类型推断机制和上面介绍的一致。

```js
function C() {
    this.constructorOnly = 0
    this.constructorUnknown = undefined
}
C.prototype.method = function() {
    this.constructorOnly = false // error
    this.constructorUnknown = "plunkbat" // OK, the type is string | undefined
}
```

## 支持CommonJS模块

在`.js`文件里，TypeScript能识别出CommonJS模块。
对`exports`和`module.exports`的赋值被识别为导出声明。
相似地，`require`函数调用被识别为模块导入。例如：

```js
// same as `import module "fs"`
const fs = require("fs");

// same as `export function readFile`
module.exports.readFile = function(f) {
  return fs.readFileSync(f);
}
```

对JavaScript文件里模块语法的支持比在TypeScript里宽泛多了。
大部分的赋值和声明方式都是允许的。

## 类，函数和对象字面量是命名空间

`.js`文件里的类是命名空间。
它可以用于嵌套类，比如：

```js
class C {
}
C.D = class {
}
```

ES2015之前的代码，它可以用来模拟静态方法：

```js
function Outer() {
  this.y = 2
}
Outer.Inner = function() {
  this.yy = 2
}
```

它还可以用于创建简单的命名空间：

```js
var ns = {}
ns.C = class {
}
ns.func = function() {
}
```

同时还支持其它的变化：

```js
// 立即调用的函数表达式
var ns = (function (n) {
  return n || {};
})();
ns.CONST = 1

// defaulting to global
var assign = assign || function() {
  // code goes here
}
assign.extra = 1
```

## 对象字面量是开放的

`.ts`文件里，用对象字面量初始化一个变量的同时也给它声明了类型。
新的成员不能再被添加到对象字面量中。
这个规则在`.js`文件里被放宽了；对象字面量具有开放的类型，允许添加并访问原先没有定义的属性。例如：

```js
var obj = { a: 1 };
obj.b = 2;  // Allowed
```

对象字面量的表现就好比具有一个默认的索引签名`[x:string]: any`，它们可以被当成开放的映射而不是封闭的对象。

与其它JS检查行为相似，这种行为可以通过指定JSDoc类型来改变，例如：

```js
/** @type {{a: number}} */
var obj = { a: 1 };
obj.b = 2;  // Error, type {a: number} does not have property b
```

## null，undefined，和空数组的类型是any或any[]

任何用`null`，`undefined`初始化的变量，参数或属性，它们的类型是`any`，就算是在严格`null`检查模式下。
任何用`[]`初始化的变量，参数或属性，它们的类型是`any[]`，就算是在严格`null`检查模式下。
唯一的例外是像上面那样有多个初始化器的属性。

```js
function Foo(i = null) {
    if (!i) i = 1;
    var j = undefined;
    j = 2;
    this.l = [];
}
var foo = new Foo();
foo.l.push(foo.i);
foo.l.push("end");
```

## 函数参数是默认可选的

由于在ES2015之前无法指定可选参数，因此`.js`文件里所有函数参数都被当做是可选的。
使用比预期少的参数调用函数是允许的。

需要注意的一点是，使用过多的参数调用函数会得到一个错误。

例如：

```js
function bar(a, b) {
  console.log(a + " " + b);
}

bar(1);       // OK, second argument considered optional
bar(1, 2);
bar(1, 2, 3); // Error, too many arguments
```

使用JSDoc注解的函数会被从这条规则里移除。
使用JSDoc可选参数语法来表示可选性。比如：

```js
/**
 * @param {string} [somebody] - Somebody's name.
 */
function sayHello(somebody) {
    if (!somebody) {
        somebody = 'John Doe';
    }
    console.log('Hello ' + somebody);
}

sayHello();
```

## 由`arguments`推断出的var-args参数声明

如果一个函数的函数体内有对`arguments`的引用，那么这个函数会隐式地被认为具有一个var-arg参数（比如:`(...arg: any[]) => any`)）。使用JSDoc的var-arg语法来指定`arguments`的类型。

```js
/** @param {...number} args */
function sum(/* numbers */) {
    var total = 0
    for (var i = 0; i < arguments.length; i++) {
      total += arguments[i]
    }
    return total
}
```

## 未指定的类型参数默认为`any`

由于JavaScript里没有一种自然的语法来指定泛型参数，因此未指定的参数类型默认为`any`。

### 在extends语句中：

例如，`React.Component`被定义成具有两个类型参数，`Props`和`State`。
在一个`.js`文件里，没有一个合法的方式在extends语句里指定它们。默认地参数类型为`any`：

```js
import { Component } from "react";

class MyComponent extends Component {
    render() {
        this.props.b; // Allowed, since this.props is of type any
    }
}
```

使用JSDoc的`@augments`来明确地指定类型。例如：

```js
import { Component } from "react";

/**
 * @augments {Component<{a: number}, State>}
 */
class MyComponent extends Component {
    render() {
        this.props.b; // Error: b does not exist on {a:number}
    }
}
```

### 在JSDoc引用中：

JSDoc里未指定的类型参数默认为`any`：

```js
/** @type{Array} */
var x = [];

x.push(1);        // OK
x.push("string"); // OK, x is of type Array<any>

/** @type{Array.<number>} */
var y = [];

y.push(1);        // OK
y.push("string"); // Error, string is not assignable to number
```

### 在函数调用中

泛型函数的调用使用`arguments`来推断泛型参数。有时候，这个流程不能够推断出类型，大多是因为缺少推断的源；在这种情况下，类型参数类型默认为`any`。例如：

```js
var p = new Promise((resolve, reject) => { reject() });

p; // Promise<any>;
```

# 支持的JSDoc

下面的列表列出了当前所支持的JSDoc注解，你可以用它们在JavaScript文件里添加类型信息。

注意，没有在下面列出的标记（例如`@async`）都是还不支持的。

* `@type`
* `@param` (or `@arg` or `@argument`)
* `@returns` (or `@return`)
* `@typedef`
* `@callback`
* `@template`
* `@class` (or `@constructor`)
* `@this`
* `@extends` (or `@augments`)
* `@enum`

它们代表的意义与usejsdoc.org上面给出的通常是一致的或者是它的超集。
下面的代码描述了它们的区别并给出了一些示例。

## `@type`

可以使用`@type`标记并引用一个类型名称（原始类型，TypeScript里声明的类型，或在JSDoc里`@typedef`标记指定的）
可以使用任何TypeScript类型和大多数JSDoc类型。

```js
/**
 * @type {string}
 */
var s;

/** @type {Window} */
var win;

/** @type {PromiseLike<string>} */
var promisedString;

// You can specify an HTML Element with DOM properties
/** @type {HTMLElement} */
var myElement = document.querySelector(selector);
element.dataset.myData = '';

```

`@type`可以指定联合类型&mdash;例如，`string`和`boolean`类型的联合。

```js
/**
 * @type {(string | boolean)}
 */
var sb;
```

注意，括号是可选的。

```js
/**
 * @type {string | boolean}
 */
var sb;
```

有多种方式来指定数组类型：

```js
/** @type {number[]} */
var ns;
/** @type {Array.<number>} */
var nds;
/** @type {Array<number>} */
var nas;
```

还可以指定对象字面量类型。
例如，一个带有`a`（字符串）和`b`（数字）属性的对象，使用下面的语法：

```js
/** @type {{ a: string, b: number }} */
var var9;
```

可以使用字符串和数字索引签名来指定`map-like`和`array-like`的对象，使用标准的JSDoc语法或者TypeScript语法。

```js
/**
 * A map-like object that maps arbitrary `string` properties to `number`s.
 *
 * @type {Object.<string, number>}
 */
var stringToNumber;

/** @type {Object.<number, object>} */
var arrayLike;
```

这两个类型与TypeScript里的`{ [x: string]: number }`和`{ [x: number]: any }`是等同的。编译器能识别出这两种语法。

可以使用TypeScript或Closure语法指定函数类型。

```js
/** @type {function(string, boolean): number} Closure syntax */
var sbn;
/** @type {(s: string, b: boolean) => number} Typescript syntax */
var sbn2;
```

或者直接使用未指定的`Function`类型：

```js
/** @type {Function} */
var fn7;
/** @type {function} */
var fn6;
```

Closure的其它类型也可以使用：

```js
/**
 * @type {*} - can be 'any' type
 */
var star;
/**
 * @type {?} - unknown type (same as 'any')
 */
var question;
```

### 转换

TypeScript借鉴了Closure里的转换语法。
在括号表达式前面使用`@type`标记，可以将一种类型转换成另一种类型

```js
/**
 * @type {number | string}
 */
var numberOrString = Math.random() < 0.5 ? "hello" : 100;
var typeAssertedNumber = /** @type {number} */ (numberOrString)
```

### 导入类型

可以使用导入类型从其它文件中导入声明。
这个语法是TypeScript特有的，与JSDoc标准不同：

```js
/**
 * @param p { import("./a").Pet }
 */
function walk(p) {
    console.log(`Walking ${p.name}...`);
}
```

导入类型也可以使用在类型别名声明中：

```js
/**
 * @typedef Pet { import("./a").Pet }
 */

/**
 * @type {Pet}
 */
var myPet;
myPet.name;
```

导入类型可以用在从模块中得到一个值的类型。

```js
/**
 * @type {typeof import("./a").x }
 */
var x = require("./a").x;
```

## `@param`和`@returns`

`@param`语法和`@type`相同，但增加了一个参数名。
使用`[]`可以把参数声明为可选的：

```js
// Parameters may be declared in a variety of syntactic forms
/**
 * @param {string}  p1 - A string param.
 * @param {string=} p2 - An optional param (Closure syntax)
 * @param {string} [p3] - Another optional param (JSDoc syntax).
 * @param {string} [p4="test"] - An optional param with a default value
 * @return {string} This is the result
 */
function stringsStringStrings(p1, p2, p3, p4){
  // TODO
}
```

函数的返回值类型也是类似的：

```js
/**
 * @return {PromiseLike<string>}
 */
function ps(){}

/**
 * @returns {{ a: string, b: number }} - May use '@returns' as well as '@return'
 */
function ab(){}
```

## `@typedef`, `@callback`, 和 `@param`

`@typedef`可以用来声明复杂类型。
和`@param`类似的语法。

```js
/**
 * @typedef {Object} SpecialType - creates a new type named 'SpecialType'
 * @property {string} prop1 - a string property of SpecialType
 * @property {number} prop2 - a number property of SpecialType
 * @property {number=} prop3 - an optional number property of SpecialType
 * @prop {number} [prop4] - an optional number property of SpecialType
 * @prop {number} [prop5=42] - an optional number property of SpecialType with default
 */
/** @type {SpecialType} */
var specialTypeObject;
```

可以在第一行上使用`object`或`Object`。

```js
/**
 * @typedef {object} SpecialType1 - creates a new type named 'SpecialType'
 * @property {string} prop1 - a string property of SpecialType
 * @property {number} prop2 - a number property of SpecialType
 * @property {number=} prop3 - an optional number property of SpecialType
 */
/** @type {SpecialType1} */
var specialTypeObject1;
```

`@param`允许使用相似的语法。
注意，嵌套的属性名必须使用参数名做为前缀：

```js
/**
 * @param {Object} options - The shape is the same as SpecialType above
 * @param {string} options.prop1
 * @param {number} options.prop2
 * @param {number=} options.prop3
 * @param {number} [options.prop4]
 * @param {number} [options.prop5=42]
 */
function special(options) {
  return (options.prop4 || 1001) + options.prop5;
}
```

`@callback`与`@typedef`相似，但它指定函数类型而不是对象类型：

```js
/**
 * @callback Predicate
 * @param {string} data
 * @param {number} [index]
 * @returns {boolean}
 */
/** @type {Predicate} */
const ok = s => !(s.length % 2);
```

当然，所有这些类型都可以使用TypeScript的语法`@typedef`在一行上声明：

```js
/** @typedef {{ prop1: string, prop2: string, prop3?: number }} SpecialType */
/** @typedef {(data: string, index?: number) => boolean} Predicate */
```

## `@template`

使用`@template`声明泛型：

```js
/**
 * @template T
 * @param {T} p1 - A generic parameter that flows through to the return type
 * @return {T}
 */
function id(x){ return x }
```

用逗号或多个标记来声明多个类型参数：

```js
/**
 * @template T,U,V
 * @template W,X
 */
```

还可以在参数名前指定类型约束。
只有列表的第一项类型参数会被约束：

```js
/**
 * @template {string} K - K must be a string or string literal
 * @template {{ serious(): string }} Seriousalizable - must have a serious method
 * @param {K} key
 * @param {Seriousalizable} object
 */
function seriousalize(key, object) {
  // ????
}
```

## `@constructor`

编译器通过`this`属性的赋值来推断构造函数，但你可以让检查更严格提示更友好，你可以添加一个`@constructor`标记：

```js
/**
 * @constructor
 * @param {number} data
 */
function C(data) {
  this.size = 0;
  this.initialize(data); // Should error, initializer expects a string
}
/**
 * @param {string} s
 */
C.prototype.initialize = function (s) {
  this.size = s.length
}

var c = new C(0);
var result = C(1); // C should only be called with new
```

通过`@constructor`，`this`将在构造函数`C`里被检查，因此你在`initialize`方法里得到一个提示，如果你传入一个数字你还将得到一个错误提示。如果你直接调用`C`而不是构造它，也会得到一个错误。

不幸的是，这意味着那些既能构造也能直接调用的构造函数不能使用`@constructor`。

## `@this`

编译器通常可以通过上下文来推断出`this`的类型。但你可以使用`@this`来明确指定它的类型：

```js
/**
 * @this {HTMLElement}
 * @param {*} e
 */
function callbackForLater(e) {
    this.clientHeight = parseInt(e) // should be fine!
}
```

## `@extends`

当JavaScript类继承了一个基类，无处指定类型参数的类型。而`@extends`标记提供了这样一种方式：

```js
/**
 * @template T
 * @extends {Set<T>}
 */
class SortableSet extends Set {
  // ...
}
```

注意`@extends`只作用于类。当前，无法实现构造函数继承类的情况。

## `@enum`

`@enum`标记允许你创建一个对象字面量，它的成员都有确定的类型。不同于JavaScript里大多数的对象字面量，它不允许添加额外成员。

```js
/** @enum {number} */
const JSDocState = {
  BeginningOfLine: 0,
  SawAsterisk: 1,
  SavingComments: 2,
}
```

注意`@enum`与TypeScript的`@enum`大不相同，它更加简单。然而，不同于TypeScript的枚举，`@enum`可以是任何类型：

```js
/** @enum {function(number): number} */
const Math = {
  add1: n => n + 1,
  id: n => -n,
  sub1: n => n - 1,
}
```

## 更多示例

```js
var someObj = {
  /**
   * @param {string} param1 - Docs on property assignments work
   */
  x: function(param1){}
};

/**
 * As do docs on variable assignments
 * @return {Window}
 */
let someFunc = function(){};

/**
 * And class methods
 * @param {string} greeting The greeting to use
 */
Foo.prototype.sayHi = (greeting) => console.log("Hi!");

/**
 * And arrow functions expressions
 * @param {number} x - A multiplier
 */
let myArrow = x => x * x;

/**
 * Which means it works for stateless function components in JSX too
 * @param {{a: string, b: number}} test - Some param
 */
var sfc = (test) => <div>{test.a.charAt(0)}</div>;

/**
 * A parameter can be a class constructor, using Closure syntax.
 *
 * @param {{new(...args: any[]): object}} C - The class to register
 */
function registerClass(C) {}

/**
 * @param {...string} p1 - A 'rest' arg (array) of strings. (treated as 'any')
 */
function fn10(p1){}

/**
 * @param {...string} p1 - A 'rest' arg (array) of strings. (treated as 'any')
 */
function fn9(p1) {
  return p1.join();
}
```

## 已知不支持的模式

在值空间中将对象视为类型是不可以的，除非对象创建了类型，如构造函数。

```js
function aNormalFunction() {

}
/**
 * @type {aNormalFunction}
 */
var wrong;
/**
 * Use 'typeof' instead:
 * @type {typeof aNormalFunction}
 */
var right;
```

对象字面量属性上的`=`后缀不能指定这个属性是可选的：

```js
/**
 * @type {{ a: string, b: number= }}
 */
var wrong;
/**
 * Use postfix question on the property name instead:
 * @type {{ a: string, b?: number }}
 */
var right;
```

`Nullable`类型只在启用了`strictNullChecks`检查时才启作用：

```js
/**
 * @type {?number}
 * With strictNullChecks: true -- number | null
 * With strictNullChecks: off  -- number
 */
var nullable;
```

`Non-nullable`类型没有意义，以其原类型对待：

```js
/**
 * @type {!number}
 * Just has type number
 */
var normal;
```

不同于JSDoc类型系统，TypeScript只允许将类型标记为包不包含`null`。
没有明确的`Non-nullable` -- 如果启用了`strictNullChecks`，那么`number`是非`null`的。
如果没有启用，那么`number`是可以为`null`的。
