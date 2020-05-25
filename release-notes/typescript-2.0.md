# TypeScript 2.0

## Null和undefined类型

TypeScript现在有两个特殊的类型：Null和Undefined, 它们的值分别是`null`和`undefined`。 以前这是不可能明确地命名这些类型的，但是现在`null`和`undefined`不管在什么类型检查模式下都可以作为类型名称使用。

以前类型检查器认为`null`和`undefined`赋值给一切。实际上，`null`和`undefined`是每一个类型的有效值， 并且不能明确排除它们（因此不可能检测到错误）。

### `--strictNullChecks`

`--strictNullChecks`可以切换到新的严格空检查模式中。

在严格空检查模式中，`null`和`undefined`值_不再_属于任何类型的值，仅仅属于它们自己类型和`any`类型的值 （还有一个例外，`undefined`也能赋值给`void`）。因此，尽管在常规类型检查模式下`T`和`T | undefined`被认为是相同的 （因为`undefined`被认为是任何`T`的子类型），但是在严格类型检查模式下它们是不同的， 并且仅仅`T | undefined`允许有`undefined`值，`T`和`T | null`的关系同样如此。

#### 示例

```typescript
// 使用--strictNullChecks参数进行编译的
let x: number;
let y: number | undefined;
let z: number | null | undefined;
x = 1;  // 正确
y = 1;  // 正确
z = 1;  // 正确
x = undefined;  // 错误
y = undefined;  // 正确
z = undefined;  // 正确
x = null;  // 错误
y = null;  // 错误
z = null;  // 正确
x = y;  // 错误
x = z;  // 错误
y = x;  // 正确
y = z;  // 错误
z = x;  // 正确
z = y;  // 正确
```

### 使用前赋值检查

在严格空检查模式中，编译器要求未包含`undefined`类型的局部变量在使用之前必须先赋值。

#### 示例

```typescript
// 使用--strictNullChecks参数进行编译
let x: number;
let y: number | null;
let z: number | undefined;
x;  // 错误，使用前未赋值
y;  // 错误，使用前未赋值
z;  // 正确
x = 1;
y = null;
x;  // 正确
y;  // 正确
```

编译器通过执行_基于控制流的类型分析_检查变量明确被赋过值。在本篇文章后面会有进一步的细节。

### 可选参数和属性

可选参数和属性会自动把`undefined`添加到他们的类型中，即使他们的类型注解明确不包含`undefined`。例如，下面两个类型是完全相同的：

```typescript
// 使用--strictNullChecks参数进行编译
type T1 = (x?: number) => string;              // x的类型是 number | undefined
type T2 = (x?: number | undefined) => string;  // x的类型是 number | undefined
```

### 非null和非undefined类型保护

如果对象或者函数的类型包含`null`和`undefined`，那么访问属性或调用函数时就会产生编译错误。因此，对类型保护进行了扩展，以支持对非null和非undefined的检查。

#### 示例

```typescript
// 使用--strictNullChecks参数进行编译
declare function f(x: number): string;
let x: number | null | undefined;
if (x) {
    f(x);  // 正确，这里的x类型是number
}
else {
    f(x);  // 错误，这里的x类型是number？
}
let a = x != null ? f(x) : "";  // a的类型是string
let b = x && f(x);  // b的类型是 string | 0 | null | undefined
```

非null和非undefined类型保护可以使用`==`、`!=`、`===`或`!==`操作符和`null`或`undefined`进行比较，如`x != null`或`x === undefined`。对被试变量类型的影响准确地反映了JavaScript的语义（比如，双等号运算符检查两个值无论你指定的是null还是undefined，然而三等于号运算符仅仅检查指定的那一个值）。

### 类型保护中的点名称

类型保护以前仅仅支持对局部变量和参数的检查。现在类型保护支持检查由变量或参数名称后跟一个或多个访问属性组成的“点名称”。

#### 示例

```typescript
interface Options {
    location?: {
        x?: number;
        y?: number;
    };
}

function foo(options?: Options) {
    if (options && options.location && options.location.x) {
        const x = options.location.x;  // x的类型是number
    }
}
```

