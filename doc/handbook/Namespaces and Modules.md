# 介绍

这节会列出多种在TypeScript里组织代码的方法。
我们将介绍命名空间（之前叫做“内部模块”）和模块（之前叫做“外部模块”）并且会讨论在什么样的场合下适合使用它们以及怎样使用它们。
我们也会涉及到一些高级主题，如怎么使用外部模块，当使用TypeScript模块时如何避免常见的陷井。

## 一个关于术语的注意事项

我们刚刚提及了“内部模块”和“外部模块”。
如果你对这个术语感到似曾相识，那么一定要注意在TypeScript1.5里，它们的命名发生了变化。
“内部模块”变成了“命名空间”。
“外部模块”变成了简单的“模块”，为了与ECMAScript 6的术语保持一致。

并且，任何使用`module`关键字声明内部模块的地方，都可以使用`namespace`关键字来代替。

这样就避免了新用户可能把它们搞混了。

## 第一步

我们先来写一段程序并将在整个小节中都使用这个例子。
我们定义几个简单的字符串验证器，好比你会使用它们来验证表单里的用户输入或验证外部数据。

##### 所有的验证器都放在一个文件里

```TypeScript
interface StringValidator {
    isAcceptable(s: string): boolean;
}

var lettersRegexp = /^[A-Za-z]+$/;
var numberRegexp = /^[0-9]+$/;

class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
        return lettersRegexp.test(s);
    }
}

class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: StringValidator; } = {};
validators['ZIP code'] = new ZipCodeValidator();
validators['Letters only'] = new LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

## 使用命名空间

随着我们增加更多的验证器，我们想要将它们组织在一起来保持对它们的追踪记录并且不用担心与其它对象产生命名冲突。
我们把验证器包裹到一个命名空间内，而不是把它们放在全局命名空间下。

这个例子里，我们把所有验证器相关的类型都放到一个叫做`Validation`的命名空间里。
因为我们想让这些接口和类在命名空间外也是可访问的，所以我们需要使用`export`。
相反的，变量`lettersRegexp`和`numberRegexp`是具体实现，所以没有导出，因此它们在命名空间外是不能访问的。
在文件末尾的测试代码里，我们需要限制类型名称，因为这是在命名空间外访问，比如`Validation.LettersOnlyValidator`。

##### 使用命名空间的验证器

```TypeScript
namespace Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }

    var lettersRegexp = /^[A-Za-z]+$/;
    var numberRegexp = /^[0-9]+$/;

    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }

    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: Validation.StringValidator; } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

# 分割成多文件

当应用变得越来越大时，我们需要将代码分散到不同的文件中以便于维护。

## 多文件中的命名空间

现在，我们把`Validation`命名空间分割成多个文件。
尽管是不同的文件，它们仍是同一个命名空间，并且在使用的时候就如同它们在一个文件中定义的一样。
因为不同文件之间存在依赖关系，所以我们加入了引用标签来告诉编译器文件之间的关联。
我们的测试代码保持不变。

##### Validation.ts

```TypeScript
namespace Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }
}
```

##### LettersOnlyValidator.ts

```TypeScript
/// <reference path="Validation.ts" />
namespace Validation {
    var lettersRegexp = /^[A-Za-z]+$/;
    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }
}
```

##### ZipCodeValidator.ts

```TypeScript
/// <reference path="Validation.ts" />
namespace Validation {
    var numberRegexp = /^[0-9]+$/;
    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}
```

##### Test.ts

