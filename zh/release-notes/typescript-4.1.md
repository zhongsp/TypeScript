# TypeScript 4.1

## 模版字面量类型

使用字符串字面量类型能够表示仅接受特定字符串参数的函数和 API。

```ts twoslash
function setVerticalAlignment(location: 'top' | 'middle' | 'bottom') {
    // ...
}

setVerticalAlignment('middel');
//                   ^^^^^^^^
// Argument of type '"middel"' is not assignable to parameter of type '"top" | "middle" | "bottom"'.
```

使用字符串字面量类型的好处是它能够对字符串进行拼写检查。

此外，字符串字面量还能用于映射类型中的属性名。
从这个意义上来讲，它们可被当作构件使用。

```ts
type Options = {
    [K in
        | 'noImplicitAny'
        | 'strictNullChecks'
        | 'strictFunctionTypes']?: boolean;
};
// same as
//   type Options = {
//       noImplicitAny?: boolean,
//       strictNullChecks?: boolean,
//       strictFunctionTypes?: boolean
//   };
```

还有一处字符串字面量类型可被当作构件使用，那就是在构造其它字符串字面量类型时。

这也是 TypeScript 4.1 支持模版字面量类型的原因。
它的语法与[JavaScript 中的模版字面量](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)的语法是一致的，但是是用在表示类型的位置上。
当将其与具体类型结合使用时，它会将字符串拼接并产生一个新的字符串字面量类型。

```ts twoslash
type World = 'world';

type Greeting = `hello ${World}`;
//   ^^^^^^^^^
//   "hello world"
```

如果在替换的位置上使用了联合类型会怎么样呢？
它将生成由各个联合类型成员所表示的字符串字面量类型的联合。

```ts twoslash
type Color = 'red' | 'blue';
type Quantity = 'one' | 'two';

type SeussFish = `${Quantity | Color} fish`;
//   ^^^^^^^^^
//   "one fish" | "two fish" | "red fish" | "blue fish"
```

除此之外，我们也可以在其它场景中应用它。
例如，有些 UI 组件库提供了指定垂直和水平对齐的 API，通常会使用类似于`"bottom-right"`的字符串来同时指定。
在垂直对齐的选项`"top"`，`"middle"`和`"bottom"`，以及水平对齐的选项`"left"`，`"center"`和`"right"`之间，共有 9 种可能的字符串，前者选项之一与后者选项之一之间使用短横线连接。

```ts twoslash
type VerticalAlignment = 'top' | 'middle' | 'bottom';
type HorizontalAlignment = 'left' | 'center' | 'right';

// Takes
//   | "top-left"    | "top-center"    | "top-right"
//   | "middle-left" | "middle-center" | "middle-right"
//   | "bottom-left" | "bottom-center" | "bottom-right"

declare function setAlignment(
    value: `${VerticalAlignment}-${HorizontalAlignment}`
): void;

setAlignment('top-left'); // works!
setAlignment('top-middel'); // error!
setAlignment('top-pot'); // error! but good doughnuts if you're ever in Seattle
```

这样的例子还有很多，但它仍只是小例子而已，因为我们可以直接写出所有可能的值。
实际上，对于 9 个字符串来讲还算可以；但是如果需要大量的字符串，你就得考虑如何去自动生成（或者简单地使用`string`）。

有些值实际上是来自于动态创建的字符串字面量。
例如，假设 `makeWatchedObject` API 接收一个对象，并生成一个几乎等同的对象，但是带有一个新的`on`方法来检测属性的变化。

```ts
let person = makeWatchedObject({
    firstName: 'Homer',
    age: 42,
    location: 'Springfield',
});

person.on('firstNameChanged', () => {
    console.log(`firstName was changed!`);
});
```

注意，`on`监听的是`"firstNameChanged"`事件，而非仅仅是`"firstName"`。
那么我们如何定义类型？

```ts twslash
type PropEventSource<T> = {
    on(eventName: `${string & keyof T}Changed`, callback: () => void): void;
};

/// Create a "watched object" with an 'on' method
/// so that you can watch for changes to properties.
declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;
```

这样做的话，如果传入了错误的属性会产生一个错误！