点名称的类型保护和用户定义的类型保护函数，还有`typeof`和`instanceof`操作符一起工作，并且不依赖`--strictNullChecks`编译参数。

对点名称进行类型保护后给点名称任一部分赋值都会导致类型保护无效。例如，对`x.y.z`进行了类型保护后给`x`、`x.y`或`x.y.z`赋值，都会导致`x.y.z`类型保护无效。

### 表达式操作符

表达式操作符允许运算对象的类型包含`null`和/或`undefined`，但是总是产生非null和非undefined类型的结果值。

```javascript
// 使用--strictNullChecks参数进行编译
function sum(a: number | null, b: number | null) {
    return a + b;  // 计算的结果值类型是number
}
```

`&&`操作符添加`null`和/或`undefined`到右边操作对象的类型中取决于当前左边操作对象的类型，`||`操作符从左边联合类型的操作对象的类型中将`null`和`undefined`同时删除。

```typescript
// 使用--strictNullChecks参数进行编译
interface Entity {
    name: string;
}
let x: Entity | null;
let s = x && x.name;  // s的类型是string | null
let y = x || { name: "test" };  // y的类型是Entity
```

### 类型扩展

在严格空检查模式中，`null`和`undefined`类型是_不会_扩展到`any`类型中的。

```typescript
let z = null;  // z的类型是null
```

在常规类型检查模式中，由于扩展，会推断`z`的类型是`any`，但是在严格空检查模式中，推断`z`是`null`类型（因此，如果没有类型注释，`null`是`z`的唯一值）。

### 非空断言操作符

在上下文中当类型检查器无法断定类型时，一个新的后缀表达式操作符`!`可以用于断言操作对象是非null和非undefined类型的。具体而言，运算`x!`产生一个不包含`null`和`undefined`的`x`的值。断言的形式类似于`<T>x`和`x as T`，`!`非空断言操作符会从编译成的JavaScript代码中移除。

```typescript
// 使用--strictNullChecks参数进行编译
function validateEntity(e?: Entity) {
    // 如果e是null或者无效的实体，就会抛出异常
}

function processEntity(e?: Entity) {
    validateEntity(e);
    let s = e!.name;  // 断言e是非空并访问name属性
}
```

### 兼容性

这些新特性是经过设计的，使得它们能够在严格空检查模式和常规类型检查模式下都能够使用。尤其是在常规类型检查模式中，`null`和`undefined`类型会自动从联合类型中删除（因为它们是其它所有类型的子类型），`!`非空断言表达式操作符也被允许使用但是没有任何作用。因此，声明文件使用null和undefined敏感类型更新后，在常规类型模式中仍然是可以向后兼容使用的。

在实际应用中，严格空检查模式要求编译的所有文件都是null和undefined敏感类型。

## 基于控制流的类型分析

TypeScript 2.0实现了对局部变量和参数的控制流类型分析。以前，对类型保护进行类型分析仅限于`if`语句和`?:`条件表达式，并且不包括赋值和控制流结构的影响，例如`return`和`break`语句。使用TypeScript 2.0，类型检查器会分析语句和表达式所有可能的控制流，在任何指定的位置对声明为联合类型的局部变量或参数产生最可能的具体类型（缩小范围的类型）。

#### 示例

```typescript
function foo(x: string | number | boolean) {
    if (typeof x === "string") {
        x; // 这里x的类型是string
        x = 1;
        x; // 这里x的类型是number
    }
    x; // 这里x的类型是number | boolean
}

function bar(x: string | number) {
    if (typeof x === "number") {
        return;
    }
    x; // 这里x的类型是string
}
```

基于控制流的类型分析在`--strictNullChecks`模式中尤为重要，因为可空类型使用联合类型来表示：

```typescript
function test(x: string | null) {
    if (x === null) {
        return;
    }
    x; // 在函数的剩余部分中，x类型是string
}
```

而且，在`--strictNullChecks`模式中，基于控制流的分析包括，对类型不允许为`undefined`的局部变量有_明确赋值_的分析。

