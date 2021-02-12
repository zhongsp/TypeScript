# TypeScript 1.8

## 类型参数约束

在 TypeScript 1.8 中, 类型参数的限制可以引用自同一个类型参数列表中的类型参数. 在此之前这种做法会报错. 这种特性通常被叫做 [F-Bounded Polymorphism](https://en.wikipedia.org/wiki/Bounded_quantification#F-bounded_quantification).

### 例子

```typescript
function assign<T extends U, U>(target: T, source: U): T {
    for (let id in source) {
        target[id] = source[id];
    }
    return target;
}

let x = { a: 1, b: 2, c: 3, d: 4 };
assign(x, { b: 10, d: 20 });
assign(x, { e: 0 });  // 错误
```

## 控制流错误分析

TypeScript 1.8 中引入了控制流分析来捕获开发者通常会遇到的一些错误.

详情见接下来的内容, 可以上手尝试:

![cfa](https://cloud.githubusercontent.com/assets/8052307/5210657/c5ae0f28-7585-11e4-97d8-86169ef2a160.gif)

### 不可及的代码

一定无法在运行时被执行的语句现在会被标记上代码不可及错误. 举个例子, 在无条件限制的 `return`, `throw`, `break` 或者 `continue` 后的语句被认为是不可及的. 使用 `--allowUnreachableCode` 来禁用不可及代码的检测和报错.

#### 例子

这里是一个简单的不可及错误的例子:

```typescript
function f(x) {
    if (x) {
       return true;
    }
    else {
       return false;
    }

    x = 0; // 错误: 检测到不可及的代码.
}
```

这个特性能捕获的一个更常见的错误是在 `return` 语句后添加换行:

```typescript
function f() {
    return            // 换行导致自动插入的分号
    {
        x: "string"   // 错误: 检测到不可及的代码.
    }
}
```

因为 JavaScript 会自动在行末结束 `return` 语句, 下面的对象字面量变成了一个代码块.

### 未使用的标签

未使用的标签也会被标记. 和不可及代码检查一样, 被使用的标签检查也是默认开启的. 使用 `--allowUnusedLabels` 来禁用未使用标签的报错.

#### 例子

```typescript
loop: while (x > 0) {  // 错误: 未使用的标签.
    x++;
}
```

### 隐式返回

JS 中没有返回值的代码分支会隐式地返回 `undefined`. 现在编译器可以将这种方式标记为隐式返回. 对于隐式返回的检查默认是被禁用的, 可以使用 `--noImplicitReturns` 来启用.

#### 例子

```typescript
function f(x) { // 错误: 不是所有分支都返回了值.
    if (x) {
        return false;
    }

    // 隐式返回了 `undefined`
}
```

### Case 语句贯穿

TypeScript 现在可以在 switch 语句中出现贯穿的几个非空 case 时报错. 这个检测默认是关闭的, 可以使用 `--noFallthroughCasesInSwitch` 启用.

#### 例子

```typescript
switch (x % 2) {
    case 0: // 错误: switch 中出现了贯穿的 case.
        console.log("even");

    case 1:
        console.log("odd");
        break;
}
```

然而, 在下面的例子中, 由于贯穿的 case 是空的, 并不会报错:

```typescript
switch (x % 3) {
    case 0:
    case 1:
        console.log("Acceptable");
        break;

    case 2:
        console.log("This is *two much*!");
        break;
}
```

## React里的函数组件

TypeScript 现在支持[函数组件](https://reactjs.org/docs/components-and-props.html#functional-and-class-components). 它是可以组合其他组件的轻量级组件.

```typescript
// 使用参数解构和默认值轻松地定义 'props' 的类型
const Greeter = ({name = 'world'}) => <div>Hello, {name}!</div>;

// 参数可以被检验
let example = <Greeter name='TypeScript 1.8' />;
```

如果需要使用这一特性及简化的 props, 请确认使用的是[最新的 react.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/react).

## 简化的 React `props` 类型管理

在 TypeScript 1.8 配合最新的 react.d.ts \(见上方\) 大幅简化了 `props` 的类型声明.

具体的:

* 你不再需要显式的声明 `ref` 和 `key` 或者 `extend React.Props`
* `ref` 和 `key` 属性会在所有组件上拥有正确的类型.
* `ref` 属性在无状态函数组件上会被正确地禁用.

## 在模块中扩充全局或者模块作用域

用户现在可以为任何模块进行他们想要, 或者其他人已经对其作出的扩充. 模块扩充的形式和过去的包模块一致 \(例如 `declare module "foo" { }` 这样的语法\), 并且可以直接嵌在你自己的模块内, 或者在另外的顶级外部包模块中.

除此之外, TypeScript 还以 `declare global { }` 的形式提供了对于_全局_声明的扩充. 这能使模块对像 `Array` 这样的全局类型在必要的时候进行扩充.

模块扩充的名称解析规则与 `import` 和 `export` 声明中的一致. 扩充的模块声明合并方式与在同一个文件中声明是相同的.

不论是模块扩充还是全局声明扩充都不能向顶级作用域添加新的项目 - 它们只能为已经存在的声明添加 "补丁".

### 例子

这里的 `map.ts` 可以声明它会在内部修改在 `observable.ts` 中声明的 `Observable` 类型, 添加 `map` 方法.

```typescript
// observable.ts
export class Observable<T> {
    // ...
}
```

```typescript
// map.ts
import { Observable } from "./observable";

// 扩充 "./observable"
declare module "./observable" {

    // 使用接口合并扩充 'Observable' 类的定义
    interface Observable<T> {
        map<U>(proj: (el: T) => U): Observable<U>;
    }

}

Observable.prototype.map = /*...*/;
```

```typescript
// consumer.ts
import { Observable } from "./observable";
import "./map";

let o: Observable<number>;
o.map(x => x.toFixed());
```

相似的, 在模块中全局作用域可以使用 `declare global` 声明被增强:

### 例子

```typescript
// 确保当前文件被当做一个模块.
export {};

declare global {
    interface Array<T> {
        mapToNumbers(): number[];
    }
}

Array.prototype.mapToNumbers = function () { /* ... */ }
```

## 字符串字面量类型

接受一个特定字符串集合作为某个值的 API 并不少见. 举例来说, 考虑一个可以通过控制[动画的渐变](https://en.wikipedia.org/wiki/Inbetweening)让元素在屏幕中滑动的 UI 库:

```typescript
declare class UIElement {
    animate(options: AnimationOptions): void;
}

interface AnimationOptions {
    deltaX: number;
    deltaY: number;
    easing: string; // 可以是 "ease-in", "ease-out", "ease-in-out"
}
```

然而, 这容易产生错误 - 当用户错误不小心错误拼写了一个合法的值时, 并没有任何提示:

```typescript
// 没有报错
new UIElement().animate({ deltaX: 100, deltaY: 100, easing: "ease-inout" });
```

在 TypeScript 1.8 中, 我们新增了字符串字面量类型. 这些类型和字符串字面量的写法一致, 只是写在类型的位置.

用户现在可以确保类型系统会捕获这样的错误. 这里是我们使用了字符串字面量类型的新的 `AnimationOptions`:

```typescript
interface AnimationOptions {
    deltaX: number;
    deltaY: number;
    easing: "ease-in" | "ease-out" | "ease-in-out";
}

// 错误: 类型 '"ease-inout"' 不能复制给类型 '"ease-in" | "ease-out" | "ease-in-out"'
new UIElement().animate({ deltaX: 100, deltaY: 100, easing: "ease-inout" });
```

## 更好的联合/交叉类型接口

TypeScript 1.8 优化了源类型和目标类型都是联合或者交叉类型的情况下的类型推导. 举例来说, 当从 `string | string[]` 推导到 `string | T` 时, 我们将类型拆解为 `string[]` 和 `T`, 这样就可以将 `string[]` 推导为 `T`.

### 例子

```typescript
type Maybe<T> = T | void;

function isDefined<T>(x: Maybe<T>): x is T {
    return x !== undefined && x !== null;
}

function isUndefined<T>(x: Maybe<T>): x is void {
    return x === undefined || x === null;
}

function getOrElse<T>(x: Maybe<T>, defaultValue: T): T {
    return isDefined(x) ? x : defaultValue;
}

function test1(x: Maybe<string>) {
    let x1 = getOrElse(x, "Undefined");         // string
    let x2 = isDefined(x) ? x : "Undefined";    // string
    let x3 = isUndefined(x) ? "Undefined" : x;  // string
}

function test2(x: Maybe<number>) {
    let x1 = getOrElse(x, -1);         // number
    let x2 = isDefined(x) ? x : -1;    // number
    let x3 = isUndefined(x) ? -1 : x;  // number
}
```

## 使用 `--outFile` 合并 `AMD` 和 `System` 模块

在使用 `--module amd` 或者 `--module system` 的同时制定 `--outFile` 将会把所有参与编译的模块合并为单个包括了多个模块闭包的输出文件.

每一个模块都会根据其相对于 `rootDir` 的位置被计算出自己的模块名称.

### 例子

```typescript
// 文件 src/a.ts
import * as B from "./lib/b";
export function createA() {
    return B.createB();
}
```

```typescript
// 文件 src/lib/b.ts
export function createB() {
    return { };
}
```

结果为:

```javascript
define("lib/b", ["require", "exports"], function (require, exports) {
    "use strict";
    function createB() {
        return {};
    }
    exports.createB = createB;
});
define("a", ["require", "exports", "lib/b"], function (require, exports, B) {
    "use strict";
    function createA() {
        return B.createB();
    }
    exports.createA = createA;
});
```

## 支持 SystemJS 使用 `default` 导入

像 SystemJS 这样的模块加载器将 CommonJS 模块做了包装并暴露为 `default` ES6 导入项. 这使得在 SystemJS 和 CommonJS 的实现由于不同加载器不同的模块导出方式不能共享定义.

设置新的编译选项 `--allowSyntheticDefaultImports` 指明模块加载器会进行导入的 `.ts` 或 `.d.ts` 中未指定的某种类型的默认导入项构建. 编译器会由此推断存在一个 `default` 导出项和整个模块自己一致.

此选项在 System 模块默认开启.

## 允许循环中被引用的 `let`/`const`

之前这样会报错, 现在由 TypeScript 1.8 支持. 循环中被函数引用的 `let`/`const` 声明现在会被输出为与 `let`/`const` 更新语义相符的代码.

### 例子

```typescript
let list = [];
for (let i = 0; i < 5; i++) {
    list.push(() => i);
}

list.forEach(f => console.log(f()));
```

被编译为:

```javascript
var list = [];
var _loop_1 = function(i) {
    list.push(function () { return i; });
};
for (var i = 0; i < 5; i++) {
    _loop_1(i);
}
list.forEach(function (f) { return console.log(f()); });
```

然后结果是:

```text
0
1
2
3
4
```

## 改进的 `for..in` 语句检查

过去 `for..in` 变量的类型被推断为 `any`, 这使得编译器忽略了 `for..in` 语句内的一些不合法的使用.

从 TypeScript 1.8 开始:

* 在 `for..in` 语句中的变量隐含类型为 `string`.
* 当一个有数字索引签名对应类型 `T` \(比如一个数组\) 的对象被一个 `for..in` 索引_有_数字索引签名并且_没有_字符串索引签名 \(比如还是数组\) 的对象的变量索引, 产生的值的类型为 `T`.

### 例子

```typescript
var a: MyObject[];
for (var x in a) {   // x 的隐含类型为 string
    var obj = a[x];  // obj 的类型为 MyObject
}
```

## 模块现在输出时会加上 `"use strict;"`

对于 ES6 来说模块始终以严格模式被解析, 但这一点过去对于非 ES6 目标在生成的代码中并没有遵循. 从 TypeScript 1.8 开始, 输出的模块总会为严格模式. 由于多数严格模式下的错误也是 TS 编译时的错误, 多数代码并不会有可见的改动, 但是这也意味着有一些东西可能在运行时没有征兆地失败, 比如赋值给 `NaN` 现在会有运行时错误. 你可以参考这篇 [MDN 上的文章](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mod) 查看详细的严格模式与非严格模式的区别列表.

## 使用 `--allowJs` 加入 `.js` 文件

经常在项目中会有外部的非 TypeScript 编写的源文件. 一种方式是将 JS 代码转换为 TS 代码, 但这时又希望将所有 JS 代码和新的 TS 代码的输出一起打包为一个文件.

`.js` 文件现在允许作为 `tsc` 的输入文件. TypeScript 编译器会检查 `.js` 输入文件的语法错误, 并根据 `--target` 和 `--module` 选项输出对应的代码. 输出也会和其他 `.ts` 文件一起. `.js` 文件的 source maps 也会像 `.ts` 文件一样被生成.

## 使用 `--reactNamespace` 自定义 JSX 工厂

在使用 `--jsx react` 的同时使用 `--reactNamespace <JSX 工厂名称>` 可以允许使用一个不同的 JSX 工厂代替默认的 `React`.

新的工厂名称会被用来调用 `createElement` 和 `__spread` 方法.

### 例子

```typescript
import {jsxFactory} from "jsxFactory";

var div = <div>Hello JSX!</div>
```

编译参数:

```text
tsc --jsx react --reactNamespace jsxFactory --m commonJS
```

结果:

```javascript
"use strict";
var jsxFactory_1 = require("jsxFactory");
var div = jsxFactory_1.jsxFactory.createElement("div", null, "Hello JSX!");
```

## 基于 `this` 的类型收窄

TypeScript 1.8 为类和接口方法扩展了[用户定义的类型收窄函数](typescript-1.8.md#用户定义的类型收窄函数).

`this is T` 现在是类或接口方法的合法的返回值类型标注. 当在类型收窄的位置使用时 \(比如 `if` 语句\), 函数调用表达式的目标对象的类型会被收窄为 `T`.

### 例子

```typescript
class FileSystemObject {
    isFile(): this is File { return this instanceof File; }
    isDirectory(): this is Directory { return this instanceof Directory;}
    isNetworked(): this is (Networked & this) { return this.networked; }
    constructor(public path: string, private networked: boolean) {}
}

class File extends FileSystemObject {
    constructor(path: string, public content: string) { super(path, false); }
}
class Directory extends FileSystemObject {
    children: FileSystemObject[];
}
interface Networked {
    host: string;
}

let fso: FileSystemObject = new File("foo/bar.txt", "foo");
if (fso.isFile()) {
    fso.content; // fso 是 File
}
else if (fso.isDirectory()) {
    fso.children; // fso 是 Directory
}
else if (fso.isNetworked()) {
    fso.host; // fso 是 networked
}
```

## 官方的 TypeScript NuGet 包

从 TypeScript 1.8 开始, 将为 TypeScript 编译器 \(`tsc.exe`\) 和 MSBuild 整合 \(`Microsoft.TypeScript.targets` 和 `Microsoft.TypeScript.Tasks.dll`\) 提供官方的 NuGet 包.

稳定版本可以在这里下载:

* [Microsoft.TypeScript.Compiler](https://www.nuget.org/packages/Microsoft.TypeScript.Compiler/)
* [Microsoft.TypeScript.MSBuild](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild/)

与此同时, 和[每日npm包](https://blogs.msdn.com/b/typescript/archive/2015/07/27/introducing-typescript-nightlies.aspx)对应的每日 NuGet 包可以在[https://myget.org](https://myget.org)下载:

* [TypeScript-Preview](https://www.myget.org/gallery/typescript-preview)

## `tsc` 错误信息更美观

我们理解大量单色的输出并不直观. 颜色可以帮助识别信息的始末, 这些视觉上的线索在处理复杂的错误信息时非常重要.

通过传递 `--pretty` 命令行选项, TypeScript 会给出更丰富的输出, 包含错误发生的上下文.

![&#x5C55;&#x793A;&#x5728; ConEmu &#x4E2D;&#x7F8E;&#x5316;&#x4E4B;&#x540E;&#x7684;&#x9519;&#x8BEF;&#x4FE1;&#x606F;](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/images/new-in-typescript/pretty01.png)

## 高亮 VS 2015 中的 JSX 代码

在 TypeScript 1.8 中, JSX 标签现在可以在 Visual Studio 2015 中被分别和高亮.

![jsx](https://cloud.githubusercontent.com/assets/8052307/12271404/b875c502-b90f-11e5-93d8-c6740be354d1.png)

通过 `工具`-&gt;`选项`-&gt;`环境`-&gt;`字体与颜色` 页面在 `VB XML` 颜色和字体设置中还可以进一步改变字体和颜色来自定义.

## `--project` \(`-p`\) 选项现在接受任意文件路径

`--project` 命令行选项过去只接受包含了 `tsconfig.json` 文件的文件夹. 考虑到不同的构建场景, 应该允许 `--project` 指向任何兼容的 JSON 文件. 比如说, 一个用户可能会希望为 Node 5 编译 CommonJS 的 ES 2015, 为浏览器编译 AMD 的 ES5. 现在少了这项限制, 用户可以更容易地直接使用 `tsc` 管理不同的构建目标, 无需再通过一些奇怪的方式, 比如将多个 `tsconfig.json` 文件放在不同的目录中.

如果参数是一个路径, 行为保持不变 - 编译器会尝试在该目录下寻找名为 `tsconfig.json` 的文件.

## 允许 tsconfig.json 中的注释

为配置添加文档是很棒的! `tsconfig.json` 现在支持单行和多行注释.

```javascript
{
    "compilerOptions": {
        "target": "ES2015", // 跑在 node v5 上, 呀!
        "sourceMap": true   // 让调试轻松一些
    },
    /*
     * 排除的文件
     */
    "exclude": [
        "file.d.ts"
    ]
}
```

## 支持输出到 IPC 驱动的文件

TypeScript 1.8 允许用户将 `--outFile` 参数和一些特殊的文件系统对象一起使用, 比如命名的管道 \(pipe\), 设备 \(devices\) 等.

举个例子, 在很多与 Unix 相似的系统上, 标准输出流可以通过文件 `/dev/stdout` 访问.

```bash
tsc foo.ts --outFile /dev/stdout
```

这一特性也允许输出给其他命令.

比如说, 我们可以输出生成的 JavaScript 给一个像 [pretty-js](https://www.npmjs.com/package/pretty-js) 这样的格式美化工具:

```bash
tsc foo.ts --outFile /dev/stdout | pretty-js
```

## 改进了 Visual Studio 2015 中对 `tsconfig.json` 的支持

TypeScript 1.8 允许在任何种类的项目中使用 `tsconfig.json` 文件. 包括 ASP.NET v4 项目, _控制台应用_, 以及 _用 TypeScript 开发的 HTML 应用_. 与此同时, 你可以添加不止一个 `tsconfig.json` 文件, 其中每一个都会作为项目的一部分被构建. 这使得你可以在不使用多个不同项目的情况下为应用的不同部分使用不同的配置.

![&#x5C55;&#x793A; Visual Studio &#x4E2D;&#x7684; tsconfig.json](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/images/new-in-typescript/tsconfig-in-vs.png)

当项目中添加了 `tsconfig.json` 文件时, 我们还禁用了项目属性页面. 也就是说所有配置的改变必须在 `tsconfig.json` 文件中进行.

### 一些限制

* 如果你添加了一个 `tsconfig.json` 文件, 不在其上下文中的 TypeScript 文件不会被编译.
* Apache Cordova 应用依然有单个 `tsconfig.json` 文件的限制, 而这个文件必须在根目录或者 `scripts` 文件夹.
* 多数项目类型中都没有 `tsconfig.json` 的模板.

