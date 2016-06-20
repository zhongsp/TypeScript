# 介绍

当使用外部JavaScript库或新的宿主API时，你需要一个声明文件（.d.ts）定义程序库的shape。
这个手册包含了写.d.ts文件的高级概念，并带有一些例子，告诉你怎么去写一个声明文件。

# 指导与说明

## 流程

最好从程序库的文档而不是代码开始写.d.ts文件。
这样保证不会被具体实现所干扰，而且相比于JS代码更易读。
下面的例子会假设你正在参照文档写声明文件。

## 命名空间

当定义接口（例如：“options”对象），你会选择是否将这些类型放进命名空间里。
这主要是靠主观判断 -- 如果使用的人主要是用这些类型来声明变量和参数，并且类型命名不会引起命名冲突，则放在全局命名空间里更好。
如果类型不是被直接使用，或者没法起一个唯一的名字的话，就使用命名空间来避免与其它类型发生冲突。

## 回调函数

许多JavaScript库接收一个函数做为参数，之后传入已知的参数来调用它。
当用这些类型为函数签名的时候，不要把这些参数标记成可选参数。
正确的思考方式是“(调用者)会提供什么样的参数？”，不是“(函数)会使用到什么样的参数？”。
TypeScript 0.9.7+不会强制这种可选参数的使用，参数可选的双向协变可以被外部的linter强制执行。

## 扩展与声明合并

写声明文件的时候，要记住TypeScript扩展现有对象的方式。
你可以选择用匿名类型或接口类型的方式声明一个变量：

#### 匿名类型var

```ts
declare let MyPoint: { x: number; y: number; };
```

#### 接口类型var

```ts
interface SomePoint { x: number; y: number; }
declare let MyPoint: SomePoint;
```

从使用者角度来讲，它们是相同的，但是SomePoint类型能够通过接口合并来扩展：

```ts
interface SomePoint { z: number; }
MyPoint.z = 4; // OK
```

是否想让你的声明是可扩展的取决于主观判断。
通常来讲，尽量符合library的意图。

## 类的分解

TypeScript的类会创建出两个类型：实例类型，定义了类型的实例具有哪些成员；构造函数类型，定义了类构造函数具有哪些类型。
构造函数类型也被称做类的静态部分类型，因为它包含了类的静态成员。

你可以使用`typeof`关键字来拿到类静态部分类型，在写声明文件时，想要把类明确的分解成实例类型和静态类型时是有用且必要的。

下面是一个例子，从使用者的角度来看，这两个声明是等同的：

#### 标准版

```ts
class A {
    static st: string;
    inst: number;
    constructor(m: any) {}
}
```

#### 分解版

```ts
interface A_Static {
    new(m: any): A_Instance;
    st: string;
}
interface A_Instance {
    inst: number;
}
declare let A: A_Static;
```

这里的利弊如下：

* 标准方式可以使用extends来继承；分解的类不能。也可能会在未来版本的TypeScript里做出改变：是否允许任意extends表达式
* 都允许之后为类添加静态成员(通过合并声明的方式)
* 分解的类允许增加实例成员，标准版不允许
* 使用分解类的时候，需要为多类型成员起合理的名字

## 命名规则

一般来讲，不要给接口加I前缀（比如：IColor）。
因为TypeScript的接口类型概念比C#或Java里的意义更为广泛，IFoo命名不利于这个特点。

# 例子

下面进行例子部分。对于每个例子，首先使用*应用示例*，然后是类型声明。
如果有多个好的声明表示方法，会列出多个。

## 参数对象

#### 应用示例

```ts
animalFactory.create("dog");
animalFactory.create("giraffe", { name: "ronald" });
animalFactory.create("panda", { name: "bob", height: 400 });
// Invalid: name must be provided if options is given
animalFactory.create("cat", { height: 32 });
```

#### 类型声明

```ts
namespace animalFactory {
    interface AnimalOptions {
        name: string;
        height?: number;
        weight?: number;
    }
    function create(name: string, animalOptions?: AnimalOptions): Animal;
}
```

## 带属性的函数

#### 应用示例

```ts
zooKeeper.workSchedule = "morning";
zooKeeper(giraffeCage);
```

#### 类型声明

```ts
// Note: Function must precede namespace
function zooKeeper(cage: AnimalCage);
namespace zooKeeper {
    let workSchedule: string;
}
```

## 可以用new调用也可以直接调用的方法

#### 应用示例

```ts
let w = widget(32, 16);
let y = new widget("sprocket");
// w and y are both widgets
w.sprock();
y.sprock();
```

#### 类型声明

```ts
interface Widget {
    sprock(): void;
}

interface WidgetFactory {
    new(name: string): Widget;
    (width: number, height: number): Widget;
}

declare let widget: WidgetFactory;
```

## 全局或外部的未知代码库

#### 应用示例

```ts
// Either
import x = require('zoo');
x.open();
// or
zoo.open();
```

#### 类型声明

```ts
declare namespace zoo {
  function open(): void;
}

declare module "zoo" {
    export = zoo;
}
```

## 模块里的单一复杂对象

#### 应用示例

```ts
// Super-chainable library for eagles
import Eagle = require('./eagle');

// Call directly
Eagle('bald').fly();

// Invoke with new
var eddie = new Eagle('Mille');

// Set properties
eddie.kind = 'golden';
```

#### 类型声明

```ts
interface Eagle {
    (kind: string): Eagle;
    new (kind: string): Eagle;

    kind: string;
    fly(): void
}

declare var Eagle: Eagle;

export = Eagle;
```

## 将模块做为函数

#### 应用示例

```ts
// Common pattern for node modules (e.g. rimraf, debug, request, etc.)
import sayHello = require('say-hello');
sayHello('Travis');
```

#### 类型声明

```ts
declare module 'say-hello' {
  function sayHello(name: string): void;
  export = sayHello;
}
```

## 回调函数

#### 应用示例

```ts
addLater(3, 4, x => console.log('x = ' + x));
```

#### 类型声明

```ts
// Note: 'void' return type is preferred here
function addLater(x: number, y: number, callback: (sum: number) => void): void;
```

如果你想看其它模式的实现方式，请在[这里](https://github.com/Microsoft/TypeScript-Handbook/issues)留言！
我们会尽可能地加到这里来。
