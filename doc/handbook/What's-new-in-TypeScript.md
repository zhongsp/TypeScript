# TypeScript 1.8 (upcoming)

## Prettier error messages from `tsc`

We understand that a ton of monochrome output can be a little difficult on the eyes.
Colors can help discern where a message starts and ends, and these visual clues are important when error output gets overwhelming.

By just passing the `--pretty` command line option, TypeScript gives more colorful output with context about where things are going wrong.

![Showing off pretty error messages in ConEmu](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/images/new-in-typescript/pretty01.png)

## The `--project` (`-p`) flag can now take any file path

The `--project` command line option originally could only take paths to a folder containing a `tsconfig.json`. Given the different scenarios for build configurations, it made sense to allow `--project` to point to any other compatible JSON file. For instance, a user might want to target ES2015 with CommonJS modules for Node 5, but ES5 with AMD modules for the browser. With this new work, users can easily manage two separate build targets using `tsc` alone without having to perform hacky workarounds like placing `tsconfig.json` files in separate directories.

The old behavior still remains the same if given a directory - the compiler will try to find a file in the directory named `tsconfig.json`.

## `this`-based type guards

TODO

## Support output to IPC-driven files

TypeScript 1.8 allows users to use the `--outFile` argument with special file system entities like named pipes, devices, etc.

As an example, on many Unix-like systems, the standard output stream is accessible by the file `/dev/stdout`.

```shell
tsc foo.ts --outFile /dev/stdout
```

This can be used to pipe output between commands as well.

