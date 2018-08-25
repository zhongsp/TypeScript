# TypeScript 2.4

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.4%22+label%3A%22Breaking+Change%22+is%3Aclosed)。

## 弱类型检测

TypeScript 2.4引入了“弱类型（weak type）”的概念。
若一个类型只包含可选的属性，那么它就被认为是*弱（weak）*的。
例如，下面的`Options`类型就是一个弱类型：

```ts
interface Options {
    data?: string,
    timeout?: number,
    maxRetries?: number,
}
```

TypeScript 2.4，当给一个弱类型赋值，但是它们之前没有共同的属性，那么就会报错。
例如：

```ts
function sendMessage(options: Options) {
    // ...
}

const opts = {
    payload: "hello world!",
    retryOnFail: true,
}

// 错误！
sendMessage(opts);
// 'opts'与'Options'之间没有共同的属性
// 你是否想用'data'/'maxRetries'来替换'payload'/'retryOnFail'
```

**推荐做法**

1. 仅声明那些确定存在的属性。
2. 给弱类型添加索引签名（如：`[propName: string]: {}`）
3. 使用类型断言（如：`opts as Options`）

## 推断返回值的类型

TypeScript现在可从上下文类型中推断出一个调用的返回值类型。
这意味着一些代码现在会适当地报错。
下面是一个例子：

```ts
let x: Promise<string> = new Promise(resolve => {
    resolve(10);
    //      ~~ 错误! 'number'类型不能赋值给'string'类型
});
```

## 更严格的回调函数参数变化

TypeScript对回调函数参数的检测将与立即签名检测协变。
之前是双变的，这会导致有时候错误的类型也能通过检测。
根本上讲，这意味着回调函数参数和包含回调的类会被更细致地检查，因此Typescript会要求更严格的类型。
这在Promises和Observables上是十分明显的。

### Promises

Here is an example of improved Promise checking:

```ts
let p = new Promise((c, e) => { c(12) });
let u: Promise<number> = p;
    ~
Type 'Promise<{}>' is not assignable to 'Promise<number>'
```

The reason this occurs is that TypeScript is not able to infer the type argument `T` when you call `new Promise`.
As a result, it just infers `Promise<{}>`.
Unfortunately, this allows you to write `c(12)` and `c('foo')`, even though the declaration of `p` explicitly says that it must be `Promise<number>`.

Under the new rules, `Promise<{}>` is not assignable to
`Promise<number>` because it breaks the callbacks to Promise.
TypeScript still isn't able to infer the type argument, so to fix this you have to provide the type argument yourself:

```ts
let p: Promise<number> = new Promise<number>((c, e) => { c(12) });
//                                  ^^^^^^^^ explicit type arguments here
```

This requirement helps find errors in the body of the promise code.
Now if you mistakenly call `c('foo')`, you get the following error:

```ts
let p: Promise<number> = new Promise<number>((c, e) => { c('foo') });
//                                                         ~~~~~
//  Argument of type '"foo"' is not assignable to 'number'
```

### (Nested) Callbacks

Other callbacks are affected by the improved callback checking as
well, primarily nested callbacks. Here's an example with a function
that takes a callback, which takes a nested callback. The nested
callback is now checked co-variantly.

```ts
declare function f(
  callback: (nested: (error: number, result: any) => void, index: number) => void
): void;

f((nested: (error: number) => void) => { log(error) });
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'(error: number) => void' is not assignable to (error: number, result: any) => void'
```

The fix is easy in this case. Just add the missing parameter to the
nested callback:

```ts
f((nested: (error: number, result: any) => void) => { });
```

## Stricter checking for generic functions

TypeScript now tries to unify type parameters when comparing two single-signature types.
As a result, you'll get stricter checks when relating two generic signatures, and may catch some bugs.

```ts
type A = <T, U>(x: T, y: U) => [T, U];
type B = <S>(x: S, y: S) => [S, S];

function f(a: A, b: B) {
    a = b;  // Error
    b = a;  // Ok
}
```

**Recommendation**

Either correct the definition or use `--noStrictGenericChecks`.

## Type parameter inference from contextual types

Prior to TypeScript 2.4, in the following example

```ts
let f: <T>(x: T) => T = y => y;
```

`y` would have the type `any`.
This meant the program would type-check, but you could technically do anything with `y`, such as the following:

```ts
let f: <T>(x: T) => T = y => y() + y.foo.bar;
```

**Recommendation:** Appropriately re-evaluate whether your generics have the correct constraint, or are even necessary. As a last resort, annotate your parameters with the `any` type.