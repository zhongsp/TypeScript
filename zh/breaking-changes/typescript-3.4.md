# TypeScript 3.4

## 顶级 `this` 现在有类型了

顶级 `this` 的类型现在被分配为 `typeof globalThis` 而不是 `any`。

因此, 在 `noImplicitAny` 下访问 `this` 上的未知值，你可能收到错误提示。

```typescript
// 在 `noImplicitAny` 下，以前可以，现在不行
this.whargarbl = 10;
```

请注意，在 `noImplicitThis` 下编译的代码不会在此处遇到任何更改。

## 泛型参数的传递

在某些情况下，TypeScript 3.4 的推断改进可能会产生泛型的函数，而不是那些接收并返回其约束的函数（通常是 `{}`）。

```typescript
declare function compose<T, U, V>(f: (arg: T) => U, g: (arg: U) => V): (arg: T) => V;

function list<T>(x: T) { return [x]; }
function box<T>(value: T) { return { value }; }

let f = compose(list, box);
let x = f(100)

// 在 TypeScript 3.4 中, 'x.value' 的类型为
//
//   number[]
//
// 但是在之前的版本中类型为
//
//   {}[]
//
// 因此，插入一个 `string` 类型是错误的
x.value.push("hello");
```

`x` 上的显式类型注释可以清除这个错误。

### 上下文返回类型作为上下文参数类型传入

TypeScript 现在使用函数调用时传入的类型（如下例中的 `then`）作为函数上下文参数类型（如下例中的箭头函数）。

```typescript
function isEven(prom: Promise<number>): Promise<{ success: boolean }> {
  return prom.then<{success: boolean}>((x) => {
    return x % 2 === 0 ?
      { success: true } :
      Promise.resolve({ success: false });
    });
}
```

这通常是一种改进，但在上面的例子中，它导致 `true` 和 `false` 获取不合需要的字面量类型。

```bash
Argument of type '(x: number) => Promise<{ success: false; }> | { success: true; }' is not assignable to parameter of type '(value: number) => { success: false; } | PromiseLike<{ success: false; }>'.
  Type 'Promise<{ success: false; }> | { success: true; }' is not assignable to type '{ success: false; } | PromiseLike<{ success: false; }>'.
    Type '{ success: true; }' is not assignable to type '{ success: false; } | PromiseLike<{ success: false; }>'.
      Type '{ success: true; }' is not assignable to type '{ success: false; }'.
        Types of property 'success' are incompatible.
```

合适的解决方法是将类型参数添加到适当的调用——本例中的 `then` 方法调用。

```typescript
function isEven(prom: Promise<number>): Promise<{ success: boolean }> {
  //               vvvvvvvvvvvvvvvvvv
  return prom.then<{success: boolean}>((x) => {
    return x % 2 === 0 ?
      { success: true } :
      Promise.resolve({ success: false });
  });
}
```

### 在 `strictFunctionTypes` 之外一致性推断优先

在 TypeScript 3.3 中，关闭 `--strictFunctionTypes` 选项时，假定使用 `interface` 声明的泛型类型在其类型参数方面始终是协变的。对于函数类型，通常无法观察到此行为。

但是，对于带有 `keyof` 状态的类型参数的泛型 `interface` 类型——逆变用法——这些类型表现不正确。

在 TypeScript 3.4 中，现在可以在所有情况下正确探测使用 `interface` 声明的类型的变动。

这导致一个可见的重大变更，只要有类型参数的接口使用了 `keyof`（包括诸如 `Record<K, T>` 之类的地方，这是涉及 `keyof K` 的类型别名）。下例就是这样一个可能的变更。

```typescript
interface HasX { x: any }
interface HasY { y: any }

declare const source: HasX | HasY;
declare const properties: KeyContainer<HasX>;

interface KeyContainer<T> {
  key: keyof T;
}

function readKey<T>(source: T, prop: KeyContainer<T>) {
  console.log(source[prop.key])
}

// 这个调用应该被拒绝，因为我们可能会这样做
// 错误地从 'HasY' 中读取 'x'。它现在恰当的提示错误。
readKey(source, properties);
```

此错误很可能表明原代码存在问题。

## 参考

* [原文](https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#typescript-34)

