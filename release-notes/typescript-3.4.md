# TypeScript 3.4

## 使用 `--incremental` 标志加快后续构建

TypeScript 3.4 引入了一个名为 `--incremental` 的新标志，它告诉 TypeScript 从上一次编译中保存有关项目图的信息。

下次使用 `--incremental` 调用 TypeScript 时，它将使用该信息来检测类型检查和生成对项目更改成本最低的方法。

```text
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "outDir": "./lib"
  },
  "include": ["./src"]
}
```

默认使用这些设置，当我们运行 `tsc` 时，TypeScript 将在输出目录（`./lib`）中查找名为 `.tsbuildinfo` 的文件。 如果 `./lib/.tsbuildinfo` 不存在，它将被生成。 但如果存在，`tsc` 将尝试使用该文件逐步进行类型检查并更新输出文件。

这些 `.tsbuildinfo` 文件可以安全地删除，并且在运行时对我们的代码没有任何影响——它们纯粹用于更快地编译。 我们也可以将它们命名为我们想要的任何名字，并使用 `--tsBuildInfoFile` 标志将它们放在我们想要的任何位置。

```text
// front-end.tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./buildcache/front-end",
    "outDir": "./lib"
  },
  "include": ["./src"]
}
```

### 复合项目

复合项目的意图的一部分（`tsconfig.json`s，`composite` 设置为 `true`）是不同项目之间的引用可以增量构建。 因此，复合项目将**始终**生成 `.tsbuildinfo` 文件。

### `outFile`

当使用 `outFile` 时，构建信息文件的名称将基于输出文件的名称。 例如，如果我们的输出 JavaScript 文件是 `./ output / foo.js`，那么在 `--incremental` 标志下，TypeScript 将生成文件`./output/foo.tsbuildinfo`。 如上所述，这可以通过 `--tsBuildInfoFile` 标志来控制。

## 泛型函数的高阶类型推断

当来自其它泛型函数的推断产生用于推断的自由类型变量时，TypeScript 3.4 现在可以生成泛型函数类型。

这意味着在 3.4 中许多函数组合模式现在运行的更好了。

为了更具体，让我们建立一些动机并考虑以下 `compose` 函数：

```typescript
function compose<A, B, C>(f: (arg: A) => B, g: (arg: B) => C): (arg: A) => C {
  return x => g(f(x));
}
```

`compose` 还有两个其他函数：

* `f` 它接受一些参数（类型为 `A`）并返回类型为 `B` 的值
* `g` 采用类型为 `B` 的参数（类型为 `f` 返回），并返回类型为 `C` 的值

`compose` 然后返回一个函数，它通过 `f` 然后 `g` 来提供它的参数。

调用此函数时，TypeScript 将尝试通过一个名为 _type argument inference_ 的进程来计算出 `A`，`B` 和 `C` 的类型。 这个推断过程通常很有效：

```typescript
interface Person {
  name: string;
  age: number;
}

function getDisplayName(p: Person) {
  return p.name.toLowerCase();
}

function getLength(s: string) {
  return s.length;
}

// 拥有类型 '(p: Person) => number'
const getDisplayNameLength = compose(
  getDisplayName,
  getLength,
);

// 有效并返回 `number` 类型
getDisplayNameLength({ name: "Person McPersonface", age: 42 });
```

推断过程在这里相当简单，因为 `getDisplayName` 和 `getLength` 使用的是可以轻松引用的类型。 但是，在 TypeScript 3.3 及更早版本中，泛型函数如 `compose` 在传递其他泛型函数时效果不佳。

```typescript
interface Box<T> {
  value: T;
}

function makeArray<T>(x: T): T[] {
  return [x];
}

function makeBox<U>(value: U): Box<U> {
  return { value };
}

// 类型为 '(arg: {}) => Box<{}[]>'
const makeBoxedArray = compose(
  makeArray,
  makeBox,
)

makeBoxedArray("hello!").value[0].toUpperCase();
//                                ~~~~~~~~~~~
// 错误：类型 '{}' 没有 'toUpperCase' 属性
```

在旧版本中，当从其他类型变量（如 `T` 和 `U`）推断时，TypeScript 会推断出空对象类型（`{}`）。

在 TypeScript 3.4 中的类型参数推断时，对于返回函数的泛型函数的调用，TypeScript _将_（视情况而定）把类型参数从泛型函数参数传递到生成的函数类型中。

换句话说，而不是生成类型

```typescript
(arg: {}) => Box<{}[]>
```

TypeScript 3.4 生成的类型

```typescript
<T>(arg: T) => Box<T[]>
```

