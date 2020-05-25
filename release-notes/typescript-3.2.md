# TypeScript 3.2

## `strictBindCallApply`

TypeScript 3.2引入了一个新的`--strictBindCallApply`编译选项（是`--strict`选项家族之一）。在使用了此选项后，函数对象上的`bind`，`call`和`apply`方法将应用强类型并进行严格的类型检查。

```typescript
function foo(a: number, b: string): string {
    return a + b;
}

let a = foo.apply(undefined, [10]);              // error: too few argumnts
let b = foo.apply(undefined, [10, 20]);          // error: 2nd argument is a number
let c = foo.apply(undefined, [10, "hello", 30]); // error: too many arguments
let d = foo.apply(undefined, [10, "hello"]);     // okay! returns a string
```

它的实现是通过引入了两种新类型来完成的，即`lib.d.ts`里的`CallableFunction`和`NewableFunction`。这些类型包含了针对常规函数和构造函数上`bind`、`call`和`apply`的泛型方法声明。这些声明使用了泛型剩余参数来捕获和反射参数列表，使之具有强类型。在`--strictBindCallApply`模式下，这些声明作用在`Function`类型声明出现的位置。

### 警告

由于更严格的检查可能暴露之前没发现的错误，因此这是`--strict`模式下的一个破坏性改动。

