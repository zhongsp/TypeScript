# TypeScript 5.1

## 更易用的隐式返回 `undefined` 的函数

在 `JavaScript` 中，如果一个函数运行结束时没有遇到 `return` 语句，它会返回 `undefined` 值。

```js
function foo() {
  // no return
}

// x = undefined
let x = foo();
```

然而，在之前版本的 TypeScript 中，*只有*返回值类型为 `void` 和 `any` 的函数可以不带 `return` 语句。
这意味着，就算明知函数返回 `undefined`，你也必须包含 `return` 语句。

```ts
//  fine - we inferred that 'f1' returns 'void'
function f1() {
  // no returns
}

//  fine - 'void' doesn't need a return statement
function f2(): void {
  // no returns
}

//  fine - 'any' doesn't need a return statement
function f3(): any {
  // no returns
}

//  error!
// A function whose declared type is neither 'void' nor 'any' must return a value.
function f4(): undefined {
  // no returns
}
```

如果某些 API 期望函数返回 `undefined` 值，这可能会让人感到痛苦 —— 你需要至少有一个显式的返回 `undefined` 语句，或者一个带有显式注释的 `return` 语句。

```ts
declare function takesFunction(f: () => undefined): undefined;

//  error!
// Argument of type '() => void' is not assignable to parameter of type '() => undefined'.
takesFunction(() => {
  // no returns
});

//  error!
// A function whose declared type is neither 'void' nor 'any' must return a value.
takesFunction((): undefined => {
  // no returns
});

//  error!
// Argument of type '() => void' is not assignable to parameter of type '() => undefined'.
takesFunction(() => {
  return;
});

//  works
takesFunction(() => {
  return undefined;
});

//  works
takesFunction((): undefined => {
  return;
});
```

这种行为非常令人沮丧和困惑，尤其是在调用自己无法控制的函数时。
理解推断 `void`与 `undefined` 之间的相互作用，以及一个返回 `undefined` 的函数是否需要 `return` 语句等等，似乎会分散注意力。

首先，TypeScript 5.1 允许返回 `undefined` 的函数不包含返回语句。

```ts
//  Works in TypeScript 5.1!
function f4(): undefined {
  // no returns
}

//  Works in TypeScript 5.1!
takesFunction((): undefined => {
  // no returns
});
```

其次，如果一个函数没有返回表达式，并且被传递给期望返回 `undefined` 值的函数的地方，TypeScript 会推断该函数的返回类型为 `undefined`。

```ts
//  Works in TypeScript 5.1!
takesFunction(function f() {
  //                 ^ return type is undefined
  // no returns
});

//  Works in TypeScript 5.1!
takesFunction(function f() {
  //                 ^ return type is undefined

  return;
});
```

为了解决另一个类似的痛点，在 TypeScript 的 `--noImplicitReturns` 选项下，只返回 `undefined` 的函数现在有了类似于 `void` 的例外情况，在这种情况下，并不是每个代码路径都必须以显式的返回语句结束。

```ts
//  Works in TypeScript 5.1 under '--noImplicitReturns'!
function f(): undefined {
  if (Math.random()) {
    // do some stuff...
    return;
  }
}
```

