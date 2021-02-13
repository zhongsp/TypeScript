# 举例

这篇指南的目的是教你如何书写高质量的 TypeScript 声明文件。
我们在这里会展示一些 API 的文档，以及它们的使用示例，
并且阐述了如何为它们书写声明文件。

这些例子是按复杂度递增的顺序组织的。

-   [带属性的对象](#带属性的对象)
-   [函数重载](#函数重载)
-   [可重用类型（接口）](#可重用类型接口)
-   [可重用类型（类型别名）](#可重用类型类型别名)
-   [组织类型](#组织类型)
-   [类](#类)
-   [全局变量](#全局变量)
-   [全局函数](#全局函数)

## 带属性的对象

_文档_

> 全局变量`myLib`包含一个用于创建祝福的`makeGreeting`函数，
> 以及表示祝福数量的`numberOfGreetings`属性。

_代码_

```ts
let result = myLib.makeGreeting('hello, world');
console.log('The computed greeting is:' + result);

let count = myLib.numberOfGreetings;
```

_声明_

使用`declare namespace`来描述用点表示法访问的类型或值。

```ts
declare namespace myLib {
    function makeGreeting(s: string): string;
    let numberOfGreetings: number;
}
```

## 函数重载

_文档_

> `getWidget`函数接收一个数字参数并返回一个组件；或者接收一个字符串参数并返回一个组件数组。

_代码_

```ts
let x: Widget = getWidget(43);

let arr: Widget[] = getWidget('all of them');
```

_声明_

```ts
declare function getWidget(n: number): Widget;
declare function getWidget(s: string): Widget[];
```

## 可重用类型（接口）

_文档_

> 当指定一个祝福词时，你必须传入一个`GreetingSettings`对象。
> 这个对象具有以下几个属性：
>
> 1- greeting：必需的字符串
>
> 2- duration: 可选的持续时间（以毫秒表示）
>
> 3- color: 可选的字符串，比如'#ff00ff'

_代码_

```ts
greet({
    greeting: 'hello world',
    duration: 4000,
});
```

_声明_

使用`interface`定义一个带有属性的类型。

```ts
interface GreetingSettings {
    greeting: string;
    duration?: number;
    color?: string;
}

declare function greet(setting: GreetingSettings): void;
```

## 可重用类型（类型别名）

_文档_

> 在任何需要祝福词的地方，你可以提供一个`string`，一个返回`string`的函数或一个`Greeter`实例。

_代码_

```ts
function getGreeting() {
    return 'howdy';
}
class MyGreeter extends Greeter {}

greet('hello');
greet(getGreeting);
greet(new MyGreeter());
```

_声明_

你可以使用类型别名来定义类型的短名：

```ts
type GreetingLike = string | (() => string) | MyGreeter;

declare function greet(g: GreetingLike): void;
```

## 组织类型

_文档_

> `greeter`对象能够记录到文件或显示一个警告。
> 你可以为`.log(...)`提供 log 选项以及为`.alert(...)`提供 alert 选项。

_代码_

```ts
const g = new Greeter('Hello');
g.log({ verbose: true });
g.alert({ modal: false, title: 'Current Greeting' });
```

_声明_

使用命名空间组织类型。

```ts
declare namespace GreetingLib {
    interface LogOptions {
        verbose?: boolean;
    }
    interface AlertOptions {
        modal: boolean;
        title?: string;
        color?: string;
    }
}
```

你也可以在一个声明中创建嵌套的命名空间：

```ts
declare namespace GreetingLib.Options {
    // Refer to via GreetingLib.Options.Log
    interface Log {
        verbose?: boolean;
    }
    interface Alert {
        modal: boolean;
        title?: string;
        color?: string;
    }
}
```

## 类

_文档_

> 你可以通过实例化`Greeter`对象来创建祝福语，或者继承`Greeter`对象来自定义祝福语。

_代码_

```ts
const myGreeter = new Greeter('hello, world');
myGreeter.greeting = 'howdy';
myGreeter.showGreeting();

class SpecialGreeter extends Greeter {
    constructor() {
        super('Very special greetings');
    }
}
```

_声明_

使用`declare class`来描述一个类或像类一样的对象。
类可以有属性和方法，就和构造函数一样。

```ts
declare class Greeter {
    constructor(greeting: string);

    greeting: string;
    showGreeting(): void;
}
```

## 全局变量

_文档_

> 全局变量`foo`包含了存在的组件总数。

_代码_

```ts
console.log('Half the number of widgets is ' + foo / 2);
```

_声明_

使用`declare var`声明变量。
如果变量是只读的，那么可以使用`declare const`。
你还可以使用`declare let`，如果变量拥有块级作用域。

```ts
/** The number of widgets present */
declare var foo: number;
```

## 全局函数

_文档_

> 你可以使用一个字符串参数来调用`greet`函数，并向用户显示一条祝福语。

_代码_

```ts
greet('hello, world');
```

_声明_

使用`declare function`来声明函数。

```ts
declare function greet(greeting: string): void;
```
