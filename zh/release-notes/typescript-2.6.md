# TypeScript 2.6

## 严格函数类型

TypeScript 2.6引入了新的类型检查选项，`--strictFunctionTypes`。`--strictFunctionTypes`选项是`--strict`系列选项之一，也就是说 `--strict`模式下它默认是启用的。你可以通过在命令行或tsconfig.json中设置`--strictFunctionTypes false`来单独禁用它。

`--strictFunctionTypes`启用时，函数类型参数的检查是_抗变（contravariantly）_而非_双变（bivariantly）_的。关于变体 \(variance\) 对于函数类型意义的相关背景，请查看[协变（covariance）和抗变（contravariance）是什么？](https://www.stephanboyer.com/post/132/what-are-covariance-and-contravariance)。

这一更严格的检查应用于除方法或构造函数声明以外的所有函数类型。方法被专门排除在外是为了确保带泛型的类和接口（如`Array<T>`）总体上仍然保持协变。

考虑下面这个 Animal 是 Dog 和 Cat 的父类型的例子：

```typescript
declare let f1: (x: Animal) => void;
declare let f2: (x: Dog) => void;
declare let f3: (x: Cat) => void;
f1 = f2;  // 启用 --strictFunctionTypes 时错误
f2 = f1;  // 正确
f2 = f3;  // 错误
```

第一个赋值语句在默认的类型检查模式中是允许的，但是在严格函数类型模式下会被标记错误。 通俗地讲，默认模式允许这么赋值，因为它_可能是_合理的，而严格函数类型模式将它标记为错误，因为它不能_被证明_合理。 任何一种模式中，第三个赋值都是错误的，因为它_永远不_合理。

用另一种方式来描述这个例子则是，默认类型检查模式中`T`在类型`(x: T) => void`是_双变的_（也即协变_或_抗变），但在严格函数类型模式中`T`是_抗变_的。

### 例子

```typescript
interface Comparer<T> {
    compare: (a: T, b: T) => number;
}

declare let animalComparer: Comparer<Animal>;
declare let dogComparer: Comparer<Dog>;

animalComparer = dogComparer;  // 错误
dogComparer = animalComparer;  // 正确
```

现在第一个赋值是错误的。更明确地说，`Comparer<T>`中的`T`因为仅在函数类型参数的位置被使用，是抗变的。

另外，注意尽管有的语言（比如C\#和Scala）要求变体标注（variance annotations）（`out`/`in` 或 `+`/`-`），而由于TypeScript的结构化类型系统，它的变体是由泛型中的类型参数的实际使用自然得出的。

### 注意：

启用`--strictFunctionTypes`时，如果`compare`被声明为方法，则第一个赋值依然是被允许的。 更明确的说，`Comparer<T>`中的`T`因为仅在方法参数的位置被使用所以是双变的。

```typescript
interface Comparer<T> {
    compare(a: T, b: T): number;
}

declare let animalComparer: Comparer<Animal>;
declare let dogComparer: Comparer<Dog>;

animalComparer = dogComparer;  // 正确，因为双变
dogComparer = animalComparer;  // 正确
```

TypeScript 2.6 还改进了与抗变位置相关的类型推导：

```typescript
function combine<T>(...funcs: ((x: ）=> void)[]): (x: T) => void {
    return x => {
        for (const f of funcs) f(x);
    }
}

function animalFunc(x: Animal) {}
function dogFunc(x: Dog) {}

let combined = combine(animalFunc，dogFunc);  // (x: Dog) => void
```

这上面所有`T`的推断都来自抗变的位置，由此我们得出`T`的_最普遍子类型_。 这与从协变位置推导出的结果恰恰相反，从协变位置我们得出的是_最普遍超类型_。

## 缓存模块中的标签模板对象

TypeScript 2.6修复了标签字符串模板的输出，以更好地遵循ECMAScript标准。 根据[ECMAScript 标准](https://tc39.github.io/ecma262/#sec-gettemplateobject)，每一次获取模板标签的值时，应该将_同一个_模板字符串数组对象 \(同一个 `TemplateStringArray`\) 作为第一个参数传递。 在 TypeScript 2.6 之前，每一次生成的都是全新的模板对象。 虽然字符串的内容是一样的，这样的输出会影响通过识别字符串来实现缓存失效的库，比如 [lit-html](https://github.com/PolymerLabs/lit-html/issues/58)。

### 例子

```typescript
export function id(x: TemplateStringsArray) {
    return x;
}

export function templateObjectFactory() {
    return id`hello world`;
}

let result = templateObjectFactory() === templateObjectFactory(); // TS 2.6 为 true
```

编译后的代码：

```javascript
"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function id(x) {
    return x;
}

var _a;
function templateObjectFactory() {
    return id(_a || (_a = __makeTemplateObject(["hello world"], ["hello world"])));
}

var result = templateObjectFactory() === templateObjectFactory();
```

> 注意：这一改变引入了新的工具函数，`__makeTemplateObject`; 如果你在搭配使用`--importHelpers`和[`tslib`](https://github.com/Microsoft/tslib)，需要更新到 1.8 或更高版本。

## 本地化的命令行诊断消息

TypeScript 2.6 npm包加入了13种语言的诊断消息本地化版本。 命令行中本地化消息会在使用`--locale`选项时显示。

### 例子

俄语显示的错误消息：

```bash
c:\ts>tsc --v
Version 2.6.1

c:\ts>tsc --locale ru --pretty c:\test\a.ts

../test/a.ts(1,5): error TS2322: Тип ""string"" не может быть назначен для типа "number".

1 var x: number = "string";
      ~
```

中文显示的帮助信息：

```bash
PS C:\ts> tsc --v
Version 2.6.1

PS C:\ts> tsc --locale zh-cn
版本 2.6.1
语法：tsc [选项] [文件 ...]

示例：tsc hello.ts
    tsc --outFile file.js file.ts
    tsc @args.txt

选项：
 -h, --help                    打印此消息。
 --all                         显示所有编译器选项。
 -v, --version                 打印编译器的版本。
 --init                        初始化 TypeScript 项目并创建 tsconfig.json 文件。
 -p 文件或目录, --project 文件或目录     编译给定了其配置文件路径或带 "tsconfig.json" 的文件夹路径的项目。
 --pretty                      使用颜色和上下文风格化错误和消息(实验)。
 -w, --watch                   监视输入文件。
 -t 版本, --target 版本            指定 ECMAScript 目标版本："ES3"(默认)、"ES5"、"ES2015"、"ES2016"、"ES2017" 或 "ESNEXT"。
 -m 种类, --module 种类            指定模块代码生成："none"、"commonjs"、"amd"、"system"、"umd"、"es2015"或 "ESNext"。
 --lib                         指定要在编译中包括的库文件:
                                 'es5' 'es6' 'es2015' 'es7' 'es2016' 'es2017' 'esnext' 'dom' 'dom.iterable' 'webworker' 'scripthost' 'es2015.core' 'es2015.collection' 'es2015.generator' 'es2015.iterable' 'es2015.promise' 'es2015.proxy' 'es2015.reflect' 'es2015.symbol' 'es2015.symbol.wellknown' 'es2016.array.include' 'es2017.object' 'es2017.sharedmemory' 'es2017.string' 'es2017.intl' 'esnext.asynciterable'
 --allowJs                     允许编译 JavaScript 文件。
 --jsx 种类                      指定 JSX 代码生成："preserve"、"react-native" 或 "react"。 -d, --declaration             生成相应的 ".d.ts" 文件。
 --sourceMap                   生成相应的 ".map" 文件。
 --outFile 文件                  连接输出并将其发出到单个文件。
 --outDir 目录                   将输出结构重定向到目录。
 --removeComments              请勿将注释发出到输出。
 --noEmit                      请勿发出输出。
 --strict                      启用所有严格类型检查选项。
 --noImplicitAny               对具有隐式 "any" 类型的表达式和声明引发错误。
 --strictNullChecks            启用严格的 NULL 检查。
 --strictFunctionTypes         对函数类型启用严格检查。
 --noImplicitThis              在带隐式"any" 类型的 "this" 表达式上引发错误。
 --alwaysStrict                以严格模式进行分析，并为每个源文件发出 "use strict" 指令。
 --noUnusedLocals              报告未使用的局部变量上的错误。
 --noUnusedParameters          报告未使用的参数上的错误。
 --noImplicitReturns           在函数中的所有代码路径并非都返回值时报告错误。
 --noFallthroughCasesInSwitch  报告 switch 语句中遇到 fallthrough 情况的错误。
 --types                       要包含在编译中类型声明文件。
 @<文件>                         从文件插入命令行选项和文件。
```

## 通过 '// @ts-ignore' 注释隐藏 .ts 文件中的错误

TypeScript 2.6支持在.ts文件中通过在报错一行上方使用`// @ts-ignore`来忽略错误。

### 例子

```typescript
if (false) {
    // @ts-ignore：无法被执行的代码的错误
    console.log("hello");
}
```

`// @ts-ignore`注释会忽略下一行中产生的所有错误。 建议实践中在`@ts-ignore`之后添加相关提示，解释忽略了什么错误。

请注意，这个注释仅会隐藏报错，并且我们建议你_极少_使用这一注释。

## 更快的 `tsc --watch`

TypeScript 2.6 带来了更快的`--watch`实现。 新版本优化了使用ES模块的代码的生成和检查。 在一个模块文件中检测到的改变_只_会使改变的模块，以及依赖它的文件被重新生成，而不再是整个项目。 有大量文件的项目应该从这一改变中获益最多。

这一新的实现也为tsserver中的监听带来了性能提升。 监听逻辑被完全重写以更快响应改变事件。

## 只写的引用现在会被标记未使用

TypeScript 2.6加入了修正的`--noUnusedLocals`和`--noUnusedParameters`[编译选项](https://www.typescriptlang.org/docs/handbook/compiler-options.html)实现。 只被写但从没有被读的声明现在会被标记未使用。

### 例子

下面`n`和`m`都会被标记为未使用，因为它们的值从未被_读取_。之前 TypeScript 只会检查它们的值是否被_引用_。

```typescript
function f(n: number) {
    n = 0;
}

class C {
    private m: number;
    constructor() {
        this.m = 0;
    }
}
```

另外仅被自己内部调用的函数也会被认为是未使用的。

### 例子

```typescript
function f() {
    f(); // 错误：'f' 被声明，但它的值从未被使用
}
```

