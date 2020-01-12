# TypeScript 2.8

## 有条件类型

TypeScript 2.8引入了_有条件类型_，它能够表示非统一的类型。 有条件的类型会以一个条件表达式进行类型关系检测，从而在两种类型中选择其一：

```typescript
T extends U ? X : Y
```

上面的类型意思是，若`T`能够赋值给`U`，那么类型是`X`，否则为`Y`。

有条件的类型`T extends U ? X : Y`或者_解析_为`X`，或者_解析_为`Y`，再或者_延迟_解析，因为它可能依赖一个或多个类型变量。 是否直接解析或推迟取决于：

* 首先，令`T'`和`U'`分别为`T`和`U`的实例，并将所有类型参数替换为`any`，如果`T'`不能赋值给`U'`，则将有条件的类型解析成`Y`。直观上讲，如果最宽泛的`T`的实例不能赋值给最宽泛的`U`的实例，那么我们就可以断定不存在可以赋值的实例，因此可以解析为`Y`。
* 其次，针对每个在`U`内由`推断`声明引入的类型变量，依据从`T`推断到`U`来收集一组候选类型（使用与泛型函数类型推断相同的推断算法）。对于给定的`推断`类型变量`V`，如果有候选类型是从协变的位置上推断出来的，那么`V`的类型是那些候选类型的联合。反之，如果有候选类型是从逆变的位置上推断出来的，那么`V`的类型是那些候选类型的交叉类型。否则`V`的类型是`never`。
* 然后，令`T''`为`T`的一个实例，所有`推断`的类型变量用上一步的推断结果替换，如果`T''`_明显可赋值_给`U`，那么将有条件的类型解析为`X`。除去不考虑类型变量的限制之外，_明显可赋值_的关系与正常的赋值关系一致。直观上，当一个类型明显可赋值给另一个类型，我们就能够知道它可以赋值给那些类型的_所有_实例。
* 否则，这个条件依赖于一个或多个类型变量，有条件的类型解析被推迟进行。

#### 例子

```typescript
type TypeName<T> =
    T extends string ? "string" :
    T extends number ? "number" :
    T extends boolean ? "boolean" :
    T extends undefined ? "undefined" :
    T extends Function ? "function" :
    "object";

type T0 = TypeName<string>;  // "string"
type T1 = TypeName<"a">;  // "string"
type T2 = TypeName<true>;  // "boolean"
type T3 = TypeName<() => void>;  // "function"
type T4 = TypeName<string[]>;  // "object"
```

### 分布式有条件类型

如果有条件类型里待检查的类型是`naked type parameter`，那么它也被称为“分布式有条件类型”。 分布式有条件类型在实例化时会自动分发成联合类型。 例如，实例化`T extends U ? X : Y`，`T`的类型为`A | B | C`，会被解析为`(A extends U ? X : Y) | (B extends U ? X : Y) | (C extends U ? X : Y)`。

#### 例子

```typescript
type T10 = TypeName<string | (() => void)>;  // "string" | "function"
type T12 = TypeName<string | string[] | undefined>;  // "string" | "object" | "undefined"
type T11 = TypeName<string[] | number[]>;  // "object"
```

在`T extends U ? X : Y`的实例化里，对`T`的引用被解析为联合类型的一部分（比如，`T`指向某一单个部分，在有条件类型分布到联合类型之后）。 此外，在`X`内对`T`的引用有一个附加的类型参数约束`U`（例如，`T`被当成在`X`内可赋值给`U`）。

#### 例子

```typescript
type BoxedValue<T> = { value: T };
type BoxedArray<T> = { array: T[] };
type Boxed<T> = T extends any[] ? BoxedArray<T[number]> : BoxedValue<T>;

type T20 = Boxed<string>;  // BoxedValue<string>;
type T21 = Boxed<number[]>;  // BoxedArray<number>;
type T22 = Boxed<string | number[]>;  // BoxedValue<string> | BoxedArray<number>;
```

注意在`Boxed<T>`的`true`分支里，`T`有个额外的约束`any[]`，因此它适用于`T[number]`数组元素类型。同时也注意一下有条件类型是如何分布成联合类型的。

