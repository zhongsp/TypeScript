# TypeScript 4.9

## `satisfies` 运算符

TypeScript 开发者有时会感到进退两难：既想要确保表达式能够*匹配*某种类型，也想要表达式获得最确切的类型用作类型推断。

例如：

```ts
// 每个属性可能是 string 或 RGB 元组。
const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    bleu: [0, 0, 255]
//  ^^^^ 拼写错误
};

// 我们想要在 'red' 上调用数组的方法
const redComponent = palette.red.at(0);

// 或者在 'green' 上调用字符串的方法
const greenNormalized = palette.green.toUpperCase();
```

注意，这里写成了 `bleu`，但我们想写的是 `blue`。
通过给 `palette` 添加类型注释就能够捕获 `bleu` 拼写错误，
但同时我们也失去了属性各自的信息。

```ts
type Colors = "red" | "green" | "blue";

type RGB = [red: number, green: number, blue: number];

const palette: Record<Colors, string | RGB> = {
    red: [255, 0, 0],
    green: "#00ff00",
    bleu: [0, 0, 255]
//  ~~~~ 能够检测到拼写错误
};

// 意想不到的错误 - 'palette.red' 可能为 string
const redComponent = palette.red.at(0);
```

新的 `satisfies` 运算符让我们可以验证表达式是否匹配某种类型，同时不改变表达式自身的类型。
例如，可以使用 `satisfies` 来检验 `palette` 的所有属性与 `string | number[]` 是否兼容：

```ts
type Colors = "red" | "green" | "blue";

type RGB = [red: number, green: number, blue: number];

const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    bleu: [0, 0, 255]
//  ~~~~ 捕获拼写错误
} satisfies Record<Colors, string | RGB>;

// 依然可以访问这些方法
const redComponent = palette.red.at(0);
const greenNormalized = palette.green.toUpperCase();
```

`satisfies` 可以用来捕获许多错误。
例如，检查一个对象是否包含了某个类型要求的所有的键，并且没有多余的：

```ts
type Colors = "red" | "green" | "blue";

// 确保仅包含 'Colors' 中定义的键
const favoriteColors = {
    "red": "yes",
    "green": false,
    "blue": "kinda",
    "platypus": false
//  ~~~~~~~~~~ 错误 - "platypus" 不在 'Colors' 中
} satisfies Record<Colors, unknown>;

// 'red', 'green', and 'blue' 的类型信息保留下来
const g: boolean = favoriteColors.green;
```

有可能我们不太在乎属性名，在乎的是属性值的类型。
在这种情况下，我们也能够确保对象属性值的类型是匹配的。

```ts
type RGB = [red: number, green: number, blue: number];

const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    blue: [0, 0]
    //    ~~~~~~ 错误！
} satisfies Record<string, string | RGB>;

// 类型信息保留下来
const redComponent = palette.red.at(0);
const greenNormalized = palette.green.toUpperCase();
```

