# TypeScript 5.0

## 装饰器 Decorators

装饰器是即将到来的 ECMAScript 特性，它允许我们定制可重用的类以及类成员。

考虑如下的代码：

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person('Ron');
p.greet();
```

这里的 `greet` 很简单，但我们假设它很复杂 - 例如包含异步的逻辑，是递归的，具有副作用等。
不管你把它想像成多么混乱复杂，现在我们想插入一些 `console.log` 语句来调试 `greet`。

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log('LOG: Entering method.');

    console.log(`Hello, my name is ${this.name}.`);

    console.log('LOG: Exiting method.');
  }
}
```

这个做法太常见了。
如果有种办法能给每一个类方法都添加打印功能就太好了！

这就是装饰器的用武之地。
让我们编写一个函数 `loggedMethod`：

```ts
function loggedMethod(originalMethod: any, _context: any) {
  function replacementMethod(this: any, ...args: any[]) {
    console.log('LOG: Entering method.');
    const result = originalMethod.call(this, ...args);
    console.log('LOG: Exiting method.');
    return result;
  }

  return replacementMethod;
}
```

"这些 `any` 是怎么回事？都啥啊？"

先别急 - 这里我们是想简化一下问题，将注意力集中在函数的功能上。
注意一下 `loggedMethod` 接收原方法（`originalMethod`）作为参数并返回一个函数：

1. 打印 `"Entering…"` 消息
1. 将 `this` 值以及所有的参数传递给原方法
1. 打印 `"Exiting..."` 消息，并且
1. 返回原方法的返回值。

现在可以使用 `loggedMethod` 来*装饰* `greet` 方法：

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person('Ron');
p.greet();

// 输出:
//
//   LOG: Entering method.
//   Hello, my name is Ron.
//   LOG: Exiting method.
```

我们刚刚在 `greet` 上使用了 `loggedMethod` 装饰器 - 注意一下写法 `@loggedMethod`。
这样做之后，`loggedMethod` 被调用时会传入被装饰的目标 `target` 以及一个上下文对象 `context object` 作为参数。
因为 `loggedMethod` 返回了一个新函数，因此这个新函数会替换掉 `greet` 的原始定义。

在 `loggedMethod` 的定义中带有第二个参数。
它就是上下文对象 `context object`，包含了一些有关于装饰器声明细节的有用信息 -
例如是否为 `#private` 成员，或者 `static`，或者方法的名称。
让我们重写 `loggedMethod` 来使用这些信息，并且打印出被装饰的方法的名字。

```ts
function loggedMethod(
  originalMethod: any,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }

  return replacementMethod;
}
```

我们使用了上下文参数。
TypeScript 提供了名为 `ClassMethodDecoratorContext` 的类型用于描述装饰器方法接收的上下文对象。

除了元数据外，上下文对象中还提供了一个有用的函数 `addInitializer`。
它提供了一种方式来 hook 到构造函数的起始位置。

例如在 JavaScript 中，下面的情形很常见：

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;

    this.greet = this.greet.bind(this);
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}
```

或者，`greet` 可以被声明为使用箭头函数初始化的属性。

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet = () => {
    console.log(`Hello, my name is ${this.name}.`);
  };
}
```

这类代码的目的是确保 `this` 值不会被重新绑定，当 `greet` 被独立地调用或者在用作回调函数时。

```ts
const greet = new Person('Ron').greet;

// 我们不希望下面的调用失败
greet();
```

我们可以定义一个装饰器来利用 `addInitializer` 在构造函数里调用 `bind`。

```ts
function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  if (context.private) {
    throw new Error(
      `'bound' cannot decorate private properties like ${methodName as string}.`
    );
  }
  context.addInitializer(function () {
    this[methodName] = this[methodName].bind(this);
  });
}
```

`bound` 没有返回值 - 因此当它装饰一个方法时，不会影响原先的方法。
但是，它会在字段被初始化前添加一些逻辑。

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @bound
  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person('Ron');