有条件类型的分布式的属性可以方便地用来_过滤_联合类型：

```typescript
type Diff<T, U> = T extends U ? never : T;  // Remove types from T that are assignable to U
type Filter<T, U> = T extends U ? T : never;  // Remove types from T that are not assignable to U

type T30 = Diff<"a" | "b" | "c" | "d", "a" | "c" | "f">;  // "b" | "d"
type T31 = Filter<"a" | "b" | "c" | "d", "a" | "c" | "f">;  // "a" | "c"
type T32 = Diff<string | number | (() => void), Function>;  // string | number
type T33 = Filter<string | number | (() => void), Function>;  // () => void

type NonNullable<T> = Diff<T, null | undefined>;  // Remove null and undefined from T

type T34 = NonNullable<string | number | undefined>;  // string | number
type T35 = NonNullable<string | string[] | null | undefined>;  // string | string[]

function f1<T>(x: T, y: NonNullable<T>) {
    x = y;  // Ok
    y = x;  // Error
}

function f2<T extends string | undefined>(x: T, y: NonNullable<T>) {
    x = y;  // Ok
    y = x;  // Error
    let s1: string = x;  // Error
    let s2: string = y;  // Ok
}
```

有条件类型与映射类型结合时特别有用：

```typescript
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

interface Part {
    id: number;
    name: string;
    subparts: Part[];
    updatePart(newName: string): void;
}

type T40 = FunctionPropertyNames<Part>;  // "updatePart"
type T41 = NonFunctionPropertyNames<Part>;  // "id" | "name" | "subparts"
type T42 = FunctionProperties<Part>;  // { updatePart(newName: string): void }
type T43 = NonFunctionProperties<Part>;  // { id: number, name: string, subparts: Part[] }
```

与联合类型和交叉类型相似，有条件类型不允许递归地引用自己。比如下面的错误。

#### 例子

```typescript
type ElementType<T> = T extends any[] ? ElementType<T[number]> : T;  // Error
```

### 有条件类型中的类型推断

现在在有条件类型的`extends`子语句中，允许出现`infer`声明，它会引入一个待推断的类型变量。 这个推断的类型变量可以在有条件类型的true分支中被引用。 允许出现多个同类型变量的`infer`。

例如，下面代码会提取函数类型的返回值类型：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

有条件类型可以嵌套来构成一系列的匹配模式，按顺序进行求值：

```typescript
type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer U ? U :
    T extends Promise<infer U> ? U :
    T;

type T0 = Unpacked<string>;  // string
type T1 = Unpacked<string[]>;  // string
type T2 = Unpacked<() => string>;  // string
type T3 = Unpacked<Promise<string>>;  // string
type T4 = Unpacked<Promise<string>[]>;  // Promise<string>
type T5 = Unpacked<Unpacked<Promise<string>[]>>;  // string
```

下面的例子解释了在协变位置上，同一个类型变量的多个候选类型会被推断为联合类型：

```typescript
type Foo<T> = T extends { a: infer U, b: infer U } ? U : never;
type T10 = Foo<{ a: string, b: string }>;  // string
type T11 = Foo<{ a: string, b: number }>;  // string | number
```

相似地，在抗变位置上，同一个类型变量的多个候选类型会被推断为交叉类型：

```typescript
type Bar<T> = T extends { a: (x: infer U) => void, b: (x: infer U) => void } ? U : never;
type T20 = Bar<{ a: (x: string) => void, b: (x: string) => void }>;  // string
type T21 = Bar<{ a: (x: string) => void, b: (x: number) => void }>;  // string & number
```

当推断具有多个调用签名（例如函数重载类型）的类型时，用_最后_的签名（大概是最自由的包含所有情况的签名）进行推断。 无法根据参数类型列表来解析重载。

```typescript
declare function foo(x: string): number;
declare function foo(x: number): string;
declare function foo(x: string | number): string | number;
type T30 = ReturnType<typeof foo>;  // string | number
```

无法在正常类型参数的约束子语句中使用`infer`声明：

