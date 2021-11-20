# TypeScript 4.5

### 支持从 `node_modules` 里读取 `lib`

为确保对 TypeScript 和 JavaScript 的支持可以开箱即用，TypeScript 内置了一些声明文件（`.d.ts`）。
这些声明文件描述了 JavaScript 语言中可用的 API，以及标准的浏览器 DOM API。
虽说 TypeScript 会根据工程中 [`target`](/tsconfig#target) 的设置来提供默认值，但你仍然可以通过在 `tsconfig.json` 文件中设置 [`lib`](https://www.typescriptlang.org/tsconfig#lib) 来指定包含哪些声明文件。

TypeScript 包含的声明文件偶尔也会成为缺点：

- 在升级 TypeScript 时，你必须要处理 TypeScript 内置声明文件的升级带来的改变，这可能成为一项挑战，因为 DOM API 的变动十分频繁。
- 难以根据你的需求以及工程依赖的需求去定制声明文件（例如，工程依赖声明了需要使用 DOM API，那么你可能也必须要使用 DOM API）。

TypeScript 4.5 引入了覆盖特定内置 `lib` 的方式，它与 `@types/` 的工作方式类似。
在决定应包含哪些 `lib` 文件时，TypeScript 会先去检查 `node_modules` 下面的 `@typescript/lib-*` 包。
例如，若将 `dom` 作为 `lib` 中的一项，那么 TypeScript 会尝试使用 `node_modules/@typescript/lib-dom`。

然后，你就可以使用包管理器去安装特定的包作为 `lib` 中的某一项。
例如，现在 TypeScript 会将 DOM API 发布到 `@types/web`。
如果你想要给工程指定一个固定版本的 DOM API，你可以在 `package.json` 文件中添加如下代码：

```json
{
  "dependencies": {
    "@typescript/lib-dom": "npm:@types/web"
  }
}
```

从 4.5 版本开始，你可以更新 TypeScript 和依赖管理工具生成的锁文件来确保使用固定版本的 DOM API。
你可以根据自己的情况来逐步更新类型声明。

十分感谢 [saschanaz](https://github.com/saschanaz) 提供的帮助。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/45771)。

### 改进 `Awaited` 类型和 `Promise`

TypeScript 4.5 引入了一个新的 `Awaited` 类型。
该类型用于描述 `async` 函数中的 `await` 操作，或者 `Promise` 上的 `.then()` 方法 - 尤其是递归地解开 `Promise` 的行为。

```ts
// A = string
type A = Awaited<Promise<string>>;

// B = number
type B = Awaited<Promise<Promise<number>>>;

// C = boolean | number
type C = Awaited<boolean | Promise<number>>;
```

`Awaited` 有助于描述现有 API，比如 JavaScript 内置的 `Promise.all`，`Promise.race` 等等。
实际上，正是涉及 `Promise.all` 的类型推断问题促进了 `Awaited` 类型的产生。
例如，下例中的代码在 TypeScript 4.4 及之前的版本中会失败。

```ts
declare function MaybePromise<T>(value: T): T | Promise<T> | PromiseLike<T>;

async function doSomething(): Promise<[number, number]> {
  const result = await Promise.all([MaybePromise(100), MaybePromise(200)]);

  // 错误！
  //
  //    [number | Promise<100>, number | Promise<200>]
  //
  // 不能赋值给类型
  //
  //    [number, number]
  return result;
}
```

现在，`Promise.all` 结合并利用 `Awaited` 来提供更好的类型推断结果，同时上例中的代码也不再有错误。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/45350)。

### 模版字符串类型作为判别式属性

TypeScript 4.5 可以对模版字符串类型的值进行细化，同时可以识别模版字符串类型的判别式属性。

例如，下面的代码在以前会出错，但在 TypeScript 4.5 里没有错误。

```ts
export interface Success {
  type: `${string}Success`;
  body: string;
}

export interface Error {
  type: `${string}Error`;
  message: string;
}

export function handler(r: Success | Error) {
  if (r.type === "HttpSuccess") {
    // 'r' 的类型为 'Success'
    let token = r.body;
  }
}
```

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/46137)。

### `module es2022`

