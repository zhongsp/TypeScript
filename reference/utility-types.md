# 实用工具类型

TypeScript提供一些工具类型来帮助常见的类型转换。这些类型是全局可见的。

## 目录

* [`Partial<T>`，TypeScript 2.1](utility-types.md#partialt)
* [`Readonly<T>`，TypeScript 2.1](utility-types.md#readonlyt)
* [`Record<K,T>`，TypeScript 2.1](utility-types.md#recordkt)
* [`Pick<T,K>`，TypeScript 2.1](utility-types.md#picktk)
* [`Omit<T,K>`](utility-types.md#omittk)
* [`Exclude<T,U>`，TypeScript 2.8](utility-types.md#excludetu)
* [`Extract<T,U>`，TypeScript 2.8](utility-types.md#extracttu)
* [`NonNullable<T>`，TypeScript 2.8](utility-types.md#nonnullablet)
* [`ReturnType<T>`，TypeScript 2.8](utility-types.md#returntypet)
* [`InstanceType<T>`，TypeScript 2.8](utility-types.md#instancetypet)
* [`Required<T>`，TypeScript 2.8](utility-types.md#requiredt)
* [`ThisType<T>`，TypeScript 2.8](utility-types.md#thistypet)

## `Partial<T>`

构造类型`T`，并将它所有的属性设置为可选的。它的返回类型表示输入类型的所有子类型。

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

## `Readonly<T>`

构造类型`T`，并将它所有的属性设置为`readonly`，也就是说构造出的类型的属性不能被再次赋值。

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

## `Record<K,T>`

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

## `Pick<T,K>`

从类型`T`中挑选部分属性`K`来构造类型。

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

## `Omit<T,K>`

从类型`T`中获取所有属性，然后从中剔除`K`属性后构造一个类型。

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

## `Exclude<T,U>`

从类型`T`中剔除所有可以赋值给`U`的属性，然后构造一个类型。

### 例子

```typescript
type T0 = Exclude<"a" | "b" | "c", "a">;  // "b" | "c"
type T1 = Exclude<"a" | "b" | "c", "a" | "b">;  // "c"
type T2 = Exclude<string | number | (() => void), Function>;  // string | number
```

## `Extract<T,U>`

从类型`T`中提取所有可以赋值给`U`的类型，然后构造一个类型。

### 例子

```typescript
type T0 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"
type T1 = Extract<string | number | (() => void), Function>;  // () => void
```

## `NonNullable<T>`

从类型`T`中剔除`null`和`undefined`，然后构造一个类型。

### 例子

```typescript
type T0 = NonNullable<string | number | undefined>;  // string | number
type T1 = NonNullable<string[] | null | undefined>;  // string[]
```

## `ReturnType<T>`

由函数类型`T`的返回值类型构造一个类型。

### 例子

```typescript
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

## `InstanceType<T>`

由构造函数类型`T`的实例类型构造一个类型。

### 例子

```typescript
class C {
    x = 0;
    y = 0;
}

type T0 = InstanceType<typeof C>;  // C
type T1 = InstanceType<any>;  // any
type T2 = InstanceType<never>;  // any
type T3 = InstanceType<string>;  // Error
type T4 = InstanceType<Function>;  // Error
```

## `Required<T>`

构造一个类型，使类型`T`的所有属性为`required`。

### 例子

```typescript
interface Props {
    a?: number;
    b?: string;
};

const obj: Props = { a: 5 }; // OK

const obj2: Required<Props> = { a: 5 }; // Error: property 'b' missing
```

## `ThisType<T>`

这个工具不会返回一个转换后的类型。它做为上下文的`this`类型的一个标记。注意，若想使用此类型，必须启用`--noImplicitThis`。

### 例子

```typescript
// Compile with --noImplicitThis

type ObjectDescriptor<D, M> = {
    data?: D;
    methods?: M & ThisType<D & M>;  // Type of 'this' in methods is D & M
}

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
    let data: object = desc.data || {};
    let methods: object = desc.methods || {};
    return { ...data, ...methods } as D & M;
}

let obj = makeObject({
    data: { x: 0, y: 0 },
    methods: {
        moveBy(dx: number, dy: number) {
            this.x += dx;  // Strongly typed this
            this.y += dy;  // Strongly typed this
        }
    }
});

obj.x = 10;
obj.y = 20;
obj.moveBy(5, 5);
```

上面例子中，`makeObject`参数里的`methods`对象具有一个上下文类型`ThisType<D & M>`，因此`methods`对象的方法里`this`的类型为`{ x: number, y: number } & { moveBy(dx: number, dy: number): number }`。

在`lib.d.ts`里，`ThisType<T>`标识接口是个简单的空接口声明。除了在被识别为对象字面量的上下文类型之外，这个接口与一般的空接口没有什么不同。