更多详情请参考 [Issue](https://github.com/microsoft/TypeScript/issues/36288)，[PR](https://github.com/microsoft/TypeScript/pull/53607)

## 不相关的存取器类型

TypeScript 4.3 支持将成对的 `get` 和 `set` 定义为不同的类型。

```ts
interface Serializer {
  set value(v: string | number | boolean);
  get value(): string;
}

declare let box: Serializer;

// Allows writing a 'boolean'
box.value = true;

// Comes out as a 'string'
console.log(box.value.toUpperCase());
```

最初，我们要求 `get` 的类型是 `set` 类型的子类型。这意味着：

```ts
box.value = box.value;
```

永远是合法的。

然而，大量现存的和提议的 API 带有毫无关联的 `get` 和 `set` 类型。
例如，考虑一个常见的情况 - DOM 中的 `style` 属性和 [`CSSStyleRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule) API。
每条样式规则都有[一个 `style` 属性](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule/style)，它是一个 [`CSSStyleDeclaration`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration)；
然而，如果你尝试给该属性写值，它仅支持字符串。

TypeScript 5.1 现在允许为 `get` 和 `set` 访问器属性指定完全不相关的类型，前提是它们具有显式的类型注解。
虽然这个版本的 TypeScript 还没有改变这些内置接口的类型，但 `CSSStyleRule` 现在可以按以下方式定义：

```ts
interface CSSStyleRule {
  // ...

  /** Always reads as a `CSSStyleDeclaration` */
  get style(): CSSStyleDeclaration;

  /** Can only write a `string` here. */
  set style(newValue: string);

  // ...
}
```

这也允许其他模式，比如要求 `set` 访问器只接受“有效”的数据，但指定 `get` 访问器可以返回 `undefined`，如果某些基础状态还没有被初始化。

```ts
class SafeBox {
  #value: string | undefined;

  // Only accepts strings!
  set value(newValue: string) {}

  // Must check for 'undefined'!
  get value(): string | undefined {
    return this.#value;
  }
}
```

实际上，这与在 `--exactOptionalProperties` 选项下可选属性的检查方式类似。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/53417)。

## 解耦 JSX 元素和 JSX 标签类型之间的类型检查

TypeScript 在 JSX 方面的一个痛点是对每个 JSX 元素标签的类型要求。
这个 TypeScript 版本使得 JSX 库更准确地描述了 JSX 组件可以返回的内容。
对于许多人来说，这具体意味着可以在 React 中使用[异步服务器组件](https://github.com/reactjs/rfcs/blob/7f8492f6a177fc33fe807d242319f2f96353bf68/text/0188-server-components.md)。

做为背景知识，JSX 元素是下列其一：

```tsx
// A self-closing JSX tag
<Foo />

// A regular element with an opening/closing tag
<Bar></Bar>
```

在类型检查 `<Foo />` 或 `<Bar></Bar>` 时，TypeScript 总是查找名为 `JSX` 的命名空间，并且获取名为 `Element` 的类型。
换句话说，它查找 `JSX.Element`。

但是为了检查 `Foo`或 `Bar` 是否是有效的标签名，TypeScript 大致上只需获取由 `Foo` 或 `Bar` 返回或构造的类型，并检查其与 `JSX.Element`（或另一种叫做 `JSX.ElementClass` 的类型，如果该类型可构造）的兼容性。

这里的限制意味着如果组件返回或 “render” 比 `JSX.Element` 更宽泛的类型，则无法使用组件。
例如，一个 `JSX` 库可能会允许组件返回 `string`s 或 `Promise`s。

作为一个更具体的例子，[未来版本](https://github.com/reactjs/rfcs/blob/7f8492f6a177fc33fe807d242319f2f96353bf68/text/0188-server-components.md)的 React 已经提出了对返回 `Promise` 的组件的有限支持，但是现有版本的 TypeScript 无法表达这一点，除非有人大幅放宽 `JSX.Element` 类型。

```tsx
import * as React from 'react';

async function Foo() {
  return <div></div>;
}

let element = <Foo />;
//             ~~~
// 'Foo' cannot be used as a JSX component.
//   Its return type 'Promise<Element>' is not a valid JSX element.
```

为了给 library 提供一种表达这种情况的方法，TypeScript 5.1 现在查找一个名为 `JSX.ElementType` 的类型。`ElementType` 精确地指定了在 JSX 元素中作为标签使用的内容。
因此现在可以像如下这样定义：

```ts
namespace JSX {
    export type ElementType =
        // All the valid lowercase tags
        keyof IntrinsicAttributes
        // Function components
        (props: any) => Element
        // Class components
        new (props: any) => ElementClass;

    export interface IntrinsictAttributes extends /*...*/ {}
    export type Element = /*...*/;
    export type ClassElement = /*...*/;
}
```

感谢 [Sebastian Silbermann](https://github.com/eps1lon) 的 [PR](https://github.com/microsoft/TypeScript/pull/51328)。