const greet = p.greet;

// Works!
greet();
```

我们将两个装饰器叠在了一起 - `@bound` 和 `@loggedMethod`。
这些装饰器以“相反的”顺序执行。
也就是说，`@loggedMethod` 装饰原始方法 `greet`，
`@bound` 装饰的是 `@loggedMethod` 的结果。
此例中，这不太重要 - 但如果你的装饰器带有副作用或者期望特定的顺序，那就不一样了。

值得注意的是：如果你在乎代码样式，也可以将装饰器放在同一行上。

```ts
@bound @loggedMethod greet() {
  console.log(`Hello, my name is ${this.name}.`);
}
```

可能不太明显的一点是，你甚至可以定义一个返回装饰器函数的函数。
这样我们可以在一定程序上定制最终的装饰器。
我们可以让 `loggedMethod` 返回一个装饰器并且定制如何打印消息。

```ts
function loggedMethod(headMessage = 'LOG:') {
  return function actualDecorator(
    originalMethod: any,
    context: ClassMethodDecoratorContext
  ) {
    const methodName = String(context.name);

    function replacementMethod(this: any, ...args: any[]) {
      console.log(`${headMessage} Entering method '${methodName}'.`);
      const result = originalMethod.call(this, ...args);
      console.log(`${headMessage} Exiting method '${methodName}'.`);
      return result;
    }

    return replacementMethod;
  };
}
```

这样做之后，在使用 `loggedMethod` 装饰器之前需要先调用它。
接下来就可以传入任意字符串作为打印消息的前缀。

```ts
class Person {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    @loggedMethod("")
    greet() {
        console.log(`Hello, my name is ${this.name}.`);
    }
}

const p = new Person("Ron");
p.greet();

// Output:
//
//    Entering method 'greet'.
//   Hello, my name is Ron.
//    Exiting method 'greet'.
```

装饰器不仅可以用在方法上！
它们也可以被用在属性/字段，存取器（getter/setter）以及自动存取器。
甚至，类本身也可以被装饰，用于处理子类化和注册。

想深入了解装饰器，可以阅读 Axel Rauschmayer 的[文章](https://2ality.com/2022/10/javascript-decorators.html)。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/50820)。

## 与旧的实验性的装饰器的差异

如果你有一定的 TypeScript 经验，你会发现 TypeScript 多年前就已经支持了“实验性的”装饰器特性。
虽然实验性的装饰器非常地好用，但是它实现的是旧版本的装饰器规范，并且总是需要启用 `--experimentalDecorators` 编译器选项。
若没有启用它并且使用了装饰器，TypeScript 会报错。

在未来的一段时间内，`--experimentalDecorators` 依然会存在；
然而，如果不使用该标记，在新代码中装饰器语法也是合法的。
在 `--experimentalDecorators` 之外，它们的类型检查和代码生成方式也不同。
类型检查和代码生成规则存在巨大差异，以至于虽然装饰器*可以*被定义为同时支持新、旧装饰器的行为，但任何现有的装饰器函数都不太可能这样做。

新的装饰器提案与 `--emitDecoratorMetadata` 的实现不兼容，并且不支持在参数上使用装饰器。
未来的 ECMAScript 提案可能会弥补这个差距。

最后要注意的是：除了可以在 `export` 关键字之前使用装饰器，还可以在 `export` 或者 `export default` 之后使用。
但是不允许混合使用两种风格。

```ts
//  allowed
@register export default class Foo {
    // ...
}

//  also allowed
export default @register class Bar {
    // ...
}