感谢 [Kagami S. Rosylight](https://github.com/saschanaz)，TypeScript 现在支持了一个新的 `module` 设置：`es2022`。
[`module es2022`](/tsconfig#module) 的主要功能是支持顶层的 `await`，即可以在 `async` 函数外部使用 `await`。
该功能在 `--module esnext` 里已经被支持了（现在又增加了 [`--module nodenext`](/tsconfig#target)），但 `es2022` 是支持该功能的首个稳定版本。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/44656)。

### 在条件类型上消除尾递归

当 TypeScript 检测到了以下情况时通常需要优雅地失败，比如无限递归、极其耗时以至影响编辑器使用体验的类型展开操作。
因此，TypeScript 会使用试探式的方法来确保它在试图拆分一个无限层级的类型时或操作将生成大量中间结果的类型时不会偏离轨道。

```ts
type InfiniteBox<T> = { item: InfiniteBox<T> };

type Unpack<T> = T extends { item: infer U } ? Unpack<U> : T;

// error: Type instantiation is excessively deep and possibly infinite.
type Test = Unpack<InfiniteBox<number>>;
```

上例是有意写成简单且没用的类型，但是存在大量有用的类型恰巧会触发试探。
作为示例，下面的 `TrimLeft` 类型会从字符串类型的开头删除空白。
若给定一个在开头位置有一个空格的字符串类型，它会直接将空格后面的字符串再传入 `TrimLeft`。

```ts
type TrimLeft<T extends string> = T extends ` ${infer Rest}`
  ? TrimLeft<Rest>
  : T;

// Test = "hello" | "world"
type Test = TrimLeft<"   hello" | " world">;
```

这个类型也许有用，但如果字符串起始位置有 50 个空格，就会产生错误。

```ts
type TrimLeft<T extends string> = T extends ` ${infer Rest}`
  ? TrimLeft<Rest>
  : T;

// error: Type instantiation is excessively deep and possibly infinite.
type Test = TrimLeft<"                                                oops">;
```

这很讨厌，因为这种类型在表示字符串操作时很有用 - 例如，URL 路由解析器。
更差的是，越有用的类型越会创建更多的实例化类型，结果就是对输入参数会有限制。

但也有一个可取之处：`TrimLeft` 在一个分支中使用了*尾递归*的方式编写。
当它再次调用自己时，是直接返回了结果并且不存在后续操作。
由于这些类型不需要创建中间结果，因此可以被更快地实现并且可以避免触发 TypeScript 内置的类型递归试探。

这就是 TypeScript 4.5 在条件类型上删除尾递归的原因。
只要是条件类型的某个分支为另一个条件类型，TypeScript 就不会去生成中间类型。
虽说仍然会进行一些试探来确保类型没有偏离方向，但已无伤大雅。

注意，下面的类型*不会*被优化，因为它使用了包含条件类型的联合类型。

```ts
type GetChars<S> = S extends `${infer Char}${infer Rest}`
  ? Char | GetChars<Rest>
  : never;
```

如果你想将它改成尾递归，可以引入帮助类型来接收一个累加类型的参数，就如同尾递归函数一样。

```ts
type GetChars<S> = GetCharsHelper<S, never>;
type GetCharsHelper<S, Acc> = S extends `${infer Char}${infer Rest}`
  ? GetCharsHelper<Rest, Char | Acc>
  : Acc;
```

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/45711)。

### 禁用导入省略

在某些情况下，TypeScript 无法检测导入是否被使用。
例如，考虑下面的代码：

```ts
import { Animal } from "./animal.js";

eval("console.log(new Animal().isDangerous())");
```

默认情况下，TypeScript 会删除上面的导入语句，因为它看上去没有被使用。
在 TypeScript 4.5 里，你可以启用新的标记 [`preserveValueImports`](/tsconfig#preserveValueImports) 来阻止 TypeScript 从生成的 JavaScript 代码里删除导入的值。
虽说应该使用 `eval` 的理由不多，但在 Svelte 框架里有相似的情况：

```html
<!-- A .svelte File -->
<script>
  import { someFunc } from "./some-module.js";
</script>

<button on:click="{someFunc}">Click me!</button>
```

同样在 Vue.js 中，使用 `<script setup>` 功能：

```html
<!-- A .vue File -->
<script setup>
  import { someFunc } from "./some-module.js";
</script>

<button @click="someFunc">Click me!</button>
```

这些框架会根据 `<script>` 标签外的标记来生成代码，但 TypeScript *仅仅*会考虑 `<script>` 标签内的代码。
也就是说 TypeScript 会自动删除对 `someFunc` 的导入，因此上面的代码无法运行！
使用 TypeScript 4.5，你可以通过 [`preserveValueImports`](/tsconfig#preserveValueImports) 来避免发生这种情况。

当该标记和 [--isolatedModules`](/tsconfig#isolatedModules) 一起使用时有个额外要求：导入的类型*必须*被标记为 type-only，因为编译器一次处理一个文件，无法知道是否导入了未被使用的值，或是导入了必须要被删除的类型以防运行时崩溃。

```ts
// Which of these is a value that should be preserved? tsc knows, but `ts.transpileModule`,
// ts-loader, esbuild, etc. don't, so `isolatedModules` gives an error.
import { someFunc, BaseType } from "./some-module.js";
//                 ^^^^^^^^
// Error: 'BaseType' is a type and must be imported using a type-only import
// when 'preserveValueImports' and 'isolatedModules' are both enabled.
```

这催生了另一个 TypeScript 4.5 的功能，[导入语句中的 `type` 修饰符](#type-on-import-names)，它尤其重要。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/44619)。

### 在导入名称前使用 `type` 修饰符

上面提到，[`preserveValueImports`](/tsconfig#preserveValueImports) 和 [`isolatedModules`](/tsconfig#isolatedModules) 结合使用时有额外的要求，这是为了让构建工具能够明确知道是否可以省略导入语句。

```ts
// Which of these is a value that should be preserved? tsc knows, but `ts.transpileModule`,
// ts-loader, esbuild, etc. don't, so `isolatedModules` issues an error.
import { someFunc, BaseType } from "./some-module.js";
//                 ^^^^^^^^
// Error: 'BaseType' is a type and must be imported using a type-only import
// when 'preserveValueImports' and 'isolatedModules' are both enabled.
```

当同时使用了这些选项时，需要有一种方式来表示导入语句是否可以被合法地丢弃。
TypeScript 已经有类似的功能，即 `import type`：

```ts
import type { BaseType } from "./some-module.js";
import { someFunc } from "./some-module.js";

export class Thing implements BaseType {
  // ...
}
```

这是有效的，但还可以提供更好的方式来避免使用两条导入语句从相同的模块中导入。
因此，TypeScript 4.5 允许在每个命名导入前使用 `type` 修饰符，你可以按需混合使用它们。

```ts
import { someFunc, type BaseType } from "./some-module.js";

export class Thing implements BaseType {
    someMethod() {
        someFunc();
    }
}
```

上例中，在 [`preserveValueImports`](/tsconfig#preserveValueImports) 模式下，能够确定 `BaseType` 可以被删除，同时 `someFunc` 应该被保留，于是就会生成如下代码：

```js
import { someFunc } from "./some-module.js";

export class Thing {
  someMethod() {
    someFunc();
  }
}
```

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/45998)。

### 私有字段存在性检查

TypeScript 4.5 支持了检查对象上是否存在某私有字段的 ECMAScript Proposal。
现在，你可以编写带有 `#private` 字段成员的类，然后使用 `in` 运算符检查另一个对象是否包含相同的字段。

```ts
class Person {
    #name: string;
    constructor(name: string) {
        this.#name = name;
    }

    equals(other: unknown) {
        return other &&
            typeof other === "object" &&
            #name in other && // <- this is new!
            this.#name === other.#name;
    }
}
```

该功能一个有趣的地方是，`#name in other` 隐含了 `other` 必须是使用 `Person` 构造的，因为只有在这种情况下才可能存在该字段。
这是该提议中关键的功能之一，同时也是为什么这项提议叫作 “ergonomic brand checks” 的原因 - 因为私有字段通常作为一种“商标”来区分不同类的实例。
因此，TypeScript 能够在每次检查中细化 `other`类型，直到细化为 `Person` 类型。

感谢来自 Bloomberg 的朋友提交的 [PR](https://github.com/microsoft/TypeScript/pull/44648)：[Ashley Claymore](https://github.com/acutmore)，[Titian Cernicova-Dragomir](https://github.com/dragomirtitian)，[Kubilay Kahveci](https://github.com/mkubilayk)，和 [Rob Palmer](https://github.com/robpalme)！

### 导入断言

TypeScript 4.5 支持了 ECMAScript Proposal 中的 *导入断言*。
该语法会被运行时所使用来检查导入是否为期望的格式。

```ts
import obj from "./something.json" assert { type: "json" };
```

TypeScript 不会检查这些断言，因为它们依赖于宿主环境。
TypeScript 会保留原样，稍后让浏览器或者运行时来处理它们（也可能会出错）。

```ts
// TypeScript 允许
// 但浏览器可能不允许
import obj from "./something.json" assert {
    type: "fluffy bunny"
};
```

动态的 `import()` 调用可以通过第二个参数来使用导入断言。

```ts
const obj = await import("./something.json", {
  assert: { type: "json" },
});
```

第二个参数的类型为 `ImportCallOptions`，并且目前它只接受一个 `assert` 属性。

感谢 [Wenlu Wang](https://github.com/Kingwl/) 实现了 [这个功能](https://github.com/microsoft/TypeScript/pull/40698)！

### 使用 `realPathSync.native` 获得更快的加载速度

TypeScript 在所有操作系统上使用了 Node.js `realPathSync` 函数的系统原生实现。

以前，这个函数只在 Linux 上使用了，但在 TypeScript 4.5 中，在大小写不敏感的操作系统上，如 Windows 和 MacOS，也被采用了。
对于一些代码库来讲这个改动会提升 5 ~ 13% 的加载速度（和操作系统有关）。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/44966)。

### JSX Attributes 的代码片段自动补全

TypeScript 4.5 为 JSX 属性提供了*代码片段自动补全*功能。
当在 JSX 标签上输入属性时，TypeScript 已经能够提供提供建议；
但对于代码片段自动补全来讲，它们会删除部分已经输入的字符来添加一个初始化器并将光标放到正确的位置。

![Snippet completions for JSX attributes. For a string property, quotes are automatically added. For a numeric properties, braces are added.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/10/jsx-attributes-snippets-4-5.gif)

TypeScript 通常会使用属性的类型来判断插入哪种初始化器，但你可以在 Visual Studio Code 中自定义该行为。

![Settings in VS Code for JSX attribute completions](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/10/jsx-snippet-settings-4-5.png)

注意，该功能只在新版本的 Visual Studio Code 中支持，因此你可能需要使用 Insiders 版本。
更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/45903)。

### 为未解决类型提供更好的编辑器支持

在某些情况下，编辑器会使用一个轻量级的“部分”语义模式 - 比如编辑器正在等待加载完整的工程，又或者是 [GitHub 的基于 web 的编辑器](https://docs.github.com/en/codespaces/developing-in-codespaces/web-based-editor)。

在旧版本 TypeScript 中，如果语言服务无法找到一个类型，它会输出 `any`。

![Hovering over a signature where `Buffer` isn't found, TypeScript replaces it with `any`.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/10/quick-info-unresolved-4-4.png)

上例中，没有找到 `Buffer`，因此 TypeScript 在 *quick info* 里显示了 `any`。
在 TypeScript 4.5 中，TypeScript 会尽可能保留你编写的代码。

![Hovering over a signature where `Buffer` isn't found, it continues to use the name `Buffer`.](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/10/quick-info-unresolved-4-5.png)

然而，当你将鼠标停在 `Buffer` 上时，你会看到 TypeScript 无法找到 `Buffer` 的提示。

![TypeScript displays `type Buffer = /* unresolved */ any;`](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/10/quick-info-unresolved-on-type-4-5.png)

总之，在 TypeScript 还没有读取整个工程的时候，它提供了更加平滑的体验。
注意，在其它正常情况下，当无法找到某个类型时总会产生错误。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/45976)。

<!--
### Breaking Changes

#### `lib.d.ts` Changes

TypeScript 4.5 contains changes to its built-in declaration files which may affect your compilation;
however, [these changes were fairly minimal](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1143), and we expect most code will be unaffected.

#### Inference Changes from `Awaited`

Because `Awaited` is now used in `lib.d.ts` and as a result of `await`, you may see certain generic types change that might cause incompatibilities;
however, given many intentional design decisions around `Awaited` to avoid breakage, we expect most code will be unaffected.

#### Compiler Options Checking at the Root of `tsconfig.json`

It's an easy mistake to accidentally forget about the `compilerOptions` section in a `tsconfig.json`.
To help catch this mistake, in TypeScript 4.5, it is an error to add a top-level field which matches any of the available options in `compilerOptions` _without_ having also defined `compilerOptions` in that `tsconfig.json`.
-->
