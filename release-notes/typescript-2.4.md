# TypeScript 2.4

## 动态导入表达式

动态的`import`表达式是一个新特性，它属于ECMAScript的一部分，允许用户在程序的任何位置异步地请求某个模块。

这意味着你可以有条件地延迟加载其它模块和库。 例如下面这个`async`函数，它仅在需要的时候才导入工具库：

```typescript
async function getZipFile(name: string, files: File[]): Promise<File> {
    const zipUtil = await import('./utils/create-zip-file');
    const zipContents = await zipUtil.getContentAsBlob(files);
    return new File(zipContents, name);
}
```

许多bundlers工具已经支持依照这些`import`表达式自动地分割输出，因此可以考虑使用这个新特性并把输出模块目标设置为`esnext`。

## 字符串枚举

TypeScript 2.4现在支持枚举成员变量包含字符串构造器。

```typescript
enum Colors {
    Red = "RED",
    Green = "GREEN",
    Blue = "BLUE",
}
```

需要注意的是字符串枚举成员不能被反向映射到枚举成员的名字。 换句话说，你不能使用`Colors["RED"]`来得到`"Red"`。

## 增强的泛型推断

TypeScript 2.4围绕着泛型的推断方式引入了一些很棒的改变。

### 返回类型作为推断目标

其一，TypeScript能够推断调用的返回值类型。 这可以优化你的体验和方便捕获错误。 如下所示：

```typescript
function arrayMap<T, U>(f: (x: T) => U): (a: T[]) => U[] {
    return a => a.map(f);
}

const lengths: (a: string[]) => number[] = arrayMap(s => s.length);
```

下面是一个你可能会见到的出错了的例子：

```typescript
let x: Promise<string> = new Promise(resolve => {
    resolve(10);
    //      ~~ Error!
});
```

### 从上下文类型中推断类型参数

在TypeScript 2.4之前，在下面的例子里：

```typescript
let f: <T>(x: T) => T = y => y;
```

`y`将会具有`any`类型。 这意味着虽然程序会检查类型，但是你却可以使用`y`做任何事情，就比如：

```typescript
let f: <T>(x: T) => T = y => y() + y.foo.bar;
```

这个例子实际上并不是类型安全的。

在TypeScript 2.4里，右手边的函数会隐式地获得类型参数，并且`y`的类型会被推断为那个类型参数的类型。

如果你使用`y`的方式是这个类型参数所不支持的，那么你会得到一个错误。 在这个例子里，`T`的约束是`{}`（隐式地），所以在最后一个例子里会出错。

### 对泛型函数进行更严格的检查

TypeScript在比较两个单一签名的类型时会尝试统一类型参数。 因此，在涉及到两个泛型签名的时候会进行更严格的检查，这就可能发现一些bugs。

```typescript
type A = <T, U>(x: T, y: U) => [T, U];
type B = <S>(x: S, y: S) => [S, S];

function f(a: A, b: B) {
    a = b;  // Error
    b = a;  // Ok
}
```

## 回调参数的严格抗变

TypeScript一直是以双变（bivariant）的方式来比较参数。 这样做有很多原因，总体上来说这不会有什么大问题直到我们发现它应用在`Promise`和`Observable`上时有些副作用。

TypeScript 2.4在处理两个回调类型时引入了收紧机制。例如：

```typescript
interface Mappable<T> {
    map<U>(f: (x: T) => U): Mappable<U>;
}

declare let a: Mappable<number>;
declare let b: Mappable<string | number>;

a = b;
b = a;
```

在TypeScript 2.4之前，它会成功执行。 当关联`map`的类型时，TypeScript会双向地关联它们的类型（例如`f`的类型）。 当关联每个`f`的类型时，TypeScript也会双向地关联那些参数的类型。

TS 2.4里关联`map`的类型时，TypeScript会检查是否每个参数都是回调类型，如果是的话，它会确保那些参数根据它所在的位置以抗变（contravariant）地方式进行检查。

换句话说，TypeScript现在可以捕获上面的bug，这对某些用户来说可能是一个破坏性改动，但却是非常帮助的。

## 弱类型（Weak Type）探测

TypeScript 2.4引入了“弱类型”的概念。 任何只包含了可选属性的类型被当作是“weak”。 比如，下面的`Options`类型是弱类型：

```typescript
interface Options {
    data?: string,
    timeout?: number,
    maxRetries?: number,
}
```

在TypeScript 2.4里给弱类型赋值时，如果这个值的属性与弱类型的属性没有任何重叠属性时会得到一个错误。 比如：

```typescript
function sendMessage(options: Options) {
    // ...
}

const opts = {
    payload: "hello world!",
    retryOnFail: true,
}

// 错误!
sendMessage(opts);
// 'opts' 和 'Options' 没有重叠的属性
// 可能我们想要用'data'/'maxRetries'来代替'payload'/'retryOnFail'
```

因为这是一个破坏性改动，你可能想要知道一些解决方法：

1. 确定属性存在时再声明
2. 给弱类型增加索引签名（比如 `[propName: string]: {}`）
3. 使用类型断言（比如`opts as Options`）

