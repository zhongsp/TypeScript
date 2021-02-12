# TypeScript里的this

## 介绍

在JavaScript里（还有TypeScript），`this`关键字的行为与其它语言相比大为不同。这可能会很令人吃惊，特别是对于那些使用其它语言的用户，他们凭借其直觉来想象`this`关键字的行为。

这篇文章会教你怎么识别及调试TypeScript里的`this`问题，并且提供了一些解决方案和各自的利弊。

## 典型症状和危险系数

丢失`this`上下文的典型症状包括：

* 类的某字段（`this.foo`）为`undefined`，但其它值没有问题
* `this`的值指向全局的`window`对象而不是类实例对象（在非严格模式下）
* `this`的值为`undefined`而不是类实例对象（严格模式下）
* 调用类方法（`this.doBa()`）失败，错误信息如“TypeError: undefined is not a function”，“Object doesn't support property or method 'doBar'”或“this.doBar is not a function”

程序中应该出现了以下代码：

* 事件监听，比如`window.addEventListener('click', myClass.doThing);`
* Promise解决，比如`myPromise.then(myClass.theNextThing);`
* 第三方库回调，比如`$(document).ready(myClass.start);`
* 函数回调，比如`someArray.map(myClass.convert)`
* ViewModel类型的库里的类，比如`<div data-bind="click: myClass.doSomething">`
* 可选包里的函数，比如`$.ajax(url, { success: myClass.handleData })`

## JavaScript里的`this`究竟是什么？

已经有大量的文章讲述了JavaScript里`this`关键字的危险性。查看[这里](http://www.quirksmode.org/js/this.html)，[这里](http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/)，或[这里](http://bjorn.tipling.com/all-this)。

当JavaScript里的一个函数被调用时，你可以按照下面的顺序来推断出`this`指向的是什么（这些规则是按优先级顺序排列的）：

* 如果这个函数是`function#bind`调用的结果，那么`this`指向的是传入`bind`的参数
* 如果函数是以`foo.func()`形式调用的，那么`this`值为`foo`
* 如果是在严格模式下，`this`将为`undefined`
* 否则，`this`将是全局对象（浏览器环境里为`window`）

这些规则会产生与直觉相反的效果。比如：

```typescript
class Foo {
  x = 3;
  print() {
    console.log('x is ' + this.x);
  }
}

var f = new Foo();
f.print(); // Prints 'x is 3' as expected

// Use the class method in an object literal
var z = { x: 10, p: f.print };
z.p(); // Prints 'x is 10'

var p = z.p;
p(); // Prints 'x is undefined'
```

## `this`的危险信号

你要注意的最大的危险信号是_在要使用类的方法时没有立即调用它_。任何时候你看到类方法被_引用了_却没有使用相同的表达式来_调用_时，`this`可能已经不对了。

例子：

```typescript
var x = new MyObject();
x.printThing(); // SAFE, method is invoked where it is referenced

var y = x.printThing; // DANGER, invoking 'y()' may not have correct 'this'

window.addEventListener('click', x.printThing, 10); // DANGER, method is not invoked where it is referenced

window.addEventListener('click', () => x.printThing(), 10); // SAFE, method is invoked in the same expression
```

## 修复

可以通过一些方法来保持`this`的上下文。

### 使用实例函数

代替TypeScript里默认的_原型_方法，你可以使用一个_实例箭头函数_来定义类成员：

```typescript
class MyClass {
    private status = "blah";

    public run = () => { // <-- note syntax here
        alert(this.status);
    }
}
var x = new MyClass();
$(document).ready(x.run); // SAFE, 'run' will always have correct 'this'
```

* 好与坏：这会为每个类实例的每个方法创建额外的闭包。如果这个方法通常是正常调用的，那么这么做有点过了。然而，它经常会在回调函数里调用，让类实例捕获到`this`上下文会比在每次调用时都创建一个闭包来得更有效率一些。
* 好：其它外部使用者不可能忘记处理`this`上下文
* 好：在TypeScript里是类型安全的
* 好：如果函数带参数不需要额外的工作
* 坏：派生类不能通过使用`super`调用基类方法
* 坏：在类与用户之前产生了额外的非类型安全的约束：明确了哪些方法提前绑定了以及哪些没有

### 本地的胖箭头

在TypeScrip里（这里为了讲解添加了一些参数） :

```typescript
var x = new SomeClass();
someCallback((n, m) => x.doSomething(n, m));
```

* 好与坏：内存/效能上的利弊与实例函数相比正相反
* 好：在TypeScript，100%的类型安全
* 好：在ECMAScript 3里同样生效
* 好：你只需要输入一次实例名
* 坏：你要输出2次参数名
* 坏：对于可变参数不起作用（'rest'）

### Function.bind

```typescript
var x = new SomeClass();
// SAFE: Functions created from function.bind are always preserve 'this'
window.setTimeout(x.someMethod.bind(x), 100);
```

* 好与坏：内存/效能上的利弊与实例函数相比正相反
* 好：如果函数带参数不需要额外的工作
* 坏：目前在TypeScript里，不是类型安全的
* 坏：只在ECMAScript 5里生效
* 坏：你要输入2次实例名

