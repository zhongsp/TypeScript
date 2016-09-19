> 这节假设你已经了解了模块的一些基本知识
请阅读[模块](./Modules.md)文档了解更多信息。

*模块解析*就是指编译器所要依据的一个流程，用它来找出某个导入操作所引用的具体值。
假设有一个导入语句`import { a } from "moduleA"`;
为了去检查任何对`a`的使用，编译器需要准确的知道它表示什么，并且会需要检查它的定义`moduleA`。

这时候，编译器会想知道“`moduleA`的shape是怎样的？”
这听上去很简单，`moduleA`可能在你写的某个`.ts`/`.tsx`文件里或者在你的代码所依赖的`.d.ts`里。

首先，编译器会尝试定位表示导入模块的文件。
编译会遵循下列二种策略之一：[Classic](#classic)或[Node](#node)。
这些策略会告诉编译器到*哪里*去查找`moduleA`。

如果它们失败了并且如果模块名是非相对的（且是在`"moduleA"`的情况下），编译器会尝试定位一个[外部模块声明](./Modules.md#ambient-modules)。
我们接下来会讲到非相对导入。

最后，如果编译器还是不能解析这个模块，它会记录一个错误。
在这种情况下，错误可能为`error TS2307: Cannot find module 'moduleA'.`

## 相对 vs. 非相对模块导入

根据模块引用是相对的还是非相对的，模块导入会以不同的方式解析。

*相对导入*是以`/`，`./`或`../`开头的。
下面是一些例子：

* `import Entry from "./components/Entry";`
* `import { DefaultHeaders } from "../constants/http";`
* `import "/mod";`

所有其它形式的导入被当作*非相对*的。
下面是一些例子：

* `import * as $ from "jQuery";`
* `import { Component } from "angular2/core";`

相对导入解析时是相对于导入它的文件来的，并且*不能*解析为一个外部模块声明。
你应该为你自己写的模块使用相对导入，这样能确保它们在运行时的相对位置。

## 模块解析策略

共有两种可用的模块解析策略：[Node](#node)和[Classic](#classic)。
你可以使用`--moduleResolution`标记为指定使用哪个。
默认值为[Node](#node)。

### Classic

这种策略以前是TypeScript默认的解析策略。
现在，它存在的理由主要是为了向后兼容。

相对导入的模块是相对于导入它的文件进行解析的。
因此`/root/src/folder/A.ts`文件里的`import { b } from "./moduleB"`会使用下面的查找流程：

1. `/root/src/folder/moduleB.ts`
2. `/root/src/folder/moduleB.d.ts`

对于非相对模块的导入，编译器则会从包含导入文件的目录开始依次向上级目录遍历，尝试定位匹配的声明文件。

比如：

有一个对`moduleB`的非相对导入`import { b } from "moduleB"`，它是在`/root/src/folder/A.ts`文件里，会以如下的方式来定位`"moduleB"`：

1. `/root/src/folder/moduleB.ts`
2. `/root/src/folder/moduleB.d.ts`
3. `/root/src/moduleB.ts`
4. `/root/src/moduleB.d.ts`
5. `/root/moduleB.ts`
6. `/root/moduleB.d.ts`
7. `/moduleB.ts`
8. `/moduleB.d.ts`

### Node

这个解析策略试图在运行时模仿[Node.js](https://nodejs.org/)模块解析机制。
完整的Node.js解析算法可以在[Node.js module documentation](https://nodejs.org/api/modules.html#modules_all_together)找到。

#### Node.js如何解析模块

为了理解TypeScript编译依照的解析步骤，先弄明白Node.js模块是非常重要的。
通常，在Node.js里导入是通过`require`函数调用进行的。
Node.js会根据`require`的是相对路径还是非相对路径做出不同的行为。

相对路径很简单。
例如，假设有一个文件路径为`/root/src/moduleA.js`，包含了一个导入`var x = require("./moduleB");`
Node.js以下面的顺序解析这个导入：

1. 将`/root/src/moduleB.js`视为文件，检查是否存在。

2. 将`/root/src/moduleB`视为目录，检查是否它包含`package.json`文件并且其指定了一个`"main"`模块。
   在我们的例子里，如果Node.js发现文件`/root/src/moduleB/package.json`包含了`{ "main": "lib/mainModule.js" }`，那么Node.js会引用`/root/src/moduleB/lib/mainModule.js`。

3. 将`/root/src/moduleB`视为目录，检查它是否包含`index.js`文件。
   这个文件会被隐式地当作那个文件夹下的"main"模块。

你可以阅读Node.js文档了解更多详细信息：[file modules](https://nodejs.org/api/modules.html#modules_file_modules) 和 [folder modules](https://nodejs.org/api/modules.html#modules_folders_as_modules)。

但是，[非相对模块名](#relative-vs-non-relative-module-imports)的解析是个完全不同的过程。
Node会在一个特殊的文件夹`node_modules`里查找你的模块。
`node_modules`可能与当前文件在同一级目录下，或者在上层目录里。
Node会向上级目录遍历，查找每个`node_modules`直到它找到要加载的模块。

还是用上面例子，但假设`/root/src/moduleA.js`里使用的是非相对路径导入`var x = require("moduleB");`。
Node则会以下面的顺序去解析`moduleB`，直到有一个匹配上。

1. `/root/src/node_modules/moduleB.js`
2. `/root/src/node_modules/moduleB/package.json` (如果指定了`"main"`属性)
3. `/root/src/node_modules/moduleB/index.js`
   <br /><br />
4. `/root/node_modules/moduleB.js`
5. `/root/node_modules/moduleB/package.json` (如果指定了`"main"`属性)
6. `/root/node_modules/moduleB/index.js`
   <br /><br />
7. `/node_modules/moduleB.js`
8. `/node_modules/moduleB/package.json` (如果指定了`"main"`属性)
9. `/node_modules/moduleB/index.js`

注意Node.js在步骤（4）和（7）会向上跳一级目录。

你可以阅读Node.js文档了解更多详细信息：[loading modules from `node_modules`](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders)。

#### TypeScript如何解析模块

TypeScript是模仿Node.js运行时的解析策略来在编译阶段定位模块定义文件。
因此，TypeScript在Node解析逻辑基础上增加了TypeScript源文件的扩展名（`.ts`，`.tsx`和`.d.ts`）。
同时，TypeScript在`package.json`里使用字段`"typings"`来表示类似`"main"`的意义 - 编译器会使用它来找到要使用的"main"定义文件。

比如，有一个导入语句`import { b } from "./moduleB"`在`/root/src/moduleA.ts`里，会以下面的流程来定位`"./moduleB"`：

1. `/root/src/moduleB.ts`
2. `/root/src/moduleB.tsx`
3. `/root/src/moduleB.d.ts`
4. `/root/src/moduleB/package.json` (如果指定了`"typings"`属性)
5. `/root/src/moduleB/index.ts`
6. `/root/src/moduleB/index.tsx`
7. `/root/src/moduleB/index.d.ts`

回想一下Node.js先查找`moduleB.js`文件，然后是合适的`package.json`，再之后是`index.js`。

类似地，非相对的导入会遵循Node.js的解析逻辑，首先查找文件，然后是合适的文件夹。
因此`/src/moduleA.ts`文件里的`import { b } from "moduleB"`会以下面的查找顺序解析：

1. `/root/src/node_modules/moduleB.ts`
2. `/root/src/node_modules/moduleB.tsx`
3. `/root/src/node_modules/moduleB.d.ts`
4. `/root/src/node_modules/moduleB/package.json` (如果指定了`"typings"`属性)
5. `/root/src/node_modules/moduleB/index.ts`
6. `/root/src/node_modules/moduleB/index.tsx`
7. `/root/src/node_modules/moduleB/index.d.ts`
   <br /><br />
8. `/root/node_modules/moduleB.ts`
9. `/root/node_modules/moduleB.tsx`
10. `/root/node_modules/moduleB.d.ts`
11. `/root/node_modules/moduleB/package.json` (如果指定了`"typings"`属性)
12. `/root/node_modules/moduleB/index.ts`
13. `/root/node_modules/moduleB/index.tsx`
14. `/root/node_modules/moduleB/index.d.ts`
    <br /><br />
15. `/node_modules/moduleB.ts`
16. `/node_modules/moduleB.tsx`
17. `/node_modules/moduleB.d.ts`
18. `/node_modules/moduleB/package.json` (如果指定了`"typings"`属性)
19. `/node_modules/moduleB/index.ts`
20. `/node_modules/moduleB/index.tsx`
21. `/node_modules/moduleB/index.d.ts`

不要被这里步骤的数量吓到 - TypeScript只是在步骤（8）和（15）向上跳了两次目录。
这并不比Node.js里的流程复杂。

## 使用`--noResolve`

正常来讲编译器会在开始编译之前解析模块导入。
每当它成功地解析了对一个文件`import`，这个文件被会加到一个文件列表里，以供编译器稍后处理。

`--noResolve`编译选项告诉编译器不要添加任何不是在命令行上传入的文件到编译列表。
编译器仍然会尝试解析模块，但是只要没有指定这个文件，那么它就不会被包含在内。

比如

#### app.ts

```ts
import * as A from "moduleA" // OK, moduleA passed on the command-line
import * as B from "moduleB" // Error TS2307: Cannot find module 'moduleB'.
```

```shell
tsc app.ts moduleA.ts --noResolve
```

使用`--noResolve`编译`app.ts`：

* 可能正确找到`moduleA`，因为它在命令行上指定了。
* 找不到`moduleB`，因为没有在命令行上传递。

## 常见问题

### 为什么在`exclude`列表里的模块还会被编译器使用

`tsconfig.json`将文件夹转变一个“工程”
如果不指定任何`“exclude”`或`“files”`，文件夹里的所有文件包括`tsconfig.json`和所有的子目录都会在编译列表里。
如果你想利用`“exclude”`排除某些文件，甚至你想指定所有要编译的文件列表，请使用`“files”`。

有些是被`tsconfig.json`自动加入的。
它不会涉及到上面讨论的模块解析。
如果编译器识别出一个文件是模块导入目标，它就会加到编译列表里，不管它是否被排除了。

因此，要从编译列表中排除一个文件，你需要在排除它的同时，还要排除所有对它进行`import`或使用了`/// <reference path="..." />`指令的文件。
