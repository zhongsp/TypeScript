## 拆分属性的写入类型

在 JavaScript 中，API 经常需要对传入的值进行转换，然后再保存。
这种情况在 getter 和 setter 中也常出现。
例如，在某个类中的一个 setter 总是需要将传入的值转换成 `number`，然后再保存到私有字段中。

```js
class Thing {
    #size = 0;

    get size() {
        return this.#size;
    }
    set size(value) {
        let num = Number(value);

        // Don't allow NaN and stuff.
        if (!Number.isFinite(num)) {
            this.#size = 0;
            return;
        }

        this.#size = num;
    }
}
```

我们该如何将这段 JavaScript 代码改写为 TypeScript 呢？
从技术上讲，我们不必进行任何特殊处理 - TypeScript 能够识别出 `size` 是一个数字。

但问题在于 `size` 不仅仅是允许将 `number` 赋值给它。
我们可以通过将 `size` 声明为 `unknown` 或 `any` 来解决这个问题：

```ts
class Thing {
    // ...
    get size(): unknown {
        return this.#size;
    }
}
```

但这不太友好 - `unknown` 类型会强制在读取 `size` 值时进行类型断言，同时 `any` 类型也不会去捕获错误。
如果我们真想要为转换值的 API 进行建模，那么之前版本的 TypeScript 会强制我们在准确性（读取容易，写入难）和自由度（写入方便，读取难）两者之间进行选择。

这就是 TypeScript 4.3 允许分别为读取和写入属性值添加类型的原因。

```ts
class Thing {
    #size = 0;

    get size(): number {
        return this.#size;
    }

    set size(value: string | number | boolean) {
        let num = Number(value);

        // Don't allow NaN and stuff.
        if (!Number.isFinite(num)) {
            this.#size = 0;
            return;
        }

        this.#size = num;
    }
}
```

上例中，`set` 存取器使用了更广泛的类型种类（`string`、`boolean`和`number`），但 `get` 存取器保证它的值为`number`。
现在，我们再给这类属性赋予其它类型的值就不会报错了！

```ts
class Thing {
    #size = 0;

    get size(): number {
        return this.#size;
    }

    set size(value: string | number | boolean) {
        let num = Number(value);

        // Don't allow NaN and stuff.
        if (!Number.isFinite(num)) {
            this.#size = 0;
            return;
        }

        this.#size = num;
    }
}
// ---cut---
let thing = new Thing();

// 可以给 `thing.size` 赋予其它类型的值！
thing.size = 'hello';
thing.size = true;
thing.size = 42;

// 读取 `thing.size` 总是返回数字！
let mySize: number = thing.size;
```

当需要判定两个同名属性间的关系时，TypeScript 将只考虑“读取的”类型（比如，`get` 存取器上的类型）。
而“写入”类型只在直接写入属性值时才会考虑。

注意，这个模式不仅作用于类。
你也可以在对象字面量中为 getter 和 setter 指定不同的类型。

```ts
function makeThing(): Thing {
    let size = 0;
    return {
        get size(): number {
            return size;
        },
        set size(value: string | number | boolean) {
            let num = Number(value);

            // Don't allow NaN and stuff.
            if (!Number.isFinite(num)) {
                size = 0;
                return;
            }

            size = num;
        },
    };
}
```

事实上，我们在接口/对象类型上支持了为属性的读和写指定不同的类型。

```ts
// Now valid!
interface Thing {
    get size(): number;
    set size(value: number | string | boolean);
}
```

此处的一个限制是属性的读取类型必须能够赋值给属性的写入类型。
换句话说，getter 的类型必须能够赋值给 setter。
这在一定程度上确保了一致性，一个属性应该总是能够赋值给它自身。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/42425)。

## `override` 和 `--noImplicitOverride` 标记

当在 JavaScript 中去继承一个类时，覆写方法十分容易 - 但不幸的是可能会犯一些错误。

其中一个就是会导致丢失重命名。
例如：