As an example, we can pipe our emitted JavaScript into a pretty printer like [pretty-js](https://www.npmjs.com/package/pretty-js):

```shell
tsc foo.ts --outFile /dev/stdout | pretty-js
```

## Option to concatenate `AMD` and `System` modules into a single output file

Specifying `--outFile` in conjunction with `--module amd` or `--module system` will concatenate all modules in the compilation into a single output file containing multiple module closures.

## New compiler flag : `--allowSyntheticDefaultImports`

When `--allowSyntheticDefaultImports` is specified, it indicates that the module loader performs some kind of synthetic default import member creation not indicated in the imported .ts or .d.ts. We infer that the default member is either the export= member of the imported module or the entire module itself should that not be present. System modules have this flag on by default.

# TypeScript 1.7

## `async`/`await` support in ES6 targets (Node v4+)

TypeScript now supports asynchronous functions for engines that have native support for ES6 generators, e.g. Node v4 and above.
Asynchronous functions are prefixed with the `async` keyword; `await` suspends the execution until an asynchronous function return promise is fulfilled and unwraps the value from the `Promise` returned.

##### Example

In the following example, each input element will be printed out one at a time with a 400ms delay:

```TypeScript
"use strict";

// printDelayed is a 'Promise<void>'
async function printDelayed(elements: string[]) {
    for (const element of elements) {
        await delay(200);
        console.log(element);
    }
}

async function delay(milliseconds: number) {
    return new Promise<void>(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

printDelayed(["Hello", "beautiful", "asynchronous", "world"]).then(() => {
    console.log();
    console.log("Printed every element!");
});
```

For more information see [Async Functions](http://blogs.msdn.com/b/typescript/archive/2015/11/03/what-about-async-await.aspx) blog post.

## Support for `--target ES6` with `--module`

TypeScript 1.7 adds `ES6` to the list of options available for the `--module` flag and allows you to specify the module output when targeting `ES6`. This provides more flexibility to target exactly the features you want in specific runtimes.

#### Example

```json
{
    "compilerOptions": { 
        "module": "amd",
        "target": "es6"
    }
}
```

## `this`-typing

It is a common pattern to return the current object (i.e. `this`) from a method to create [fluent-style APIs](https://en.wikipedia.org/wiki/Fluent_interface).
For instance, consider the following `BasicCalculator` module:

```TypeScript
export default class BasicCalculator {
    public constructor(protected value: number = 0) { }
    
    public currentValue(): number {
        return this.value;
    }
    
    public add(operand: number) {
        this.value += operand;
        return this;
    }
    
    public subtract(operand: number) {
        this.value -= operand;
        return this;
    }
    
    public multiply(operand: number) {
        this.value *= operand;
        return this;
    }
    
    public divide(operand: number) {
        this.value /= operand;
        return this;
    }
}
```

A user could express `2 * 5 + 1` as

```TypeScript
import calc from "./BasicCalculator";

let v = new calc(2)
    .multiply(5)
    .add(1)
    .currentValue();
``` 

This often opens up very elegant ways of writing code; however, there was a problem for classes that wanted to extend from `BasicCalculator`.
Imagine a user wanted to start writing a `ScientificCalculator`:

```TypeScript
import BasicCalculator from "./BasicCalculator";

export default class ScientificCalculator extends BasicCalculator {
    public constructor(value = 0) {
        super(value);
    }
    
    public square() {
        this.value = this.value ** 2;
        return this;
    }
    
    public sin() {
        this.value = Math.sin(this.value);
        return this;
    }
}
```

Because TypeScript used to infer the type `BasicCalculator` for each method in `BasicCalculator` that returned `this`, the type system would forget that it had `ScientificCalculator` whenever using a `BasicCalculator` method.

For instance:

```TypeScript
import calc from "./ScientificCalculator";

let v = new calc(0.5)
    .square()
    .divide(2)
    .sin()    // Error: 'BasicCalculator' has no 'sin' method.
    .currentValue();
```

This is no longer the case - TypeScript now infers `this` to have a special type called `this` whenever inside an instance method of a class.
The `this` type is written as so, and basically means "the type of the left side of the dot in a method call".

The `this` type is also useful with intersection types in describing libraries (e.g. Ember.js) that use mixin-style patterns to describe inheritance:

```TypeScript
interface MyType {
    extend<T>(other: T): this & T;
}
```

## ES7 exponentiation operator

TypeScript 1.7 supports upcoming [ES7/ES2016 exponentiation operators](https://github.com/rwaldron/exponentiation-operator): `**` and `**=`. The operators will be transformed in the output to ES3/ES5 using `Math.pow`.

##### Example

```ts
var x = 2 ** 3;
var y = 10;
y **= 2;
var z =  -(4 ** 3);
```

Will generate the following JavaScript output:

```js
var x = Math.pow(2, 3);
var y = 10;
y = Math.pow(y, 2);
var z = -(Math.pow(4, 3));
```

## Improved checking for destructuring object literal

TypeScript 1.7 makes checking of destructuring patterns with an object literal or array literal initializers less rigid and more intuitive.

When an object literal is contextually typed by the implied type of an object binding pattern:
* Properties with default values in the object binding pattern become optional in the object literal.
* Properties in the object binding pattern that have no match in the object literal are required to have a default value in the object binding pattern and are automatically added to the object literal type.
* Properties in the object literal that have no match in the object binding pattern are an error.

When an array literal is contextually typed by the implied type of an array binding pattern:

* Elements in the array binding pattern that have no match in the array literal are required to have a default value in the array binding pattern and are automatically added to the array literal type.

##### Example

```ts
// Type of f1 is (arg?: { x?: number, y?: number }) => void
function f1({ x = 0, y = 0 } = {}) { }

// And can be called as:
f1();
f1({});
f1({ x: 1 });
f1({ y: 1 });
f1({ x: 1, y: 1 });

// Type of f2 is (arg?: (x: number, y?: number) => void
function f2({ x, y = 0 } = { x: 0 }) { }

f2();
f2({});        // Error, x not optional
f2({ x: 1 });
f2({ y: 1 });  // Error, x not optional
f2({ x: 1, y: 1 });
```

## Support for decorators when targeting ES3

Decorators are now allowed when targeting ES3. TypeScript 1.7 removes the ES5-specific use of `reduceRight` from the `__decorate` helper. The changes also inline calls `Object.getOwnPropertyDescriptor` and `Object.defineProperty` in a backwards-compatible fashion that allows for a to clean up the emit for ES5 and later by removing various repetitive calls to the aforementioned `Object` methods.


# TypeScript 1.6

## JSX support

JSX is an embeddable XML-like syntax. It is meant to be transformed into valid JavaScript, but the semantics of that transformation are implementation-specific. JSX came to popularity with the React library but has since seen other applications. TypeScript 1.6 supports embedding, type checking, and optionally compiling JSX directly into JavaScript.

#### New `.tsx` file extension and `as` operator

TypeScript 1.6 introduces a new `.tsx` file extension.  This extension does two things: it enables JSX inside of TypeScript files, and it makes the new `as` operator the default way to cast (removing any ambiguity between JSX expressions and the TypeScript prefix cast operator). For example:

```ts
var x = <any> foo; 
// is equivalent to:
var x = foo as any;
```

#### Using React

To use JSX-support with React you should use the [React typings](https://github.com/borisyankov/DefinitelyTyped/tree/master/react). These typings define the `JSX` namespace so that TypeScript can correctly check JSX expressions for React. For example:

```ts 
/// <reference path="react.d.ts" />

interface Props {  
  name: string;
}

class MyComponent extends React.Component<Props, {}> {  
  render() {
    return <span>{this.props.foo}</span>
  }
}

<MyComponent name="bar" />; // OK 
<MyComponent name={0} />; // error, `name` is not a number  
```

#### Using other JSX framworks

JSX element names and properties are validated against the `JSX` namespace. Please see the [[JSX]] wiki page for defining the `JSX` namespace for your framework. 

#### Output generation

TypeScript ships with two JSX modes: `preserve` and `react`.  
- The `preserve` mode will keep JSX expressions as part of the output to be further consumed by another transform step. *Additionally the output will have a `.jsx` file extension.*
- The `react` mode will emit `React.createElement`, does not need to go through a JSX transformation before use, and the output will have a `.js` file extension.

See the [[JSX]] wiki page for more information on using JSX in TypeScript.

## Intersection types

TypeScript 1.6 introduces intersection types, the logical complement of union types. A union type `A | B` represents an entity that is either of type `A` or type `B`, whereas an intersection type `A & B` represents an entity that is both of type `A` *and* type `B`.

##### Example

```typescript
function extend<T, U>(first: T, second: U): T & U {
    let result = <T & U> {};
    for (let id in first) {
        result[id] = first[id];
    }
    for (let id in second) {
        if (!result.hasOwnProperty(id)) {
            result[id] = second[id];
        }
    }
    return result;
}

var x = extend({ a: "hello" }, { b: 42 });
var s = x.a;
var n = x.b;
```

```typescript
type LinkedList<T> = T & { next: LinkedList<T> };

interface Person {
    name: string;
}

var people: LinkedList<Person>;
var s = people.name;
var s = people.next.name;
var s = people.next.next.name;
var s = people.next.next.next.name;
```

```typescript
interface A { a: string }
interface B { b: string }
interface C { c: string }

var abc: A & B & C;
abc.a = "hello";
abc.b = "hello";
abc.c = "hello";
```

See [issue #1256](https://github.com/Microsoft/TypeScript/issues/1256) for more information.

## Local type declarations

Local class, interface, enum, and type alias declarations can now appear inside function declarations. Local types are block scoped, similar to variables declared with `let` and `const`. For example:

```typescript
function f() {
    if (true) {
        interface T { x: number }
        let v: T;
        v.x = 5;
    }
    else {
        interface T { x: string }
        let v: T;
        v.x = "hello";
    }
}
```

The inferred return type of a function may be a type declared locally within the function. It is not possible for callers of the function to reference such a local type, but it can of course be matched structurally. For example:

```typescript
interface Point {
    x: number;
    y: number;
}

function getPointFactory(x: number, y: number) {
    class P {
        x = x;
        y = y;
    }
    return P;
}

var PointZero = getPointFactory(0, 0);
var PointOne = getPointFactory(1, 1);
var p1 = new PointZero();
var p2 = new PointZero();
var p3 = new PointOne();
```

Local types may reference enclosing type parameters and local class and interfaces may themselves be generic. For example:

```typescript
function f3() {
    function f<X, Y>(x: X, y: Y) {
        class C {
            public x = x;
            public y = y;
        }
        return C;
    }
    let C = f(10, "hello");
    let v = new C();
    let x = v.x;  // number
    let y = v.y;  // string
}
```

## Class expressions

TypeScript 1.6 adds support for ES6 class expressions. In a class expression, the class name is optional and, if specified, is only in scope in the class expression itself. This is similar to the optional name of a function expression. It is not possible to refer to the class instance type of a class expression outside the class expression, but the type can of course be matched structurally. For example:

```typescript
let Point = class {
    constructor(public x: number, public y: number) { }
    public length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
};
var p = new Point(3, 4);  // p has anonymous class type
console.log(p.length());
```

## Extending expressions

TypeScript 1.6 adds support for classes extending arbitrary expression that computes a constructor function. This means that built-in types can now be extended in class declarations.

The `extends` clause of a class previously required a type reference to be specified. It now accepts an expression optionally followed by a type argument list. The type of the expression must be a constructor function type with at least one construct signature that has the same number of type parameters as the number of type arguments specified in the `extends` clause. The return type of the matching construct signature(s) is the base type from which the class instance type inherits. Effectively, this allows both real classes and "class-like" expressions to be specified in the `extends` clause.

Some examples:

```typescript
// Extend built-in types

class MyArray extends Array<number> { }
class MyError extends Error { }

// Extend computed base class

class ThingA {
    getGreeting() { return "Hello from A"; }
}

class ThingB {
    getGreeting() { return "Hello from B"; }
}

interface Greeter {
    getGreeting(): string;
}

interface GreeterConstructor {
    new (): Greeter;
}

function getGreeterBase(): GreeterConstructor {
    return Math.random() >= 0.5 ? ThingA : ThingB;
}

class Test extends getGreeterBase() {
    sayHello() {
        console.log(this.getGreeting());
    }
}
```

## `abstract` classes and methods

TypeScript 1.6 adds support for `abstract` keyword for classes and their methods. An abstract class is allowed to have methods with no implementation, and cannot be constructed.

#### Examples

```TypeScript
abstract class Base {
    abstract getThing(): string;
    getOtherThing() { return 'hello'; }
}

let x = new Base(); // Error, 'Base' is abstract

// Error, must either be 'abstract' or implement concrete 'getThing'
class Derived1 extends Base { }

class Derived2 extends Base {
    getThing() { return 'hello'; }
    foo() { 
        super.getThing();// Error: cannot invoke abstract members through 'super'
    } 
}

var x = new Derived2(); // OK
var y: Base = new Derived2(); // Also OK
y.getThing(); // OK
y.getOtherThing(); // OK
```

## Generic type aliases

With TypeScript 1.6, type aliases can be generic. For example:

```typescript
type Lazy<T> = T | (() => T);

var s: Lazy<string>;
s = "eager";
s = () => "lazy";

interface Tuple<A, B> {
    a: A;
    b: B;
}

type Pair<T> = Tuple<T, T>;
```

## Stricter object literal assignment checks

TypeScript 1.6 enforces stricter object literal assignment checks for the purpose of catching excess or misspelled properties. Specifically, when a fresh object literal is assigned to a variable or passed for a parameter of a non-empty target type, it is an error for the object literal to specify properties that don't exist in the target type.

#### Examples

```typescript
var x: { foo: number };
x = { foo: 1, baz: 2 };  // Error, excess property `baz`

var y: { foo: number, bar?: number };
y = { foo: 1, baz: 2 };  // Error, excess or misspelled property `baz`
```

A type can include an index signature to explicitly indicate that excess properties are permitted:

```typescript
var x: { foo: number, [x: string]: any };
x = { foo: 1, baz: 2 };  // Ok, `baz` matched by index signature
```

## ES6 generators

TypeScript 1.6 adds support for generators when targeting ES6. 

A generator function can have a return type annotation, just like a function. The annotation represents the type of the generator returned by the function. Here is an example:
```ts
function *g(): Iterable<string> {
    for (var i = 0; i < 100; i++) {
        yield ""; // string is assignable to string
    }
    yield * otherStringGenerator(); // otherStringGenerator must be iterable and element type assignable to string
}
```

A generator function with no type annotation can have the type annotation inferred. So in the following case, the type will be inferred from the yield statements:
```ts
function *g() {
    for (var i = 0; i < 100; i++) {
        yield ""; // infer string
    }
    yield * otherStringGenerator(); // infer element type of otherStringGenerator
}
```

## Experimental support for `async` functions

TypeScript 1.6 introduces experimental support of `async` functions when targeting ES6. Async functions are expected to invoke an asynchronous operation and await its result without blocking normal execution of the program. This accomplished through the use of an ES6-compatible `Promise` implementation, and transposition of the function body into a compatible form to resume execution when the awaited asynchronous operation completes.


An *async function* is a function or method that has been prefixed with the `async` modifier. This modifier informs the compiler that function body transposition is required, and that the keyword `await` should be treated as a unary expression instead of an identifier. An *Async Function* must provide a return type annotation that points to a compatible `Promise` type. Return type inference can only be used if there is a globally defined, compatible `Promise` type.

#### Example

```TypeScript
var p: Promise<number> = /* ... */;  
async function fn(): Promise<number> {  
  var i = await p; // suspend execution until 'p' is settled. 'i' has type "number"  
  return 1 + i;  
}  
  
var a = async (): Promise<number> => 1 + await p; // suspends execution.  
var a = async () => 1 + await p; // suspends execution. return type is inferred as "Promise<number>" when compiling with --target ES6  
var fe = async function(): Promise<number> {  
  var i = await p; // suspend execution until 'p' is settled. 'i' has type "number"  
  return 1 + i;  
}  
  
class C {  
  async m(): Promise<number> {  
    var i = await p; // suspend execution until 'p' is settled. 'i' has type "number"  
    return 1 + i;  
  }  
  
  async get p(): Promise<number> {  
    var i = await p; // suspend execution until 'p' is settled. 'i' has type "number"  
    return 1 + i;  
  }  
}
```

## Nightly builds

While not strictly a language change, nightly builds are now available by installing with the following command:

```Shell
npm install -g typescript@next
```

## Adjustments in module resolution logic

Starting from release 1.6 TypeScript compiler will use different set of rules to resolve module names when targeting 'commonjs'. These [rules](https://github.com/Microsoft/TypeScript/issues/2338) attempted to model module lookup procedure used by Node. This effectively mean that node modules can include information about its typings and TypeScript compiler will be able to find it. User however can override module resolution rules picked by the compiler by using `--moduleResolution` command line option. Possible values are: 
- 'classic' - module resolution rules used by pre 1.6 TypeScript compiler
- 'node' - node-like module resolution

## Merging ambient class and interface declaration

The instance side of an ambient class declaration can be extended using an interface declaration The class constructor object is unmodified. For example:

```ts
declare class Foo {
    public x : number;
}

interface Foo {
    y : string;
}

function bar(foo : Foo)  {
    foo.x = 1; // OK, declared in the class Foo
    foo.y = "1"; // OK, declared in the interface Foo
}
```

## User-defined type guard functions

TypeScript 1.6 adds a new way to narrow a variable type inside an `if` block, in addition to `typeof` and `instanceof`. A user-defined type guard functions is one with a return type annotation of the form `x is T`, where `x` is a declared parameter in the signature, and `T` is any type. When a user-defined type guard function is invoked on a variable in an `if` block, the type of the variable will be narrowed to `T`. 

#### Examples

```ts
function isCat(a: any): a is Cat {
  return a.name === 'kitty';
}

var x: Cat | Dog;
if(isCat(x)) {
  x.meow(); // OK, x is Cat in this block
}
```

## `exclude` property support in tsconfig.json

A tsconfig.json file that doesn't specify a files property (and therefore implicitly references all *.ts files in all subdirectories) can now contain an exclude property that specifies a list of files and/or directories to exclude from the compilation. The exclude property must be an array of strings that each specify a file or folder name relative to the location of the tsconfig.json file. For example:
```json
{
    "compilerOptions": {
        "out": "test.js"
    },
    "exclude": [
        "node_modules",
        "test.ts",
        "utils/t2.ts"
    ]
}
```
The `exclude` list does not support wilcards. It must simply be a list of files and/or directories.

## `--init` command line option

Run `tsc --init` in a directory to create an initial `tsconfig.json` in this directory with preset defaults. Optionally pass command line arguments along with `--init` to be stored in your initial tsconfig.json on creation.
 
# TypeScript 1.5

## ES6 模块

TypeScript 1.5 支持 ECMAScript 6 (ES6) 模块。ES6模块是有效的TypeScript外部模块通过一种新的语法：ES6模块独自加载源文件，可能导入其它模块和提供一些外部可访问的导出内容。ES6模块提供了一些新的导入导出语法，但是不是必须的。新的ES6模块语法和TypeScript原始的内部模块外部模块构造形式共存，并且它们可以混合使用。

#### Export 声明

TypeScript除了支持现有的`export`声明外，模块成员也可以通过单独的导出声明来导出，并可以选择性地使用`as`语句指定不同的名字。

```ts
interface Stream { ... }
function writeToStream(stream: Stream, data: string) { ... }
export { Stream, writeToStream as write };  // writeToStream exported as write
```

导出声明，同样，可以选择性地使用`as`语句块为导出指定不同的本地名。比如：

```ts
import { read, write, standardOutput as stdout } from "./inout";
var s = read(stdout);
write(stdout, s);
```

做为独立导入的一种可选方案，可以给导出的整个模块指定命名空间：

```ts
import * as io from "./inout";
var s = io.read(io.standardOutput);
io.write(io.standardOutput, s);
```

#### 二次导出（Re-exporting）

使用`from`语句，一个模块可以复制别一个模块的导出到当前模块中，而不必引入新的本地名。

```ts
export { read, write, standardOutput as stdout } from "./inout";
```

`export *`可以用来二次导出别一个模块的所有导出。这在一个模块是用来集合其它模块的导出的情况下是很有帮助的。

```ts
export function transform(s: string): string { ... }
export * from "./mod1";
export * from "./mod2";
```

#### 默认导出

默认导出声明指定模块默认导出的内容：

```ts
export default class Greeter {
    sayHello() {
        console.log("Greetings!");
    }
}
```

并且可以由默认导入来导入：

```ts
import Greeter from "./greeter";
var g = new Greeter();
g.sayHello();
```

#### 空导入

一个“空导入”可以用来导入一个模块提供的副作用。

```ts
import "./polyfills";
```

关于模块的更多信息，请阅读[ES6模块支持文档](https://github.com/Microsoft/TypeScript/issues/2242)。

## 解构声明与赋值

TypeScript 1.5 增加了支持ES6的解构声明与赋值。

#### 声明

解构声明是引入一个或多个命名的变量并且用一个对象的属性或数组的元素初始化它们。

比如，下面的例子声明了变量`x`，`y`和`z`，并且使用`getSomeObject().x`，`getSomeObject().y`和`getSomeObject().z`来分别初始化它们：

```ts
var { x, y, z} = getSomeObject();
```

解构声明同样可以作用于从数组里提取值：

```ts
var [x, y, z = 10] = getSomeArray();
```

相似地，解构也可以用在函数参数声明：

```ts
function drawText({ text = "", location: [x, y] = [0, 0], bold = false }) {  
    // Draw text
}

// Call drawText with an object literal
var item = { text: "someText", location: [1,2,3], style: "italics" };
drawText(item);
```

#### 赋值

解构模式也可以被用在正常的赋值表达式中。比如，交换两个变量可以一个解构赋值简单的完成：

```ts
var x = 1;  
var y = 2;  
[x, y] = [y, x];
```

## `namespace` 关键字

TypeScript使用`module`关键字来定义内部模块和外部模块；这会给刚使用TypeScript的用户带来困惑。内部模块好比是大家熟悉的命名空间；然而，外部模块是真正的JS模块。

> 注意：之前用来定义内部模块的语法仍然支持

**以前**：

```TypeScript
module Math {
    export function add(x, y) { ... }
}
```

**以后**：

```TypeScript
namespace Math {
    export function add(x, y) { ... }
}
```

## `let` 和 `const` 支持

ES6 `let` 和 `const` 声明在目标为ES3和ES5的时候也支持了。

#### Const

```ts
const MAX = 100;

++MAX; // Error: The operand of an increment or decrement 
       //        operator cannot be a constant.
```

#### 块级作用域

```ts
if (true) {
  let a = 4;
  // use a
}
else {
  let a = "string";
  // use a
}

alert(a); // Error: a is not defined in this scope
```

## for..of 支持

TypeScript 1.5增加了在ES3/ES5上支持ES6的`for..of`数组遍历，同时还支持迭代器接口当目标为ES6时。

#### 例子：

TypeScript编译器会将for..of数组转换成常用的ES3/ES5 JavaScript：

```ts
for (var v of expr) { }
```

will be emitted as:

```js
for (var _i = 0, _a = expr; _i < _a.length; _i++) {
    var v = _a[_i];
}
```

## Decorators

> TypeScript decorator is based on the [ES7 decorator proposal](https://github.com/wycats/javascript-decorators). 

A decorator is:
- an expression
- that evaluates to a function
- that takes the target, name, and property descriptor as arguments
- and optionally returns a property descriptor to install on the target object

> For more information, please see the [Decorators](https://github.com/Microsoft/TypeScript/issues/2249) proposal.

#### Example:

Decorators `readonly` and `enumerable(false)` will be applied to the property `method` before it is installed on class `C`. This allows the decorator to change the implementation, and in this case, augment the descriptor to be writable: false and enumerable: false.

```ts
class C {
  @readonly
  @enumerable(false)
  method() { }
}

function readonly(target, key, descriptor) {
    descriptor.writable = false;
}

function enumerable(value) {
  return function (target, key, descriptor) {
     descriptor.enumerable = value;
  }
}
```

## Computed properties
Initializing an object with dynamic properties can be a bit of a burden. Take the following example:

```TypeScript
type NeighborMap = { [name: string]: Node };
type Node = { name: string; neighbors: NeighborMap;}

function makeNode(name: string, initialNeighbor: Node): Node {
    var neighbors: NeighborMap = {};
    neighbors[initialNeighbor.name] = initialNeighbor;
    return { name: name, neighbors: neighbors };
}
```

Here we need to create a variable to hold on to the neighbor-map so that we can initialize it. With TypeScript 1.5, we can let the compiler do the heavy lifting:

```TypeScript
function makeNode(name: string, initialNeighbor: Node): Node {
    return {
        name: name,
        neighbors: {
            [initialNeighbor.name]: initialNeighbor
        }
    }
}
```

## Support for `UMD` and `System` module output

In addition to `AMD` and `CommonJS` module loaders, TypeScript now supports emitting modules `UMD` ([Universal Module Definition](https://github.com/umdjs/umd)) and [`System`](https://github.com/systemjs/systemjs) module formats.

**Usage**:
> tsc --module umd

and

> tsc --module system


## Unicode codepoint escapes in strings

ES6 introduces escapes that allow users to represent a Unicode codepoint using just a single escape.

As an example, consider the need to escape a string that contains the character '𠮷'.  In UTF-16/UCS2, '𠮷' is represented as a surrogate pair, meaning that it's encoded using a pair of 16-bit code units of values, specifically `0xD842` and `0xDFB7`. Previously this meant that you'd have to escape the codepoint as `"\uD842\uDFB7"`. This has the major downside that it’s difficult to discern two independent characters from a surrogate pair.

With ES6’s codepoint escapes, you can cleanly represent that exact character in strings and template strings with a single escape: `"\u{20bb7}"`. TypeScript will emit the string in ES3/ES5 as `"\uD842\uDFB7"`.

## Tagged template strings in ES3/ES5

In TypeScript 1.4, we added support for template strings for all targets, and tagged templates for just ES6. Thanks to some considerable work done by [@ivogabe](https://github.com/ivogabe), we bridged the gap for for tagged templates in ES3 and ES5.

When targeting ES3/ES5, the following code

```TypeScript
function oddRawStrings(strs: TemplateStringsArray, n1, n2) {
    return strs.raw.filter((raw, index) => index % 2 === 1);
}

oddRawStrings `Hello \n${123} \t ${456}\n world`
```

will be emitted as

```JavaScript
function oddRawStrings(strs, n1, n2) {
    return strs.raw.filter(function (raw, index) {
        return index % 2 === 1;
    });
}
(_a = ["Hello \n", " \t ", "\n world"], _a.raw = ["Hello \\n", " \\t ", "\\n world"], oddRawStrings(_a, 123, 456));
var _a;
```

## AMD-dependency optional names
`/// <amd-dependency path="x" />` informs the compiler about a non-TS module dependency that needs to be injected in the resulting module's require call; however, there was no way to consume this module in the TS code. 

The new `amd-dependency name` property allows passing an optional name for an amd-dependency:

```Typescript
/// <amd-dependency path="legacy/moduleA" name="moduleA"/>
declare var moduleA:MyType
moduleA.callStuff()
```
Generated JS code:
```
define(["require", "exports", "legacy/moduleA"], function (require, exports, moduleA) {
    moduleA.callStuff()
});
```

## Project support through `tsconfig.json`

Adding a `tsconfig.json` file in a directory indicates that the directory is the root of a TypeScript project. The tsconfig.json file specifies the root files and the compiler options required to compile the project. A project is compiled in one of the following ways:

- By invoking tsc with no input files, in which case the compiler searches for the tsconfig.json file starting in the current directory and continuing up the parent directory chain.
- By invoking tsc with no input files and a -project (or just -p) command line option that specifies the path of a directory containing a tsconfig.json file.

#### Example:
```json
{
    "compilerOptions": {
        "module": "commonjs",
        "noImplicitAny": true,
        "sourceMap": true,
    }
}
```
See the [tsconfig.json wiki page](https://github.com/Microsoft/TypeScript/wiki/tsconfig.json) for more details.

## `--rootDir` command line option

Option `--outDir` duplicates the input hierarchy in the output. The compiler computes the root of the input files as the longest common path of all input files; and then uses that to replicate all its substructure in the output.

Sometimes this is not desirable, for instance inputs `FolderA\FolderB\1.ts` and `FolderA\FolderB\2.ts` would result in output structure mirroring `FolderA\FolderB\`. now if a new file `FolderA\3.ts` is added to the input, the output structure will pop out to mirror `FolderA\`.

`--rootDir` specifies the input directory to be mirrored in output instead of computing it.

## `--noEmitHelpers` command line option

The TypeSript compiler emits a few helpers like `__extends` when needed. The helpers are emitted in every file they are referenced in. If you want to consolidate all helpers in one place, or override the default behavior, use `--noEmitHelpers` to instructs the compiler not to emit them.


## `--newLine` command line option

By default the output new line character is `\r\n` on Windows based systems and `\n` on *nix based systems. `--newLine` command line flag allows overriding this behavior and specifying the new line character to be used in generated output files.

## `--inlineSourceMap` and `inlineSources` command line options

`--inlineSourceMap` causes source map files to be written inline in the generated `.js` files instead of in a independent `.js.map` file.  `--inlineSources` allows for additionally inlining the source `.ts` file into the 


# TypeScript 1.4

## 联合类型

### 概述

联合类型有助于表示一个值的类型可以是多种类型之一的情况。比如，有一个API接命令行传入`string`类型，`string[]`类型或者是一个返回`string`的函数。你就可以这样写：

```ts
interface RunOptions {
   program: string;
   commandline: string[]|string|(() => string);
}
```

给联合类型赋值也很直观 -- 只要这个值能满足联合类型中任意一个类型那么就可以赋值给这个联合类型：

```ts
var opts: RunOptions = /* ... */;
opts.commandline = '-hello world'; // OK
opts.commandline = ['-hello', 'world']; // OK
opts.commandline = [42]; // Error, 数字不是字符串或字符串数组
```

当读取联合类型时，你可以访问类型共有的属性：

```ts
if(opts.length === 0) { // OK, string和string[]都有'length'属性
  console.log("it's empty");
}
```

使用类型保护，你可以轻松地使用联合类型：

```ts
function formatCommandline(c: string|string[]) {
    if(typeof c === 'string') {
        return c.trim();
    } else {
        return c.join(' ');
    }
}
```

### 严格的泛型

随着联合类型可以表示有很多类型的场景，我们决定去改进泛型调用的规范性。之前，这段代码编译不会报错（出乎意料）：

```ts
function equal<T>(lhs: T, rhs: T): boolean {
  return lhs === rhs;
}

// 之前没有错误
// 现在会报错：在string和number之前没有最佳的基本类型
var e = equal(42, 'hello');
```

通过联合类型，你可以指定你想要的行为，在函数定义时或在调用的时候：

```ts
// 'choose' function where types must match
function choose1<T>(a: T, b: T): T { return Math.random() > 0.5 ? a : b }
var a = choose1('hello', 42); // Error
var b = choose1<string|number>('hello', 42); // OK

// 'choose' function where types need not match
function choose2<T, U>(a: T, b: U): T|U { return Math.random() > 0.5 ? a : b }
var c = choose2('bar', 'foo'); // OK, c: string
var d = choose2('hello', 42); // OK, d: string|number
```

### 更好的类型推断

当一个集合里有多种类型的值时，联合类型会为数组或其它地方提供更好的类型推断：

```ts
var x = [1, 'hello']; // x: Array<string|number>
x[0] = 'world'; // OK
x[0] = false; // Error, boolean is not string or number
```

## `let` 声明
在JavaScript里，`var`声明会被“提升”到所在作用域的顶端。这可能会引发一些让人不解的bugs：

```ts
console.log(x); // meant to write 'y' here
/* later in the same block */
var x = 'hello';
```

TypeScript已经支持新的ES6的关键字`let`，声明一个块级作用域的变量。一个`let`变量只能在声明之后的位置被引用，并且作用域为声明它的块里：

```ts
if(foo) {
    console.log(x); // Error, cannot refer to x before its declaration
    let x = 'hello';
} else {
    console.log(x); // Error, x is not declared in this block
}
```
`let`只在设置目标为ECMAScript 6 （`--target ES6`）时生效。

## `const` 声明

另一个TypeScript支持的ES6里新出现的声明类型是`const`。不能给一个`const`类型变量赋值，只能在声明的时候初始化。这对于那些在初始化之后就不想去改变它的值的情况下是很有帮助的：

```ts
const halfPi = Math.PI / 2;
halfPi = 2; // Error, can't assign to a `const`
```

`const`只在设置目标为ECMAScript 6 （`--target ES6`）时生效。

## 模版字符串

TypeScript现已支持ES6模块字符串。通过它可以方便地在字符串中嵌入任何表达式：

```ts
var name = "TypeScript";
var greeting  = `Hello, ${name}! Your name has ${name.length} characters`;
```

当编译目标为ES6之前的版本时，这个字符串被分解为：

```js
var name = "TypeScript!";
var greeting = "Hello, " + name + "! Your name has " + name.length + " characters";
```

## 类型守护

JavaScript常用模式之一是在运行时使用`typeof`或`instanceof`检查表达式的类型。 在`if`语句里使用它们的时候，TypeScript可以识别出这些条件并且随之改变类型推断的结果。

使用`typeof`来检查一个变量：

```ts
var x: any = /* ... */;
if(typeof x === 'string') {
    console.log(x.subtr(1)); // Error, 'subtr' does not exist on 'string'
}
// x is still any here
x.unknown(); // OK
```

结合联合类型使用`typeof`和`else`：

```ts
var x: string|HTMLElement = /* ... */;
if(typeof x === 'string') {
    // x is string here, as shown above
} else {
    // x is HTMLElement here
    console.log(x.innerHTML);
}
```

结合类和联合类型使用`instanceof`：

```ts
class Dog { woof() { } }
class Cat { meow() { } }
var pet: Dog|Cat = /* ... */;
if(pet instanceof Dog) {
    pet.woof(); // OK
} else {
    pet.woof(); // Error
}
```

## 类型别名

你现在可以使用`type`关键字来为类型定义一个“别名”：

```ts
type PrimitiveArray = Array<string|number|boolean>;
type MyNumber = number;
type NgScope = ng.IScope;
type Callback = () => void;
```

类型别名与其原始的类型完全一致；它们只是简单的替代名。

## `const enum`（完全嵌入的枚举）

枚举很有帮助，但是有些程序实际上并不需要它生成的代码并且想要将枚举变量所代码的数字值直接替换到对应位置上。新的`const enum`声明与正常的`enum`在类型安全方面具有同样的作用，只是在编译时会清除掉。

```ts
const enum Suit { Clubs, Diamonds, Hearts, Spades }
var d = Suit.Diamonds;
```
Compiles to exactly:
```js
var d = 1;
```

TypeScript也会在可能的情况下计算枚举值：

```ts
enum MyFlags {
  None = 0,
  Neat = 1,
  Cool = 2,
  Awesome = 4,
  Best = Neat | Cool | Awesome
}
var b = MyFlags.Best; // emits var b = 7;
```

## `-noEmitOnError` 命令行选项

TypeScript编译器的默认行为是当存在类型错误（比如，将`string`类型赋值给`number`类型）时仍会生成.js文件。这在构建服务器上或是其它场景里可能会是不想看到的情况，因为希望得到的是一次“纯净”的构建。新的`noEmitOnError`标记可以阻止在编译时遇到错误的情况下继续生成.js代码。

它现在是MSBuild工程的默认行为；这允许MSBuild持续构建以我们想要的行为进行，输出永远是来自纯净的构建。

## AMD 模块名

默认情况下AMD模块以匿名形式生成。这在使用其它工具（比如，r.js）处理生成的模块的时可能会带来麻烦。

新的`amd-module name`标签允许给编译器传入一个可选的模块名：

```TypeScript
//// [amdModule.ts]
///<amd-module name='NamedModule'/>
export class C {
}
```

结果会把`NamedModule`赋值成模块名，做为调用AMD`define`的一部分：

```JavaScript
//// [amdModule.js]
define("NamedModule", ["require", "exports"], function (require, exports) {
    var C = (function () {
        function C() {
        }
        return C;
    })();
    exports.C = C;
});
```

# TypeScript 1.3

## 受保护的

类里面新的`protected`修饰符作用与其它语言如C++，C#和Java中的一样。一个类的`protected`成员只在这个类的子类中可见：

```ts
class Thing {
  protected doSomething() { /* ... */ }
}

class MyThing extends Thing {
  public myMethod() {
    // OK，可以在子类里访问受保护的成员
    this.doSomething();
  }
}
var t = new MyThing();
t.doSomething(); // Error，不能在类外部访问受保护成员
```

## 元组类型

元组类型表示一个数组，其中元素的类型都是已知的，但是不一样是同样的类型。比如，你可能想要表示一个第一个元素是`string`类型第二个元素是`number`类型的数组：

```ts
// Declare a tuple type
var x: [string, number];
// 初始化
x = ['hello', 10]; // OK
// 错误的初始化
x = [10, 'hello']; // Error
```

但是访问一个已知的索引，会得到正确的类型：

```ts
console.log(x[0].substr(1)); // OK
console.log(x[1].substr(1)); // Error, 'number'没有'substr'方法
```

注意在TypeScript1.4里，当访问超出已知索引的元素时，会返回联合类型：

```ts
x[3] = 'world'; // OK
console.log(x[5].toString()); // OK, 'string'和'number'都有toString
x[6] = true; // Error, boolean不是number或string
```

# TypeScript 1.1

## 改进性能

1.1版本的编译器速度比所有之前发布的版本快4倍。阅读[这篇博客里的有关图表](http://blogs.msdn.com/b/typescript/archive/2014/10/06/announcing-typescript-1-1-ctp.aspx)

## 更好的模块可见性规则

TypeScript现在只在使用`--declaration`标记时才严格强制模块里类型的可见性。这在Angular里很有用，例如：

```ts
module MyControllers {
  interface ZooScope extends ng.IScope {
    animals: Animal[];
  }
  export class ZooController {
    // Used to be an error (cannot expose ZooScope), but now is only
    // an error when trying to generate .d.ts files
    constructor(public $scope: ZooScope) { }
    /* more code */
  }
}
```
