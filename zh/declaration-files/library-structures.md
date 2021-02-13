# 代码库结构

一般来讲，*组织*声明文件的方式取决于代码库是如何被使用的。
在 JavaScript 中一个代码库有很多使用方式，这就需要你书写声明文件去匹配它们。
这篇指南涵盖了如何识别常见代码库的模式，以及怎样书写符合相应模式的声明文件。

针对代码库的每种主要的组织模式，在[模版](./templates.md)一节都有对应的文件。
你可以利用它们帮助你快速上手。

## 识别代码库的类型

首先，我们先看一下 TypeScript 声明文件能够表示的库的类型。
这里会简单展示每种类型的代码库的使用方式，以及如何去书写，还有一些真实案例。

识别代码库的类型是书写声明文件的第一步。
我们将会给出一些提示，关于怎样通过代码库的*使用方法*及其*源码*来识别库的类型。
根据库的文档及组织结构的不同，在这两种方式中可能一个会比另外的一个简单一些。
我们推荐你使用任意你喜欢的方式。

## 你应该寻找什么？

在为代码库编写声明文件时，你需要问自己以下几个问题。

1. 如何获取代码库？

    比如，是否只能够从 npm 或 CDN 获取。

2. 如何导入代码库？

    它是否添加了某个全局对象？它是否使用了`require`或`import`/`export`语句？

## 针对不同类型的代码库的示例

### 模块化代码库

几乎所有的 Node.js 代码库都属于这一类。
这类代码库只能工作在有模块加载器的环境下。
比如，`express`只能在 Node.js 里工作，所以必须使用 CommonJS 的`require`函数加载。

ECMAScript 2015（也就是 ES2015，ECMAScript 6 或 ES6），CommonJS 和 RequireJS 具有相似的*导入*一个*模块*的写法。
例如，对于 JavaScript CommonJS （Node.js），写法如下：

```js
var fs = require('fs');
```

对于 TypeScript 或 ES6，`import`关键字也具有相同的作用：

```ts
import * as fs from 'fs';
```

你通常会在模块化代码库的文档里看到如下说明：

```js
var someLib = require('someLib');
```

或

```js
define(..., ['someLib'], function(someLib) {

});
```

与全局模块一样，你也可能会在 [UMD](#umd) 模块的文档里看到这些例子，因此要仔细查看源码和文档。

#### 从代码上识别模块化代码库

模块化代码库至少会包含以下代表性条目之一：

-   无条件的调用`require`或`define`
-   像`import * as a from 'b';`或`export c;`这样的声明
-   赋值给`exports`或`module.exports`

它们极少包含：

-   对`window`或`global`的赋值

#### 模块化代码库的模版

有以下四个模版可用：

-   [`module.d.ts`](./templates/module.d.ts.md)
-   [`module-class.d.ts`](./templates/module-class.d.ts.md)
-   [`module-function.d.ts`](./templates/module-function.d.ts.md)
-   [`module-plugin.d.ts`](./templates/module-plugin.d.ts.md)

你应该先阅读[`module.d.ts`](./templates/module.d.ts.md)以便从整体上了解它们的工作方式。

然后，若一个模块可以当作函数调用，则使用[`module-function.d.ts`](./templates/module-function.d.ts.md)。

```js
const x = require('foo');
// Note: calling 'x' as a function
const y = x(42);
```

如果一个模块可以使用`new`来构造，则使用[`module-class.d.ts`](./templates/module-class.d.ts.md)。

```js
var x = require('bar');
// Note: using 'new' operator on the imported variable
var y = new x('hello');
```

如果一个模块在导入后会更改其它的模块，则使用[`module-plugin.d.ts`](./templates/module-plugin.d.ts.md)。

```js
const jest = require('jest');
require('jest-matchers-files');
```

### 全局代码库

全局代码库可以通过全局作用域来访问（例如，不使用任何形式的`import`语句）。
许多代码库只是简单地导出一个或多个供使用的全局变量。
比如，如果你使用[jQuery](https://jquery.com/)，那么可以使用`$`变量来引用它。

```ts
$(() => {
    console.log('hello!');
});
```

你通常能够在文档里看到如何在 HTML 的 script 标签里引用代码库：

```html
<script src="http://a.great.cdn.for/someLib.js"></script>
```

目前，大多数流行的全局代码库都以 UMD 代码库发布。
UMD 代码库与全局代码库很难通过文档来识别。
在编写全局代码库的声明文件之前，确保代码库不是 UMD 代码库。

#### 从代码来识别全局代码库

通常，全局代码库的代码十分简单。
一个全局的“Hello, world”代码库可以如下：

```js
function createGreeting(s) {
    return 'Hello, ' + s;
}
```

或者这样：

```js
window.createGreeting = function (s) {
    return 'Hello, ' + s;
};
```

在阅读全局代码库的代码时，你会看到：

-   顶层的`var`语句或`function`声明
-   一个或多个`window.someName`赋值语句
-   假设 DOM 相关的原始值`document`或`window`存在

你不会看到：

-   检查或使用了模块加载器，如`require`或`define`
-   CommonJS/Node.js 风格的导入语句，如`var fs = require("fs");`
-   `define(...)`调用
-   描述`require`或导入代码库的文档

#### 全局代码库的示例

由于将全局代码库转换为 UMD 代码库十分容易，因此很少有代码库仍然使用全局代码库风格。
然而，小型的代码库以及需要使用 DOM 的代码库仍然可以是全局的。

#### 全局代码库的模版

模版文件[`global.d.ts`](../doc/handbook/declaration%20files/templates/global.d.ts.md)定义了`myLib`示例代码库。
请务必阅读[脚注："防止命名冲突"](#es6-对模块调用签名的影响)。

### UMD

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

#### 模版

使用[`module-plugin.d.ts`](./templates/module-plugin.d.ts.md)模版。

### 全局插件

一个*全局插件*是全局代码，它们会改变全局对象的结构。 对于*全局修改的模块*，在运行时存在冲突的可能。

比如，一些库往`Array.prototype`或`String.prototype`里添加新的方法。

#### 识别全局插件

全局通常很容易地从它们的文档识别出来。

你会看到像下面这样的例子：

```javascript
var x = 'hello, world';
// Creates new methods on built-in types
console.log(x.startsWithHello());

var y = [1, 2, 3];
// Creates new methods on built-in types
console.log(y.reverseAndSort());
```

#### 模版

使用[`global-plugin.d.ts`](../doc/handbook/declaration%20files/templates/global-plugin.d.ts.md)模版。

### 全局修改的模块

当一个*全局修改的模块*被导入的时候，它们会改变全局作用域里的值。 比如，存在一些库它们添加新的成员到`String.prototype`当导入它们的时候。 这种模式很危险，因为可能造成运行时的冲突， 但是我们仍然可以为它们书写声明文件。

#### 识别全局修改的模块

全局修改的模块通常可以很容易地从它们的文档识别出来。 通常来讲，它们与全局插件相似，但是需要`require`调用来激活它们的效果。

你可能会看到像下面这样的文档:

```javascript
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

#### 模版

使用[`global-modifying-module.d.ts`](../doc/handbook/declaration%20files/templates/global-modifying-module.d.ts.md)模版。

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
如果在 tsconfig.json 里启用了[`"esModuleInterop": true`](/tsconfig/#esModuleInterop)，那么 Typescript 会自动为你处理。
