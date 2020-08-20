## 改进类型推断和`Promise.all`

TypeScript的最近几个版本（3.7前后）更新了像`Promise.all`和`Promise.race`等的函数声明。
不巧的是，它引入了一些回归问题，尤其是在和`null`或`undefined`混合使用的场景中。

```ts
interface Lion {
  roar(): void;
}

interface Seal {
  singKissFromARose(): void;
}

async function visitZoo(
  lionExhibit: Promise<Lion>,
  sealExhibit: Promise<Seal | undefined>
) {
  let [lion, seal] = await Promise.all([lionExhibit, sealExhibit]);
  lion.roar();
  //   ~~~~
  //  对象可能为'undefined'
}
```

这是一种奇怪的行为！
事实上，只有`sealExhibit`包含了`undefined`值，但是它却让`lion`也含有了`undefined`值。

得益于[Jack Bates](https://github.com/jablko)提交的[PR](https://github.com/microsoft/TypeScript/pull/34501)，这个问题已经被修复了，它改进了TypeScript 3.9中的类型推断流程。
上面的例子中已经不再产生错误。
如果你在旧版本的TypeScript中被`Promise`的这个问题所困扰，我们建议你尝试一下3.9版本！

### `awaited` 类型

如果你一直关注TypeScript，那么你可能会注意到[一个新的类型运算符`awaited`](https://github.com/microsoft/TypeScript/pull/35998)。
这个类型运算符的作用是准确地表达JavaScript中`Promise`的工作方式。

我们原计划在TypeScript 3.9中支持`awaited`，但在现有的代码中测试过该特性后，我们发现还需要进行一些设计，以便让所有人能够顺利地使用它。
因此，我们从主分支中暂时移除了这个特性。
我们将继续试验这个特性，它不会被包含进本次发布。

## 速度优化

TypeScript 3.9提供了多项速度优化。
TypeScript在`material-ui`和`styled-components`代码包中拥有非常慢的编辑速度和编译速度。在发现了这点后，TypeScript团队集中了精力解决性能问题。
TypeScript优化了大型联合类型、交叉类型、有条件类型和映射类型。

- https://github.com/microsoft/TypeScript/pull/36576
- https://github.com/microsoft/TypeScript/pull/36590
- https://github.com/microsoft/TypeScript/pull/36607
- https://github.com/microsoft/TypeScript/pull/36622
- https://github.com/microsoft/TypeScript/pull/36754
- https://github.com/microsoft/TypeScript/pull/36696

上面列出的每一个PR都能够减少5-10%的编译时间（对于某些代码库）。
对于`material-ui`库而言，现在能够节约大约40%的编译时间！

我们还调整了在编辑器中的文件重命名功能。
从Visual Studio Code团队处得知，当重命名一个文件时，计算出需要更新的`import`语句要花费5到10秒的时间。
TypeScript 3.9通过[改变编译器和语言服务缓存文件查询的内部实现](https://github.com/microsoft/TypeScript/pull/37055)解决了这个问题。

尽管仍有优化的空间，我们希望当前的改变能够为每个人带来更流畅的体验。

## `// @ts-expect-error` 注释

设想一下，我们正在使用TypeScript编写一个代码库，它对外开放了一个公共函数`doStuff`。
该函数的类型声明了它接受两个`string`类型的参数，因此其它TypeScript的用户能够看到类型检查的结果，但该函数还进行了运行时的检查以便JavaScript用户能够看到一个有帮助的错误。

```ts
function doStuff(abc: string, xyz: string) {
  assert(typeof abc === "string");
  assert(typeof xyz === "string");

  // do some stuff
}
```

如果有人错误地使用了该函数，那么TypeScript用户能够看到红色的波浪线和错误提示，JavaScript用户会看到断言错误。
然后，我们想编写一条单元测试来测试该行为。

```ts
expect(() => {
  doStuff(123, 456);
}).toThrow();
```

不巧的是，如果你使用TypeScript来编译单元测试，TypeScript会提示一个错误！

```ts
doStuff(123, 456);
//      ~~~
// 错误：类型'number'不能够赋值给类型'string'。
```

这就是TypeScript 3.9添加了`// @ts-expect-error`注释的原因。
当一行代码带有`// @ts-expect-error`注释时，TypeScript不会提示上例的错误；
但如果该行代码没有错误，TypeScript会提示没有必要使用`// @ts-expect-error`。

示例，以下的代码是正确的：

```ts
// @ts-expect-error
console.log(47 * "octopus");
```

但是下面的代码：

```ts
// @ts-expect-error
console.log(1 + 1);
```

会产生错误：

```
未使用的 '@ts-expect-error' 指令。
```

非常感谢[Josh Goldberg](https://github.com/JoshuaKGoldberg)实现了这个功能。
更多信息请参考[the `ts-expect-error` pull request](https://github.com/microsoft/TypeScript/pull/36014)。

### `ts-ignore` 还是 `ts-expect-error`?

某些情况下，`// @ts-expect-error`和`// @ts-ignore`是相似的，都能够阻止产生错误消息。
两者的不同在于，如果下一行代码没有错误，那么`// @ts-ignore`不会做任何事。

你可能会想要抛弃`// @ts-ignore`注释转而去使用`// @ts-expect-error`，并且想要知道哪一个更适用于以后的代码。
实际上，这完全取决于你和你的团队，下面列举了一些具体情况。

如果满足以下条件，那么选择`ts-expect-error`：

- 你在编写单元测试，并且想让类型系统提示错误
- 你知道此处有问题，并且很快会回来改正它，只是暂时地忽略该错误
- 你的团队成员都很积极，大家想要在代码回归正常后及时地删除忽略类型检查注释

如果满足以下条件，那么选择`ts-ignore`：

- 项目规模较大，产生了一些错误但是找不到相应代码的负责人
- 正处于TypeScript版本升级的过程中，某些错误只在特定版本的TypeScript中存在，但是在其它版本中并不存在
- 你没有足够的时间考虑究竟应该使用`// @ts-ignore`还是`// @ts-expect-error`

## 在条件表达式中检查未被调用的函数

在TypeScript 3.7中，我们引入了_未进行函数调用的检查_，当你忘记去调用某个函数时会产生错误。

```ts
function hasImportantPermissions(): boolean {
  // ...
}

// Oops!
if (hasImportantPermissions) {
  //  ~~~~~~~~~~~~~~~~~~~~~~~
  // 这个条件永远返回true，因为函数已经被定义。
  // 你是否想要调用该函数？
  deleteAllTheImportantFiles();
}
```

然而，这个错误只会在`if`条件语句中才会提示。
多亏了[Alexander Tarasyuk](https://github.com/a-tarasyuk)提交的[PR](https://github.com/microsoft/TypeScript/pull/36402)，现在这个特性也支持在三元表达式中使用，例如`cond ? trueExpr : falseExpr`。

```ts
declare function listFilesOfDirectory(dirPath: string): string[];
declare function isDirectory(): boolean;

function getAllFiles(startFileName: string) {
  const result: string[] = [];
  traverse(startFileName);
  return result;

  function traverse(currentPath: string) {
    return isDirectory
      ? // ~~~~~~~~~~~
        // 该条件永远返回true
        // 因为函数已经被定义。
        // 你是否想要调用该函数？
        listFilesOfDirectory(currentPath).forEach(traverse)
      : result.push(currentPath);
  }
}
```

https://github.com/microsoft/TypeScript/issues/36048

## 编辑器改进

TypeScript编译器不但支持在大部分编辑器中编写TypeScript代码，还支持着在Visual Studio系列的编辑器中编写JavaScript代码。
针对不同的编辑器，在使用TypeScript/JavaScript的新功能时可能会有所区别，但是

- Visual Studio Code支持[选择不同的TypeScript版本](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-the-workspace-version-of-typescript)。或者，安装[JavaScript/TypeScript Nightly Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)插件来使用最新的版本。
- Visual Studio 2017/2019提供了SDK安装包，以及[MSBuild安装包](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild)。
- Sublime Text 3支持[选择不同的TypeScript版本](https://github.com/microsoft/TypeScript-Sublime-Plugin#note-using-different-versions-of-typescript)

### 在JavaScript中自动导入CommonJS模块

在使用了CommonJS模块的JavaScript文件中，我们对自动导入功能进行了一个非常棒的改进。

在旧的版本中，TypeScript总是假设你想要使用ECMAScript模块风格的导入语句，并且无视你的文件类型。

```js
import * as fs from "fs";
```

然而，在编写JavaScript文件时，并不总是想要使用ECMAScript模块风格。
非常多的用户仍然在使用CommonJS模块，例如`require(...)`。

```js
const fs = require("fs");
```

现在，TypeScript会自动检测你正在使用的导入语句风格，并使用当前的导入语句风格。

<video src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/03/ERkaliGU0AA5anJ1.mp4"></video>

更新信息请参考[PR](https://github.com/microsoft/TypeScript/pull/37027).

### Code Actions 保留换行符

TypeScript的重构工具和快速修复工具对换行符的处理不是非常好。
一个基本的示例如下。

```ts
const maxValue = 100;

/*start*/
for (let i = 0; i <= maxValue; i++) {
  // First get the squared value.
  let square = i ** 2;

  // Now print the squared value.
  console.log(square);
}
/*end*/
```

如果我们选中从`/*start*/`到`/*end*/`，然后进行“提取到函数”操作，我们会得到如下的代码。

```ts
const maxValue = 100;

printSquares();

function printSquares() {
  for (let i = 0; i <= maxValue; i++) {
    // First get the squared value.
    let square = i ** 2;
    // Now print the squared value.
    console.log(square);
  }
}
```

![在旧版本的TypeScript中，将循环提取到函数时，换行符没有被保留。](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/03/printSquaresWithoutNewlines-3.9.gif.gif)

这不是我们想要的 - 在`for`循环中，每条语句之间都有一个空行，但是重构后它们被移除了！
TypeScript 3.9调整后，它会保留我们编写的代码。

```ts
const maxValue = 100;

printSquares();

function printSquares() {
  for (let i = 0; i <= maxValue; i++) {
    // First get the squared value.
    let square = i ** 2;

    // Now print the squared value.
    console.log(square);
  }
}
```

![在TypeScript 3.9中，将循环提取到函数时，会保留一个换行符。](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/03/printSquaresWithNewlines-3.9.gif.gif)

更多信息请参考[PR](https://github.com/microsoft/TypeScript/pull/36688)

### 快速修复：缺失的返回值表达式

有时候，我们可能忘记在函数的最后添加返回值语句，尤其是在将简单箭头函数转换成还有花括号的箭头函数时。

```ts
// before
let f1 = () => 42;

// oops - not the same!
let f2 = () => {
  42;
};
```

感谢开源社区的[Wenlu Wang](https://github.com/Kingwl)的[PR](https://github.com/microsoft/TypeScript/pull/26434)，TypeScript提供了快速修复功能来添加`return`语句，删除花括号，或者为箭头函数体添加小括号用以区分对象字面量。

![示例](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2020/04/missingReturnValue-3-9.gif)

### 支持"Solution Style"的`tsconfig.json`文件

编译器需要知道一个文件被哪个配置文件所管理，因此才能够应用适当的配置选项并且计算出当前“工程”包含了哪些文件。
在默认情况下，编辑器使用TypeScript语言服务来向上遍历父级目录以查找`tsconfig.json`文件。

有一种特殊情况是`tsconfig.json`文件仅用于引用其它`tsconfig.json`文件。

```json5
// tsconfig.json
{
  files: [],
  references: [
    { path: "./tsconfig.shared.json" },
    { path: "./tsconfig.frontend.json" },
    { path: "./tsconfig.backend.json" },
  ],
}
```

这个文件除了用来管理其它项目的配置文件之外什么也没做，在某些环境中它被叫作“solution”。
这里，任何一个`tsconfig.*.json`文件都不会被TypeScript语言服务所选用，但是我们希望语言服务能够分析出当前的`.ts`文件被上述`tsconfig.json`中引用的哪个配置文件所管理。

TypeScript 3.9为这种类型的配置方式添加了编辑器的支持。
更多信息请参考[PR](https://github.com/microsoft/TypeScript/pull/37239).
