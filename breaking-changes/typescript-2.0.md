# TypeScript 2.0

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.0%22+label%3A%22Breaking+Change%22+is%3Aclosed).

## 对函数或类表达式的捕获变量不进行类型细化\(narrowing\)

类型细化不会在函数，类和lambda表达式上进行。

**例子**

```typescript
var x: number | string;

if (typeof x === "number") {
    function inner(): number {
        return x; // Error, type of x is not narrowed, c is number | string
    }
    var y: number = x; // OK, x is number
}
```

编译器不知道回调函数什么时候被执行。考虑下面的情况：

```typescript
var x: number | string = "a";
if (typeof x === "string") {
    setTimeout(() => console.log(x.charAt(0)), 0);
}
x = 5;
```

当`x.charAt()`被调用的时候把`x`的类型当作`string`是错误的，事实上它确实不是`string`类型。

**推荐**

使用常量代替：

```typescript
const x: number | string = "a";
if (typeof x === "string") {
    setTimeout(() => console.log(x.charAt(0)), 0);
}
```

## 泛型参数会进行类型细化

**例子**

```typescript
function g<T>(obj: T) {
    var t: T;
    if (obj instanceof RegExp) {
         t = obj; // RegExp is not assignable to T
    }
}
```

**推荐** 可以把局部变量声明为特定类型而不是泛型参数或者使用类型断言。

## 只有get而没有set的存取器会被自动推断为`readonly`属性

**例子**

```typescript
class C {
  get x() { return 0; }
}

var c = new C();
c.x = 1; // Error Left-hand side is a readonly property
```

**推荐**

定义一个不对属性写值的setter。

## 在严格模式下函数声明不允许出现在块\(block\)里

在严格模式下这已经是一个运行时错误。从TypeScript 2.0开始，它会被标记为编译时错误。

**例子**

```typescript
if( true ) {
    function foo() {}
}

export = foo;
```

**推荐**

使用函数表达式代替：

```typescript
if( true ) {
    const foo = function() {}
}
```

## `TemplateStringsArray`现是是不可变的

ES2015模版字符串总是将它们的标签以不可变的类数组对象进行传递，这个对象带有一个`raw`属性（同样是不可变的）。 TypeScript把这个对象命名为`TemplateStringsArray`。

便利的是，`TemplateStringsArray`可以赋值给`Array<string>`，因此你可以利用这个较短的类型来使用标签参数：

```typescript
function myTemplateTag(strs: string[]) {
    // ...
}
```

然而，在TypeScript 2.0，支持用`readonly`修饰符表示这些对象是不可变的。 这样的话，`TemplateStringsArray` 就变成了不可变的，并且不再可以赋值给`string[]`。

**推荐**

直接使用`TemplateStringsArray`（或者使用`ReadonlyArray<string>`）。

