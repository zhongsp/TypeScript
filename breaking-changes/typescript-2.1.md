# TypeScript 2.1

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.1%22+label%3A%22Breaking+Change%22+is%3Aclosed).

## 生成的构造函数代码将`this`的值替换为`super(...)`调用的返回值

在ES2015中，如果构造函数返回一个对象，那么对于任何`super(...)`的调用者将隐式地替换掉`this`的值。 因此，有必要获取任何可能的`super(...)`的返回值并用`this`进行替换。

**示例**

定义一个类`C`：

```typescript
class C extends B {
    public a: number;
    constructor() {
        super();
        this.a = 0;
    }
}
```

将生成如下代码：

```javascript
var C = (function (_super) {
    __extends(C, _super);
    function C() {
        var _this = _super.call(this) || this;
        _this.a = 0;
        return _this;
    }
    return C;
}(B));
```

注意：

* `_super.call(this)`存入局部变量`_this`
* 构造函数体里所有使用`this`的地方都被替换为`super`调用的返回值（例如`_this`）
* 每个构造函数将明确地返回它的`this`，以确保正确的继承

值得注意的是在`super(...)`调用前就使用`this`从[TypeScript 1.8](typescript-2.1.md#disallow-this-accessing-before-super-call)开始将会引发错误。

## 继承内置类型如`Error`，`Array`和`Map`将是无效的

做为将`this`的值替换为`super(...)`调用返回值的一部分，子类化`Error`，`Array`等的结果可以是非预料的。 这是因为`Error`，`Array`等的构造函数会使用ECMAScript 6的`new.target`来调整它们的原型链； 然而，在ECMAScript 5中调用构造函数时却没有有效的方法来确保`new.target`的值。 在默认情况下，其它低级别的编译器也普遍存在这个限制。

**示例**

针对如下的子类：

```typescript
class FooError extends Error {
    constructor(m: string) {
        super(m);
    }
    sayHello() {
        return "hello " + this.message;
    }
}
```

你会发现：

* 由这个子类构造出来的对象上的方法可能为`undefined`，因此调用`sayHello`会引发错误。
* `instanceof`应用于子类与其实例之前会失效，因此`(new FooError()) instanceof FooError`会返回`false`。

**推荐**

做为一个推荐，你可以在任何`super(...)`调用后立即手动地调整原型。

```typescript
class FooError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, FooError.prototype);
    }

    sayHello() {
        return "hello " + this.message;
    }
}
```

但是，任何`FooError`的子类也必须要手动地设置原型。 对于那些不支持[`Object.setPrototypeOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf)的运行时环境，你可以使用[`__proto__`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto)。

不幸的是，\[这些变通方法在IE10及其之前的版本\]\([https://msdn.microsoft.com/en-us/library/s4esdbwz\(v=vs.94\).aspx](https://msdn.microsoft.com/en-us/library/s4esdbwz%28v=vs.94%29.aspx)\) 你可以手动地将方法从原型上拷贝到实例上（比如从`FooError.prototype`到`this`），但是原型链却是无法修复的。

## `const`变量和`readonly`属性会默认地推断成字面类型

默认情况下，`const`声明和`readonly`属性不会被推断成字符串，数字，布尔和枚举字面量类型。这意味着你的变量/属性可能具有比之前更细的类型。这将体现在使用`===`和`!==`的时候。

**示例**

```typescript
const DEBUG = true; // 现在为`true`类型，之前为`boolean`类型

if (DEBUG === false) { // 错误： 操作符'==='不能应用于'true'和'false'
    ...
}
```

**推荐**

针对故意要求更加宽泛类型的情况下，将类型转换成基础类型：

```typescript
const DEBUG = <boolean>true; // `boolean`类型
```

## 不对函数和类表达式里捕获的变量进行类型细化

当泛型类型参数具有`string`，`number`或`boolean`约束时，会被推断为字符串，数字和布尔字面量类型。此外，如果字面量类型有相同的基础类型（如`string`），当没有字面量类型做为推断的最佳超类型时这个规则会失效。

**示例**

```typescript
declare function push<T extends string>(...args: T[]): T;

var x = push("A", "B", "C"); // 推断成 "A" | "B" | "C" 在TS 2.1, 在TS 2.0里为 string
```

**推荐**

在调用处明确指定参数类型：

```typescript
var x = push<string>("A", "B", "C"); // x是string
```

## 没有注解的callback参数如果没有与之匹配的重载参数会触发implicit-any错误

在之前编译器默默地赋予callback（下面的`c`）的参数一个`any`类型。原因关乎到编译器如何解析重载的函数表达式。从TypeScript 2.1开始，在使用`--noImplicitAny`时，这会触发一个错误。

**示例**

```typescript
declare function func(callback: () => void): any;
declare function func(callback: (arg: number) => void): any;

func(c => { });
```

**推荐**

删除第一个重载，因为它实在没什么意义；上面的函数可以使用1个或0个必须参数调用，因为函数可以安全地忽略额外的参数。

```typescript
declare function func(callback: (arg: number) => void): any;

func(c => { });
func(() => { });
```

或者，你可以给callback的参数指定一个明确的类型：

```typescript
func((c:number) => { });
```

## 逗号操作符使用在无副作用的表达式里时会被标记成错误

大多数情况下，这种在之前是有效的逗号表达式现在是错误。

**示例**

```typescript
let x = Math.pow((3, 5)); // x = NaN, was meant to be `Math.pow(3, 5)`

// This code does not do what it appears to!
let arr = [];
switch(arr.length) {
  case 0, 1:
    return 'zero or one';
  default:
    return 'more than one';
}
```

**推荐**

`--allowUnreachableCode`会禁用产生警告在整个编译过程中。或者，你可以使用`void`操作符来镇压这个逗号表达式错误：

```typescript
let a = 0;
let y = (void a, 1); // no warning for `a`
```

## 标准库里的DOM API变动

* **Node.firstChild**，**Node.lastChild**，**Node.nextSibling**，**Node.previousSibling**，**Node.parentElement**和**Node.parentNode**现在是`Node | null`而非`Node`。

  查看[\#11113](https://github.com/Microsoft/TypeScript/issues/11113)了解详细信息。

  推荐明确检查`null`或使用`!`断言操作符（比如`node.lastChild!`）。