```TypeScript
/// <reference path="Validation.ts" />
/// <reference path="LettersOnlyValidator.ts" />
/// <reference path="ZipCodeValidator.ts" />

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: Validation.StringValidator; } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

当涉及到多文件时，我们必须确保所有编译后的代码都被加载了。
我们有两种方式。

第一种方式，把所有的输入文件编译为一个输出文件，需要使用`--out`标记：

```Shell
tsc --out sample.js Test.ts
```

编译器会根据源码里的引用标签自动地对输出进行排序。你也可以单独地指定每个文件。

```Shell
tsc --out sample.js Validation.ts LettersOnlyValidator.ts ZipCodeValidator.ts Test.ts
```

第二种方式，我们可以编译每一个文件（默认方式），那么每个源文件都会对应生成一个JavaScript文件。
然后，在页面上通过`<script>`标签把所有生成的JavaScript文件按正确的顺序引进来，比如：

##### MyTestPage.html（摘录部分）

```html
<script src="Validation.js" type="text/javascript" />
<script src="LettersOnlyValidator.js" type="text/javascript" />
<script src="ZipCodeValidator.js" type="text/javascript" />
<script src="Test.js" type="text/javascript" />
```

# 使用模块

TypeScript中同样存在模块的概念。
模块会在两种情况下被用到：Node.js或require.js。
对于没有使用Node.js和require.js的应用来说是不需要使用外部模块的，最好使用上面介绍的命名空间的方式来组织代码。

使用模块时，不同文件之间的关系是通过文件级别的导入和导出来指定的。
在TypeScript里，任何具有顶级`import`和`export`的文件都会被视为模块。

下面，我们把之前的例子改写成使用模块。
注意，我们不再使用`module`关键字 - 文件本身会被视为一个模块并以文件名来区分。

引用标签用`import`语句来代替，指明了模块之前的依赖关系。
`import`语句有两部分：模块在当前文件中的名字，`require`关键字指定了依赖模块的路径：

```typescript
import someMod = require('someModule');
```

我们通过顶级的`export`关键字指出了哪些对象在模块外是可见的，如同使用`export`定义命名空间的公共接口一样。

为了编译，我们必须在命令行上指明生成模块的目标类型。对于Node.js，使用`--module commonjs`。对于require.js，使用`--module amd`。比如：

```Shell
ts --module commonjs Test.ts
```

编译的时候，每个外部模块会变成一个单独的`.js`文件。
如同引用标签，编译器会按照`import`语句编译相应的文件。

##### Validation.ts

```TypeScript
export interface StringValidator {
    isAcceptable(s: string): boolean;
}
```

##### LettersOnlyValidator.ts

```TypeScript
import validation = require('./Validation');
var lettersRegexp = /^[A-Za-z]+$/;
export class LettersOnlyValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return lettersRegexp.test(s);
    }
}
```

##### ZipCodeValidator.ts

```TypeScript
import validation = require('./Validation');
var numberRegexp = /^[0-9]+$/;
export class ZipCodeValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}
```

##### Test.ts

```TypeScript
import validation = require('./Validation');
import zip = require('./ZipCodeValidator');
import letters = require('./LettersOnlyValidator');

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: validation.StringValidator; } = {};
validators['ZIP code'] = new zip.ZipCodeValidator();
validators['Letters only'] = new letters.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

## 生成模块代码

根据编译时指定的目标模块类型，编译器会生成相应的代码，或者是适合Node.js（commonjs）或者是适合require.js（AMD）模块加载系统的代码。
想要了解更多关于`define`和`require`函数的使用方法，请阅读相应模块加载器的说明文档。

这个例子展示了在导入导出阶段使用的名字是怎么转换成模块加载代码的。

##### SimpleModule.ts

```TypeScript
import m = require('mod');
export var t = m.something + 1;
```

##### AMD / RequireJS SimpleModule.js:

```JavaScript
define(["require", "exports", 'mod'], function(require, exports, m) {
    exports.t = m.something + 1;
});
```

##### CommonJS / Node SimpleModule.js:

```JavaScript
var m = require('mod');
exports.t = m.something + 1;
```

# Export =
在上面的例子中，使用验证器的时候，每个模块只导出一个值。
像这种情况，在验证器对象前面再加上限定名就显得累赘了，最好是直接使用一个标识符。

`export =`语法指定了模块导出的单个对象。
它可以是类，接口，模块，函数或枚举类型。
当import的时候，直接使用模块导出的标识符，不再需要其它限定名。

下面，我们简化验证器的实现，使用`export =`语法使每个模块导出单一对象。
这会简化对模块的使用 - 我们可以用`zipValidator`代替`zip.ZipCodeValidator`。

##### Validation.ts