```typescript
function mumble(check: boolean) {
    let x: number; // 类型不允许为undefined
    x; // 错误，x是undefined
    if (check) {
        x = 1;
        x; // 正确
    }
    x; // 错误，x可能是undefi
    x = 2;
    x; // 正确
}
```

## 标记联合类型

TypeScript 2.0实现了标记（或区分）联合类型。具体而言，TS编译器现在支持类型保护，基于判别属性的检查来缩小联合类型的范围，并且`switch`语句也支持此特性。

#### 示例

```typescript
interface Square {
    kind: "square";
    size: number;
}

interface Rectangle {
    kind: "rectangle";
    width: number;
    height: number;
}

interface Circle {
    kind: "circle";
    radius: number;
}

type Shape = Square | Rectangle | Circle;

function area(s: Shape) {
    // 在下面的switch语句中，s的类型在每一个case中都被缩小
    // 根据判别属性的值，变量的其它属性不使用类型断言就可以被访问
    switch (s.kind) {
        case "square": return s.size * s.size;
        case "rectangle": return s.width * s.height;
        case "circle": return Math.PI * s.radius * s.radius;
    }
}

function test1(s: Shape) {
    if (s.kind === "square") {
        s;  // Square
    }
    else {
        s;  // Rectangle | Circle
    }
}

function test2(s: Shape) {
    if (s.kind === "square" || s.kind === "rectangle") {
        return;
    }
    s;  // Circle
}
```

_判别属性类型保护_是`x.p == v`、`x.p === v`、`x.p != v`或者`x.p !== v`其中的一种表达式，`p`和`v`是一个属性和字符串字面量类型或字符串字面量联合类型的表达式。判别属性类型保护缩小`x`的类型到由判别属性`p`和`v`的可能值之一组成的类型。

请注意，我们目前只支持字符串字面值类型的判别属性。我们打算以后添加对布尔值和数字字面量类型的支持。

## `never`类型

TypeScript 2.0引入了一个新原始类型`never`。`never`类型表示值的类型从不出现。具体而言，`never`是永不返回函数的返回类型，也是变量在类型保护中永不为true的类型。

`never`类型具有以下特征：

* `never`是所有类型的子类型并且可以赋值给所有类型。
* 没有类型是`never`的子类型或能赋值给`never`（`never`类型本身除外）。
* 在函数表达式或箭头函数没有返回类型注解时，如果函数没有`return`语句，或者只有`never`类型表达式的`return`语句，并且如果函数是不可执行到终点的（例如通过控制流分析决定的），则推断函数的返回类型是`never`。
* 在有明确`never`返回类型注解的函数中，所有`return`语句（如果有的话）必须有`never`类型的表达式并且函数的终点必须是不可执行的。

因为`never`是每一个类型的子类型，所以它总是在联合类型中被省略，并且在函数中只要其它类型被返回，类型推断就会忽略`never`类型。

一些返回`never`函数的示例：

```typescript
// 函数返回never必须无法执行到终点
function error(message: string): never {
    throw new Error(message);
}

// 推断返回类型是never
function fail() {
    return error("Something failed");
}

// 函数返回never必须无法执行到终点
function infiniteLoop(): never {
    while (true) {
    }
}
```

一些函数返回`never`的使用示例：

```typescript
// 推断返回类型是number
function move1(direction: "up" | "down") {
    switch (direction) {
        case "up":
            return 1;
        case "down":
            return -1;
    }
    return error("Should never get here");
}

// 推断返回类型是number
function move2(direction: "up" | "down") {
    return direction === "up" ? 1 :
        direction === "down" ? -1 :
        error("Should never get here");
}

// 推断返回类型是T
function check<T>(x: T | undefined) {
    return x || error("Undefined value");
}
```

因为`never`可以赋值给每一个类型，当需要回调函数返回一个更加具体的类型时，函数返回`never`类型可以用于检测返回类型是否正确：

```typescript
function test(cb: () => string) {
    let s = cb();
    return s;
}

test(() => "hello");
test(() => fail());
test(() => { throw new Error(); })
```

## 只读属性和索引签名

属性或索引签名现在可以使用`readonly`修饰符声明为只读的。

