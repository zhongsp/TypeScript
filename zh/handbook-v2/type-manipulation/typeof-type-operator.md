# typeof 类型运算符

## `typeof` 类型运算符

JavaScript 已经有了 `typeof` 运算符，你可以在*表达式*上下文中使用它：

```ts twoslash
// 输出 "string"
console.log(typeof "Hello world");
```

TypeScript 添加了 `typeof` 运算符，你可以在*类型*上下文中使用它来引用变量或属性的 *类型*：

```ts twoslash
let s = "hello";
let n: typeof s;
//  ^?
```

对于基本类型，这并不是很有用，但是如果与其他类型运算符结合使用，你就可以方便地表达许多模式。例如，让我们首先看一下预定义类型 `ReturnType<T>`。它接受*函数类型*为参数并生成其返回类型：

```ts twoslash
type Predicate = (x: unknown) => boolean;
type K = ReturnType<Predicate>;
//   ^?
```

如果我们尝试对函数名称使用 `ReturnType`，我们会看到一个指示性的错误：

```ts twoslash
// @errors: 2749
function f() {
  return { x: 10, y: 3 };
}
type P = ReturnType<f>;
```

请记住，*值*和*类型*不是相同的东西。要引用*值 `f`* 具有的*类型*，我们使用 `typeof`：

```ts twoslash
function f() {
  return { x: 10, y: 3 };
}
type P = ReturnType<typeof f>;
//   ^?
```

### 限制

TypeScript 有意限制了你可以在其上使用 `typeof` 的表达式类型。

具体来说，只有在标识符（即变量名）或其属性上使用 `typeof` 是合法的。这有助于避免编写你认为正在执行但实际上没有执行的代码的混淆陷阱：

```ts twoslash
// @errors: 1005
declare const msgbox: (prompt: string) => boolean;
// type msgbox = any;
// ---cut---
// 本意是使用 = ReturnType<typeof msgbox>
let shouldContinue: typeof msgbox("你是否确定要继续？");
```