```ts
class SomeComponent {
    show() {
        // ...
    }
    hide() {
        // ...
    }
}

class SpecializedComponent extends SomeComponent {
    show() {
        // ...
    }
    hide() {
        // ...
    }
}
```

`SpecializedComponent` 是 `SomeComponent` 的子类，并且覆写了 `show` 和 `hide` 方法。
猜一猜，如果有人想要将 `show` 和 `hide` 方法删除并用单个方法代替会发生什么？

```diff
 class SomeComponent {
-    show() {
-        // ...
-    }
-    hide() {
-        // ...
-    }
+    setVisible(value: boolean) {
+        // ...
+    }
 }
 class SpecializedComponent extends SomeComponent {
     show() {
         // ...
     }
     hide() {
         // ...
     }
 }
```

_哦，不！_
`SpecializedComponent` 中的方法没有被更新。
而是变为添加了两个没用的 `show` 和 `hide` 方法，它们可能都没有被调用。

此处的部分问题在于我们不清楚这里是想添加新的方法，还是想覆写已有的方法。
因此，TypeScript 4.3 增加了 `override` 关键字。

```ts
class SpecializedComponent extends SomeComponent {
    override show() {
        // ...
    }
    override hide() {
        // ...
    }
}
```

当一个方法被标记为 `override`，TypeScript 会确保在基类中存在同名的方法。

```ts
class SomeComponent {
    setVisible(value: boolean) {
        // ...
    }
}
class SpecializedComponent extends SomeComponent {
    override show() {
        //   ~~~~
        //   错误
    }
}
```

这是一项重大改进，但如果*忘记*在方法前添加 `override` 则不会起作用 - 这也是人们常犯的错误。

例如，可能会不小心覆写了基类中的方法，并且还没有意识到。

```ts
class Base {
    someHelperMethod() {
        // ...
    }
}

class Derived extends Base {
    // 不是真正想覆写基类中的方法，
    // 只是想编写一个本地的帮助方法
    someHelperMethod() {
        // ...
    }
}
```

因此，TypeScript 4.3 中还增加了一个 `--noImplicitOverride` 选项。
当启用了该选项，如果覆写了父类中的方法但没有添加 `override` 关键字，则会产生错误。
在上例中，如果启用了 `--noImplicitOverride`，则 TypeScript 会报错，并提示我们需要重命名 `Derived` 中的方法。

