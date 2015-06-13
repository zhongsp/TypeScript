# 介绍

TypeScript有一些独特的概念，有的是因为我们需要描述JavaScript顶级对象的类型发生了什么变化。
这其中之一叫做`声明合并`。
理解了这个概念对于你使用TypeScript去操作现有的JavaScript是大有帮助的。
同时，也开启通往更多高级抽象概念的大门。

首先，在了解怎么进行声明合并之前，让我们先看一下什么叫做`声明合并`。

在这个手册里，声明合并是指编译器会把两个相同的名字的声明合并成一个单独的声明。
合并后的声明同时具有那两个被合并的声明的特性。
声明合并不限于只合并两个，任意数量都可以。

# 基础概念

Typescript里声明可用于三个地方：命名空间/模块，类型或者值。
创建命名空间/模块的声明可以通过（.）标识符访问其中的类型。
创建类型的声明就是用给定的名字创建相应类型。
最后，创建值的声明是在生成的JavaScript里存在的那部分（比如：函数和变量）。

| Declaration Type | Namespace | Type | Value |
|------------------|:---------:|:----:|:-----:|
| Module           |     X     |      |   X   |
| Class            |           |   X  |   X   |
| Interface        |           |   X  |       |
| Function         |           |      |   X   |
| Variable         |           |      |   X   |

理解每个声明创建了什么，有助于理解当声明合并时什么东西被合并了。

# 合并接口

最简单最常见的就是合并接口，声明合并的种类是：接口合并。
从根本上说，合并的机制是把各自声明里的成员放进一个同名的单一接口里。

```TypeScript
interface Box {
    height: number;
    width: number;
}

interface Box {
    scale: number;
}

var box: Box = {height: 5, width: 6, scale: 10};
```

接口中非函数的成员必须是唯一的。如果多个接口中具有相同名字的非函数成员就会报错。

对于函数成员，每个同名函数声明都会被当成这个函数的一个重载。

需要注意的是，接口A与它后面的接口A（把这个接口叫做A'）合并时，A'中的重载函数具有更高的优先级。

如下例所示：

```TypeScript
interface Document {
    createElement(tagName: any): Element;
}
interface Document {
    createElement(tagName: string): HTMLElement;
}
interface Document {
    createElement(tagName: "div"): HTMLDivElement;
    createElement(tagName: "span"): HTMLSpanElement;
    createElement(tagName: "canvas"): HTMLCanvasElement;
}
```

这三个接口合并成一个声明。
注意每组接口里的声明顺序保持不变，只是靠后的接口会出现在它前面的接口声明之前。

```TypeScript
interface Document {
    createElement(tagName: "div"): HTMLDivElement;
    createElement(tagName: "span"): HTMLSpanElement;
    createElement(tagName: "canvas"): HTMLCanvasElement;
    createElement(tagName: string): HTMLElement;
    createElement(tagName: any): Element;
}
```


# 合并模块

与接口相似，同名的模块也会合并其成员。
模块会创建出命名空间和值，我们需要知道这两者都是怎么合并的。

命名空间的合并，模块导出的同名接口进行合并，构成单一命名空间内含合并后的接口。

值的合并，如果当前已经存在给定名字的模块，那么后来的模块的导出成员会被加到已经存在的那个模块里。

`Animals`声明合并示例：

```TypeScript
module Animals {
    export class Zebra { }
}

module Animals {
    export interface Legged { numberOfLegs: number; }
    export class Dog { }
}
```

等同于：

```TypeScript
module Animals {
    export interface Legged { numberOfLegs: number; }

    export class Zebra { }
    export class Dog { }
}
```

除了这些合并外，你还需要了解非导出成员是如何处理的。
非导出成员仅在其原始存在于的模块（未合并的）之内可见。这就是说合并之后，从其它模块合并进来的成员无法访问非导出成员了。

下例提供了更清晰的说明：

```TypeScript
module Animal {
    var haveMuscles = true;

    export function animalsHaveMuscles() {
        return haveMuscles;
    }
}

module Animal {
    export function doAnimalsHaveMuscles() {
        return haveMuscles;  // <-- error, haveMuscles is not visible here
    }
}
```

因为`haveMuscles`并没有导出，只有`animalsHaveMuscles`函数共享了原始未合并的模块可以访问这个变量。
`doAnimalsHaveMuscles`函数虽是合并模块的一部分，但是访问不了未导出的成员。

# 模块与类和函数和枚举类型合并

模块可以与其它类型的声明进行合并。
只要模块的定义符合将要合并类型的定义。合并结果包含两者的声明类型。
Typescript使用这个功能去实现一些JavaScript里的设计模式。

首先，尝试将模块和类合并。
这让我们可以定义内部类。

```TypeScript
class Album {
    label: Album.AlbumLabel;
}
module Album {
    export class AlbumLabel { }
}
```

合并规则与上面`合并模块`小节里讲的规则一致，我们必须导出`AlbumLabel`类，好让合并的类能访问。
合并结果是一个类并带有一个内部类。
你也可以使用模块为类增加一些静态属性。

除了内部类的模式，你在JavaScript里，创建一个函数稍后扩展它增加一些属性也是很常见的。
Typescript使用声明合并来达到这个目的并保证类型安全。

```TypeScript
function buildLabel(name: string): string {
    return buildLabel.prefix + name + buildLabel.suffix;
}

module buildLabel {
    export var suffix = "";
    export var prefix = "Hello, ";
}

alert(buildLabel("Sam Smith"));
```

相似的，模块可以用来扩展枚举型：

```TypeScript
enum Color {
    red = 1,
    green = 2,
    blue = 4
}

module Color {
    export function mixColor(colorName: string) {
        if (colorName == "yellow") {
            return Color.red + Color.green;
        }
        else if (colorName == "white") {
            return Color.red + Color.green + Color.blue;
        }
        else if (colorName == "magenta") {
            return Color.red + Color.blue;
        }
        else if (colorName == "cyan") {
            return Color.green + Color.blue;
        }
    }
}
```

# 非法的合并

并不是所有的合并都被允许。
现在，类不能与类合并，变量与类型不能合并，接口与类不能合并。
想要模仿类的合并，请参考[Mixins in TypeScript](./Mixins.md)。