//  error - before *and* after is not allowed
@before export @after class Bar {
    // ...
}
```

## 编写强类型的装饰器

上面的例子 `loggedMethod` 和 `bound` 是故意写的简单并且忽略了大量和类型有关的细节。

为装饰器添加类型可能会很复杂。
例如，强类型的 `loggedMethod` 可能像下面这样：

```ts
function loggedMethod<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
        console.log(`LOG: Entering method '${methodName}'.`)
        const result = target.call(this, ...args);
        console.log(`LOG: Exiting method '${methodName}'.`)
        return result;
    }

    return replacementMethod;
}
```

我们必须分别给原方法的 `this`、形式参数和返回值添加类型，上面使用了类型参数 `This`，`Args` 以及 `Return`。
装饰器函数到底有多复杂取决于你要确保什么。
但要记住，装饰器被使用的次数远多于被编写的次数，因此强类型的版本是通常希望得到的 -
但我们需要在可读性之间做出取舍，因此要尽量保持简洁。

未来会有更多关于如何编写装饰器的文档 - 但是[这篇文章](https://2ality.com/2022/10/javascript-decorators.html)详细介绍了装饰器的工作方式。

## `const` 类型参数

在推断对象类型时，TypeScript 通常会选择一个通用类型。
例如，下例中 `names` 的推断类型为 `string[]`：

```ts
type HasNames = { readonly names: string[] };
function getNamesExactly<T extends HasNames>(arg: T): T["names"] {
    return arg.names;
}

// Inferred type: string[]
const names = getNamesExactly({ names: ["Alice", "Bob", "Eve"]});
```

这样做的目的通常是为了允许后面可以进行修改。

然而，根据 `getNamesExactly` 的具体功能和预期使用方式，通常情况下需要更加具体的类型。

直到现在，API 作者们通常不得不在一些位置上添加 `as const` 来达到预期的类型推断目的：

```ts
// The type we wanted:
//    readonly ["Alice", "Bob", "Eve"]
// The type we got:
//    string[]
const names1 = getNamesExactly({ names: ["Alice", "Bob", "Eve"]});

// Correctly gets what we wanted:
//    readonly ["Alice", "Bob", "Eve"]
const names2 = getNamesExactly({ names: ["Alice", "Bob", "Eve"]} as const);
```

这样做既繁琐又容易忘。
在 TypeScript 5.0 里，你可以为类型参数声明添加 `const` 修饰符，
这使得 `const` 形式的类型推断成为默认行为：

```ts
type HasNames = { names: readonly string[] };
function getNamesExactly<const T extends HasNames>(arg: T): T["names"] {
//                       ^^^^^
    return arg.names;
}

// Inferred type: readonly ["Alice", "Bob", "Eve"]
// Note: Didn't need to write 'as const' here
const names = getNamesExactly({ names: ["Alice", "Bob", "Eve"] });
```

注意，`const` 修饰符不会*拒绝*可修改的值，并且不需要不可变约束。
使用可变类型约束可能会产生令人惊讶的结果。

```ts
declare function fnBad<const T extends string[]>(args: T): void;

// 'T' is still 'string[]' since 'readonly ["a", "b", "c"]' is not assignable to 'string[]'
fnBad(["a", "b" ,"c"]);
```

这里，`T` 的候选推断类型为 `readonly ["a", "b", "c"]`，但是 `readonly` 只读数组不能用在需要可变数组的地方。
这种情况下，类型推断会回退到类型约束，将数组视为 `string[]` 类型，因此函数调用仍然会成功。

这个函数更好的定义是使用 `readonly string[]`：

```ts
declare function fnGood<const T extends readonly string[]>(args: T): void;

// T is readonly ["a", "b", "c"]
fnGood(["a", "b" ,"c"]);
```

要注意 `const` 修饰符只影响在函数调用中直接写出的对象、数组和基本表达式的类型推断，
因此，那些无法（或不会）使用 `as const` 进行修饰的参数在行为上不会有任何变化：

```ts
declare function fnGood<const T extends readonly string[]>(args: T): void;
const arr = ["a", "b" ,"c"];

