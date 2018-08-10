# TypeScript 3.0

## 工程引用

TypeScript 3.0 引入了一个叫做工程引用的新概念。工程引用允许TypeScript工程依赖于其它TypeScript工程 - 特别要提的是允许`tsconfig.json`文件引用其它`tsconfig.json`文件。当指明了这些依赖后，就可以方便地将代码分割成单独的小工程，有助于TypeScript（以及周边的工具）了解构建顺序和输出结构。

TypeScript 3.0 还引入了一种新的`tsc`模式，即`--build`标记，它与工程引用同时运用可以加速构建TypeScript。

相关详情请阅读[工程引用手册](../handbook/Project%20References.md)。

## 剩余参数和展开表达式里的元组

TypeScript 3.0 增加了支持以元组类型与函数参数列表进行交互的能力。
如下：

* [将带有元组类型的剩余参数扩展为离散参数](#rest-parameters-with-tuple-types)
* [将带有元组类型的展开表达式扩展为离散参数](#spread-expressions-with-tuple-types)
* [泛型剩余参数以及相应的元组类型推断](#generic-rest-parameters)
* [元组类型里的可选元素](#optional-elements-in-tuple-types)
* [元组类型里的剩余元素](#rest-elements-in-tuple-types)

有了这些特性后，便有可能将转换函数和它们参数列表的高阶函数变为强类型的。

### <a name="rest-parameters-with-tuple-types"></a>带元组类型的剩余参数

当剩余参数里有元组类型时，元组类型被扩展为离散参数序列。
例如，如下两个声明是等价的：

```ts
declare function foo(...args: [number, string, boolean]): void;
```

```ts
declare function foo(args_0: number, args_1: string, args_2: boolean): void;
```

### <a name="spread-expressions-with-tuple-types"></a>带有元组类型的展开表达式

在函数调用中，若最后一个参数是元组类型的展开表达式，那么这个展开表达式相当于元组元素类型的离散参数序列。

因此，下面的调用都是等价的：

```ts
const args: [number, string, boolean] = [42, "hello", true];
foo(42, "hello", true);
foo(args[0], args[1], args[2]);
foo(...args);
```

### <a name="generic-rest-parameters"></a>泛型剩余参数

剩余参数允许带有泛型类型，这个泛型类型被限制为是一个数组类型，类型推断系统能够推断这类泛型剩余参数里的元组类型。这样就可以进行高阶捕获和展开部分参数列表:

#### 例子

```ts
declare function bind<T, U extends any[], V>(f: (x: T, ...args: U) => V, x: T): (...args: U) => V;

declare function f3(x: number, y: string, z: boolean): void;

const f2 = bind(f3, 42);  // (y: string, z: boolean) => void
const f1 = bind(f2, "hello");  // (z: boolean) => void
const f0 = bind(f1, true);  // () => void

f3(42, "hello", true);
f2("hello", true);
f1(true);
f0();
```

上例的`f2`声明，类型推断可以推断出`number`，`[string, boolean]`和`void`做为`T`，`U`和`V`。

注意，如果元组类型是从参数序列中推断出来的，之后又扩展成参数列表，就像`U`那样，原来的参数名称会被用在扩展中（然而，这个名字没有语义上的意义且是察觉不到的）。

### <a name="optional-elements-in-tuple-types"></a>元组类型里的可选元素

元组类型现在允许在其元素类型上使用`?`后缀，表示这个元素是可选的：

#### 例子

```ts
let t: [number, string?, boolean?];
t = [42, "hello", true];
t = [42, "hello"];
t = [42];
```

在`--strictNullChecks`模式下，`?`修饰符会自动地在元素类型中包含`undefined`，类似于可选参数。

在元组类型的一个元素类型上使用`?`后缀修饰符来把它标记为可忽略的元素，且它右侧所有元素也同时带有了`?`修饰符。

当剩余参数推断为元组类型时，源码中的可选参数在推断出的类型里成为了可选元组元素。

带有可选元素的元组类型的`length`属性是表示可能长度的数字字面量类型的联合类型。
例如，`[number, string?, boolean?]`元组类型的`length`属性的类型是`1 | 2 | 3`。

### <a name="rest-elements-in-tuple-types"></a>元组类型里的剩余元素

元组类型里最后一个元素可以是剩余元素，形式为`...X`，这里`X`是数组类型。
剩余元素代表元组类型是开放的，可以有零个或多个额外的元素。
例如，`[number, ...string[]]`表示带有一个`number`元素和任意数量`string`类型元素的元组类型。

#### 例子

```ts
function tuple<T extends any[]>(...args: T): T {
    return args;
}

const numbers: number[] = getArrayOfNumbers();
const t1 = tuple("foo", 1, true);  // [string, number, boolean]
const t2 = tuple("bar", ...numbers);  // [string, ...number[]]
```

这个带有剩余元素的元组类型的`length`属性类型是`number`。

## 新的`unknown`类型

TypeScript 3.0引入了一个顶级的`unknown`类型。
对照于`any`，`unknown`是类型安全的。
任何值都可以赋给`unknown`，但是当没有类型断言或基于控制流的类型细化时`unknown`不可以赋值给其它类型，除了它自己和`any`外。
同样地，在`unknown`没有被断言或细化到一个确切类型之前，是不允许在其上进行任何操作的。

### 例子

```ts
// In an intersection everything absorbs unknown

type T00 = unknown & null;  // null
type T01 = unknown & undefined;  // undefined
type T02 = unknown & null & undefined;  // null & undefined (which becomes never)
type T03 = unknown & string;  // string
type T04 = unknown & string[];  // string[]
type T05 = unknown & unknown;  // unknown
type T06 = unknown & any;  // any

// In a union an unknown absorbs everything

type T10 = unknown | null;  // unknown
type T11 = unknown | undefined;  // unknown
type T12 = unknown | null | undefined;  // unknown
type T13 = unknown | string;  // unknown
type T14 = unknown | string[];  // unknown
type T15 = unknown | unknown;  // unknown
type T16 = unknown | any;  // any

// Type variable and unknown in union and intersection

type T20<T> = T & {};  // T & {}
type T21<T> = T | {};  // T | {}
type T22<T> = T & unknown;  // T
type T23<T> = T | unknown;  // unknown

// unknown in conditional types

type T30<T> = unknown extends T ? true : false;  // Deferred
type T31<T> = T extends unknown ? true : false;  // Deferred (so it distributes)
type T32<T> = never extends T ? true : false;  // true
type T33<T> = T extends never ? true : false;  // Deferred

// keyof unknown

type T40 = keyof any;  // string | number | symbol
type T41 = keyof unknown;  // never

// Only equality operators are allowed with unknown

function f10(x: unknown) {
    x == 5;
    x !== 10;
    x >= 0;  // Error
    x + 1;  // Error
    x * 2;  // Error
    -x;  // Error
    +x;  // Error
}

// No property accesses, element accesses, or function calls

function f11(x: unknown) {
    x.foo;  // Error
    x[5];  // Error
    x();  // Error
    new x();  // Error
}

// typeof, instanceof, and user defined type predicates

declare function isFunction(x: unknown): x is Function;

function f20(x: unknown) {
    if (typeof x === "string" || typeof x === "number") {
        x;  // string | number
    }
    if (x instanceof Error) {
        x;  // Error
    }
    if (isFunction(x)) {
        x;  // Function
    }
}

// Homomorphic mapped type over unknown

type T50<T> = { [P in keyof T]: number };
type T51 = T50<any>;  // { [x: string]: number }
type T52 = T50<unknown>;  // {}

// Anything is assignable to unknown

function f21<T>(pAny: any, pNever: never, pT: T) {
    let x: unknown;
    x = 123;
    x = "hello";
    x = [1, 2, 3];
    x = new Error();
    x = x;
    x = pAny;
    x = pNever;
    x = pT;
}

// unknown assignable only to itself and any

function f22(x: unknown) {
    let v1: any = x;
    let v2: unknown = x;
    let v3: object = x;  // Error
    let v4: string = x;  // Error
    let v5: string[] = x;  // Error
    let v6: {} = x;  // Error
    let v7: {} | null | undefined = x;  // Error
}

// Type parameter 'T extends unknown' not related to object

function f23<T extends unknown>(x: T) {
    let y: object = x;  // Error
}

// Anything but primitive assignable to { [x: string]: unknown }

function f24(x: { [x: string]: unknown }) {
    x = {};
    x = { a: 5 };
    x = [1, 2, 3];
    x = 123;  // Error
}

// Locals of type unknown always considered initialized

function f25() {
    let x: unknown;
    let y = x;
}

// Spread of unknown causes result to be unknown

function f26(x: {}, y: unknown, z: any) {
    let o1 = { a: 42, ...x };  // { a: number }
    let o2 = { a: 42, ...x, ...y };  // unknown
    let o3 = { a: 42, ...x, ...y, ...z };  // any
}

// Functions with unknown return type don't need return expressions

function f27(): unknown {
}

// Rest type cannot be created from unknown

function f28(x: unknown) {
    let { ...a } = x;  // Error
}

// Class properties of type unknown don't need definite assignment

class C1 {
    a: string;  // Error
    b: unknown;
    c: any;
}
```

## 在JSX里支持`defaultProps`

TypeScript 2.9和之前的版本不支持在JSX组件里使用[React的`defaultProps`](https://reactjs.org/docs/typechecking-with-proptypes.html#default-prop-values)声明。
用户通常不得不将属性声明为可选的，然后在`render`里使用非`null`的断言，或者在导出之前对组件的类型使用类型断言。

TypeScript 3.0在`JSX`命名空间里支持一个新的类型别名`LibraryManagedAttributes`。
这个助手类型定义了在检查JSX表达式之前在组件`Props`上的一个类型转换；因此我们可以进行定制：如何处理提供的`props`与推断`props`之间的冲突，推断如何映射，如何处理可选性以及不同位置的推断如何结合在一起。

我们可以利用它来处理React的`defaultProps`以及`propTypes`。

```tsx
export interface Props {
    name: string;
}

export class Greet extends React.Component<Props> {
    render() {
        const { name } = this.props;
        return <div>Hello ${name.toUpperCase()}!</div>;
    }
    static defaultProps = { name: "world"};
}

// Type-checks! No type assertions needed!
let el = <Greet />
```

### 说明

#### `defaultProps`的确切类型

默认类型是从`defaultProps`属性的类型推断而来。如果添加了显式的类型注释，比如`static defaultProps: Partial<Props>;`，编译器无法识别哪个属性具有默认值（因为`defaultProps`类型包含了`Props`的所有属性）。

使用`static defaultProps: Pick<Props, "name">;`做为显式的类型注释，或者不添加类型注释。

对于无状态的函数式组件（SFCs），使用ES2015默认的初始化器：

```tsx
function Greet({ name = "world" }: Props) {
    return <div>Hello ${name.toUpperCase()}!</div>;
}
```

#### `@types/React`的改动

仍需要在`@types/React`里`JSX`命名空间上添加`LibraryManagedAttributes`定义。

## `/// <reference lib="..." />`指令

TypeScript增加了一个新的三斜线指令（`/// <reference lib="name" />`），允许一个文件显式地包含一个已知的内置_lib_文件。

内置的_lib_文件的引用和_tsconfig.json_里的编译器选项`"lib"`相同（例如，使用`lib="es2015"`而不是`lib="lib.es2015.d.ts"`等）。

当你写的声明文件依赖于内置类型时，例如DOM APIs或内置的JS运行时构造函数如`Symbol`或`Iterable`，推荐使用三斜线引用指令。之前，这个`.d.ts`文件不得不添加重覆的类型声明。

### 例子

在某个文件里使用 `/// <reference lib="es2017.string" />`等同于指定`--lib es2017.string`编译选项。

```ts
/// <reference lib="es2017.string" />

"foo".padStart(4);
```