注意，`T` 已从 `makeArray` 传递到结果类型的类型参数列表中。 这意味着来自 `compose` 参数的泛型已被保留，我们的 `makeBoxedArray` 示例将正常运行！

```typescript
interface Box<T> {
  value: T;
}

function makeArray<T>(x: T): T[] {
  return [x];
}

function makeBox<U>(value: U): Box<U> {
  return { value };
}

// 类型为 '<T>(arg: T) => Box<T[]>'
const makeBoxedArray = compose(
  makeArray,
  makeBox,
)

// 正常运行！
makeBoxedArray("hello!").value[0].toUpperCase();
```

更多细节，你可以[读到更多从这些原始的变动](https://github.com/Microsoft/TypeScript/pull/30215)。

## 改进 `ReadonlyArray` 和 `readonly` 元祖

TypeScript 3.4 让使用只读的类似数组的类型更简单了。

### 一个与 `ReadonlyArray` 相关的新语法

`ReadonlyArray` 类型描述 `Array` 是只读的。

任何带有 `ReadonlyArray` 引用的变量不能被添加、移除或者替换数组中的任何元素。

```typescript
function foo(arr: ReadonlyArray<string>) {
  arr.slice();        // okay
  arr.push("hello!"); // error!
}
```

当期待数组不可变时使用 `ReadonlyArray` 替代 `Array` 是好实践，考虑到数组有一个更棒的语法的情况下这通常有一点痛苦。 尤其是，`number[]` 是一个省略版的 `Array<number>`，就像 `Date[]` 是省略版的 `Array<Date>`。

TypeScript 3.4 为 `ReadonlyArray` 引入了一个新的语法，就是在数组类型上使用了新的 `readonly` 修饰语。

```typescript
function foo(arr: readonly string[]) {
  arr.slice();        // okay
  arr.push("hello!"); // 错误！
}
```

### `readonly` 元祖

TypeScript 3.4 同样引入了对 `readonly` 元祖的支持。 我们可以在任何元祖类型上加上前置 `readonly` 关键字用来表示它是 `readonly` 元祖，非常像我们现在可以对数组使用的省略版语法。 就像你可能期待的，不像插槽可写的普通元祖，`readonly` 元祖只允许从那些位置读。

```typescript
function foo(pair: readonly [string, string]) {
  console.log(pair[0]);   // okay
  pair[1] = "hello!";     // 错误
}
```

普通的元祖是用相同的方式从 `Array` 继承的——一个元祖`T1`, `T2`, ... `Tn` 继承自 `Array< T1 | T2 | ... Tn >` - `readonly` 元祖是继承自类型 `ReadonlyArray`。所以，一个 `readonly` 元祖 `T1`, `T2`, ... `Tn` 继承自 `ReadonlyArray< T1 | T2 | ... Tn >`。

### 映射类型修饰语 `readonly` 和 `readonly` 数组

在之前的 TypeScript 版本中，我们一般使用映射类型操作不同的类似数组的结构。

这意味着，一个映射类型像 `Boxify` 可以在数组上生效，元祖也是。

```typescript
interface Box<T> { value: T }

type Boxify<T> = {
}

// { a: Box<string>, b: Box<number> }
type A = Boxify<{ a: string, b: number }>;

// Array<Box<number>>
type B = Boxify<number[]>;

// [Box<string>, Box<number>]
type C = Boxify<[string, boolean]>;
```

不幸的是，映射类型像 `Readonly` 实用类型在数组和元祖类型上实际上是无用的。

```typescript
// lib.d.ts
type Readonly<T> = {
  readonly [K in keyof T]: T[K]
}

// 在 TypeScript 3.4 之前代码会如何执行

// { readonly a: string, readonly b: number }
type A = Readonly<{ a: string, b: number }>;

// number[]
type B = Readonly<number[]>;

// [string, boolean]
type C = Readonly<[string, boolean]>;
```

在 TypeScript 3.4，在映射类型中的 `readonly` 修饰符将自动的转换类似数组结构到他们相符合的 `readonly` 副本。

```typescript
// 在 TypeScript 3.4 中代码会如何运行

// { readonly a: string, readonly b: number }
type A = Readonly<{ a: string, b: number }>;

// readonly number[]
type B = Readonly<number[]>;

// readonly [string, boolean]
type C = Readonly<[string, boolean]>;
```

类似地，你可以编写一个类似 `Writable` 映射类型的实用程序类型来移除 `readonly`-ness，并将 `readonly` 数组容器转换回它们的可变等价物。

```typescript
type Writable<T> = {
  -readonly [K in keyof T]: T[K]
}

// { a: string, b: number }
type A = Writable<{
  readonly a: string;
  readonly b: number
}>;

// number[]
type B = Writable<readonly number[]>;

// [string, boolean]
type C = Writable<readonly [string, boolean]>;
```

### 注意事项

它不是一个通用型操作，尽管它看起来像。 `readonly` 类型修饰符只能用于数组类型和元组类型的语法。

```typescript
let err1: readonly Set<number>; // 错误！
let err2: readonly Array<boolean>; // 错误！

let okay: readonly boolean[]; // 有效
```

你可以[查看 pull request 了解更多详情](https://github.com/Microsoft/TypeScript/pull/29435)。

## `const` 断言

TypeScript 3.4 引入了一个叫 _`const`_ 断言的字面量值的新构造。 它的语法是用 `const` 代替类型名称的类型断言（例如 `123 as const`）。 当我们用 `const` 断言构造新的字面量表达式时，我们可以用来表示：

* 该表达式中的字面量类型不应粗化（例如，不要从 `'hello'` 到`string`）
* 对象字面量获得 `readonly` 属性
* 数组字面量成为 `readonly` 元组

```typescript
// Type '"hello"'
let x = "hello" as const;

// Type 'readonly [10, 20]'
let y = [10, 20] as const;

// Type '{ readonly text: "hello" }'
let z = { text: "hello" } as const;
```

也可以使用尖括号断言语法，除了 `.tsx` 文件之外。

```typescript
// Type '"hello"'
let x = <const>"hello";

// Type 'readonly [10, 20]'
let y = <const>[10, 20];

// Type '{ readonly text: "hello" }'
let z = <const>{ text: "hello" };
```

此功能意味着通常可以省略掉仅用于将不可变性示意给编译器的类型。

```typescript
// 不使用引用或声明的类型。
// 我们只需要一个 const 断言。
function getShapes() {
  let result = [
    { kind: "circle", radius: 100, },
    { kind: "square", sideLength: 50, },
  ] as const;

  return result;
}

for (const shape of getShapes()) {
  // 完美细化
  if (shape.kind === "circle") {
    console.log("Circle radius", shape.radius);
  }
  else {
    console.log("Square side length", shape.sideLength);
  }
}
```

请注意，上面的例子不需要类型注释。 `const` 断言允许 TypeScript 采用最具体的类型表达式。

如果你选择不使用 TypeScript 的 `enum` 结构，这甚至可以用于在纯 JavaScript 代码中使用类似 `enum` 的模式。

```typescript
export const Colors = {
  red: "RED",
  blue: "BLUE",
  green: "GREEN",
} as const;

// 或者使用 'export default'

export default {
  red: "RED",
  blue: "BLUE",
  green: "GREEN",
} as const;
```

### 注意事项

需要注意的是，`const` 断言只能直接应用于简单的字面量表达式上。

```typescript
// 错误！'const' 断言只能用在 string, number, boolean, array, object literal。
let a = (Math.random() < 0.5 ? 0 : 1) as const;

// 有效！
let b = Math.random() < 0.5 ?
  0 as const :
  1 as const;
```

另一件得记住的事是 `const` 上下文不会直接将表达式转换为完全不可变的。

```typescript
let arr = [1, 2, 3, 4];

let foo = {
  name: "foo",
  contents: arr,
} as const;

foo.name = "bar";   // 错误！
foo.contents = [];  // 错误！

foo.contents.push(5); // ...有效！
```

更多详情，你可以[查看相应的 pull request](https://github.com/Microsoft/TypeScript/pull/29510)。

## 对 `globalThis` 的类型检查

TypeScript 3.4 引入了对 ECMAScript 新 `globalThis` 全局变量的类型检查的支持，它指向的是全局作用域。 与上述解决方案不同，`globalThis` 提供了一种访问全局作用域的标准方法，可以在不同环境中使用。

```typescript
// 在一个全局文件里:

var abc = 100;

// 指向上面的 `abc`
globalThis.abc = 200;
```

注意，使用 `let` 和 `const` 声明的全局变量不会显示在 `globalThis` 上。

```typescript
let answer = 42;

// 错误！'typeof globalThis' 没有 'answer' 属性。
globalThis.answer = 333333;
```

同样重要的是要注意，在编译为老版本的 ECMAScript 时，TypeScript 不会转换引用到 `globalThis` 上。 因此，除非您的目标是常青浏览器（已经支持 `globalThis`），否则您可能需要[使用 polyfill](https://github.com/ljharb/globalThis)。

更多详细信息，请参阅[该功能的 pull request](https://github.com/Microsoft/TypeScript/pull/29332)。

## 参考

* [原文](https://github.com/microsoft/TypeScript-Handbook/blob/master/pages/release%20notes/TypeScript%203.4.md)