此外，这个新功能还有[另一个警告](https://github.com/Microsoft/TypeScript/pull/27028#issuecomment-429334450)。由于有这些限制，`bind`、`call`和`apply`无法为重载的泛型函数或重载的函数进行完整地建模。 当在泛型函数上使用这些方法时，类型参数会被替换为空对象类型（`{}`），并且若在有重载的函数上使用这些方法时，只有最后一个重载会被建模。

## 对象字面量的泛型展开表达式

TypeScript 3.2开始，对象字面量允许泛型展开表达式，它产生交叉类型，和`Object.assign`函数或JSX字面量类似。例如：

```typescript
function taggedObject<T, U extends string>(obj: T, tag: U) {
    return { ...obj, tag };  // T & { tag: U }
}

let x = taggedObject({ x: 10, y: 20 }, "point");  // { x: number, y: number } & { tag: "point" }
```

属性赋值和非泛型展开表达式会最大程度地合并到泛型展开表达式的一侧。例如：

```typescript
function foo1<T>(t: T, obj1: { a: string }, obj2: { b: string }) {
    return { ...obj1, x: 1, ...t, ...obj2, y: 2 };  // { a: string, x: number } & T & { b: string, y: number }
}
```

非泛型展开表达式与之前的行为相同：函数调用签名和构造签名被移除，仅有非方法的属性被保留，针对同名属性则只有出现在最右侧的会被使用。它与交叉类型不同，交叉类型会连接调用签名和构造签名，保留所有的属性，合并同名属性的类型。因此，当展开使用泛型初始化的相同类型时可能会产生不同的结果：

```typescript
function spread<T, U>(t: T, u: U) {
    return { ...t, ...u };  // T & U
}

declare let x: { a: string, b: number };
declare let y: { b: string, c: boolean };

let s1 = { ...x, ...y };  // { a: string, b: string, c: boolean }
let s2 = spread(x, y);    // { a: string, b: number } & { b: string, c: boolean }
let b1 = s1.b;  // string
let b2 = s2.b;  // number & string
```

## 泛型对象剩余变量和参数

TypeScript 3.2开始允许从泛型变量中解构剩余绑定。它是通过使用`lib.d.ts`里预定义的`Pick`和`Exclude`助手类型，并结合使用泛型类型和解构式里的其它绑定名实现的。

```typescript
function excludeTag<T extends { tag: string }>(obj: T) {
    let { tag, ...rest } = obj;
    return rest;  // Pick<T, Exclude<keyof T, "tag">>
}

const taggedPoint = { x: 10, y: 20, tag: "point" };
const point = excludeTag(taggedPoint);  // { x: number, y: number }
```

## BigInt

BigInt里ECMAScript的一项提案，它在理论上允许我们建模任意大小的整数。 TypeScript 3.2可以为BigInit进行类型检查，并支持在目标为`esnext`时输出BigInit字面量。

为支持BigInt，TypeScript引入了一个新的原始类型`bigint`（全小写）。 可以通过调用`BigInt()`函数或书写BigInt字面量（在整型数字字面量末尾添加`n`）来获取`bigint`。

```typescript
let foo: bigint = BigInt(100); // the BigInt function
let bar: bigint = 100n;        // a BigInt literal

// *Slaps roof of fibonacci function*
// This bad boy returns ints that can get *so* big!
function fibonacci(n: bigint) {
    let result = 1n;
    for (let last = 0n, i = 0n; i < n; i++) {
        const current = result;
        result += last;
        last = current;
    }
    return result;
}

fibonacci(10000n)
```

尽管你可能会认为`number`和`bigint`能互换使用，但它们是不同的东西。

```typescript
declare let foo: number;
declare let bar: bigint;

foo = bar; // error: Type 'bigint' is not assignable to type 'number'.
bar = foo; // error: Type 'number' is not assignable to type 'bigint'.
```

ECMAScript里规定，在算术运算符里混合使用`number`和`bigint`是一个错误。 应该显式地将值转换为`BigInt`。

```typescript
console.log(3.141592 * 10000n);     // error
console.log(3145 * 10n);            // error
console.log(BigInt(3145) * 10n);    // okay!
```

还有一点要注意的是，对`bigint`使用`typeof`操作符返回一个新的字符串：`"bigint"`。 因此，TypeScript能够正确地使用`typeof`细化类型。

```typescript
function whatKindOfNumberIsIt(x: number | bigint) {
    if (typeof x === "bigint") {
        console.log("'x' is a bigint!");
    }
    else {
        console.log("'x' is a floating-point number");
    }
}
```

感谢[Caleb Sander](https://github.com/calebsander)为实现此功能的付出。

### 警告

BigInt仅在目标为`esnext`时才支持。 可能不是很明显的一点是，因为BigInts针对算术运算符`+`, `-`, `*`等具有不同的行为，为老旧版（如`es2017`及以下）提供此功能时意味着重写出现它们的每一个操作。 TypeScript需根据类型和涉及到的每一处加法，字符串拼接，乘法等产生正确的行为。

因为这个原因，我们不会立即提供向下的支持。 好的一面是，Node 11和较新版本的Chrome已经支持了这个特性，因此你可以在目标为`esnext`时，使用BigInt。

一些目标可能包含polyfill或类似BigInt的运行时对象。 基于这些考虑，你可能会想要添加`esnext.bigint`到`lib`编译选项里。

## Non-unit types as union discriminants

TypeScript 3.2放宽了作为判别式属性的限制，来让类型细化变得容易。 如果联合类型的共同属性包含了_某些_单体类型（如，字面符字面量，`null`或`undefined`）且不包含泛型，那么它就可以做为判别式。

因此，TypeScript 3.2认为下例中的`error`属性可以做为判别式。这在之前是不可以的，因为`Error`并非是一个单体类型。 那么，`unwrap`函数体里的类型细化就可以正确地工作了。

```typescript
type Result<T> =
    | { error: Error; data: null }
    | { error: null; data: T };

function unwrap<T>(result: Result<T>) {
    if (result.error) {
        // Here 'error' is non-null
        throw result.error;
    }

    // Now 'data' is non-null
    return result.data;
}
```

## `tsconfig.json`可以通过Node.js包来继承

TypeScript 3.2现在可以从`node_modules`里解析`tsconfig.json`。如果`tsconfig.json`文件里的`"extends"`设置为空，那么TypeScript会检测`node_modules`包。 When using a bare path for the `"extends"` field in `tsconfig.json`, TypeScript will dive into `node_modules` packages for us.

```text
{
    "extends": "@my-team/tsconfig-base",
    "include": ["./**/*"]
    "compilerOptions": {
        // Override certain options on a project-by-project basis.
        "strictBindCallApply": false,
    }
}
```

这里，TypeScript会去`node_modules`目录里查找`@my-team/tsconfig-base`包。针对每一个包，TypeScript检查`package.json`里是否包含`"tsconfig"`字段，如果是，TypeScript会尝试从那里加载配置文件。如果两者都不存在，TypeScript尝试从根目录读取`tsconfig.json`。这与Nodejs查找`.js`文件或TypeScript查找`.d.ts`文件的已有过程类似。

这个特性对于大型组织或具有很多分布的依赖的工程特别有帮助。

## The new `--showConfig` flag

`tsc`，TypeScript编译器，支持一个新的标记`--showConfig`。 运行`tsc --showConfig`时，TypeScript计算生效的`tsconfig.json`并打印（继承的配置也会计算在内）。 这对于调试诊断配置问题很有帮助。

## JavaScript的`Object.defineProperty`声明

在编写JavaScript文件时（使用`allowJs`），TypeScript能识别出使用`Object.defineProperty`声明。 也就是说会有更好的代码补全功能，和强类型检查，这需要在JavaScript文件里启用类型检查功能（打开`checkJs`选项或在文件顶端添加`// @ts-check`注释）。

```javascript
// @ts-check

let obj = {};
Object.defineProperty(obj, "x", { value: "hello", writable: false });

obj.x.toLowercase();
//    ~~~~~~~~~~~
//    error:
//     Property 'toLowercase' does not exist on type 'string'.
//     Did you mean 'toLowerCase'?

obj.x = "world";
//  ~
//  error:
//   Cannot assign to 'x' because it is a read-only property.
```