```ts twoslash
type PropEventSource<T> = {
    on(eventName: `${string & keyof T}Changed`, callback: () => void): void;
};
declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;
let person = makeWatchedObject({
    firstName: 'Homer',
    age: 42,
    location: 'Springfield',
});

// error!
person.on('firstName', () => {});

// error!
person.on('frstNameChanged', () => {});
```

我们还可以在模版字面量上做一些其它的事情：可以从替换的位置来*推断*类型。
我们将上面的例子改写成泛型，由`eventName`字符串来推断关联的属性名。

```ts twoslash
type PropEventSource<T> = {
    on<K extends string & keyof T>(
        eventName: `${K}Changed`,
        callback: (newValue: T[K]) => void
    ): void;
};

declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;

let person = makeWatchedObject({
    firstName: 'Homer',
    age: 42,
    location: 'Springfield',
});

// works! 'newName' is typed as 'string'
person.on('firstNameChanged', (newName) => {
    // 'newName' has the type of 'firstName'
    console.log(`new name is ${newName.toUpperCase()}`);
});

// works! 'newAge' is typed as 'number'
person.on('ageChanged', (newAge) => {
    if (newAge < 0) {
        console.log('warning! negative age');
    }
});
```

这里我们将`on`定义为泛型方法。
当用户使用`"firstNameChanged'`来调用该方法，TypeScript 会尝试去推断出`K`所表示的类型。
为此，它尝试将`K`与`"Changed"`之前的内容进行匹配并推断出`"firstName"`。
一旦 TypeScript 得到了结果，`on`方法就能够从原对象上获取`firstName`的类型，此例中是`string`。
类似地，当使用`"ageChanged"`调用时，它会找到属性`age`的类型为`number`。

类型推断可以用不同的方式组合，常见的是解构字符串，再使用其它方式重新构造它们。
实际上，为了便于修改字符串字面量类型，我们引入了一些新的工具类型来修改字符大小写。

```ts twoslash
type EnthusiasticGreeting<T extends string> = `${Uppercase<T>}`;

type HELLO = EnthusiasticGreeting<'hello'>;
//   ^^^^^
//   "HELLO"
```

新的类型别名为`Uppercase`，`Lowercase`，`Capitalize`和`Uncapitalize`。
前两个会转换字符串中的所有字符，而后面两个只转换字符串的首字母。

更多详情，[查看原 PR](https://github.com/microsoft/TypeScript/pull/40336)以及[正在进行中的切换类型别名助手的 PR](https://github.com/microsoft/TypeScript/pull/40580).

## 在映射类型中更改映射的键

让我们先回顾一下，映射类型可以使用任意的键来创建新的对象类型。

```ts
type Options = {
    [K in
        | 'noImplicitAny'
        | 'strictNullChecks'
        | 'strictFunctionTypes']?: boolean;
};
// same as
//   type Options = {
//       noImplicitAny?: boolean,
//       strictNullChecks?: boolean,
//       strictFunctionTypes?: boolean
//   };
```

或者，基于任意的对象类型来创建新的对象类型。

```ts
/// 'Partial<T>' 等同于 'T'，只是把每个属性标记为可选的。
type Partial<T> = {
    [K in keyof T]?: T[K];
};
```

到目前为止，映射类型只能使用提供给它的键来创建新的对象类型；然而，很多时候我们想要创建新的键，或者过滤掉某些键。

这就是 TypeScript 4.1 允许更改映射类型中的键的原因。它使用了新的`as`语句。

```ts
type MappedTypeWithNewKeys<T> = {
    [K in keyof T as NewKeyType]: T[K];
    //            ^^^^^^^^^^^^^
    //            这里是新的语法！
};
```

通过`as`语句，你可以利用例如模版字面量类型，并基于原属性名来轻松地创建新属性名。

```ts twoslash
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
    name: string;
    age: number;
    location: string;
}

type LazyPerson = Getters<Person>;
// type LazyPerson = {
//     getName: () => string;
//     getAge: () => number;
//     getLocation: () => string;
// }
```

此外，你可以巧用`never`类型来过滤掉某些键。
也就是说，在某些情况下你不必使用`Omit`工具类型。

```ts twoslash
// 删除 'kind' 属性
type RemoveKindField<T> = {
    [K in keyof T as Exclude<K, 'kind'>]: T[K];
};

interface Circle {
    kind: 'circle';
    radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;

type RemoveKindField<T> = {
    [K in keyof T as Exclude<K, 'kind'>]: T[K];
};

interface Circle {
    kind: 'circle';
    radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;
// type KindlessCircle = {
//     radius: number;
// }
```

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/40336)。

