# TypeScript 4.6

### 允许在构造函数中的 `super()` 调用之前插入代码

在 JavaScript 的类中，在引用 `this` 之前必须先调用 `super()`。
在 TypeScript 中同样有这个限制，只不过在检查时过于严格。
在之前版本的 TypeScript 中，如果类中存在**属性初始化器**，
那么在构造函数里，在 `super()` 调用之前不允许出现任何其它代码。

```ts
class Base {
    // ...
}

class Derived extends Base {
    someProperty = true;

    constructor() {
        // 错误！
        // 必须先调用 'super()' 因为需要初始化 'someProperty'。
        doSomeStuff();
        super();
    }
}
```

这样做是因为程序实现起来容易，但这样做也会拒绝很多合法的代码。
TypeScript 4.6 放宽了限制，它允许在 `super()` 之前出现其它代码，
与此同时仍然会检查在引用 `this` 之前顶层的`super()` 已经被调用。

感谢 [Joshua Goldberg](https://github.com/JoshuaKGoldberg) 的 [PR](https://github.com/microsoft/TypeScript/pull/29374)。

### 基于控制流来分析解构的可辨识联合类型

TypeScript 可以根据判别式属性来细化类型。
例如，在下面的代码中，TypeScript 能够在检查 `kind` 的类型后细化 `action` 的类型。

```ts
type Action =
    | { kind: "NumberContents", payload: number }
    | { kind: "StringContents", payload: string };

function processAction(action: Action) {
    if (action.kind === "NumberContents") {
        // `action.payload` is a number here.
        let num = action.payload * 2
        // ...
    }
    else if (action.kind === "StringContents") {
        // `action.payload` is a string here.
        const str = action.payload.trim();
        // ...
    }
}
```

这样就可以使用持有不同数据的对象，但通过共同的字段来区分它们。

这在 TypeScript 是很常见的；然而，根据个人的喜好，你可能想对上例中的 `kind` 和 `payload` 进行解构。
就像下面这样：

```ts
type Action =
    | { kind: "NumberContents", payload: number }
    | { kind: "StringContents", payload: string };

function processAction(action: Action) {
    const { kind, payload } = action;
    if (kind === "NumberContents") {
        let num = payload * 2
        // ...
    }
    else if (kind === "StringContents") {
        const str = payload.trim();
        // ...
    }
}
```

此前，TypeScript 会报错 - 当 `kind` 和 `payload` 是由同一个对象解构为变量时，它们会被独立对待。

在 TypeScript 4.6 中可以正常工作！

当解构独立的属性为 const 声明，或当解构参数到变量且没有重新赋值时，TypeScript 会检查被解构的类型是否为可辨识联合。
如果是的话，TypeScript 就能够根据类型检查来细化变量的类型。
因此上例中，通过检查 `kind` 的类型可以细化 `payload` 的类型。

更多详情请查看 [PR](https://github.com/microsoft/TypeScript/pull/46266)。

### 改进的递归深度检查

TypeScript 要面对一些有趣的挑战，因为它是构建在结构化类型系统之上，同时又支持了泛型。

在结构化类型系统中，对象类型的兼容性是由对象包含的成员决定的。

```ts
interface Source {
    prop: string;
}

interface Target {
    prop: number;
}

function check(source: Source, target: Target) {
    target = source;
    // error!
    // Type 'Source' is not assignable to type 'Target'.
    //   Types of property 'prop' are incompatible.
    //     Type 'string' is not assignable to type 'number'.
}
```

`Source` 与 `Target` 的兼容性取决于它们的*属性*是否可以执行赋值操作。
此例中是指 `prop` 属性。

当引入了泛型后，有一些难题需要解决。
例如，下例中的 `Source<string>` 是否可以赋值给 `Target<number>`？

```ts
interface Source<T> {
    prop: Source<Source<T>>;
}

interface Target<T> {
    prop: Target<Target<T>>;
}

function check(source: Source<string>, target: Target<number>) {
    target = source;
}
```

要想回答这个问题，TypeScript 需要检查 `prop` 的类型是否兼容。
这又要回答另一个问题：`Source<Source<string>>` 是否能够赋值给 `Target<Target<number>>`？
要想回答这个问题，TypeScript 需要检查 `prop` 的类型是否与那些类型兼容，
结果就是还要检查 `Source<Source<Source<string>>>` 是否能够赋值给 `Target<Target<Target<number>>>`？
继续发展下去，就会注意到类型会进行无限展开。

TypeScript 使用了启发式的算法 - 当一个类型达到特定的检查深度时，它表现出了将会进行无限展开，
那么就认为它*可能*是兼容的。
通常情况下这是没问题的，但是也可能出现漏报的情况。

```ts
interface Foo<T> {
    prop: T;
}

declare let x: Foo<Foo<Foo<Foo<Foo<Foo<string>>>>>>;
declare let y: Foo<Foo<Foo<Foo<Foo<string>>>>>;

x = y;
```

通过人眼观察我们知道上例中的 `x` 和 `y` 是不兼容的。
虽然类型的嵌套层次很深，但人家就是这样声明的。
启发式算法要处理的是在探测类型过程中生成的深层次嵌套类型，而非程序员明确手写出的类型。

TypeScript 4.6 现在能够区分出这类情况，并且对上例进行正确的错误提示。
此外，由于不再担心会对明确书写的类型进行误报，
TypeScript 能够更容易地判断类型的无限展开，
并且降低了类型兼容性检查的成本。
因此，像 DefinitelyTyped 上的 `redux-immutable` 、 `react-lazylog` 和 `yup`
代码库，对它们的类型检查时间降低了 50%。

你可能已经体验过这个改动了，因为它被挑选合并到了 TypeScript 4.5.3 中，
但它仍然是 TypeScript 4.6 中值得关注的一个特性。
更多详情请阅读 [PR](https://github.com/microsoft/TypeScript/pull/46599)。

### 索引访问类型推断改进

TypeScript 现在能够正确地推断通过索引访问到另一个映射对象类型的类型。

```ts
interface TypeMap {
    "number": number;
    "string": string;
    "boolean": boolean;
}

type UnionRecord<P extends keyof TypeMap> = { [K in P]:
    {
        kind: K;
        v: TypeMap[K];
        f: (p: TypeMap[K]) => void;
    }
}[P];

function processRecord<K extends keyof TypeMap>(record: UnionRecord<K>) {
    record.f(record.v);
}

// 这个调用之前是有问题的，但现在没有问题
processRecord({
    kind: "string",
    v: "hello!",

    // 'val' 之前会隐式地获得类型 'string | number | boolean'，
    // 但现在会正确地推断为类型 'string'。
    f: val => {
        console.log(val.toUpperCase());
    }
})
```

该模式已经被支持了并允许 TypeScript 判断 `record.f(record.v)` 调用是合理的，
但是在以前，`processRecord` 调用中对 `val` 的类型推断并不好。

TypeScript 4.6 改进了这个情况，因此在启用 `processRecord` 时不再需要使用类型断言。

更多详情请阅读 [PR](https://github.com/microsoft/TypeScript/pull/47109)。

### 对因变参数的控制流分析

函数签名可以声明为剩余参数且其类型可以为可辨识联合元组类型。

```ts
function func(...args: ["str", string] | ["num", number]) {
    // ...
}
```

这意味着 `func` 的实际参数完全依赖于第一个实际参数。
若第一个参数为字符串 `"str"` 时，则第二个参数为 `string` 类型。
若第一个参数为字符串 `"num"` 时，则第二个参数为 `number` 类型。

像这样 TypeScript 是由签名来推断函数类型时，TypeScript 能够根据依赖的参数来细化类型。

```ts
type Func = (...args: ["a", number] | ["b", string]) => void;

const f1: Func = (kind, payload) => {
    if (kind === "a") {
        payload.toFixed();  // 'payload' narrowed to 'number'
    }
    if (kind === "b") {
        payload.toUpperCase();  // 'payload' narrowed to 'string'
    }
};

f1("a", 42);
f1("b", "hello");
```

更多详情请阅读 [PR](https://github.com/microsoft/TypeScript/pull/47190)。

### --target es2022

TypeScript 的 `--target` 编译选项现在支持使用 `es2022`。
这意味着像类字段这样的特性能够稳定地在输出结果中保留。
这也意味着像 [Arrays 的上 at() 和 Object.hasOwn 方法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
或者 [new Error 时的 `cause` 选项](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error#rethrowing_an_error_with_a_cause)
可以通过设置新的 `--target` 或者 `--lib es2022` 来使用。

感谢 [Kagami Sascha Rosylight (saschanaz)](https://github.com/saschanaz) 的[实现](https://github.com/microsoft/TypeScript/pull/46291)。

### 删除 react-jsx 中不必要的参数

在以前，当使用 `--jsx react-jsx` 来编译如下的代码时

```ts
export const el = <div>foo</div>;
```

TypeScript 会生成如下的 JavaScript 代码：

```ts
import { jsx as _jsx } from "react/jsx-runtime";
export const el = _jsx("div", { children: "foo" }, void 0);
```

末尾的 `void 0` 参数是没用的，删掉它会减小打包的体积。

感谢 [https://github.com/a-tarasyuk](https://github.com/a-tarasyuk) 的 [PR](https://github.com/microsoft/TypeScript/pull/47467)，TypeScript 4.6 会删除 `void 0` 参数。

### JSDoc 命名建议

在 JSDoc 里，你可以用 `@param` 标签来文档化参数。

```js
/**
 * @param x The first operand
 * @param y The second operand
 */
function add(x, y) {
    return x + y;
}
```

但是，如果这些注释已经过时了会发生什么？就比如，我们将 `x` 和 `y` 重命名为 `a` 和 `b`？

```js
/**
 * @param x {number} The first operand
 * @param y {number} The second operand
 */
function add(a, b) {
    return a + b;
}
```

在之前 TypeScript 仅会在对 JavaScript 文件执行类型检查时报告这个问题 - 通过
使用 `checkJs` 选项，或者在文件顶端添加 `// @ts-check` 注释。

现在，你能够在编译器中的 TypeScript 文件上看到类似的提示！
TypeScript 现在会给出建议，如果函数签名中的参数名与 JSDoc 中的参数名不一致。

![example](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2022/02/jsdoc-comment-suggestions-4-6.png)

该[改动](https://github.com/microsoft/TypeScript/pull/47257)是由 [Alexander Tarasyuk](https://github.com/a-tarasyuk) 提供的！

### JavaScript 中更多的语法和绑定错误提示

TypeScript 将更多的语法和绑定错误检查应用到了 JavaScript 文件上。
如果你在 Visual Studio 或 Visual Studio Code 这样的编辑器中打开 JavaScript 文件时就会看到这些新的错误提示，
或者当你使用 TypeScript 编译器来处理 JavaScript 文件时 - 即便你没有打开 `checkJs` 或者添加 `// @ts-check` 注释。

做为例子，如果在 JavaScript 文件中的同一个作用域中有两个同名的 `const` 声明，
那么 TypeScript 会报告一个错误。

```js
const foo = 1234;
//    ~~~
// error: Cannot redeclare block-scoped variable 'foo'.

// ...

const foo = 5678;
//    ~~~
// error: Cannot redeclare block-scoped variable 'foo'.
```

另外一个例子，TypeScript 会报告修饰符是否被正确地使用了。

```js
function container() {
    export function foo() {
//  ~~~~~~
// error: Modifiers cannot appear here.

    }
}
```

这些检查可以通过在文件顶端添加 `// @ts-nocheck` 注释来禁用，
但是我们很想听听在大家的 JavaScript 工作流中使用该特性的反馈。
你可以在 Visual Studio Code 安装 [TypeScript 和 JavaScript Nightly 扩展](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) 来提前体验，
并阅读 [PR1](https://github.com/microsoft/TypeScript/pull/47067) 和 [PR1](https://github.com/microsoft/TypeScript/pull/47075)。

### TypeScript Trace 分析器

有人偶尔会遇到创建和比较类型时很耗时的情况。
TypeScript 提供了一个 [`--generateTrace`](https://github.com/microsoft/TypeScript/wiki/Performance#performance-tracing) 选项来帮助识别耗时的类型，
或者帮助诊断 TypeScript 编译器中的问题。
虽说由 `--generateTrace` 生成的信息是非常有帮助的（尤其是在 TypeScript 4.6 的改进后），
但是阅读这些 trace 信息是比较难的。

近期，我们发布了 [@typescript/analyze-trace](https://www.npmjs.com/package/@typescript/analyze-trace) 工具来帮助阅读这些信息。
虽说我们不认为每个人都需要使用 `analyze-trace`，但是我们认为它会为遇到了 [TypeScript 构建性能](https://github.com/microsoft/TypeScript/wiki/Performance)问题的团队提供帮助。

更多详情请查看 [repo](https://github.com/microsoft/typescript-analyze-trace)。