更多示例请查看[这里](https://github.com/microsoft/TypeScript/issues/47920)和[这里](https://github.com/microsoft/TypeScript/pull/46827)。
感谢[Oleksandr Tarasiuk](https://github.com/a-tarasyuk)对该属性的贡献。

## 使用 `in` 运算符来细化并未列出其属性的对象类型

开发者经常需要处理在运行时不完全已知的值。
事实上，我们常常不能确定对象的某个属性是否存在，是否从服务端得到了响应或者读取到了某个配置文件。
JavaScript 的 `in` 运算符能够检查对象上是否存在某个属性。

从前，TypeScript 能够根据没有明确列出的属性来细化类型。

```ts
interface RGB {
    red: number;
    green: number;
    blue: number;
}

interface HSV {
    hue: number;
    saturation: number;
    value: number;
}

function setColor(color: RGB | HSV) {
    if ("hue" in color) {
        // 'color' 类型为 HSV
    }
    // ...
}
```

此处，`RGB` 类型上没有列出 `hue` 属性，因此被细化掉了，剩下了 `HSV` 类型。

那如果每个类型上都没有列出这个属性呢？
在这种情况下，语言无法提供太多的帮助。
看下面的 JavaScript 示例：

```ts
function tryGetPackageName(context) {
    const packageJSON = context.packageJSON;
    // Check to see if we have an object.
    if (packageJSON && typeof packageJSON === "object") {
        // Check to see if it has a string name property.
        if ("name" in packageJSON && typeof packageJSON.name === "string") {
            return packageJSON.name;
        }
    }

    return undefined;
}
```

将上面的代码改写为合适的 TypeScript，我们会给 `context` 定义一个类型；
然而，在旧版本的 TypeScript 中如果声明 `packageJSON` 属性的类型为安全的 `unknown` 类型会有问题。

```ts
interface Context {
    packageJSON: unknown;
}

function tryGetPackageName(context: Context) {
    const packageJSON = context.packageJSON;
    // Check to see if we have an object.
    if (packageJSON && typeof packageJSON === "object") {
        // Check to see if it has a string name property.
        if ("name" in packageJSON && typeof packageJSON.name === "string") {
        //                                              ~~~~
        // error! Property 'name' does not exist on type 'object.
            return packageJSON.name;
        //                     ~~~~
        // error! Property 'name' does not exist on type 'object.
        }
    }

    return undefined;
}
```

这是因为当 `packageJSON` 的类型从 `unknown` 细化为 `object` 类型后，
`in` 运算符会严格地将类型细化为包含了所检查属性的某个类型。
因此，`packageJSON` 的类型仍为 `object`。

TypeScript 4.9 增强了 `in` 运算符的类型细化功能，它能够更好地处理没有列出属性的类型。
现在 TypeScript 不是什么也不做，而是将其类型与 `Record<"property-key-being-checked", unknown>` 进行类型交叉运算。

因此在上例中，`packageJSON` 的类型将从 `unknown` 细化为 `object` 再细化为 `object & Record<"name", unknown>`。
这样就允许我们访问并细化类型 `packageJSON.name`。

```ts
interface Context {
    packageJSON: unknown;
}

function tryGetPackageName(context: Context): string | undefined {
    const packageJSON = context.packageJSON;
    // Check to see if we have an object.
    if (packageJSON && typeof packageJSON === "object") {
        // Check to see if it has a string name property.
        if ("name" in packageJSON && typeof packageJSON.name === "string") {
            // Just works!
            return packageJSON.name;
        }
    }

    return undefined;
}
```

TypeScript 4.9 还会严格限制 `in` 运算符的使用，以确保左侧的操作数能够赋值给 `string | number | symbol`，右侧的操作数能够赋值给 `object`。
它有助于检查是否使用了合法的属性名，以及避免在原始类型上进行检查。

更多详情请查看 [PR](https://github.com/microsoft/TypeScript/pull/50666).

## 类中的自动存取器

TypeScript 4.9 支持了 ECMAScript 即将引入的“自动存取器”功能。
自动存取器的声明如同定义一个类的属性，只不过是需要使用 `accessor` 关键字。

```ts
class Person {
    accessor name: string;

    constructor(name: string) {
        this.name = name;
    }
}
```

在底层实现中，自动存取器会被展开为 `get` 和 `set` 存取器，以及一个无法访问的私有成员。

```ts
class Person {
    #__name: string;

    get name() {
        return this.#__name;
    }
    set name(value: string) {
        this.#__name = name;
    }

    constructor(name: string) {
        this.name = name;
    }
}
```

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/49705)。

## 在 `NaN` 上的相等性检查

在 JavaScript 中，你无法使用内置的相等运算符去检查某个值是否等于 `NaN`。

由于一些原因，`NaN` 是个特殊的数值，它代表 `不是一个数字`。
没有值等于 `NaN`，包括 `NaN` 自己！

```ts
console.log(NaN == 0)  // false
console.log(NaN === 0) // false

console.log(NaN == NaN)  // false
console.log(NaN === NaN) // false
```

换句话说，任何值都不等于 `NaN`。

```ts
console.log(NaN != 0)  // true
console.log(NaN !== 0) // true

console.log(NaN != NaN)  // true
console.log(NaN !== NaN) // true
```

从技术上讲，这不是 JavaScript 独有的问题，任何使用 IEEE-754 浮点数的语言都有一样的问题；
但是 JavaScript 中主要的数值类型为浮点数，并且解析数值时经常会得到 `NaN`。
因此，检查 `NaN` 是很常见的操作，正确的方法是使用 `Number.isNaN` 函数 - 
但像上文提到的，很多人可能不小心地使用了 `someValue === NaN` 来进行检查。

现在，如果 TypeScript 发现直接比较 `NaN` 会报错，并提示使用 `Number.isNaN`。

```ts
function validate(someValue: number) {
    return someValue !== NaN;
    //     ~~~~~~~~~~~~~~~~~
    // error: This condition will always return 'true'.
    //        Did you mean '!Number.isNaN(someValue)'?
}
```

我们确信这个改动会帮助捕获初级的错误，就如同 TypeScript 也会检查比较对象字面量和数组字面量一样。

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 提交的 [PR](https://github.com/microsoft/TypeScript/pull/50626)。

## 监视文件功能使用文件系统事件

在先前的版本中，TypeScript 主要依靠*轮询*来监视每个文件。
使用轮询的策略意味着定期检查文件是否有更新。
在 Node.js 中，`fs.watchFile` 是内置的使用轮询来检查文件变动的方法。
虽说轮询在跨操作系统和文件系统的情况下更稳妥，但是它也意味着 CPU 会定期地被中断，转而去检查是否有文件更新即便在没有任何改动的情况下。
这在只有少数文件的时候问题不大，但如果工程包含了大量文件 - 或 `node_modules` 里有大量的文件 - 就会变得非常吃资源。

通常来讲，更好的做法是使用文件系统事件。
做为轮询的替换，我们声明对某些文件的变动感兴趣并提供回调函数用于处理有改动的文件。
大多数现代的平台提供了如 `CreateIoCompletionPort`、`kqueue`、`epoll` 和 `inotify` API。
Node.js 对这些 API 进行了抽象，提供了 `fs.watch` API。
文件系统事件通常可以很好地工作，但是也存在一些注意事项。
一个 watcher 需要考虑 [inode watching](https://nodejs.org/docs/latest-v18.x/api/fs.html#inodes)的问题、
[在一些文件系统上不可用](https://nodejs.org/docs/latest-v18.x/api/fs.html#availability)的问题（比如：网络文件系统）、
嵌套的文件监控是否可用、重命名目录是否触发事件以及可用 file watcher 耗尽的问题！
换句话说，这件事不是那么容易做的，特别是我们还需要跨平台。

因此，过去我们的默认选择是普遍好用的方式：轮询。
虽不总是，但大部分时候是这样的。

后来，我们提供了[选择文件监视策略的方法](https://www.typescriptlang.org/docs/handbook/configuring-watch.html)。
这让我们收到了很多使用反馈并改善跨平台的问题。
由于 TypeScript 必须要能够处理大规模的代码并且也已经有了改进，因此我们觉得切换到使用文件系统事件是件值得做的事情。

在 TypeScript 4.9 中，文件监视已经默认使用文件系统事件的方式，仅当无法初始化事件监视时才回退到轮询。
对大部分开发者来讲，在使用 `--watch` 模式或在 Visual Studio、VS Code 里使用 TypeScript 时会极大降低资源的占用。

[文件监视方式仍然是可以配置的](https://www.typescriptlang.org/docs/handbook/configuring-watch.html)，可以使用环境变量和 `watchOptions` - 像 [VS Code 这样的编辑器还支持单独配置](https://code.visualstudio.com/docs/getstarted/settings#:~:text=typescript%2etsserver%2ewatchOptions)。
如果你的代码使用的是网络文件系统（如 NFS 和 SMB）就需要回退到旧的行为；
但如果服务器有强大的处理能力，最好是启用 SSH 并且通过远程运行 TypeScript，这样就可以使用本地文件访问。
VS Code 支持了很多[远程开发](https://marketplace.visualstudio.com/search?term=remote&target=VSCode&category=All%20categories&sortBy=Relevance)的工具。

## 编辑器中的“删除未使用导入”和“排序导入”命令

以前，TypeScript 仅支持两个管理导入语句的编辑器命令。
拿下面的代码举例：

```ts
import { Zebra, Moose, HoneyBadger } from "./zoo";
import { foo, bar } from "./helper";

let x: Moose | HoneyBadger = foo();
```

第一个命令是 “组织导入语句”，它会删除未使用的导入并对剩下的条目排序。
因此会将上面的代码重写为：

```ts
import { foo } from "./helper";
import { HoneyBadger, Moose } from "./zoo";

let x: Moose | HoneyBadger = foo();
```

在 TypeScript 4.3 中，引入了“排序导入语句”命令，它仅排序导入语句但不进行删除，因此会将上例代码重写为：

```ts
import { bar, foo } from "./helper";
import { HoneyBadger, Moose, Zebra } from "./zoo";

let x: Moose | HoneyBadger = foo();
```

使用“排序导入语句”的注意事项是，在 VS Code 中该命令只能在保存文件时触发，而非能够手动执行的命令。

TypeScript 4.9 添加了另一半功能，提供了“移除未使用的导入”功能。
TypeScript 会移除未使用的导入命名和语句，但是不能改变当前的排序。

```ts
import { Moose, HoneyBadger } from "./zoo";
import { foo } from "./helper";

let x: Moose | HoneyBadger = foo();
```

该功能对任何编译器都是可用的；
但要注意的是，VS Code (1.73+) 会内置这个功能并且可以使用 `Command Pallette` 来执行。
如果用户想要使用更细的“移除未使用的导入”或“排序导入”命令，那么可以将“组织导入”的快捷键绑定到这些命令上。

更多详情请参考[这里](https://github.com/microsoft/TypeScript/pull/50931)。

## 在 `return` 关键字上使用跳转到定义

在编辑器中，当在 `return` 关键字上使用跳转到定义功能时，TypeScript 会跳转到函数的顶端。
这会帮助理解 `return` 语句是属于哪个函数的。

我们期待这个功能扩展到更多的关键字上，例如 `await` 和 `yield` 或者 `switch`、`case` 和 `default`。
感谢[Oleksandr Tarasiuk](https://github.com/a-tarasyuk)的[实现](https://github.com/microsoft/TypeScript/pull/51227)。

## 性能优化

TypeScript 进行了一些较小的但是能觉察到的性能优化。

首先，重写了 TypeScript 的 `forEachChild` 函数使用函数查找表代替 `switch` 语句。
`forEachChild` 是编译器在遍历语法节点时会反复调用的函数，和部分语言服务一起大量地被使用在编译绑定阶段。
对 `forEachChild` 函数的重构减少了绑定阶段和语言服务操作的 20% 时间消耗。

当我们看到了 `forEachChild` 的效果后也在 `visitEachChild`（在编译器和语言服务中用来变换节点的函数）上进行了类似的优化。
同样的重构减少了 3% 生成工程输出的时间消耗。

对于 `forEachChild` 的优化最初是受到了 [Artemis Everfree](https://artemis.sh/) [文章](https://artemis.sh/2022/08/07/emulating-calculators-fast-in-js.html)的启发。
虽说我们认为速度提升的根本原因是由于函数体积和复杂度的降低而非这篇文章里提到的问题，但我们非常感谢能够从中获得经验并快速地进行重构让 TypeScript 运行得更快。

最后，TypeScript 还优化了在条件类型的 `true` 分支中保留类型信息。
例如：

```ts
interface Zoo<T extends Animal> {
    // ...
}

type MakeZoo<A> = A extends Animal ? Zoo<A> : never;
```

TypeScript 在检查 `Zoo<A>`时需要记住 `A` 是 `Animal`。
TypeScript 通过新建 `A` 和 `Animal` 的交叉类型来保留该信息；
然而，TypeScript 之前采用的是即时求值的方式，即便有时是不需要的。
而且类型检查器中的一些问题代码使得这些类型无法被简化。
TypeScript 现在会推迟类型交叉操作直到真的有需要的时候。
对于大量地使用了有条件类型的代码来说，你会觉察到大幅的提速，但从我们的性能测试结果来看却只看到了 3% 的类型检查性能提升。