只读属性可以初始化和在同一个类的构造函数中被赋值，但是在其它情况下对只读属性的赋值是不允许的。

此外，有几种情况下实体_隐式_只读的：

* 属性声明只使用`get`访问器而没有使用`set`访问器被视为只读的。
* 在枚举类型中，枚举成员被视为只读属性。
* 在模块类型中，导出的`const`变量被视为只读属性。
* 在`import`语句中声明的实体被视为只读的。
* 通过ES2015命名空间导入访问的实体被视为只读的（例如，当`foo`当作`import * as foo from "foo"`声明时，`foo.x`是只读的）。

#### 示例

```typescript
interface Point {
    readonly x: number;
    readonly y: number;
}

var p1: Point = { x: 10, y: 20 };
p1.x = 5;  // 错误，p1.x是只读的

var p2 = { x: 1, y: 1 };
var p3: Point = p2;  // 正确，p2的只读别名
p3.x = 5;  // 错误，p3.x是只读的
p2.x = 5;  // 正确，但是因为别名使用，同时也改变了p3.x
```

```typescript
class Foo {
    readonly a = 1;
    readonly b: string;
    constructor() {
        this.b = "hello";  // 在构造函数中允许赋值
    }
}
```

```typescript
let a: Array<number> = [0, 1, 2, 3, 4];
let b: ReadonlyArray<number> = a;
b[5] = 5;      // 错误，元素是只读的
b.push(5);     // 错误，没有push方法（因为这会修改数组）
b.length = 3;  // 错误，length是只读的
a = b;         // 错误，缺少修改数组的方法
```

## 指定函数中`this`类型

紧跟着类和接口，现在函数和方法也可以声明`this`的类型了。

函数中`this`的默认类型是`any`。从TypeScript 2.0开始，你可以提供一个明确的`this`参数。`this`参数是伪参数，它位于函数参数列表的第一位：

```typescript
function f(this: void) {
    // 确保`this`在这个独立的函数中无法使用
}
```

### 回调函数中的`this`参数

库也可以使用`this`参数声明回调函数如何被调用。

#### 示例

```typescript
interface UIElement {
    addClickListener(onclick: (this: void, e: Event) => void): void;
}
```

`this:void`意味着`addClickListener`预计`onclick`是一个`this`参数不需要类型的函数。

现在如果你在调用代码中对`this`进行了类型注释：

```typescript
class Handler {
    info: string;
    onClickBad(this: Handler, e: Event) {
        // 哎哟，在这里使用this.在运行中使用这个回调函数将会崩溃。
        this.info = e.message;
    };
}
let h = new Handler();
uiElement.addClickListener(h.onClickBad); // 错误！
```

### `--noImplicitThis`

TypeScript 2.0还增加了一个新的编译选项用来标记函数中所有没有明确类型注释的`this`的使用。

## `tsconfig.json`支持文件通配符

