# TypeScript 1.6

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+1.6%22+label%3A%22breaking+change%22)。

## 严格的对象字面量赋值检查

当在给变量赋值或给非空类型的参数赋值时，如果对象字面量里指定的某属性不存在于目标类型中时会得到一个错误。

你可以通过使用[--suppressExcessPropertyErrors](https://github.com/Microsoft/TypeScript/pull/4484)编译器选项来禁用这个新的严格检查。

**例子：**

```typescript
var x: { foo: number };
x = { foo: 1, baz: 2 };  // Error, excess property `baz`

var y: { foo: number, bar?: number };
y = { foo: 1, baz: 2 };  // Error, excess or misspelled property `baz`
```

**推荐：**

为了避免此错误，不同情况下有不同的补救方法：

**如果目标类型接收额外的属性，可以增加一个索引：**

```typescript
var x: { foo: number, [x: string]: any };
x = { foo: 1, baz: 2 };  // OK, `baz` matched by index signature
```

**如果原始类型是一组相关联的类型，使用联合类型明确指定它们的类型而不是仅指定一个基本类型。**

```typescript
let animalList: (Dog | Cat | Turkey)[] = [    // use union type instead of Animal
    {name: "Milo", meow: true },
    {name: "Pepper", bark: true},
    {name: "koko", gobble: true}
];
```

**还有可以明确地转换到目标类型以避免此错误：**

```typescript
interface Foo {
    foo: number;
}
interface FooBar {
    foo: number;
    bar: number;
}
var y: Foo;
y = <FooBar>{ foo: 1, bar: 2 };
```

## CommonJS的模块解析不再假设路径为相对的

之前，对于`one.ts`和`two.ts`文件，如果它们在相同目录里，那么在`two.ts`里面导入`"one"`时是相对于`one.ts`的路径的。

TypeScript 1.6在编译CommonJS时，`"one"`不再等同于"./one"。取而代之的是会相对于合适的`node_modules`文件夹进行查找，与Node.js在运行时解析模块相似。更多详情，阅读[the issue that describes the resolution algorithm](https://github.com/Microsoft/TypeScript/issues/2338)。

**例子：**

`./one.ts`

```typescript
export function f() {
    return 10;
}
```

`./two.ts`

```typescript
import { f as g } from "one";
```

**推荐：**

**修改所有计划之外的非相对的导入。**

`./one.ts`

```typescript
export function f() {
    return 10;
}
```

`./two.ts`

```typescript
import { f as g } from "./one";
```

**将`--moduleResolution`编译器选项设置为`classic`。**

## 函数和类声明为默认导出时不再能够与在意义上有交叉的同名实体进行合并

在同一空间内默认导出声明的名字与空间内一实体名相同时会得到一个错误；比如，

```typescript
export default function foo() {
}

namespace foo {
    var x = 100;
}
```

和

```typescript
export default class Foo {
    a: number;
}

interface Foo {
    b: string;
}
```

两者都会报错。

然而，在下面的例子里合并是被允许的，因为命名空间并不具备做为值的意义：

```typescript
export default class Foo {
}

namespace Foo {
}
```

**推荐：**

为默认导出声明本地变量并使用单独的`export default`语句：

```typescript
class Foo {
    a: number;
}

interface foo {
    b: string;
}

export default Foo;
```

更多详情，请阅读[the originating issue](https://github.com/Microsoft/TypeScript/issues/3095)。

## 模块体以严格模式解析

按照[ES6规范](http://www.ecma-international.org/ecma-262/6.0/#sec-strict-mode-code)，模块体现在以严格模式进行解析。行为将相当于在模块作用域顶端定义了`"use strict"`；它包括限制了把`arguments`和`eval`做为变量名或参数名的使用，把未来保留字做为变量或参数使用，八进制数字字面量的使用等。

## 标准库里DOM API的改动

* **MessageEvent**和**ProgressEvent**构造函数希望传入参数；查看[issue \#4295](https://github.com/Microsoft/TypeScript/issues/4295)。
* **ImageData**构造函数希望传入参数；查看[issue \#4220](https://github.com/Microsoft/TypeScript/issues/4220)。
* **File**构造函数希望传入参数；查看[issue \#3999](https://github.com/Microsoft/TypeScript/issues/3999)。

## 系统模块输出使用批量导出

编译器以系统模块的格式使用新的`_export`函数[批量导出](https://github.com/ModuleLoader/es6-module-loader/issues/386)的变体，它接收任何包含键值对的对象做为参数而不是key, value。

模块加载器需要升级到[v0.17.1](https://github.com/ModuleLoader/es6-module-loader/releases/tag/v0.17.1)或更高。

## npm包的.js内容从'bin'移到了'lib'

TypeScript的npm包入口位置从`bin`移动到了`lib`，以防‘node\_modules/typescript/bin/typescript.js’通过IIS访问的时候造成阻塞（`bin`默认是隐藏段因此IIS会阻止访问这个文件夹）。

## TypeScript的npm包不会默认全局安装

TypeScript 1.6从package.json里移除了`preferGlobal`标记。如果你依赖于这种行为，请使用`npm install -g typescript`。

## 装饰器做为调用表达式进行检查

从1.6开始，装饰器类型检查更准确了；编译器会将装饰器表达式做为以被装饰的实体做为参数的调用表达式来进行检查。这可能会造成以前的代码报错。