```TypeScript
export interface StringValidator {
    isAcceptable(s: string): boolean;
}
```

##### LettersOnlyValidator.ts

```TypeScript
import validation = require('./Validation');
var lettersRegexp = /^[A-Za-z]+$/;
class LettersOnlyValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return lettersRegexp.test(s);
    }
}
export = LettersOnlyValidator;
```

##### ZipCodeValidator.ts

```TypeScript
import validation = require('./Validation');
var numberRegexp = /^[0-9]+$/;
class ZipCodeValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}
export = ZipCodeValidator;
```

##### Test.ts

```TypeScript
import validation = require('./Validation');
import zipValidator = require('./ZipCodeValidator');
import lettersValidator = require('./LettersOnlyValidator');

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: validation.StringValidator; } = {};
validators['ZIP code'] = new zipValidator();
validators['Letters only'] = new lettersValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

# 别名

另一种简化模块操作的方法是使用`import q = x.y.z`给常用的模块起一个短的名字。
不要与`import x = require('name')`用来加载模块的语法弄混了，这里的语法是为指定的符号创建一个别名。
你可以用这种方法为任意标识符创建别名，也包括导入的模块中的对象。

##### 创建别名基本方法

```TypeScript
namespace Shapes {
    export namespace Polygons {
        export class Triangle { }
        export class Square { }
    }
}

import polygons = Shapes.Polygons;
var sq = new polygons.Square(); // Same as 'new Shapes.Polygons.Square()'
```

注意，我们并没有使用`require`关键字，而是直接使用导入符号的限定名赋值。
这与使用`var`相似，但它还适用于类型和导入的具有命名空间含义的符号。
重要的是，对于值来讲，`import`会产生与原始符号不同的引用，所以改变别名的值并不会影响原始变量的值。

# 可选模块的加载与其它高级加载的场景

有些时候，你只想在某种条件下才去加载一个模块。
在TypeScript里，我们可以使用下面的方式来实现它以及其它高级加载的场景，直接调用模块加载器而不必担心类型安全问题。

编译器能探测出一个模块是否在生成的JavaScript里被使用到了。
对于那些只做为类型系统部分使用的模块来讲，不会生成对应`require代码`。
挑出未使用的引用有益于性能优化，同时也允许可选择性的加载模块。

这种模式的核心是`import id = require('...')`让我们可以访问外部模块导出的类型。
模块加载是动态调用的（通过`require`），像下面`if`语句展示的那样。
它利用了挑出对未使用引用的优化，模块只在需要的时候才去加载。
为了让这种方法可行，通过`import`定义的符号只能在表示类型的位置使用（也就是说那段代码永远不会被编译生成JavaScript）。

为了确保使用正确，我们可以使用`typeof`关键字。
在要求是类型的位置使用`typeof`关键字时，会得到类型值，在这个例子里得到的是外部模块的类型。

##### Node.js动态模块加载

```TypeScript
declare var require;
import Zip = require('./ZipCodeValidator');
if (needZipValidation) {
    var x: typeof Zip = require('./ZipCodeValidator');
    if (x.isAcceptable('.....')) { /* ... */ }
}
```

##### require.js动态模块加载

```TypeScript
declare var require;
import Zip = require('./ZipCodeValidator');
if (needZipValidation) {
    require(['./ZipCodeValidator'], (x: typeof Zip) => {
        if (x.isAcceptable('...')) { /* ... */ }
    });
}
```

# 使用其它JavaScript库

为了描述不是用TypeScript写的程序库的类型，我们需要对程序库暴露的API进行声明。
由于大部分程序库只提供少数的顶级对象，命名空间和模块是用来表示它们是一个好办法。
我们叫它声明不是对执行环境的定义。
通常会在`.d.ts`里写这些定义。
如果你熟悉C/C++，你可以把它们当做`.h`文件。
让我们看一些例子。

## 外部命名空间

流行的程序库D3在全局对象`d3`里定义它的功能。
因为这个库通过一个`<script>`标签加载（不是通过模块加载器），它的声明文件使用内部模块来定义它的类型。
为了让TypeScript编译器识别它的类型，我们使用外部命名空间声明。
比如，我们像下面这样写：

##### D3.d.ts (部分摘录)

<!-- TODO: This is not at all how it's done on DT - do we want to change this? -->
```TypeScript
declare namespace d3 {
    export interface Selectors {
        select: {
            (selector: string): Selection;
            (element: EventTarget): Selection;
        };
    }

