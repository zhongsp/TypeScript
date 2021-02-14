# 实用工具类型

TypeScript 提供一些工具类型来帮助常见的类型转换。这些类型是全局可见的。

## 目录

-   [`Partial<T>`，TypeScript 2.1](#partialtype)
-   [`Readonly<Type>`，TypeScript 2.1](#readonlytype)
-   [`Record<Keys, Type>`，TypeScript 2.1](#recordkeys-type)
-   [`Pick<Type, Keys>`，TypeScript 2.1](#picktype-keys)
-   [`Omit<Type, Keys>`，TypeScript 3.5](#omittype-keys)
-   [`Exclude<Type, ExcludedUnion>`，TypeScript 2.8](#excludetype-excludedunion)
-   [`Extract<Type, Union>`，TypeScript 2.8](#extracttype-union)
-   [`NonNullable<Type>`，TypeScript 2.8](#nonnullabletype)
-   [`Parameters<Type>`](#parameterstype)
-   [`ConstructorParameters<Type>`](#constructorparameterstype)
-   [`ReturnType<Type>`，TypeScript 2.8](#returntypetype)
-   [`InstanceType<Type>`，TypeScript 2.8](#instancetypetype)
-   [`Required<Type>`，TypeScript 2.8](#requiredtype)
-   [`ThisParameterType<Type>`](#thisparametertypetype)
-   [`OmitThisParameter<Type>`](#omitthisparametertype)
-   [`ThisType<Type>`，TypeScript 2.8](#thistypetype)
-   [操作字符串的类型](#操作字符串的类型)

## `Partial<Type>`

构造类型`Type`，并将它所有的属性设置为可选的。它的返回类型表示输入类型的所有子类型。

### 例子

```typescript
interface Todo {
    title: string;
    description: string;
}

function updateTodo(todo: Todo, fieldsToUpdate: Partial<Todo>) {
    return { ...todo, ...fieldsToUpdate };
}

const todo1 = {
    title: 'organize desk',
    description: 'clear clutter',
};

const todo2 = updateTodo(todo1, {
    description: 'throw out trash',
});
```

## `Readonly<Type>`

构造类型`Type`，并将它所有的属性设置为`readonly`，也就是说构造出的类型的属性不能被再次赋值。

### 例子

```typescript
interface Todo {
    title: string;
}

const todo: Readonly<Todo> = {
    title: 'Delete inactive users',
};

todo.title = 'Hello'; // Error: cannot reassign a readonly property
```

这个工具可用来表示在运行时会失败的赋值表达式（比如，当尝试给[冻结对象](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)的属性再次赋值时）。

### `Object.freeze`

```typescript
function freeze<T>(obj: T): Readonly<T>;
```

## `Record<Keys, Type>`

构造一个类型，其属性名的类型为`K`，属性值的类型为`T`。这个工具可用来将某个类型的属性映射到另一个类型上。

### 例子

```typescript
interface PageInfo {
    title: string;
}

type Page = 'home' | 'about' | 'contact';

const x: Record<Page, PageInfo> = {
    about: { title: 'about' },
    contact: { title: 'contact' },
    home: { title: 'home' },
};
```

## `Pick<Type, Keys>`

从类型`Type`中挑选部分属性`Keys`来构造类型。

### 例子

```typescript
interface Todo {
    title: string;
    description: string;
    completed: boolean;
}

type TodoPreview = Pick<Todo, 'title' | 'completed'>;

const todo: TodoPreview = {
    title: 'Clean room',
    completed: false,
};
```

## `Omit<Type, Keys>`

从类型`Type`中获取所有属性，然后从中剔除`Keys`属性后构造一个类型。

### 例子

```typescript
interface Todo {
    title: string;
    description: string;
    completed: boolean;
}

type TodoPreview = Omit<Todo, 'description'>;

const todo: TodoPreview = {
    title: 'Clean room',
    completed: false,
};
```

## `Exclude<Type, ExcludedUnion>`

从类型`Type`中剔除所有可以赋值给`ExcludedUnion`的属性，然后构造一个类型。

### 例子

```typescript
type T0 = Exclude<'a' | 'b' | 'c', 'a'>; // "b" | "c"
type T1 = Exclude<'a' | 'b' | 'c', 'a' | 'b'>; // "c"
type T2 = Exclude<string | number | (() => void), Function>; // string | number
```

## `Extract<Type, Union>`

从类型`Type`中提取所有可以赋值给`Union`的类型，然后构造一个类型。

### 例子

```typescript
type T0 = Extract<'a' | 'b' | 'c', 'a' | 'f'>; // "a"
type T1 = Extract<string | number | (() => void), Function>; // () => void
```

## `NonNullable<Type>`

从类型`Type`中剔除`null`和`undefined`，然后构造一个类型。

### 例子

```typescript
type T0 = NonNullable<string | number | undefined>; // string | number
type T1 = NonNullable<string[] | null | undefined>; // string[]
```

## `Parameters<Type>`

由函数类型`Type`的参数类型来构建出一个元组类型。

### 例子

```ts
declare function f1(arg: { a: number; b: string }): void;

type T0 = Parameters<() => string>;
//    []
type T1 = Parameters<(s: string) => void>;
//    [s: string]
type T2 = Parameters<<T>(arg: T) => T>;
//    [arg: unknown]
type T3 = Parameters<typeof f1>;
//    [arg: { a: number; b: string; }]
type T4 = Parameters<any>;
//    unknown[]
type T5 = Parameters<never>;
//    never
type T6 = Parameters<string>;
//   never
//   Type 'string' does not satisfy the constraint '(...args: any) => any'.
type T7 = Parameters<Function>;
//   never
//   Type 'Function' does not satisfy the constraint '(...args: any) => any'.
```

## `ConstructorParameters<Type>`

由构造函数类型来构建出一个元组类型或数组类型。
由构造函数类型`Type`的参数类型来构建出一个元组类型。（若`Type`不是构造函数类型，则返回`never`）。

### 例子

```ts
type T0 = ConstructorParameters<ErrorConstructor>;
//    [message?: string | undefined]
type T1 = ConstructorParameters<FunctionConstructor>;
//    string[]
type T2 = ConstructorParameters<RegExpConstructor>;
//    [pattern: string | RegExp, flags?: string | undefined]
type T3 = ConstructorParameters<any>;
//   unknown[]

type T4 = ConstructorParameters<Function>;
//    never
// Type 'Function' does not satisfy the constraint 'new (...args: any) => any'.
```

## `ReturnType<Type>`

由函数类型`Type`的返回值类型构建一个新类型。

### 例子

```
type T0 = ReturnType<() => string>;  // string
type T1 = ReturnType<(s: string) => void>;  // void
type T2 = ReturnType<(<T>() => T)>;  // {}
type T3 = ReturnType<(<T extends U, U extends number[]>() => T)>;  // number[]
type T4 = ReturnType<typeof f1>;  // { a: number, b: string }
type T5 = ReturnType<any>;  // any
type T6 = ReturnType<never>;  // any
type T7 = ReturnType<string>;  // Error
type T8 = ReturnType<Function>;  // Error
```

## `InstanceType<Type>`

由构造函数类型`Type`的实例类型来构建一个新类型。

### 例子

```typescript
class C {
    x = 0;
    y = 0;
}

type T0 = InstanceType<typeof C>; // C
type T1 = InstanceType<any>; // any
type T2 = InstanceType<never>; // any
type T3 = InstanceType<string>; // Error
type T4 = InstanceType<Function>; // Error
```

## `Required<Type>`

构建一个类型，使类型`Type`的所有属性为`required`。
与此相反的是[`Partial`](#partialtype)。

### 例子

```typescript
interface Props {
    a?: number;
    b?: string;
}

const obj: Props = { a: 5 }; // OK

const obj2: Required<Props> = { a: 5 }; // Error: property 'b' missing
```

## `ThisParameterType<Type>`

从函数类型中提取 [this](../handbook/functions.md#this参数) 参数的类型。
若函数类型不包含 `this` 参数，则返回 [unknown](../handbook/basic-types.md#unknown) 类型。

### 例子

```ts
function toHex(this: Number) {
    return this.toString(16);
}

function numberToString(n: ThisParameterType<typeof toHex>) {
    return toHex.apply(n);
}
```

## `OmitThisParameter<Type>`

从`Type`类型中剔除 [`this`](../handbook/functions.md#this参数) 参数。
若未声明 `this` 参数，则结果类型为 `Type` 。
否则，由`Type`类型来构建一个不带`this`参数的类型。
泛型会被忽略，并且只有最后的重载签名会被采用。

### 例子

```ts
function toHex(this: Number) {
    return this.toString(16);
}

const fiveToHex: OmitThisParameter<typeof toHex> = toHex.bind(5);

console.log(fiveToHex());
```

## `ThisType<Type>`

这个工具不会返回一个转换后的类型。
它做为上下文的[`this`](../handbook/functions.md#this)类型的一个标记。
注意，若想使用此类型，必须启用`--noImplicitThis`。

### 例子

```typescript
// Compile with --noImplicitThis

type ObjectDescriptor<D, M> = {
    data?: D;
    methods?: M & ThisType<D & M>; // Type of 'this' in methods is D & M
};

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
    let data: object = desc.data || {};
    let methods: object = desc.methods || {};
    return { ...data, ...methods } as D & M;
}

let obj = makeObject({
    data: { x: 0, y: 0 },
    methods: {
        moveBy(dx: number, dy: number) {
            this.x += dx; // Strongly typed this
            this.y += dy; // Strongly typed this
        },
    },
});

obj.x = 10;
obj.y = 20;
obj.moveBy(5, 5);
```

上面例子中，`makeObject`参数里的`methods`对象具有一个上下文类型`ThisType<D & M>`，因此`methods`对象的方法里`this`的类型为`{ x: number, y: number } & { moveBy(dx: number, dy: number): number }`。

在`lib.d.ts`里，`ThisType<T>`标识接口是个简单的空接口声明。除了在被识别为对象字面量的上下文类型之外，这个接口与一般的空接口没有什么不同。

## 操作字符串的类型

为了便于操作模版字符串字面量，TypeScript 引入了一些能够操作字符串的类型。
更多详情，请阅读[模版字面量类型](/docs/handbook/2/template-literal-types.html#uppercasestringtype)。
（TODO）
