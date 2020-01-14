# TypeScript 2.3

## ES5/ES3 的生成器和迭代支持

_首先是一些 ES2016 的术语：_

### 迭代器

[ES2015引入了`Iterator`（迭代器）](http://www.ecma-international.org/ecma-262/6.0/#sec-iteration)，它表示提供了 next，return，以及 throw 三个方法的对象，具体满足以下接口：

```typescript
interface Iterator<T> {
  next(value?: any): IteratorResult<T>;
  return?(value?: any): IteratorResult<T>;
  throw?(e?: any): IteratorResult<T>;
}
```

这种迭代器对于迭代可用的值时很有用，比如数组的元素或者Map的键。如果一个对象有一个返回`Iterator`对象的`Symbol.iterator`方法，那么我们说这个对象是“可迭代的”。

迭代器协议还定义了一些ES2015中的特性像`for..of`和展开运算符以及解构赋值中的数组的剩余运算的操作对象。

### 生成器

[ES2015也引入了"生成器"](http://www.ecma-international.org/ecma-262/6.0/#sec-generatorfunction-objects)，生成器是可以通过`Iterator`接口和`yield`关键字被用来生成部分运算结果的函数。生成器也可以在内部通过`yield*`代理对与其他可迭代对象的调用。举例来说：

```typescript
function* f() {
  yield 1;
  yield* [2, 3];
}
```

### 新的`--downlevelIteration`编译选项

之前迭代器只在编译目标为 ES6/ES2015 或者更新版本时可用。此外，设计迭代器协议的结构，比如`for..of`，如果编译目标低于ES6/ES2015，则只能在操作数组时被支持。

TypeScript 2.3 在 ES3 和 ES5 为编译目标时由`--downlevelIteration`编译选项增加了完整的对生成器和迭代器协议的支持。

通过`--downlevelIteration`编译选项，编译器会使用新的类型检查和输出行为，尝试调用被迭代对象的`[Symbol.iterator]()`方法 \(如果有\)，或者在对象上创建一个语义上的数组迭代器。

> 注意这需要非数组的值有原生的`Symbol.iterator`或者`Symbol.iterator`的运行时模拟实现。

使用`--downlevelIteration`时，在 ES5/ES3 中`for..of`语句、数组解构、数组中的元素展开、函数调用、new 表达式在支持`Symbol.iterator`时可用，但即便没有定义`Symbol.iterator`，它们在运行时或开发时都可以被使用到数组上.

## 异步迭代

TypeScript 2.3 添加了对异步迭代器和生成器的支持，描述见当前的[TC39 提案](https://github.com/tc39/proposal-async-iteration)。

### 异步迭代器

异步迭代引入了`AsyncIterator`，它和`Iterator`相似。实际上的区别在于`AsyncIterator`的`next`、`return`和`throw`方法的返回的是迭代结果的`Promise`，而不是结果本身。这允许`AsyncIterator`在生成值之前的时间点就加入异步通知。`AsyncIterator`的接口如下：

```typescript
interface AsyncIterator<T> {
  next(value?: any): Promise<IteratorResult<T>>;
  return?(value?: any): Promise<IteratorResult<T>>;
  throw?(e?: any): Promise<IteratorResult<T>>;
}
```

一个支持异步迭代的对象如果有一个返回`AsyncIterator`对象的`Symbol.asyncIterator`方法，被称作是“可迭代的”。

### 异步生成器

[异步迭代提案](https://github.com/tc39/proposal-async-iteration)引入了“异步生成器”，也就是可以用来生成部分计算结果的异步函数。异步生成器也可以通过`yield*`代理对可迭代对象或异步可迭代对象的调用：

```typescript
async function* g() {
  yield 1;
  await sleep(100);
  yield* [2, 3];
  yield* (async function *() {
    await sleep(100);
    yield 4;
  })();
}
```

和生成器一样，异步生成器只能是函数声明，函数表达式，或者类或对象字面量的方法。箭头函数不能作为异步生成器。异步生成器除了一个可用的`Symbol.asyncIterator`引用外 \(原生或三方实现\)，还需要一个可用的全局`Promise`实现（既可以是原生的，也可以是ES2015兼容的实现）。

### `for-await-of`语句

最后，ES2015引入了`for..of`语句来迭代可迭代对象。相似的，异步迭代提案引入了`for..await..of`语句来迭代可异步迭代的对象。

```typescript
async function f() {
  for await (const x of g()) {
     console.log(x);
  }
}
```

`for..await..of`语句仅在异步函数或异步生成器中可用。

### 注意事项

* 始终记住我们对于异步迭代器的支持是建立在运行时有`Symbol.asyncIterator`支持的基础上的。你可能需要`Symbol.asyncIterator`的三方实现，虽然对于简单的目的可以仅仅是：`(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");`
* 如果你没有声明`AsyncIterator`，还需要在`--lib`选项中加入`esnext`来获取`AsyncIterator`声明。
* 最后, 如果你的编译目标是ES5或ES3，你还需要设置`--downlevelIterators`编译选项。

## 泛型参数默认类型

TypeScript 2.3 增加了对声明泛型参数默认类型的支持。

### 示例

考虑一个会创建新的`HTMLElement`的函数，调用时不加参数会生成一个`Div`，你也可以选择性地传入子元素的列表。之前你必须这么去定义：

```typescript
declare function create(): Container<HTMLDivElement, HTMLDivElement[]>;
declare function create<T extends HTMLElement>(element: T): Container<T, T[]>;
declare function create<T extends HTMLElement, U extends HTMLElement>(element: T, children: U[]): Container<T, U[]>;
```

有了泛型参数默认类型，我们可以将定义化简为：

```typescript
declare function create<T extends HTMLElement = HTMLDivElement, U = T[]>(element?: T, children?: U): Container<T, U>;
```

泛型参数的默认类型遵循以下规则：

* 有默认类型的类型参数被认为是可选的。
* 必选的类型参数不能在可选的类型参数后。
* 如果类型参数有约束，类型参数的默认类型必须满足这个约束。
* 当指定类型实参时，你只需要指定必选类型参数的类型实参。 未指定的类型参数会被解析为它们的默认类型。
* 如果指定了默认类型，且类型推断无法选择一个候选类型，那么将使用默认类型作为推断结果。
* 一个被现有类或接口合并的类或者接口的声明可以为现有类型参数引入默认类型。
* 一个被现有类或接口合并的类或者接口的声明可以引入新的类型参数，只要它指定了默认类型。

## 新的`--strict`主要编译选项

TypeScript加入的新检查项为了避免不兼容现有项目通常都是默认关闭的。虽然避免不兼容是好事，但这个策略的一个弊端则是使配置最高类型安全越来越复杂，这么做每次TypeScript版本发布时都需要显示地加入新选项。有了`--strict`编译选项，就可以选择最高级别的类型安全（了解随着更新版本的编译器增加了增强的类型检查特性可能会报新的错误）。

新的`--strict`编译器选项包含了一些建议配置的类型检查选项。具体来说，指定`--strict`相当于是指定了以下所有选项（未来还可能包括更多选项）：

* `--strictNullChecks`
* `--noImplicitAny`
* `--noImplicitThis`
* `--alwaysStrict`

确切地说，`--strict`编译选项会为以上列出的编译器选项设置默认值。这意味着还可以单独控制这些选项。比如：

```bash
--strict --noImplicitThis false
```

这将是开启除`--noImplicitThis`编译选项以外的所有严格检查选项。使用这个方式可以表述除某些明确列出的项以外的所有严格检查项。换句话说，现在可以在默认最高级别的类型安全下排除部分检查。

从TypeScript 2.3开始，`tsc --init`生成的默认`tsconfig.json`在`"compilerOptions"`中包含了`"strict: true"`设置。这样一来，用`tsc --init`创建的新项目默认会开启最高级别的类型安全。

## 改进的`--init`输出

除了默认的`--strict`设置外，`tsc --init`还改进了输出。`tsc --init`默认生成的`tsconfig.json`文件现在包含了一些带描述的被注释掉的常用编译器选项. 你可以去掉相关选项的注释来获得期望的结果。我们希望新的输出能简化新项目的配置并且随着项目成长保持配置文件的可读性。

## `--checkJS`选项下 .js 文件中的错误

即便使用了`--allowJs`，TypeScript编译器默认不会报 .js 文件中的任何错误。TypeScript 2.3 中使用`--checkJs`选项，`.js`文件中的类型检查错误也可以被报出.

你可以通过为它们添加`// @ts-nocheck`注释来跳过对某些文件的检查，反过来你也可以选择通过添加`// @ts-check`注释只检查一些`.js`文件而不需要设置`--checkJs`编译选项。你也可以通过添加`// @ts-ignore`到特定行的一行前来忽略这一行的错误.

`.js`文件仍然会被检查确保只有标准的 ECMAScript 特性，类型标注仅在`.ts`文件中被允许，在`.js`中会被标记为错误。JSDoc注释可以用来为你的JavaScript代码添加某些类型信息，更多关于支持的JSDoc结构的详情，请浏览[JSDoc支持文档](https://github.com/Microsoft/TypeScript/wiki/JSDoc-support-in-JavaScript)。

有关详细信息，请浏览[类型检查JavaScript文件文档](https://github.com/Microsoft/TypeScript/wiki/Type-Checking-JavaScript-Files)。