// 'T' is still 'string[]'-- the 'const' modifier has no effect here
fnGood(arr);
```

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/51865)，[PR](https://github.com/microsoft/TypeScript/issues/30680) 和 [PR](https://github.com/microsoft/TypeScript/issues/41114)。

## `extends` 支持多个配置文件

在管理多个项目时，拥有一个“基础”配置文件，其他 tsconfig.json 文件可以继承它，这会非常有帮助。
这就是为什么 TypeScript 支持使用 `extends` 字段来从 `compilerOptions` 中复制字段的原因。

```json
// packages/front-end/src/tsconfig.json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "../lib",
        // ...
    }
}
```

然而，有时您可能想要从多个配置文件中进行继承。
例如，假设您正在使用一个[在 npm 上发布的 TypeScript 基础配置文件](https://github.com/tsconfig/bases)。
如果您希望自己所有的项目也使用 npm 上的 `@tsconfig/strictest` 包中的选项，那么有一个简单的解决方案：让 `tsconfig.base.json` 从 `@tsconfig/strictest` 进行扩展：

```json
// tsconfig.base.json
{
    "extends": "@tsconfig/strictest/tsconfig.json",
    "compilerOptions": {
        // ...
    }
}
```

这在某种程度上是有效的。
如果您的某些工程不想使用 `@tsconfig/strictest`，那么必须手动禁用这些选项，或者创建一个不继承于 `@tsconfig/strictest` 的 `tsconfig.base.json`。

为了提高灵活性，TypeScript 5.0 允许 `extends` 字段指定多个值。
例如，有如下的配置文件：

```json
{
    "extends": ["a", "b", "c"],
    "compilerOptions": {
        // ...
    }
}
```

这样写就如同是直接继承 `c`，而 `c` 继承于 `b`，`b` 继承于 `a`。
如果出现冲突，后来者会被采纳。

在下面的例子中，在最终的 `tsconfig.json` 中 `strictNullChecks` 和 `noImplicitAny` 会被启用。

```json
// tsconfig1.json
{
    "compilerOptions": {
        "strictNullChecks": true
    }
}

// tsconfig2.json
{
    "compilerOptions": {
        "noImplicitAny": true
    }
}

// tsconfig.json
{
    "extends": ["./tsconfig1.json", "./tsconfig2.json"],
    "files": ["./index.ts"]
}
```

另一个例子，我们可以这样改写最初的示例：

```json
// packages/front-end/src/tsconfig.json
{
    "extends": ["@tsconfig/strictest/tsconfig.json", "../../../tsconfig.base.json"],
    "compilerOptions": {
        "outDir": "../lib",
        // ...
    }
}
```

更多详情请参考：[PR](https://github.com/microsoft/TypeScript/pull/50403)。

## 所有的 `enum` 均为联合 `enum`

在最初 TypeScript 引入枚举类型时，它们只不过是一组同类型的数值常量。

```ts
enum E {
    Foo = 10,
    Bar = 20,
}
```

`E.Foo` 和 `E.Bar` 唯一特殊的地方在于它们可以赋值给任何期望类型为 `E` 的地方。
除此之外，它们基本上等同于 `number` 类型。

```ts
function takeValue(e: E) {}

takeValue(E.Foo); // works
takeValue(123); // error!
```

直到 TypeScript 2.0 引入了枚举字面量类型，枚举才变得更为特殊。
枚举字面量类型为每个枚举成员提供了其自己的类型，并将枚举本身转换为每个成员类型的联合类型。
它们还允许我们仅引用枚举中的一部分类型，并细化掉那些类型。

```ts
// Color is like a union of Red | Orange | Yellow | Green | Blue | Violet
enum Color {
    Red, Orange, Yellow, Green, Blue, /* Indigo */, Violet
}

// Each enum member has its own type that we can refer to!
type PrimaryColor = Color.Red | Color.Green | Color.Blue;