## 递归的有条件类型

在 JavaScript 中较为常见的是，一个函数能够以任意的层级来展平（flatten）并构建容器类型。
例如，可以拿`Promise`实例对象上的`.then()`方法来举例。
`.then(...)`方法能够拆解每一个`Promise`，直到它找到一个非`Promise`的值，然后将该值传递给回调函数。
`Array`上也存在一个相对较新的`flat`方法，它接收一个表示深度的参数，并以此来决定展平操作的层数。

在过去，我们无法使用 TypeScript 类型系统来表达上述例子。
虽然也存在一些 hack，但基本上都不切合实际。

TypeScript 4.1 取消了对有条件类型的一些限制 - 因此它现在可以表达上述类型。
在 TypeScript 4.1 中，允许在有条件类型的分支中立即引用该有条件类型自身，这就使得编写递归的类型别名变得更加容易。
例如，我们想定义一个类型来获取嵌套数组中的元素类型，可以定义如下的`deepFlatten`类型。

```ts
type ElementType<T> = T extends ReadonlyArray<infer U> ? ElementType<U> : T;

function deepFlatten<T extends readonly unknown[]>(x: T): ElementType<T>[] {
    throw 'not implemented';
}

// All of these return the type 'number[]':
deepFlatten([1, 2, 3]);
deepFlatten([[1], [2, 3]]);
deepFlatten([[1], [[2]], [[[3]]]]);
```

类似地，在 TypeScript 4.1 中我们可以定义`Awaited`类型来拆解`Promise`。

```ts
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

/// 类似于 `promise.then(...)`，但是类型更准确
declare function customThen<T, U>(
    p: Promise<T>,
    onFulfilled: (value: Awaited<T>) => U
): Promise<Awaited<U>>;
```

一定要注意，虽然这些递归类型很强大，但要有节制地使用它。

首先，这些类型能做的更多，但也会增加类型检查的耗时。
尝试为考拉兹猜想或斐波那契数列建模是一件有趣的事儿，但请不要在 npm 上发布带有它们的`.d.ts`文件。

除了计算量大之外，这些类型还可能会达到内置的递归深度限制。
如果到达了递归深度限制，则会产生编译错误。
通常来讲，最好不要去定义这样的类型。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/40002).

## 索引访问类型检查（`--noUncheckedIndexedAccess`）

TypeScript 支持一个叫做*索引签名*的功能。
索引签名用于告诉类型系统，用户可以访问任意名称的属性。

```ts twoslash
interface Options {
    path: string;
    permissions: number;

    // 额外的属性可以被这个签名捕获
    [propName: string]: string | number;
}

function checkOptions(opts: Options) {
    opts.path; // string
    opts.permissions; // number

    // 以下都是允许的
    // 它们的类型为 'string | number'
    opts.yadda.toString();
    opts['foo bar baz'].toString();
    opts[Math.random()].toString();
}
```

上例中，`Options`包含了索引签名，它表示在访问未直接列出的属性时得到的类型为`string | number`。
这是一种乐观的做法，它假想我们非常清楚代码在做什么，但实际上 JavaScript 中的大部分值并不支持任意的属性名。
例如，大多数类型并不包含属性名为`Math.random()`的值。
对许多用户来讲，这不是期望的行为，就好像没有利用到`--strictNullChecks`提供的严格类型检查。

这就是 TypeScript 4.1 提供了`--noUncheckedIndexedAccess`编译选项的原因。
在该新模式下，任何属性访问（例如`foo.bar`）或者索引访问（例如`foo["bar"]`）都会被认为可能为`undefined`。
例如在上例中，`opts.yadda`的类型为`string | number | undefined`，而不是`string | number`。
如果需要访问那个属性，你可以先检查属性是否存在或者使用非空断言运算符（`!`后缀字符）。