文件通配符来啦！！支持文件通配符一直是[最需要的特性之一](https://github.com/Microsoft/TypeScript/issues/1927)。

类似文件通配符的文件模式支持两个属性`"include"`和`"exclude"`。

#### 示例

```javascript
{
    "compilerOptions": {
        "module": "commonjs",
        "noImplicitAny": true,
        "removeComments": true,
        "preserveConstEnums": true,
        "outFile": "../../built/local/tsc.js",
        "sourceMap": true
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules",
        "**/*.spec.ts"
    ]
}
```

支持文件通配符的符号有：

* `*`匹配零个或多个字符（不包括目录）
* `?`匹配任意一个字符（不包括目录）
* `**/`递归匹配所有子目录

如果文件通配符模式语句中只包含`*`或`.*`，那么只匹配带有扩展名的文件（例如默认是`.ts`、`.tsx`和`.d.ts`，如果`allowJs`设置为`true`，`.js`和`.jsx`也属于默认）。

如果`"files"`和`"include"`都没有指定，编译器默认包含所有目录中的TypeScript文件（`.ts`、`.d.ts`和`.tsx`），除了那些使用`exclude`属性排除的文件外。如果`allowJs`设置为true，JS文件（`.js`和`.jsx`）也会被包含进去。

如果`"files"`和`"include"`都指定了，编译器将包含这两个属性指定文件的并集。使用`ourDir`编译选项指定的目录文件总是被排除，即使`"exclude"`属性指定的文件也会被删除，但是`files`属性指定的文件不会排除。

`"exclude"`属性指定的文件会对`"include"`属性指定的文件过滤。但是对`"files"`指定的文件没有任何作用。当没有明确指定时，`"exclude"`属性默认会排除`node_modules`、`bower_components`和`jspm_packages`目录。

## 模块解析增加：BaseUrl、路径映射、rootDirs和追踪

TypeScript 2.0提供了一系列额外的模块解析属性告诉编译器去哪里可以找到给定模块的声明。

更多详情，请参阅[模块解析](../handbook/module-resolution.md)文档。

### Base URL

使用了AMD模块加载器并且模块在运行时”部署“到单文件夹的应用程序中使用`baseUrl`是一种常用的做法。所有非相对名称的模块导入被认为是相对于`baseUrl`的。

#### 示例

```javascript
{
  "compilerOptions": {
    "baseUrl": "./modules"
  }
}
```

现在导入`moduleA`将会在`./modules/moduleA`中查找。

```typescript
import A from "moduleA";
```

### 路径映射

有时模块没有直接位于_baseUrl_中。加载器使用映射配置在运行时去映射模块名称和文件，请参阅[RequireJs文档](http://requirejs.org/docs/api.html#config-paths)和[SystemJS文档](https://github.com/systemjs/systemjs/blob/master/docs/overview.md#map-config)。

TypeScript编译器支持`tsconfig`文件中使用`"paths"`属性映射的声明。

#### 示例

例如，导入`"jquery"`模块在运行时会被转换为`"node_modules/jquery/dist/jquery.slim.min.js"`。

```javascript
{
    "compilerOptions": {
        "baseUrl": "./node_modules",
        "paths": {
        "jquery": ["jquery/dist/jquery.slim.min"]
        }
    }
}
```

使用`"paths"`也允许更复杂的映射，包括多次后退的位置。考虑一个只有一个地方的模块是可用的，其它的模块都在另一个地方的项目配置。

### `rootDirs`和虚拟目录

使用`rootDirs`，你可以告知编译器的_根目录_组合这些“虚拟”目录。因此编译器在这些“虚拟”目录中解析相对导入模块，仿佛是合并到一个目录中一样。

#### 示例

给定的项目结构

```text
 src
 └── views
     └── view1.ts (imports './template1')
     └── view2.ts

 generated
 └── templates
         └── views
             └── template1.ts (imports './view2')
```

构建步骤将复制`/src/views`和`/generated/templates/views`目录下的文件输出到同一个目录中。在运行时，视图期望它的模板和它存在同一目录中，因此应该使用相对名称`"./template"`导入。

`"rootDir"`指定的一组根目录的内容将会在运行时合并。因此在我们的例子，`tsconfig.json`文件应该类似于：

```javascript
{
  "compilerOptions": {
    "rootDirs": [
      "src/views",
      "generated/templates/views"
    ]
  }
}
```

### 追踪模块解析

`--traceResolution`提供了一种方便的方法，以了解模块如何被编译器解析的。

```text
tsc --traceResolution
```

## 快捷外部模块声明

当你使用一个新模块时，如果不想要花费时间书写一个声明时，现在你可以使用快捷声明以便以快速开始。

#### declarations.d.ts

```typescript
declare module "hot-new-module";
```

所有从快捷模块的导入都具有任意类型。

```typescript
import x, {y} from "hot-new-module";
x(y);
```

## 模块名称中的通配符

以前使用模块加载器（例如[AMD](https://github.com/amdjs/amdjs-api/blob/master/LoaderPlugins.md)和[SystemJS](https://github.com/systemjs/systemjs/blob/master/docs/creating-plugins.md)）导入没有代码的资源是不容易的。之前，必须为每个资源定义一个外部模块声明。

TypeScript 2.0支持使用通配符符号（`*`）定义一类模块名称。这种方式，一个声明只需要一次扩展名，而不再是每一个资源。

#### 示例

```typescript
declare module "*!text" {
    const content: string;
    export default content;
}
// Some do it the other way around.
declare module "json!*" {
    const value: any;
    export default value;
}
```

现在你可以导入匹配`"*!text"`或`"json!*"`的东西了。

```typescript
import fileContent from "./xyz.txt!text";
import data from "json!http://example.com/data.json";
console.log(data, fileContent);
```

当从一个基于非类型化的代码迁移时，通配符模块的名称可能更加有用。结合快捷外部模块声明，一组模块可以很容易地声明为`any`。

#### 示例

```typescript
declare module "myLibrary/*";
```

所有位于`myLibrary`目录之下的模块的导入都被编译器认为是`any`类型，因此这些模块的任何类型检查都会被关闭。

```typescript
import { readFile } from "myLibrary/fileSystem/readFile`;

readFile(); // readFile是'any'类型
```

## 支持UMD模块定义

一些库被设计为可以使用多种模块加载器或者不是使用模块加载器（全局变量）来使用，这被称为[UMD](https://github.com/umdjs/umd)或[同构](http://isomorphic.net/)模块。这些库可以通过导入或全局变量访问。

举例：

**math-lib.d.ts**

```typescript
export const isPrime(x: number): boolean;
export as namespace mathLib;
```

然后，该库可作为模块导入使用：

```typescript
import { isPrime } from "math-lib";
isPrime(2);
mathLib.isPrime(2); // 错误：无法在模块内部使用全局定义
```

它也可以被用来作为一个全局变量，只限于没有`import`和`export`脚本文件中。

```typescript
mathLib.isPrime(2);
```

## 可选类属性

现在可以在类中声明可选属性和方法，与接口类似。

#### 示例

```typescript
class Bar {
    a: number;
    b?: number;
    f() {
        return 1;
    }
    g?(): number;  // 可选方法的方法体可以省略
    h?() {
        return 2;
    }
}
```

在`--strictNullChecks`模式下编译时，可选属性和方法会自动添加`undefined`到它们的类型中。因此，上面的`b`属性类型是`number | undefined`，上面`g`方法的类型是`(()=> number) | undefined`。使用类型保护可以去除`undefined`。

## 私有的和受保护的构造函数

类的构造函数可以被标记为`private`或`protected`。私有构造函数的类不能在类的外部实例化，并且也不能被继承。受保护构造函数的类不能再类的外部实例化，但是可以被继承。

#### 示例

```typescript
class Singleton {
    private static instance: Singleton;

    private constructor() { }

    static getInstance() {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }
}

let e = new Singleton(); // 错误：Singleton的构造函数是私有的。
let v = Singleton.getInstance();
```

## 抽象属性和访问器

抽象类可以声明抽象属性和、或访问器。所有子类将需要声明抽象属性或者被标记为抽象的。抽象属性不能初始化。抽象访问器不能有具体代码块。

#### 示例

```typescript
abstract class Base {
    abstract name: string;
    abstract get value();
    abstract set value(v: number);
}

class Derived extends Base {
    name = "derived";

    value = 1;
}
```

## 隐式索引签名

如果对象字面量中所有已知的属性是赋值给索引签名，那么现在对象字面量类型可以赋值给索引签名类型。这使得一个使用对象字面量初始化的变量作为参数传递给期望参数是map或dictionary的函数成为可能：

```typescript
function httpService(path: string, headers: { [x: string]: string }) { }

const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
};

httpService("", { "Content-Type": "application/x-www-form-urlencoded" });  // 可以
httpService("", headers);  // 现在可以，以前不可以。
```

## 使用`--lib`编译参数包含内置类型声明

获取ES6/ES2015内置API声明仅限于`target: ES6`。输入`--lib`，你可以使用`--lib`指定一组项目所需要的内置API。比如说，如果你希望项目运行时支持`Map`、`Set`和`Promise`（例如现在静默更新浏览器），直接写`--lib es2015.collection,es2015.promise`就好了。同样，你也可以排除项目中不需要的声明，例如在node项目中使用`--lib es5,es6`排除DOM。

下面是列出了可用的API：

* dom
* webworker
* es5
* es6 / es2015
* es2015.core
* es2015.collection
* es2015.iterable
* es2015.promise
* es2015.proxy
* es2015.reflect
* es2015.generator
* es2015.symbol
* es2015.symbol.wellknown
* es2016
* es2016.array.include
* es2017
* es2017.object
* es2017.sharedmemory
* scripthost

#### 示例

```text
tsc --target es5 --lib es5,es2015.promise
```

```javascript
"compilerOptions": {
    "lib": ["es5", "es2015.promise"]
}
```

## 使用`--noUnusedParameters`和`--noUnusedLocals`标记未使用的声明

TypeScript 2.0有两个新的编译参数来帮助你保持一个干净的代码库。`-noUnusedParameters`编译参数标记所有未使用的函数或方法的参数错误。`--noUnusedLocals`标记所有未使用的局部（未导出）声明像变量、函数、类和导入等等，另外未使用的私有类成员在`--noUnusedLocals`作用下也会标记为错误。

#### 示例

```typescript
import B, { readFile } from "./b";
//     ^ 错误：`B`声明了，但是没有使用。
readFile();


export function write(message: string, args: string[]) {
    //                                 ^^^^  错误：'arg'声明了，但是没有使用。
    console.log(message);
}
```

使用以`_`开头命名的参数声明不会被未使用参数检查。例如：

```typescript
function returnNull(_a) { // 正确
    return null;
}
```

## 模块名称允许`.js`扩展名

TypeScript 2.0之前，模块名称总是被认为是没有扩展名的。例如，导入一个模块`import d from "./moduleA.js"`，则编译器在`./moduleA.js.ts`或`./moduleA.js.d.ts`中查找`"moduleA.js"`的定义。这使得像[SystemJS](https://github.com/systemjs/systemjs)这种期望模块名称是URI的打包或加载工具很难使用。

使用TypeScript 2.0，编译器将在`./moduleA.ts`或`./moduleA.d.ts`中查找`"moduleA.js"`的定义。

## 支持编译参数`target : es5`和`module: es6`同时使用

之前编译参数`target : es5`和`module: es6`同时使用被认为是无效的，但是现在是有效的。这将有助于使用基于ES2015的tree-shaking（将无用代码移除）比如[rollup](https://github.com/rollup/rollup)。

## 函数形参和实参列表末尾支持逗号

现在函数形参和实参列表末尾允许有逗号。这是对[第三阶段的ECMAScript提案](https://jeffmo.github.io/es-trailing-function-commas/)的实现, 并且会编译为可用的 ES3/ES5/ES6。

#### 示例

```typescript
function foo(
  bar: Bar,
  baz: Baz, // 形参列表末尾添加逗号是没有问题的。
) {
  // 具体实现……
}

foo(
  bar,
  baz, // 实参列表末尾添加逗号同样没有问题
);
```

## 新编译参数`--skipLibCheck`

TypeScript 2.0添加了一个新的编译参数`--skipLibCheck`，该参数可以跳过声明文件（以`.d.ts`为扩展名的文件）的类型检查。当一个程序包含有大量的声明文件时，编译器需要花费大量时间对已知不包含错误的声明进行类型检查，通过跳过声明文件的类型检查，编译时间可能会大大缩短。

由于一个文件中的声明可以影响其他文件中的类型检查，当指定`--skipLibCheck`时，一些错误可能检测不到。比如说, 如果一个非声明文件中的类型被声明文件用到, 可能仅在声明文件被检查时能发现错误. 不过这种情况在实际使用中并不常见。

## 允许在声明中重复标识符

这是重复定义错误的一个常见来源。多个声明文件定义相同的接口成员。

TypeScript 2.0放宽了这一约束，并允许可以不同代码块中出现重复的标识符, 只要它们有_完全相同_的类型。

在同一代码块重复定义仍不允许。

#### 示例

```typescript
interface Error {
    stack?: string;
}


interface Error {
    code?: string;
    path?: string;
    stack?: string;  // OK
}
```

## 新编译参数`--declarationDir`

`--declarationDir`可以使生成的声明文件和JavaScript文件不在同一个位置中。

