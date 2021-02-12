# global-modifying-module.d.ts

## 修改了全局作用域的模块

对于修改了全局作用域的模块来讲，在导入它们时，会对全局作用域中的值进行修改。
比如存在某个代码库，当导入它时，它会向`String.prototype`上添加新的成员。
该模式存在危险，因为它有导致运行时冲突的可能性，
但我们仍然可以为其编写声明文件。

## 识别出修改了全局作用域的模块

我们可以通过文档来识别修改了全局作用域的模块。
通常来讲，它们与全局插件类似，但是需要`require`语句来激活。

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

以下是一个示例：

```ts
// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ This is the global-modifying module template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ Note: If your global-modifying module is callable or constructable, you'll
 *~ need to combine the patterns here with those in the module-class or module-function
 *~ template files
 */
declare global {
    /*~ Here, declare things that go in the global namespace, or augment
     *~ existing declarations in the global namespace
     */
    interface String {
        fancyFormat(opts: StringFormatOptions): string;
    }
}

/*~ If your module exports types or values, write them as usual */
export interface StringFormatOptions {
    fancinessLevel: number;
}

/*~ For example, declaring a method on the module (in addition to its global side effects) */
export function doSomething(): void;

/*~ If your module exports nothing, you'll need this line. Otherwise, delete it */
export {};
```