    export interface Event {
        x: number;
        y: number;
    }

    export interface Base extends Selectors {
        event: Event;
    }
}

declare var d3: D3.Base;
```

## 外来的模块

在Node.js里，大多数的任务可以通过加载一个或多个模块来完成。
我们可以使用顶级export声明来为每个模块定义各自的`.d.ts`文件，但全部放在一个大的文件中会更方便。
为此，我们把模块名用引号括起来，方便之后的import。
例如：

##### node.d.ts (部分摘录)

```TypeScript
declare module "url" {
    export interface Url {
        protocol?: string;
        hostname?: string;
        pathname?: string;
    }

    export function parse(urlStr: string, parseQueryString?, slashesDenoteHost?): Url;
}

declare module "path" {
    export function normalize(p: string): string;
    export function join(...paths: any[]): string;
    export var sep: string;
}
```

现在我们可以`///<reference path="node.d.ts"/>`, 然后使用`import url = require('url');`加载这个模块。

```TypeScript
///<reference path="node.d.ts"/>
import url = require("url");
var myUrl = url.parse("http://www.typescriptlang.org");
```

# 命名空间和模块的陷井

这部分我们会描述常见的命名空间和模块的使用陷井，和怎样去避免它。

## 对模块使用`/// <reference>`

一个常见的错误是使用`/// <reference>`引用模块文件，应该使用import。
要理解这之间的不同，我们首先应该弄清编译器是怎么找到模块的类型信息的。

首先，根据`import x = require(...);`声明查找`.ts`文件。
这个文件应该是使用了顶级import或export声明的执行文件。

其次，与前一步相似，去查找`.d.ts`文件，不同的是它不是执行文件而是声明文件（同样具有顶级的import或export声明）。

最后，在`declare`的模块里寻找名字匹配的“外来模块的声明”。

##### myModules.d.ts

```TypeScript
// In a .d.ts file or .ts file that is not a module:
declare module "SomeModule" {
    export function fn(): string;
}
```

##### myOtherModule.ts

```TypeScript
/// <reference path="myModules.d.ts" />
import m = require("SomeModule");
```

这里的引用标签指定了外来模块的位置。
这就是一些Typescript例子中引用node.d.ts的方法。

## 不必要的命名空间

如果你想把命名空间转换为模块，它可能会像下面这个文件一件：

##### shapes.ts
```TypeScript
export namespace Shapes {
    export class Triangle { /* ... */ }
    export class Square { /* ... */ }
}
```

顶层的模块`Shapes`包裹了`Triangle`和`Square`。
这对于使用它的人来说是让人迷惑和讨厌的：

##### shapeConsumer.ts
```TypeScript
import shapes = require('./shapes');
var t = new shapes.Shapes.Triangle(); // shapes.Shapes?
```

TypeScript里模块的一个特点是不同的模块永远也不会在相同的作用域内使用相同的名字。
因为使用模块的人会为它们命名，所以完全没有必要把导出的符号包裹在一个命名空间里。

再次重申，不应该对模块使用命名空间，使用命名空间是为了提供逻辑分组和避免命名冲突。
模块文件本身已经是一个逻辑分组，并且它的名字是由导入这个模块的代码指定，所以没有必要为导出的对象增加额外的模块层。

下面是改进的例子：

##### shapes.ts

```TypeScript
export class Triangle { /* ... */ }
export class Square { /* ... */ }
```

##### shapeConsumer.ts
```TypeScript
import shapes = require('./shapes');
var t = new shapes.Triangle();
```

## 模块的取舍

就像每个JS文件对应一个模块一样，TypeScript里模块文件与生成的JS文件也是一一对应的。
这会产生一个效果，就是无法使用`--out`来让编译器合并多个模块文件为一个JavaScript文件。