function isPrimaryColor(c: Color): c is PrimaryColor {
    // Narrowing literal types can catch bugs.
    // TypeScript will error here because
    // we'll end up comparing 'Color.Red' to 'Color.Green'.
    // We meant to use ||, but accidentally wrote &&.
    return c === Color.Red && c === Color.Green && c === Color.Blue;
}
```

为每个枚举成员提供其自己的类型的一个问题是，这些类型在某种程度上与成员的实际值相关联。
在某些情况下，无法计算该值 - 例如，枚举成员可能由函数调用初始化。

```ts
enum E {
    Blah = Math.random()
}
```

每当 TypeScript 遇到这些问题时，它会悄悄地退而使用旧的枚举策略。
这意味着放弃所有联合类型和字面量类型的优势。

TypeScript 5.0 通过为每个计算成员创建唯一类型，成功将所有枚举转换为联合枚举。
这意味着现在所有枚举都可以被细化，并且每个枚举成员都有其自己的类型。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/50528)

## `--moduleResolution bundler`

TypeScript 4.7 支持将 `--module` 和 `--moduleResolution` 选项设置为 `node16` 和 `nodenext`。
这些选项的目的是更好地模拟 `Node.js` 中 ECMAScript 模块的精确查找规则；
然而，这种模式存在许多其他工具实际上并不强制执行的限制。

例如，在 Node.js 的 ECMAScript 模块中，任何相对导入都需要包含文件扩展名。

```ts
// entry.mjs
import * as utils from "./utils";     //  wrong - we need to include the file extension.

import * as utils from "./utils.mjs"; //  works
```

对于 Node.js 和浏览器来说，这样做有一些原因 - 它可以加快文件查找速度，并且对于简单的文件服务器效果更好。
但是对于许多使用打包工具的开发人员来说，`node16` / `nodenext` 设置很麻烦，
因为打包工具中没有这么多限制。
在某些方面，`node` 解析模式对于任何使用打包工具的人来说是更好的。

但在某些方面，原始的 `node` 解析模式已经过时了。
大多数现代打包工具在 Node.js 中使用 ECMAScript 模块和 CommonJS 查找规则的融合。
例如，像在 CommonJS 中一样，无扩展名的导入也可以正常工作，但是在查找[包的导出条件](https://nodejs.org/api/packages.html#nested-conditions)时，它们将首选像在 ECMAScript 文件中一样的 `import` 条件。

为了模拟打包工具的工作方式，TypeScript 现在引入了一种新策略：`--moduleResolution bundler`。

```json
{
    "compilerOptions": {
        "target": "esnext",
        "moduleResolution": "bundler"
    }
}
```

如果你使用如 Vite， esbuild, swc, Webpack, parcel 等现代打包工具，它们实现了混合的查找策略，新的 `bundler` 选项是更好的选择。

另一方面，如果您正在编写一个要发布到 npm 的代码库，那么使用 `bundler` 选项可能会隐藏影响未使用打包工具用户的兼容性问题。
因此，在这些情况下，使用 `node16` 或 `nodenext` 解析选项可能是更好的选择。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/51669)

## 定制化解析的标记

JavaScript 工具现在可以模拟“混合”解析规则，就像我们上面描述的 `bundler` 模式一样。
由于工具的支持可能有所不同，因此 TypeScript 5.0 提供了启用或禁用一些功能的方法，这些功能可能无法与您的配置一起使用。

### `allowImportingTsExtensions`

`--allowImportingTsExtensions` 允许 TypeScript 文件导入使用了 TypeScript 特定扩展名的文件，例如 `.ts`, `.mts`, `.tsx`。

此标记仅在启用了 `--noEmit` 或 `--emitDeclarationOnly` 时允许使用，
因为这些导入路径无法在运行时的 JavaScript 输出文件中被解析。
这里的期望是，您的解析器（例如打包工具、运行时或其他工具）将保证这些在 `.ts` 文件之间的导入可以工作。

### resolvePackageJsonExports

`--resolvePackageJsonExports` 强制 TypeScript 使用 [package.json 里的 exports 字段](https://nodejs.org/api/packages.html#exports)，如果它尝试读取 `node_modules` 里的某个包。

当 `--moduleResolution` 为 `node16`, `nodenext` 和 `bundler` 时，该选项的默认值为 `true`。

### `resolvePackageJsonImports`

`--resolvePackageJsonImports` 强制 TypeScript 使用 [package.json 里的 imports 字段](https://nodejs.org/api/packages.html#imports)，当它查找以 `#` 开头的文件时，且该文件的父目录中包含 `package.json` 文件。

