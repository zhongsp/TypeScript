# TypeScript 2.4

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.4%22+label%3A%22Breaking+Change%22+is%3Aclosed)。

## 弱类型检测

TypeScript 2.4引入了“弱类型（weak type）”的概念。 若一个类型只包含可选的属性，那么它就被认为是_弱（weak）_的。 例如，下面的`Options`类型就是一个弱类型：

```typescript
interface Options {
    data?: string,
    timeout?: number,
    maxRetries?: number,
}
```

TypeScript 2.4，当给一个弱类型赋值，但是它们之前没有共同的属性，那么就会报错。 例如：

```typescript
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

TypeScript现在可从上下文类型中推断出一个调用的返回值类型。 这意味着一些代码现在会适当地报错。 下面是一个例子：

```typescript
let x: Promise<string> = new Promise(resolve => {
    resolve(10);
    //      ~~ 错误! 'number'类型不能赋值给'string'类型
});
```

## 更严格的回调函数参数变化

TypeScript对回调函数参数的检测将与立即签名检测协变。 之前是双变的，这会导致有时候错误的类型也能通过检测。 根本上讲，这意味着回调函数参数和包含回调的类会被更细致地检查，因此Typescript会要求更严格的类型。 这在Promises和Observables上是十分明显的。

### Promises

下面是改进后的Promise检查的例子：

```typescript
let p = new Promise((c, e) => { c(12) });
let u: Promise<number> = p;
    ~
    类型 'Promise<{}>' 不能赋值给 'Promise<number>'
```

TypeScript无法在调用`new Promise`时推断类型参数`T`的值。 因此，它仅推断为`Promise<{}>`。 不幸的是，它会允许你这样写`c(12)`和`c('foo')`，就算`p`的声明明确指出它应该是`Promise<number>`。

在新的规则下，`Promise<{}>`不能够赋值给`Promise<number>`，因为它破坏了Promise的回调函数。 TypeScript仍无法推断类型参数，所以你只能通过传递类型参数来解决这个问题：

```typescript
let p: Promise<number> = new Promise<number>((c, e) => { c(12) });
//                                  ^^^^^^^^ 明确的类型参数
```

它能够帮助从promise代码体里发现错误。 现在，如果你错误地调用`c('foo')`，你就会得到一个错误提示:

```typescript
let p: Promise<number> = new Promise<number>((c, e) => { c('foo') });
//                                                         ~~~~~
//  参数类型 '"foo"' 不能赋值给 'number'
```

### （嵌套）回调

其它类型的回调也会被这个改进所影响，其中主要是嵌套的回调。 下面是一个接收回调函数的函数，回调函数又接收嵌套的回调。 嵌套的回调现在会以协变的方式检查。

```typescript
declare function f(
  callback: (nested: (error: number, result: any) => void, index: number) => void
): void;

f((nested: (error: number) => void) => { log(error) });
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'(error: number) => void' 不能赋值给 '(error: number, result: any) => void'
```

修复这个问题很容易。给嵌套的回调传入缺失的参数：

```typescript
f((nested: (error: number, result: any) => void) => { });
```

## 更严格的泛型函数检查

TypeScript在比较两个单一签名的类型时会尝试统一类型参数。 结果就是，当关系到两个泛型签名时检查变得更严格了，但同时也会捕获一些bug。

```typescript
type A = <T, U>(x: T, y: U) => [T, U];
type B = <S>(x: S, y: S) => [S, S];

function f(a: A, b: B) {
    a = b;  // Error
    b = a;  // Ok
}
```

**推荐做法**

或者修改定义或者使用`--noStrictGenericChecks`。

## 从上下文类型中推荐类型参数

在TypeScript之前，下面例子中

```typescript
let f: <T>(x: T) => T = y => y;
```

`y`的类型将是`any`。 这意味着，程序虽会进行类型检查，但是你可以在`y`上做任何事，比如：

```typescript
let f: <T>(x: T) => T = y => y() + y.foo.bar;
```

**推荐做法:**

适当地重新审视你的泛型是否为正确的约束。实在不行，就为参数加上`any`注解。

