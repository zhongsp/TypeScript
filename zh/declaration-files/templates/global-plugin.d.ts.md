# global-plugin.d.ts

## UMD

一个 UMD 模块既可以用作 ES 模块（使用导入语句），也可以用作全局变量（在缺少模块加载器的环境中使用）。
许多流行的代码库，如[Moment.js](http://momentjs.com/)，都是使用这模式发布的。
例如，在 Node.js 中或使用了 RequireJS 时，你可以这样使用：

```ts
import moment = require('moment');
console.log(moment.format());
```

在纯浏览器环境中，你可以这样使用：

```js
console.log(moment.format());
```

### 识别 UMD 代码库

[UMD 模块](https://github.com/umdjs/umd)会检查运行环境中是否存在模块加载器。
这是一种常见模式，示例如下：

```js
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["libName"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("libName"));
    } else {
        root.returnExports = factory(root.libName);
    }
}(this, function (b) {
```

如果你看到代码库中存在类如`typeof define`，`typeof window`或`typeof module`的检测代码，尤其是在文件的顶端，那么它大概率是 UMD 代码库。

在 UMD 模块的文档中经常会提供在 Node.js 中结合`require`使用的示例，以及在浏览器中结合`<script>`标签使用的示例。

### UMD 代码库的示例

大多数流行的代码库均提供了 UMD 格式的包。
例如，[jQuery](https://jquery.com/)，[Moment.js](http://momentjs.com/)和[lodash](https://lodash.com/)等。

### 模版

针对模块，共存在三个模版。它们是：

-   [`module.d.ts`](./templates/module.d.ts.md)
-   [`module-class.d.ts`](./templates/module-class.d.ts.md)
-   [`module-function.d.ts`](./templates/module-function.d.ts.md)

若一个模块可以当作函数调用，则使用[`module-function.d.ts`](./templates/module-function.d.ts.md)。

```js
var x = require('foo');
// Note: calling 'x' as a function
var y = x(42);
```

请务必阅读[脚注："ES6 对模块调用签名的影响"](#es6-对模块调用签名的影响)。

如果一个模块可以使用`new`来构造，则使用[`module-class.d.ts`](./templates/module-class.d.ts.md)。

```js
var x = require('bar');
// Note: using 'new' operator on the imported variable
var y = new x('hello');
```

请务必阅读[脚注："ES6 对模块调用签名的影响"](#es6-对模块调用签名的影响)，它同样适用于这类模块。

如果一个模块既不可以调用，又不可以构造，那么就使用[`module.d.ts`](./templates/module.d.ts.md)。

## 模块插件或 UMD 插件

模块插件会改变其它模块的结构（包含 UMD 或 ES 模块）。
例如，在 Moment.js 中，`moment-range`会将`range`方法添加到`moment`对象上。

对于编写声明文件而言，无论是 ES 模块还是 UMD 模块，你都可以使用相同的代码。

### 模版

使用[`module-plugin.d.ts`](./templates/module-plugin.d.ts.md)模版。

## 全局插件

全局插件是一段全局代码，它会改变某个全局变量。
对于修改了全局作用域的模块，它会增加出现运行时冲突的可能性。

例如，有些库会向`Array.prototype`或`String.prototype`中增加新的函数。

### 识别全局插件

全局插件通常可以根据其文档来识别。

你会看到如下示例：

```js
var x = 'hello, world';
// Creates new methods on built-in types
console.log(x.startsWithHello());

var y = [1, 2, 3];
// Creates new methods on built-in types
console.log(y.reverseAndSort());
```

### 模版

使用[`global-plugin.d.ts`](./templates/global-plugin.d.ts.md)模版。

## 修改了全局作用域的模块

对于修改了全局作用域的模块来讲，在导入它们时，会对全局作用域中的值进行修改。
比如存在某个代码库，当导入它时，它会向`String.prototype`上添加新的成员。
该模式存在危险，因为它有导致运行时冲突的可能性，
但我们仍然可以为其编写声明文件。

### 识别出修改了全局作用域的模块

我们可以通过文档来识别修改了全局作用域的模块。
通常来讲，它们与全局插件类似，但是需要`require`语句来激活对全局作用域的修改。

你可能看到过如下的文档：

```js
// 'require' call that doesn't use its return value
var unused = require('magic-string-time');
/* or */
require('magic-string-time');

var x = 'hello, world';
// Creates new methods on built-in types
console.log(x.startsWithHello());

var y = [1, 2, 3];
// Creates new methods on built-in types
console.log(y.reverseAndSort());
```

### 模版

使用[`global-modifying-module.d.ts`](./templates/global-modifying-module.d.ts.md)模版。

## 利用依赖

你的代码库可能会有若干种依赖。
本节会介绍如何在声明文件中导入它们。

### 对全局库的依赖

如果你的代码库依赖于某个全局代码库，则使用`/// <reference types="..." />`指令：

```ts
/// <reference types="someLib" />

function getThing(): someLib.thing;
```

### 对模块的依赖

如果你的代码库依赖于某个模块，则使用`import`语句：

```ts
import * as moment from 'moment';

function getThing(): moment;
```

### 对 UMD 模块的依赖

#### 全局代码库

如果你的全局代码库依赖于某个 UMD 模块，则使用`/// <reference types`指令：

```ts
/// <reference types="moment" />

function getThing(): moment;
```

#### ES 模块或 UMD 模块代码库

如果你的模块或 UMD 代码库依赖于某个 UMD 代码库，则使用`import`语句：

```ts
import * as someLib from 'someLib';
```

不要使用`/// <reference`指令来声明对 UMD 代码库的依赖。

## 脚注

### 防止命名冲突

注意，虽说可以在全局作用域内定义许多类型。
但我们强烈建议不要这样做，因为当一个工程中存在多个声明文件时，它可能会导致难以解决的命名冲突。

可以遵循的一个简单规则是使用代码库提供的某个全局变量来声明拥有命名空间的类型。
例如，如果代码库提供了全局变量`cats`，那么可以这样写：

```ts
declare namespace cats {
    interface KittySettings {}
}
```

而不是：

```ts
// at top-level
interface CatsKittySettings {}
```

这样做会保证代码库可以被转换成 UMD 模块，且不会影响声明文件的使用者。

### ES6 对模块插件的影响

一些插件会对已有模块的顶层导出进行添加或修改。
这在 CommonJS 以及其它模块加载器里是合法的，但 ES6 模块是不可改变的，因此该模式是不可行的。
因为，TypeScript 是模块加载器无关的，所以在编译时不会对该行为加以限制，但是开发者若想要转换到 ES6 模块加载器则需要注意这一点。

### ES6 对模块调用签名的影响

许多代码库，如 Express，将自身导出为可调用的函数。
例如，Express 的典型用法如下：

```ts
import exp = require('express');
var app = exp();
```

在 ES6 模块加载器中，顶层对象（此例中就`exp`）只能拥有属性；
顶层的模块对象永远不能够被调用。
最常见的解决方案是为可调用的/可构造的对象定义一个`default`导出；
有些模块加载器会自动检测这种情况并且将顶层对象替换为`default`导出。

## 代码库文件结构

声明文件的结构应该反映代码库源码的结构。

一个代码库可以包含多个模块，比如：

```
myLib
  +---- index.js
  +---- foo.js
  +---- bar
         +---- index.js
         +---- baz.js
```

它们可以通过如下方式导入：

```js
var a = require('myLib');
var b = require('myLib/foo');
var c = require('myLib/bar');
var d = require('myLib/bar/baz');
```

声明文件如下：

```
@types/myLib
  +---- index.d.ts
  +---- foo.d.ts
  +---- bar
         +---- index.d.ts
         +---- baz.d.ts
```

```ts
// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ This template shows how to write a global plugin. */

/*~ Write a declaration for the original type and add new members.
 *~ For example, this adds a 'toBinaryString' method with overloads to
 *~ the built-in number type.
 */
interface Number {
    toBinaryString(opts?: MyLibrary.BinaryFormatOptions): string;

    toBinaryString(
        callback: MyLibrary.BinaryFormatCallback,
        opts?: MyLibrary.BinaryFormatOptions
    ): string;
}

/*~ If you need to declare several types, place them inside a namespace
 *~ to avoid adding too many things to the global namespace.
 */
declare namespace MyLibrary {
    type BinaryFormatCallback = (n: number) => string;
    interface BinaryFormatOptions {
        prefix?: string;
        padding: number;
    }
}
```