```ts twoslash
// @noUncheckedIndexedAccess
interface Options {
    path: string;
    permissions: number;

    // 额外的属性可以被这个签名捕获
    [propName: string]: string | number;
}
// ---cut---
function checkOptions(opts: Options) {
    opts.path; // string
    opts.permissions; // number

    // 在 noUncheckedIndexedAccess 下，以下操作不允许
    opts.yadda.toString();
    opts['foo bar baz'].toString();
    opts[Math.random()].toString();

    // 首先检查是否存在
    if (opts.yadda) {
        console.log(opts.yadda.toString());
    }

    // 使用 ! 非空断言，“我知道在做什么”
    opts.yadda!.toString();
}
```

使用`--noUncheckedIndexedAccess`的一个结果是，通过索引访问数组元素时也会进行严格类型检查，就算是在遍历检查过边界的数组时。

```ts twoslash
// @noUncheckedIndexedAccess
function screamLines(strs: string[]) {
    // 下面会有问题
    for (let i = 0; i < strs.length; i++) {
        console.log(strs[i].toUpperCase());
    }
}
```

如果你不需要使用索引，那么可以使用`for`-`of`循环或`forEach`来遍历。

```ts twoslash
// @noUncheckedIndexedAccess
function screamLines(strs: string[]) {
    // 可以正常工作
    for (const str of strs) {
        console.log(str.toUpperCase());
    }

    // 可以正常工作
    strs.forEach((str) => {
        console.log(str.toUpperCase());
    });
}
```

这个选项虽可以用来捕获访问越界的错误，但对大多数代码来讲有些烦，因此它不会被`--strict`选项自动启用；然而，如果你对此选项感兴趣，可以尝试一下，看它是否适用于你的代码。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/39560).

## 不带 `baseUrl` 的 `paths`

路径映射的使用很常见 - 通常它用于优化导入语句，以及模拟在单一代码仓库中进行链接的行为。

不幸的是，在使用`paths`时必须指定`baseUrl`，它允许裸路径描述符基于`baseUrl`进行解析。
它会导致在自动导入时会使用较差的路径。

在 TypeScript 4.1 中，`paths`不必与`baseUrl`一起使用。
它会一定程序上帮助解决上述的问题。

## `checkJs` 默认启用 `allowJs`

从前，如果你想要对 JavaScript 工程执行类型检查，你需要同时启用`allowJs`和`checkJs`。
这样的体验让人讨厌，因此现在`checkJs`会默认启用`allowJs`。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/40275)。

## React 17 JSX 工厂

TypeScript 4.1 通过以下两个编译选项来支持 React 17 中的`jsx`和`jsxs`工厂函数：

-   `react-jsx`
-   `react-jsxdev`

这两个编译选项分别用于生产环境和开发环境中。
通常，编译选项之间可以继承。
例如，用于生产环境的`tsconfig.json`如下：

```json tsconfig
// ./src/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "es2015",
        "jsx": "react-jsx",
        "strict": true
    },
    "include": ["./**/*"]
}
```

另外一个用于开发环境的`tsconfig.json`如下：

```json tsconfig
// ./src/tsconfig.dev.json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "jsx": "react-jsxdev"
    }
}
```

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/39199)。

## 在编辑器中支持 JSDoc `@see` 标签

编辑器对 TypeScript 和 JavaScript 代码中的 JSDoc 标签`@see`有了更好的支持。
它允许你使用像“跳转到定义”这样的功能。
例如，在下例中的 JSDoc 里可以使用跳转到定义到`first`或`C`。

```ts
// @filename: first.ts
export class C {}

// @filename: main.ts
import * as first from './first';

/**
 * @see first.C
 */
function related() {}
```

