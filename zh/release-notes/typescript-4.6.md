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

WIP.. https://devblogs.microsoft.com/typescript/announcing-typescript-4-6/
