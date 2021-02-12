# TypeScript 1.4

## 联合类型

### 概述

联合类型有助于表示一个值的类型可以是多种类型之一的情况。比如，有一个API接命令行传入`string`类型，`string[]`类型或者是一个返回`string`的函数。你就可以这样写：

```typescript
interface RunOptions {
   program: string;
   commandline: string[]|string|(() => string);
}
```

给联合类型赋值也很直观 -- 只要这个值能满足联合类型中任意一个类型那么就可以赋值给这个联合类型：

```typescript
var opts: RunOptions = /* ... */;
opts.commandline = '-hello world'; // OK
opts.commandline = ['-hello', 'world']; // OK
opts.commandline = [42]; // Error, 数字不是字符串或字符串数组
```

当读取联合类型时，你可以访问类型共有的属性：

```typescript
if(opts.length === 0) { // OK, string和string[]都有'length'属性
  console.log("it's empty");
}
```

使用类型保护，你可以轻松地使用联合类型：

```typescript
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

```typescript
function equal<T>(lhs: T, rhs: T): boolean {
  return lhs === rhs;
}

// 之前没有错误
// 现在会报错：在string和number之前没有最佳的基本类型
var e = equal(42, 'hello');
```

通过联合类型，你可以指定你想要的行为，在函数定义时或在调用的时候：

```typescript
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

```typescript
var x = [1, 'hello']; // x: Array<string|number>
x[0] = 'world'; // OK
x[0] = false; // Error, boolean is not string or number
```

## `let` 声明

在JavaScript里，`var`声明会被“提升”到所在作用域的顶端。这可能会引发一些让人不解的bugs：

```typescript
console.log(x); // meant to write 'y' here
/* later in the same block */
var x = 'hello';
```

TypeScript已经支持新的ES6的关键字`let`，声明一个块级作用域的变量。一个`let`变量只能在声明之后的位置被引用，并且作用域为声明它的块里：

```typescript
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

```typescript
const halfPi = Math.PI / 2;
halfPi = 2; // Error, can't assign to a `const`
```

`const`只在设置目标为ECMAScript 6 （`--target ES6`）时生效。

## 模版字符串

TypeScript现已支持ES6模块字符串。通过它可以方便地在字符串中嵌入任何表达式：

```typescript
var name = "TypeScript";
var greeting  = `Hello, ${name}! Your name has ${name.length} characters`;
```

当编译目标为ES6之前的版本时，这个字符串被分解为：

```javascript
var name = "TypeScript!";
var greeting = "Hello, " + name + "! Your name has " + name.length + " characters";
```

## 类型守护

JavaScript常用模式之一是在运行时使用`typeof`或`instanceof`检查表达式的类型。 在`if`语句里使用它们的时候，TypeScript可以识别出这些条件并且随之改变类型推断的结果。

使用`typeof`来检查一个变量：

```typescript
var x: any = /* ... */;
if(typeof x === 'string') {
    console.log(x.subtr(1)); // Error, 'subtr' does not exist on 'string'
}
// x is still any here
x.unknown(); // OK
```

结合联合类型使用`typeof`和`else`：

```typescript
var x: string|HTMLElement = /* ... */;
if(typeof x === 'string') {
    // x is string here, as shown above
} else {
    // x is HTMLElement here
    console.log(x.innerHTML);
}
```

结合类和联合类型使用`instanceof`：

```typescript
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

```typescript
type PrimitiveArray = Array<string|number|boolean>;
type MyNumber = number;
type NgScope = ng.IScope;
type Callback = () => void;
```

类型别名与其原始的类型完全一致；它们只是简单的替代名。

## `const enum`（完全嵌入的枚举）

枚举很有帮助，但是有些程序实际上并不需要它生成的代码并且想要将枚举变量所代码的数字值直接替换到对应位置上。新的`const enum`声明与正常的`enum`在类型安全方面具有同样的作用，只是在编译时会清除掉。

```typescript
const enum Suit { Clubs, Diamonds, Hearts, Spades }
var d = Suit.Diamonds;
```

Compiles to exactly:

```javascript
var d = 1;
```

TypeScript也会在可能的情况下计算枚举值：

```typescript
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

```typescript
//// [amdModule.ts]
///<amd-module name='NamedModule'/>
export class C {
}
```

结果会把`NamedModule`赋值成模块名，做为调用AMD`define`的一部分：

```javascript
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