感谢贡献者[Wenlu Wang](https://github.com/Kingwl)[实现了这个功能](https://github.com/microsoft/TypeScript/pull/39760)！

## 破坏性改动

### `lib.d.ts` 更新

`lib.d.ts`包含一些 API 变动，在某种程度上是因为 DOM 类型是自动生成的。
一个具体的变动是`Reflect.enumerate`被删除了，因为它在 ES2016 中被删除了。

### `abstract` 成员不能被标记为 `async`

`abstract`成员不再可以被标记为`async`。
这可以通过删除`async`关键字来修复，因为调用者只关注返回值类型。

### `any`/`unknown` Are Propagated in Falsy Positions

从前，对于表达式`foo && somethingElse`，若`foo`的类型为`any`或`unknown`，那么整个表达式的类型为`somethingElse`。

例如，在以前此处的`x`的类型为`{ someProp: string }`。

```ts
declare let foo: unknown;
declare let somethingElse: { someProp: string };

let x = foo && somethingElse;
```

然而，在 TypeScript 4.1 中，会更谨慎地确定该类型。
由于不清楚`&&`左侧的类型，我们会传递`any`和`unknown`类型，而不是`&&`右侧的类型。

常见的模式是检查与`boolean`的兼容性，尤其是在谓词函数中。

```ts
function isThing(x: any): boolean {
    return x && typeof x === 'object' && x.blah === 'foo';
}
```

一种合适的修改是使用`!!foo && someExpression`来代替`foo && someExpression`。

### `Promise`的`resolve`的参数不再是可选的

在编写如下的代码时

```ts
new Promise((resolve) => {
    doSomethingAsync(() => {
        doSomething();
        resolve();
    });
});
```

你可能会得到如下的错误：

```
  resolve()
  ~~~~~~~~~
error TS2554: Expected 1 arguments, but got 0.
  An argument for 'value' was not provided.
```

这是因为`resolve`不再有可选参数，因此默认情况下，必须给它传值。
它通常能够捕获`Promise`的 bug。
典型的修复方法是传入正确的参数，以及添加明确的类型参数。

```ts
new Promise<number>((resolve) => {
    //     ^^^^^^^^
    doSomethingAsync((value) => {
        doSomething();
        resolve(value);
        //      ^^^^^
    });
});
```

然而，有时`resolve()`确实需要不带参数来调用
在这种情况下，我们可以给`Promise`传入明确的`void`泛型类型参数（例如，`Promise<void>`）。
它利用了 TypeScript 4.1 中的一个新功能，一个潜在的`void`类型的末尾参数会变成可选参数。

```ts
new Promise<void>((resolve) => {
    //     ^^^^^^
    doSomethingAsync(() => {
        doSomething();
        resolve();
    });
});
```

TypeScript 4.1 提供了快速修复选项来解决该问题。

### 有条件展开会创建可选属性

在 JavaScript 中，对象展开（例如，`{ ...foo }`）不会操作假值。
因此，在`{ ...foo }`代码中，如果`foo`的值为`null`或`undefined`，则它会被略过。

很多人利用该性质来可选地展开属性。

```ts
interface Person {
    name: string;
    age: number;
    location: string;
}

interface Animal {
    name: string;
    owner: Person;
}

function copyOwner(pet?: Animal) {
    return {
        ...(pet && pet.owner),
        otherStuff: 123,
    };
}

// We could also use optional chaining here:

function copyOwner(pet?: Animal) {
    return {
        ...pet?.owner,
        otherStuff: 123,
    };
}
```

此处，如果`pet`定义了，那么`pet.owner`的属性会被展开 - 否则，不会有属性被展开到目标对象中。

在之前，`copyOwner`的返回值类型为基于每个展开运算结果的联合类型：
The return type of `copyOwner` was previously a union type based on each spread:

```
{ x: number } | { x: number, name: string, age: number, location: string }
```

它精确地展示了操作是如何进行的：如果`pet`定义了，那么`Person`中的所有属性都存在；否则，在结果中不存在`Person`中的任何属性。
它是一种要么全有要么全无的的操作。

然而，我们发现这个模式被过度地使用了，在单一对象中存在数以百计的展开运算，每一个展开操作可能会添加成百上千的操作。
结果就是这项操作可能非常耗时，并且用处不大。

在 TypeScript 4.1 中，返回值类型有时会使用全部的可选类型。

```
{
    x: number;
    name?: string;
    age?: number;
    location?: string;
}
```

这样的结果是有更好的性能以及更佳地展示。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/40778)。
目前，该行为还不完全一致，我们期待在未来会有所改进。

### Unmatched parameters are no longer related

从前 TypeScript 在关联参数时，如果参数之间没有联系，则会将其关联为`any`类型。
由于[TypeScript 4.1 的改动](https://github.com/microsoft/TypeScript/pull/41308)，TypeScript 会完全跳过这个过程。
这意味着一些可赋值性检查会失败，同时也意味着重载解析可能会失败。
例如，在解析 Node.js 中`util.promisify`函数的重载时可能会选择不同的重载签名，这可能会导致产生新的错误。

做为一个变通方法，你可能需要使用类型断言来消除错误。
