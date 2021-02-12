## 全局代码库

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

## 从代码来识别全局代码库

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

## 全局代码库的示例

由于将全局代码库转换为 UMD 代码库十分容易，因此很少有代码库仍然使用全局代码库风格。
然而，小型的代码库以及需要使用 DOM 的代码库仍然可以是全局的。

## 全局代码库模版

你可以看到如下声明文件的示例：

```ts
// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ If this library is callable (e.g. can be invoked as myLib(3)),
 *~ include those call signatures here.
 *~ Otherwise, delete this section.
 */
declare function myLib(a: string): string;
declare function myLib(a: number): number;

/*~ If you want the name of this library to be a valid type name,
 *~ you can do so here.
 *~
 *~ For example, this allows us to write 'var x: myLib';
 *~ Be sure this actually makes sense! If it doesn't, just
 *~ delete this declaration and add types inside the namespace below.
 */
interface myLib {
    name: string;
    length: number;
    extras?: string[];
}

/*~ If your library has properties exposed on a global variable,
 *~ place them here.
 *~ You should also place types (interfaces and type alias) here.
 */
declare namespace myLib {
    //~ We can write 'myLib.timeout = 50;'
    let timeout: number;

    //~ We can access 'myLib.version', but not change it
    const version: string;

    //~ There's some class we can create via 'let c = new myLib.Cat(42)'
    //~ Or reference e.g. 'function f(c: myLib.Cat) { ... }
    class Cat {
        constructor(n: number);

        //~ We can read 'c.age' from a 'Cat' instance
        readonly age: number;

        //~ We can invoke 'c.purr()' from a 'Cat' instance
        purr(): void;
    }

    //~ We can declare a variable as
    //~   'var s: myLib.CatSettings = { weight: 5, name: "Maru" };'
    interface CatSettings {
        weight: number;
        name: string;
        tailLength?: number;
    }

    //~ We can write 'const v: myLib.VetID = 42;'
    //~  or 'const v: myLib.VetID = "bob";'
    type VetID = string | number;

    //~ We can invoke 'myLib.checkCat(c)' or 'myLib.checkCat(c, v);'
    function checkCat(c: Cat, s?: VetID);
}
```