```typescript
type ReturnType<T extends (...args: any[]) => infer R> = R;  // 错误，不支持
```

但是，可以这样达到同样的效果，在约束里删掉类型变量，用有条件类型替换：

```typescript
type AnyFunction = (...args: any[]) => any;
type ReturnType<T extends AnyFunction> = T extends (...args: any[]) => infer R ? R : any;
```

### 预定义的有条件类型

TypeScript 2.8在`lib.d.ts`里增加了一些预定义的有条件类型：

* `Exclude<T, U>` -- 从`T`中剔除可以赋值给`U`的类型。
* `Extract<T, U>` -- 提取`T`中可以赋值给`U`的类型。
* `NonNullable<T>` -- 从`T`中剔除`null`和`undefined`。
* `ReturnType<T>` -- 获取函数返回值类型。
* `InstanceType<T>` -- 获取构造函数类型的实例类型。

#### Example

```typescript
type T00 = Exclude<"a" | "b" | "c" | "d", "a" | "c" | "f">;  // "b" | "d"
type T01 = Extract<"a" | "b" | "c" | "d", "a" | "c" | "f">;  // "a" | "c"

type T02 = Exclude<string | number | (() => void), Function>;  // string | number
type T03 = Extract<string | number | (() => void), Function>;  // () => void

type T04 = NonNullable<string | number | undefined>;  // string | number
type T05 = NonNullable<(() => string) | string[] | null | undefined>;  // (() => string) | string[]

function f1(s: string) {
    return { a: 1, b: s };
}

class C {
    x = 0;
    y = 0;
}

type T10 = ReturnType<() => string>;  // string
type T11 = ReturnType<(s: string) => void>;  // void
type T12 = ReturnType<(<T>() => T)>;  // {}
type T13 = ReturnType<(<T extends U, U extends number[]>() => T)>;  // number[]
type T14 = ReturnType<typeof f1>;  // { a: number, b: string }
type T15 = ReturnType<any>;  // any
type T16 = ReturnType<never>;  // any
type T17 = ReturnType<string>;  // Error
type T18 = ReturnType<Function>;  // Error

type T20 = InstanceType<typeof C>;  // C
type T21 = InstanceType<any>;  // any
type T22 = InstanceType<never>;  // any
type T23 = InstanceType<string>;  // Error
type T24 = InstanceType<Function>;  // Error
```

> 注意：`Exclude`类型是[建议的](https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-307871458)`Diff`类型的一种实现。我们使用`Exclude`这个名字是为了避免破坏已经定义了`Diff`的代码，并且我们感觉这个名字能更好地表达类型的语义。我们没有增加`Omit<T, K>`类型，因为它可以很容易的用`Pick<T, Exclude<keyof T, K>>`来表示。

## 改进对映射类型修饰符的控制