感谢开发者社区的贡献。
该功能是在[这个 PR](https://github.com/microsoft/TypeScript/pull/39669)中由[Wenlu Wang](https://github.com/Kingwl)实现，一个更早的 `override` 实现是由[Paul Cody Johnston](https://github.com/pcj)完成。

## 模版字符串类型改进

在近期的版本中，TypeScript 引入了一种新类型，即：模版字符串类型。
它可以通过连接操作来构造类字符串类型：

```ts
type Color = 'red' | 'blue';
type Quantity = 'one' | 'two';

type SeussFish = `${Quantity | Color} fish`;
// 等同于
//   type SeussFish = "one fish" | "two fish"
//                  | "red fish" | "blue fish";
```

或者与其它类字符串类型进行模式匹配。

```ts
declare let s1: `${number}-${number}-${number}`;
declare let s2: `1-2-3`;

// 正确
s1 = s2;
```

我们做的首个改动是 TypeScript 应该在何时去推断模版字符串类型。
当一个模版字符串的类型是由类字符串字面量类型进行的按上下文归类（比如，TypeScript 识别出将模版字符串传递给字面量类型时），它会得到模版字符串类型。

```ts
function bar(s: string): `hello ${string}` {
    // 之前会产生错误，但现在没有问题
    return `hello ${s}`;
}
```

在类型推断和 `extends string` 的类型参数上也会起作用。

```ts
declare let s: string;
declare function f<T extends string>(x: T): T;

// 以前：string
// 现在：`hello-${string}`
let x2 = f(`hello ${s}`);
```

另一个主要的改动是 TypeScript 会更好地进行类型关联，并在不同的模版字符串之间进行推断。

示例如下：

```ts
declare let s1: `${number}-${number}-${number}`;
declare let s2: `1-2-3`;
declare let s3: `${number}-2-3`;

s1 = s2;
s1 = s3;
```

在检查字符串字面量类型时，例如 `s2`，TypeScript 可以匹配字符串的内容并计算出在第一个赋值语句中 `s2` 与 `s1` 兼容。
然而，当再次遇到模版字符串类型时，则会直接放弃进行匹配。
结果就是，像 `s3` 到 `s1` 的赋值语句会出错。

现在，TypeScript 会去判断是否模版字符串的每一部分都能够成功匹配。
你现在可以混合并使用不同的替换字符串来匹配模版字符串，TypeScript 能够更好地计算出它们是否兼容。

```ts
declare let s1: `${number}-${number}-${number}`;
declare let s2: `1-2-3`;
declare let s3: `${number}-2-3`;
declare let s4: `1-${number}-3`;
declare let s5: `1-2-${number}`;
declare let s6: `${number}-2-${number}`;

// 下列均无问题
s1 = s2;
s1 = s3;
s1 = s4;
s1 = s5;
s1 = s6;
```

在这项改进之后，TypeScript 提供了更好的推断能力。
示例如下：

```ts
declare function foo<V extends string>(arg: `*${V}*`): V;

function test<T extends string>(s: string, n: number, b: boolean, t: T) {
    let x1 = foo('*hello*'); // "hello"
    let x2 = foo('**hello**'); // "*hello*"
    let x3 = foo(`*${s}*` as const); // string
    let x4 = foo(`*${n}*` as const); // `${number}`
    let x5 = foo(`*${b}*` as const); // "true" | "false"
    let x6 = foo(`*${t}*` as const); // `${T}`
    let x7 = foo(`**${s}**` as const); // `*${string}*`
}
```

更多详情，请参考[PR：利用按上下文归类](https://github.com/microsoft/TypeScript/pull/43376)，以及[PR：改进模版字符串类型的类型推断和检查](https://github.com/microsoft/TypeScript/pull/43361)。

## ECMAScript `#private` 的类成员

TypeScript 4.3 扩大了在类中可被声明为 `#private` `#names` 的成员的范围，使得它们在运行时成为真正的私有的。
除属性外，方法和存取器也可进行私有命名。

```ts
class Foo {
    #someMethod() {
        //...
    }

    get #someValue() {
        return 100;
    }

    publicMethod() {
        // 可以使用
        // 可以在类内部访问私有命名成员。
        this.#someMethod();
        return this.#someValue;
    }
}

new Foo().#someMethod();
//        ~~~~~~~~~~~
// 错误!
// 属性 '#someMethod' 无法在类 'Foo' 外访问，因为它是私有的。

new Foo().#someValue;
//        ~~~~~~~~~~
// 错误!
// 属性 '#someValue' 无法在类 'Foo' 外访问，因为它是私有的。
```

更为广泛地，静态成员也可以有私有命名。

```ts
class Foo {
    static #someMethod() {
        // ...
    }
}

Foo.#someMethod();
//  ~~~~~~~~~~~
// 错误!
// 属性 '#someMethod' 无法在类 'Foo' 外访问，因为它是私有的。
```

该功能是由 Bloomberg 的朋友开发的：[PR](https://github.com/microsoft/TypeScript/pull/42458) - 由 [Titian Cernicova-Dragomir](https://github.com/dragomirtitian) 和 [Kubilay Kahveci](https://github.com/mkubilayk) 开发，并得到了 [Joey Watts](https://github.com/joeywatts)，[Rob Palmer](https://github.com/robpalme) 和 [Tim McClure](https://github.com/tim-mc) 的帮助支持。
感谢他们！

## `ConstructorParameters` 可用于抽象类

在 TypeScript 4.3 中，`ConstructorParameters`工具类型可以用在 `abstract` 类上。

```ts
abstract class C {
    constructor(a: string, b: number) {
        // ...
    }
}

// 类型为 '[a: string, b: number]'
type CParams = ConstructorParameters<typeof C>;
```

这多亏了 TypeScript 4.2 支持了声明抽象的构造签名：

```ts
type MyConstructorOf<T> = {
    new (...args: any[]): T;
};

// 或使用简写形式：

type MyConstructorOf<T> = abstract new (...args: any[]) => T;
```

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/43380)。

## 按上下文细化泛型类型

TypeScript 4.3 能够更智能地对泛型进行类型细化。
这让 TypeScript 能够支持更多模式，甚至有时还能够发现错误。

设想有这样的场景，我们想要编写一个 `makeUnique` 函数。
它接受一个 `Set` 或 `Array`，如果接收的是 `Array`，则对数组进行排序并去除重复的元素。
最后返回初始的集合。

```ts
function makeUnique<T>(
  collection: Set<T> | T[],
  comparer: (x: T, y: T) => number
): Set<T> | T[] {
  // 假设元素已经是唯一的
  if (collection instanceof Set) {
    return collection;
  }

  // 排序，然后去重
  collection.sort(comparer);
  for (let i = 0; i < collection.length; i++) {
    let j = i;
    while (
      j < collection.length &&
      comparer(collection[i], collection[j + 1]) === 0
    ) {
      j++;
    }
    collection.splice(i + 1, j - i);
  }
  return collection;
}
```

暂且不谈该函数的具体实现，假设它就是某应用中的一个需求。
我们可能会注意到，函数签名没能捕获到 `collection` 的初始类型。
我们可以定义一个类型参数 `C`，并用它代替 `Set<T> | T[]`。

```diff
- function makeUnique<T>(collection: Set<T> | T[], comparer: (x: T, y: T) => number): Set<T> | T[]
+ function makeUnique<T, C extends Set<T> | T[]>(collection: C, comparer: (x: T, y: T) => number): C
```

在 TypeScript 4.2 以及之前的版本中，如果这样做的话会产生很多错误。

```ts
function makeUnique<T, C extends Set<T> | T[]>(
  collection: C,
  comparer: (x: T, y: T) => number
): C {
  // 假设元素已经是唯一的
  if (collection instanceof Set) {
    return collection;
  }

  // 排序，然后去重
  collection.sort(comparer);
  //         ~~~~
  // 错误：属性 'sort' 不存在于类型 'C' 上。
  for (let i = 0; i < collection.length; i++) {
    //                           ~~~~~~
    // 错误: 属性 'length' 不存在于类型 'C' 上。
    let j = i;
    while (
      j < collection.length &&
      comparer(collection[i], collection[j + 1]) === 0
    ) {
      //             ~~~~~~
      // 错误: 属性 'length' 不存在于类型 'C' 上。
      //       ~~~~~~~~~~~~~  ~~~~~~~~~~~~~~~~~
      // 错误: 元素具有隐式的 'any' 类型，因为 'number' 类型的表达式不能用来索引 'Set<T> | T[]' 类型。
      j++;
    }
    collection.splice(i + 1, j - i);
    //         ~~~~~~
    // 错误: 属性 'splice' 不存在于类型 'C' 上。
  }
  return collection;
}
```

全是错误！
为何 TypeScript 要对我们如此刻薄？

问题在于进行 `collection instanceof Set` 检查时，我们期望它能够成为类型守卫，并根据条件将 `Set<T> | T[]` 类型细化为 `Set<T>` 和 `T[]` 类型；
然而，实际上 TypeScript 没有对 `Set<T> | T[]` 进行处理，而是去细化泛型值 `collection`，其类型为 `C`。

虽是细微的差别，但结果却不同。
TypeScript 不会去读取 `C` 的泛型约束（即 `Set<T> | T[]`）并细化它。
如果要让 TypeScript 由 `Set<T> | T[]` 进行类型细化，它就会忘记在每个分支中 `collection` 的类型为 `C`，因为没有比较好的办法去保留这些信息。
假设 TypeScript 真这样做了，那么上例也会有其它的错误。
在函数返回的位置期望得到一个 `C` 类型的值，但从每个分支中得到的却是`Set<T>` 和 `T[]`，因此 TypeScript 会拒绝编译。

```ts
function makeUnique<T>(
  collection: Set<T> | T[],
  comparer: (x: T, y: T) => number
): Set<T> | T[] {
  // 假设元素已经是唯一的
  if (collection instanceof Set) {
    return collection;
    //     ~~~~~~~~~~
    // 错误：类型 'Set<T>' 不能赋值给类型 'C'。
    //          'Set<T>' 可以赋值给 'C' 的类型约束，但是
    //          'C' 可能使用 'Set<T> | T[]' 的不同子类型进行实例化。
  }

  // ...

  return collection;
  //     ~~~~~~~~~~
  // 错误：类型 'T[]' 不能赋值给类型 'C'。
  //          'T[]' 可以赋值给 'C' 的类型约束，但是
  //          'C' 可能使用 'Set<T> | T[]' 的不同子类型进行实例化。
}
```

TypeScript 4.3 是怎么做的？
在一些关键的位置，类型系统会去查看类型的约束。
例如，在遇到 `collection.length` 时，TypeScript 不去关心 `collection` 的类型为 `C`，而是会去查看可访问的属性，而这些是由 `T[] | Set<T>` 泛型约束决定的。

在类似的地方，TypeScript 会获取由泛型约束细化出的类型，因为它包含了用户关心的信息；
而在其它的一些地方，TypeScript 会去细化初始的泛型类型（但结果通常也是该泛型类型）。

换句话说，根据泛型值的使用方式，TypeScript 的处理方式会稍有不同。
最终结果就是，上例中的代码不会产生编译错误。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/43183)。

## 检查总是为真的 Promise

在 `strictNullChecks` 模式下，在条件语句中检查 `Promise` 是否真时会产生错误。

```ts
async function foo(): Promise<boolean> {
  return false;
}

async function bar(): Promise<string> {
  if (foo()) {
    //  ~~~~~
    // Error!
    // This condition will always return true since
    // this 'Promise<boolean>' appears to always be defined.
    // Did you forget to use 'await'?
    return 'true';
  }
  return 'false';
}
```

[这项改动](https://github.com/microsoft/TypeScript/pull/39175)是由[Jack Works](https://github.com/Jack-Works)实现。

## `static` 索引签名

与明确的类型声明相比，索引签名允许我们在一个值上设置更多的属性。

```ts
class Foo {
  hello = 'hello';
  world = 1234;

  // 索引签名：
  [propName: string]: string | number | undefined;
}

let instance = new Foo();

// 没问题
instance['whatever'] = 42;

// 类型为 'string | number | undefined'
let x = instance['something'];
```

目前为止，索引签名只允许在类的实例类型上进行设置。
感谢 [Wenlu Wang](https://github.com/microsoft/TypeScript/pull/37797) 的 [PR](https://github.com/microsoft/TypeScript/pull/37797)，现在索引签名也可以声明为 `static`。

```ts
class Foo {
  static hello = 'hello';
  static world = 1234;

  static [propName: string]: string | number | undefined;
}

// 没问题
Foo['whatever'] = 42;

// 类型为 'string | number | undefined'
let x = Foo['something'];
```
类静态类型上的索引签名检查规则与类实例类型上的索引签名的检查规则是相同的，即每个静态属性必须与静态索引签名类型兼容。

```ts
class Foo {
  static prop = true;
  //     ~~~~
  // 错误！'boolean' 类型的属性 'prop' 不能赋值给字符串索引类型
  // 'string | number | undefined'.

  static [propName: string]: string | number | undefined;
}
```

## `.tsbuildinfo` 文件大小改善

TypeScript 4.3 中，作为 `--incremental` 构建组分部分的 `.tsbuildinfo` 文件会变得非常小。
这得益于一些内部格式的优化，使用以数值标识的查找表来替代重复多次的完整路径以及类似的信息。
这项工作的灵感源自于 [Tobias Koppers](https://github.com/sokra) 的 [PR](https://github.com/microsoft/TypeScript/pull/43079)，而后在 [PR](https://github.com/microsoft/TypeScript/pull/43155) 中实现，并在 [PR](https://github.com/microsoft/TypeScript/pull/43695) 中进行优化。

我们观察到了 `.tsbuildinfo` 文件有如下的变化：

- 1MB 到 411 KB
- 14.9MB 到 1MB
- 1345MB 到 467MB

不用说，缩小文件的尺寸会稍微加快构建速度。

## Lazier Calculations in `--incremental` and `--watch` Compilations

One of the issues with `--incremental` and `--watch` modes are that while they make later compilations go faster, the initial compilation can be a bit slower - in some cases, significantly slower.
This is because these modes have to perform a bunch of book-keeping, computing information about the current project, and sometimes saving that data in a `.tsbuildinfo` file for later builds.

That's why on top of `.tsbuildinfo` size improvements, TypeScript 4.3 also ships some changes to `--incremental` and `--watch` modes that make the first build of a project with these flags just as fast as an ordinary build!
To do this, much of the information that would ordinarily be computed up-front is instead done on an on-demand basis for later builds.
While this can add some overhead to a subsequent build, TypeScript's `--incremental` and `--watch` functionality will still typically operate on a much smaller set of files, and any needed information will be saved afterwards.
In a sense, `--incremental` and `--watch` builds will "warm up" and get faster at compiling files once you've updated them a few times.

In a repository with 3000 files, **this reduced initial build times to almost a third**!

[This work was started](https://github.com/microsoft/TypeScript/pull/42960) by [Tobias Koppers](https://github.com/sokra), whose work ensued in [the resulting final change](https://github.com/microsoft/TypeScript/pull/43314) for this functionality.
We'd like to extend a great thanks to Tobias for helping us find these opportunities for improvements!

## Import Statement Completions

One of the biggest pain-points users run into with import and export statements in JavaScript is the order - specifically that imports are written as

```ts
import { func } from './module.js';
```

instead of

```ts
from "./module.js" import { func };
```

This causes some pain when writing out a full import statement from scratch because auto-complete wasn't able to work correctly.
For example, if you start writing something like `import {`, TypeScript has no idea what module you're planning on importing from, so it couldn't provide any scoped-down completions.

To alleviate this, we've leveraged the power of auto-imports!
Auto-imports already deal with the issue of not being able to narrow down completions from a specific module - their whole point is to provide every possible export and automatically insert an import statement at the top of your file.

So when you now start writing an `import` statement that doesn't have a path, we'll provide you with a list of possible imports.
When you commit a completion, we'll complete the full import statement, including the path that you were going to write.

![Import statement completions](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/05/auto-import-statement-4-3.gif)

This work requires editors that specifically support the feature.
You'll be able to try this out by using the latest [Insiders versions of Visual Studio Code](https://code.visualstudio.com/insiders/).

For more information, take a look at [the implementing pull request](https://github.com/microsoft/TypeScript/pull/43149)!

## Editor Support for `@link` Tags

TypeScript can now understand `@link` tags, and will try to resolve declarations that they link to.
What this means is that you'll be able to hover over names within `@link` tags and get quick information, or use commands like go-to-definition or find-all-references.

For example, you'll be able to go-to-definition on `bar` in `@link bar` in the example below and a TypeScript-supported editor will jump to `bar`'s function declaration.

```ts
/**
 * To be called 70 to 80 days after {@link plantCarrot}.
 */
function harvestCarrot(carrot: Carrot) {}

/**
 * Call early in spring for best results. Added in v2.1.0.
 * @param seed Make sure it's a carrot seed!
 */
function plantCarrot(seed: Seed) {
    // TODO: some gardening
}
```

![Jumping to definition and requesting quick info on a `@link` tag for ](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/05/link-tag-4-3.gif)

For more information, see [the pull request on GitHub](https://github.com/microsoft/TypeScript/pull/41877)!

## Go-to-Definition on Non-JavaScript File Paths

Many loaders allow users to include assets in their applications using JavaScript imports.
They'll typically be written as something like `import "./styles.css"` or the like.

Up until now, TypeScript's editor functionality wouldn't even attempt to read this file, so go-to-definition would typically fail.
At best, go-to-definition would jump to a declaration like `declare module "*.css"` if it could find something along those lines.

TypeScript's language service now tries to jump to the correct file when you perform a go-to-definition on relative file paths, even if they're not JavaScript or TypeScript files!
Try it out with imports to CSS, SVGs, PNGs, font files, Vue files, and more.

For more information, you can check out [the implementing pull request](https://github.com/microsoft/TypeScript/pull/42539).

## Breaking Changes

### `lib.d.ts` Changes

As with every TypeScript version, declarations for `lib.d.ts` (especially the declarations generated for web contexts), have changed.
In this release, we leveraged [Mozilla's browser-compat-data](https://github.com/mdn/browser-compat-data) to remove APIs that no browser implements.
While it is unlike that you are using them, APIs such as `Account`, `AssertionOptions`, `RTCStatsEventInit`, `MSGestureEvent`, `DeviceLightEvent`, `MSPointerEvent`, `ServiceWorkerMessageEvent`, and `WebAuthentication` have all been removed from `lib.d.ts`.
This is discussed [in some detail here](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/991).

https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/991

### Errors on Always-Truthy Promise Checks

Under `strictNullChecks`, using a `Promise` that always appears to be defined within a condition check is now considered an error.

```ts
declare var p: Promise<number>;

if (p) {
    //  ~
    // Error!
    // This condition will always return true since
    // this 'Promise<number>' appears to always be defined.
    //
    // Did you forget to use 'await'?
}
```

For more details, [see the original change](https://github.com/microsoft/TypeScript/pull/39175).

### Union Enums Cannot Be Compared to Arbitrary Numbers

Certain `enum`s are considered _union `enum`s_ when their members are either automatically filled in, or trivially written.
In those cases, an enum can recall each value that it potentially represents.

In TypeScript 4.3, if a value with a union `enum` type is compared with a numeric literal that it could never be equal to, then the type-checker will issue an error.

```ts
enum E {
    A = 0,
    B = 1,
}

function doSomething(x: E) {
    // Error! This condition will always return 'false' since the types 'E' and '-1' have no overlap.
    if (x === -1) {
        // ...
    }
}
```

As a workaround, you can re-write an annotation to include the appropriate literal type.

```ts
enum E {
    A = 0,
    B = 1,
}

// Include -1 in the type, if we're really certain that -1 can come through.
function doSomething(x: E | -1) {
    if (x === -1) {
        // ...
    }
}
```

You can also use a type-assertion on the value.

```ts
enum E {
    A = 0,
    B = 1,
}

function doSomething(x: E) {
    // Use a type asertion on 'x' because we know we're not actually just dealing with values from 'E'.
    if ((x as number) === -1) {
        // ...
    }
}
```

Alternatively, you can re-declare your enum to have a non-trivial initializer so that any number is both assignable and comparable to that enum. This may be useful if the intent is for the enum to specify a few well-known values.

```ts
enum E {
    // the leading + on 0 opts TypeScript out of inferring a union enum.
    A = +0,
    B = 1,
}
```

For more details, [see the original change](https://github.com/microsoft/TypeScript/pull/42472)