当 `--moduleResolution` 为 `node16`, `nodenext` 和 `bundler` 时，该选项的默认值为 `true`。

### `allowArbitraryExtensions`

在 TypeScript 5.0 中，当导入路径不是以已知的 JavaScript 或 TypeScript 文件扩展名结尾时，编译器将查找该路径的声明文件，形式为 `{文件基础名称}.d.{扩展名}.ts`。
例如，如果您在打包项目中使用 CSS 加载器，您可能需要编写（或生成）如下的声明文件：

```css
/* app.css */
.cookie-banner {
  display: none;
}
```

```ts
// app.d.css.ts
declare const css: {
  cookieBanner: string;
};
export default css;
```

```tsx
// App.tsx
import styles from "./app.css";

styles.cookieBanner; // string
```

默认情况下，该导入将引发错误，告诉您 TypeScript 不支持此文件类型，您的运行时可能不支持导入它。
但是，如果您已经配置了运行时或打包工具来处理它，您可以使用新的 `--allowArbitraryExtensions` 编译器选项来抑制错误。

需要注意的是，历史上通常可以通过添加名为 `app.css.d.ts` 而不是 `app.d.css.ts` 的声明文件来实现类似的效果 - 但是，这只在 Node.js 中 CommonJS 的 `require` 解析规则下可以工作。
严格来说，前者被解析为名为 `app.css.js` 的 JavaScript 文件的声明文件。
由于 Node 中的 ESM 需要使用包含扩展名的相对文件导入，因此在 `--moduleResolution` 为 `node16` 或 `nodenext` 时，TypeScript 会在示例的 ESM 文件中报错。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/issues/50133) [PR](https://github.com/microsoft/TypeScript/pull/51435)。

### `customConditions`

`--customConditions` 接受额外的[条件](https://nodejs.org/api/packages.html#nested-conditions)列表，当 TypeScript 从 package.json 的[exports](https://nodejs.org/api/packages.html#exports)或 [imports](https://nodejs.org/api/packages.html#imports) 字段解析时，这些条件应该成功。
这些条件会被添加到解析器默认使用的任何现有条件中。

例如，有如下的配置：

```json
{
    "compilerOptions": {
        "target": "es2022",
        "moduleResolution": "bundler",
        "customConditions": ["my-condition"]
    }
}
```

每当 `package.json` 里引用了 `exports` 或 `imports` 字段时，TypeScript 都会考虑名为 `my-condition` 的条件。

所以当从具有如下 `package.json` 的包中导入时：

```json
{
    // ...
    "exports": {
        ".": {
            "my-condition": "./foo.mjs",
            "node": "./bar.mjs",
            "import": "./baz.mjs",
            "require": "./biz.mjs"
        }
    }
}
```

TypeScript 会尝试查找 `foo.mjs` 文件。

该字段仅在 `--moduleResolution` 为 `node16`, `nodenext` 和 `bundler` 时有效。

## --verbatimModuleSyntax

在默认情况下，TypeScript 会执行*导入省略*。
大体上来讲，如果有如下代码：

```ts
import { Car } from "./car";

export function drive(car: Car) {
    // ...
}
```

TypeScript 能够检测到导入语句仅用于导入类型，因此会删除导入语句。
最终生成的 JavaScript 代码如下：

```js
export function drive(car) {
    // ...
}
```

大多数情况下这是没问题的，因为如果 `Car` 不是从 `./car` 导出的值，我们将会得到一个运行时错误。

但在一些特殊情况下，它增加了一层复杂性。
例如，不存在像 `import "./car";` 这样的语句 - 这个导入语句会被完全删除。
这对于有副作用的模块来讲是有区别的。

TypeScript 的 JavaScript 代码生成策略还有其它一些复杂性 - 导入省略不仅只是由导入语句的使用方式决定 - 它还取决于值的声明方式。
因此，如下的代码的处理方式不总是那么明显：

```ts
export { Car } from "./car";
```

这段代码是应该保留还是删除？
如果 `Car` 是使用 `class` 声明的，那么在生成的 JavaScript 代码中会被保留。
但是如果 `Car` 是使用类型别名或 `interface` 声明的，那么在生成的 JavaScript 代码中会被省略。

尽管 TypeScript 可以根据多个文件来综合判断如何生成代码，但不是所有的编译器都能够做到。

导入和导出语句中的 `type` 修饰符能够起到一点作用。
我们可以使用 `type` 修饰符明确声明导入和导出是否仅用于类型分析，并且可以在生成的 JavaScript 文件中完全删除。

```ts
// This statement can be dropped entirely in JS output
import type * as car from "./car";

// The named import/export 'Car' can be dropped in JS output
import { type Car } from "./car";
export { type Car } from "./car";
```

`type` 修饰符本身并不是特别管用 - 默认情况下，导入省略仍会删除导入语句，
并且不强制要求您区分类型导入和普通导入以及导出。
因此，TypeScript 提供了 `--importsNotUsedAsValues` 来确保您使用类型修饰符，
`--preserveValueImports` 来防止*某些*模块消除行为，
以及 `--isolatedModules` 来确保您的 TypeScript 代码在不同编译器中都能正常运行。
不幸的是，理解这三个标志的细节很困难，并且仍然存在一些意外行为的边缘情况。

TypeScript 5.0 提供了一个新的 `--verbatimModuleSyntax` 来简化这个情况。
规则很简单 - 所有不带 `type` 修饰符的导入导出语句会被保留。
任何带有 `type` 修饰符的导入导出语句会被删除。

```ts
// Erased away entirely.
import type { A } from "a";

// Rewritten to 'import { b } from "bcd";'
import { b, type c, type d } from "bcd";

// Rewritten to 'import {} from "xyz";'
import { type xyz } from "xyz";
```

使用这个新的选项，实现了所见即所得。

但是，这在涉及模块互操作性时会有一些影响。
在这个标志下，当您的设置或文件扩展名暗示了不同的模块系统时，ECMAScript 的导入和导出不会被重写为 `require` 调用。
相反，您会收到一个错误。
如果您需要生成使用 `require` 和 `module.exports` 的代码，您需要使用早于 ES2015 的 TypeScript 的模块语法：

```ts
import foo = require("foo");

// ==>

const foo = require("foo");
```

```ts
function foo() {}
function bar() {}
function baz() {}

export = {
    foo,
    bar,
    baz
};

// ==>

function foo() {}
function bar() {}
function baz() {}

module.exports = {
    foo,
    bar,
    baz
};
```

虽然这是一种限制，但它确实有助于使一些问题更加明显。
例如，在 `--module node16` 下很容易忘记[在 package.json 中设置 `type` 字段](https://nodejs.org/api/packages.html#type)。
结果是开发人员会开始编写 CommonJS 模块而不是 ES 模块，但却没有意识到这一点，从而导致查找规则和 JavaScript 输出出现意外的结果。
这个新的标志确保您有意识地使用文件类型，因为语法是刻意不同的。

因为 `--verbatimModuleSyntax` 相比于 `--importsNotUsedAsValues` 和 `--preserveValueImports` 提供了更加一致的行为，推荐使用前者，后两个标记将被弃用。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/52203) 和 [issue](https://github.com/microsoft/TypeScript/issues/51479).