映射类型支持在属性上添加`readonly`或`?`修饰符，但是它们不支持_移除_修饰符。 这对于[_同态映射类型_](https://github.com/Microsoft/TypeScript/pull/12563)有些影响，因为同态映射类型默认保留底层类型的修饰符。

TypeScript 2.8为映射类型增加了增加或移除特定修饰符的能力。 特别地，映射类型里的`readonly`或`?`属性修饰符现在可以使用`+`或`-`前缀，来表示修饰符是添加还是移除。

#### 例子

```typescript
type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] };  // 移除readonly和?
type ReadonlyPartial<T> = { +readonly [P in keyof T]+?: T[P] };  // 添加readonly和?
```

不带`+`或`-`前缀的修饰符与带`+`前缀的修饰符具有相同的作用。因此上面的`ReadonlyPartial<T>`类型与下面的一致

```typescript
type ReadonlyPartial<T> = { readonly [P in keyof T]?: T[P] };  // 添加readonly和?
```

利用这个特性，`lib.d.ts`现在有了一个新的`Required<T>`类型。 它移除了`T`的所有属性的`?`修饰符，因此所有属性都是必需的。

#### 例子

```typescript
type Required<T> = { [P in keyof T]-?: T[P] };
```

注意在`--strictNullChecks`模式下，当同态映射类型移除了属性底层类型的`?`修饰符，它同时也移除了那个属性上的`undefined`类型：

#### 例子

```typescript
type Foo = { a?: string };  // 等同于 { a?: string | undefined }
type Bar = Required<Foo>;  // 等同于 { a: string }
```

## 改进交叉类型上的`keyof`

TypeScript 2.8作用于交叉类型的`keyof`被转换成作用于交叉成员的`keyof`的联合。 换句话说，`keyof (A & B)`会被转换成`keyof A | keyof B`。 这个改动应该能够解决`keyof`表达式推断不一致的问题。

#### 例子

```typescript
type A = { a: string };
type B = { b: string };

type T1 = keyof (A & B);  // "a" | "b"
type T2<T> = keyof (T & B);  // keyof T | "b"
type T3<U> = keyof (A & U);  // "a" | keyof U
type T4<T, U> = keyof (T & U);  // keyof T | keyof U
type T5 = T2<A>;  // "a" | "b"
type T6 = T3<B>;  // "a" | "b"
type T7 = T4<A, B>;  // "a" | "b"
```

## 更好的处理`.js`文件中的命名空间模式

TypeScript 2.8加强了识别`.js`文件里的命名空间模式。 JavaScript顶层的空对象字面量声明，就像函数和类，会被识别成命名空间声明。

```javascript
var ns = {};     // recognized as a declaration for a namespace `ns`
ns.constant = 1; // recognized as a declaration for var `constant`
```

顶层的赋值应该有一致的行为；也就是说，`var`或`const`声明不是必需的。

```javascript
app = {}; // does NOT need to be `var app = {}`
app.C = class {
};
app.f = function() {
};
app.prop = 1;
```

### 立即执行的函数表达式做为命名空间

立即执行的函数表达式返回一个函数，类或空的对象字面量，也会被识别为命名空间：

```javascript
var C = (function () {
  function C(n) {
    this.p = n;
  }
  return C;
})();
C.staticProperty = 1;
```

### 默认声明

“默认声明”允许引用了声明的名称的初始化器出现在逻辑或的左边：

```javascript
my = window.my || {};
my.app = my.app || {};
```

### 原型赋值

你可以把一个对象字面量直接赋值给原型属性。独立的原型赋值也可以：

```typescript
var C = function (p) {
  this.p = p;
};
C.prototype = {
  m() {
    console.log(this.p);
  }
};
C.prototype.q = function(r) {
  return this.p === r;
};
```

### 嵌套与合并声明

现在嵌套的层次不受限制，并且多文件之间的声明合并也没有问题。以前不是这样的。

```javascript
var app = window.app || {};
app.C = class { };
```

## 各文件的JSX工厂

TypeScript 2.8增加了使用`@jsx dom`指令为每个文件设置JSX工厂名。 JSX工厂也可以使用`--jsxFactory`编译参数设置（默认值为`React.createElement`）。TypeScript 2.8你可以基于文件进行覆写。

#### 例子

```typescript
/** @jsx dom */
import { dom } from "./renderer"
<h></h>
```

生成：

```javascript
var renderer_1 = require("./renderer");
renderer_1.dom("h", null);
```

## 本地范围的JSX命名空间

JSX类型检查基于JSX命名空间里的定义，比如`JSX.Element`用于JSX元素的类型，`JSX.IntrinsicElements`用于内置的元素。 在TypeScript 2.8之前`JSX`命名空间被视为全局命名空间，并且一个工程只允许存在一个。 TypeScript 2.8开始，`JSX`命名空间将在`jsxNamespace`下面查找（比如`React`），允许在一次编译中存在多个jsx工厂。 为了向后兼容，全局的`JSX`命名空间被当做回退选项。 使用独立的`@jsx`指令，每个文件可以有自己的JSX工厂。

## 新的`--emitDeclarationsOnly`

`--emitDeclarationsOnly`允许_仅_生成声明文件；使用这个标记`.js`/`.jsx`输出会被跳过。当使用其它的转换工具如Babel处理`.js`输出的时候，可以使用这个标记。

