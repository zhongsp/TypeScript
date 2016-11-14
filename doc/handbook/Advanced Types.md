# 交叉类型（Intersection Types）

交叉类型是将多个类型合并为一个类型。
这让我们可以把现有的多种类型叠加到一起成为一种类型，它包含了所需的所有类型的特性。
例如，`Person & Serializable & Loggable`同时是`Person`*和*`Serializable`*和*`Loggable`。
就是说这个类型的对象同时拥有了这三种类型的成员。

我们大多是在混入（mixins）或其它不适合典型面向对象模型的地方看到交叉类型的使用。
（在JavaScript里发生这种情况的场合很多！）
下面是如何创建混入的一个简单例子：

```ts
function extend<T, U>(first: T, second: U): T & U {
    let result = <T & U>{};
    for (let id in first) {
        (<any>result)[id] = (<any>first)[id];
    }
    for (let id in second) {
        if (!result.hasOwnProperty(id)) {
            (<any>result)[id] = (<any>second)[id];
        }
    }
    return result;
}

class Person {
    constructor(public name: string) { }
}
interface Loggable {
    log(): void;
}
class ConsoleLogger implements Loggable {
    log() {
        // ...
    }
}
var jim = extend(new Person("Jim"), new ConsoleLogger());
var n = jim.name;
jim.log();
```

# 联合类型

联合类型与交叉类型很有关联，但是使用上却完全不同。
偶尔你会遇到这种情况，一个代码库希望传入`number`或`string`类型的参数。
例如下面的函数：

```ts
/**
 * Takes a string and adds "padding" to the left.
 * If 'padding' is a string, then 'padding' is appended to the left side.
 * If 'padding' is a number, then that number of spaces is added to the left side.
 */
function padLeft(value: string, padding: any) {
    if (typeof padding === "number") {
        return Array(padding + 1).join(" ") + value;
    }
    if (typeof padding === "string") {
        return padding + value;
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}

padLeft("Hello world", 4); // returns "    Hello world"
```

`padLeft`存在一个问题，`padding`参数的类型指定成了`any`。
这就是说我们可以传入一个既不是`number`也不是`string`类型的参数，但是TypeScript却不报错。

```ts
let indentedString = padLeft("Hello world", true); // 编译阶段通过，运行时报错
```

在传统的面向对象语言里，我们可能会将这两种类型抽象成有层级的类型。
这么做显然是非常清晰的，但同时也存在了过度设计。
`padLeft`原始版本的好处之一是允许我们传入原始类型。
这样做的话使用起来既简单又方便。
如果我们就是想使用已经存在的函数的话，这种新的方式就不适用了。

代替`any`， 我们可以使用*联合类型*做为`padding`的参数：

```ts
/**
 * Takes a string and adds "padding" to the left.
 * If 'padding' is a string, then 'padding' is appended to the left side.
 * If 'padding' is a number, then that number of spaces is added to the left side.
 */
function padLeft(value: string, padding: string | number) {
    // ...
}

let indentedString = padLeft("Hello world", true); // errors during compilation
```

联合类型表示一个值可以是几种类型之一。
我们用竖线（`|`）分隔每个类型，所以`number | string | boolean`表示一个值可以是`number`，`string`，或`boolean`。

如果一个值是联合类型，我们只能访问此联合类型的所有类型里共有的成员。

```ts
interface Bird {
    fly();
    layEggs();
}

interface Fish {
    swim();
    layEggs();
}

function getSmallPet(): Fish | Bird {
    // ...
}

let pet = getSmallPet();
pet.layEggs(); // okay
pet.swim();    // errors
```

这里的联合类型可能有点复杂，但是你很容易就习惯了。
如果一个值的类型是`A | B`，我们能够*确定*的是它包含了`A`*和*`B`中共有的成员。
这个例子里，`Bird`具有一个`fly`成员。
我们不能确定一个`Bird | Fish`类型的变量是否有`fly`方法。
如果变量在运行时是`Fish`类型，那么调用`pet.fly()`就出错了。

# 类型保护与区分类型

联合类型非常适合这样的情形，可接收的值有不同的类型。
当我们想明确地知道是否拿到`Fish`时会怎么做？
JavaScript里常用来区分2个可能值的方法是检查它们是否存在。
像之前提到的，我们只能访问联合类型的所有类型中共有的成员。

```ts
let pet = getSmallPet();

// 每一个成员访问都会报错
if (pet.swim) {
    pet.swim();
}
else if (pet.fly) {
    pet.fly();
}
```

为了让这段代码工作，我们要使用类型断言：

```ts
let pet = getSmallPet();

if ((<Fish>pet).swim) {
    (<Fish>pet).swim();
}
else {
    (<Bird>pet).fly();
}
```

## 用户自定义的类型保护

可以注意到我们使用了多次类型断言。
如果我们只要检查过一次类型，就能够在后面的每个分支里清楚`pet`的类型的话就好了。

TypeScript里的*类型保护*机制让它成为了现实。
类型保护就是一些表达式，它们会在运行时检查以确保在某个作用域里的类型。
要定义一个类型保护，我们只要简单地定义一个函数，它的返回值是一个*类型断言*：

```ts
function isFish(pet: Fish | Bird): pet is Fish {
    return (<Fish>pet).swim !== undefined;
}
```

在这个例子里，`pet is Fish`就是类型断言。
一个断言是`parameterName is Type`这种形式，`parameterName`必须是来自于当前函数签名里的一个参数名。

每当使用一些变量调用`isFish`时，TypeScript会将变量缩减为那个具体的类型，只要这个类型与变量的原始类型是兼容的。

```ts
// 'swim' 和 'fly' 调用都没有问题了

if (isFish(pet)) {
    pet.swim();
}
else {
    pet.fly();
}
```

注意TypeScript不仅知道在`if`分支里`pet`是`Fish`类型；
它还清楚在`else`分支里，一定*不是*`Fish`类型，一定是`Bird`类型。

## `typeof`类型保护

现在我们回过头来看看怎么使用联合类型书写`padLeft`代码。
我们可以像下面这样利用类型断言来写：

```ts
function isNumber(x: any): x is number {
    return typeof x === "number";
}

function isString(x: any): x is string {
    return typeof x === "string";
}

function padLeft(value: string, padding: string | number) {
    if (isNumber(padding)) {
        return Array(padding + 1).join(" ") + value;
    }
    if (isString(padding)) {
        return padding + value;
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}
```

然而，必须要定义一个函数来判断类型是否是原始类型，这太痛苦了。
幸运的是，现在我们不必将`typeof x === "number"`抽象成一个函数，因为TypeScript可以将它识别为一个类型保护。
也就是说我们可以直接在代码里检查类型了。

```ts
function padLeft(value: string, padding: string | number) {
    if (typeof padding === "number") {
        return Array(padding + 1).join(" ") + value;
    }
    if (typeof padding === "string") {
        return padding + value;
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}
```

这些*`typeof`类型保护*只有两种形式能被识别：`typeof v === "typename"`和`typeof v !== "typename"`，`"typename"`必须是`"number"`，`"string"`，`"boolean"`或`"symbol"`。
但是TypeScript并不会阻止你与其它字符串比较，语言不会把那些表达式识别为类型保护。

## `instanceof`类型保护

如果你已经阅读了`typeof`类型保护并且对JavaScript里的`instanceof`操作符熟悉的话，你可能已经猜到了这节要讲的内容。

*`instanceof`类型保护*是通过构造函数来细化类型的一种方式。
比如，我们借鉴一下之前字符串填充的例子：

```ts
interface Padder {
    getPaddingString(): string
}

class SpaceRepeatingPadder implements Padder {
    constructor(private numSpaces: number) { }
    getPaddingString() {
        return Array(this.numSpaces + 1).join(" ");
    }
}

class StringPadder implements Padder {
    constructor(private value: string) { }
    getPaddingString() {
        return this.value;
    }
}

function getRandomPadder() {
    return Math.random() < 0.5 ?
        new SpaceRepeatingPadder(4) :
        new StringPadder("  ");
}

// 类型为SpaceRepeatingPadder | StringPadder
let padder: Padder = getRandomPadder();

if (padder instanceof SpaceRepeatingPadder) {
    padder; // 类型细化为'SpaceRepeatingPadder'
}
if (padder instanceof StringPadder) {
    padder; // 类型细化为'StringPadder'
}
```

`instanceof`的右侧要求是一个构造函数，TypeScript将细化为：

1. 此构造函数的`prototype`属性的类型，如果它的类型不为`any`的话
2. 构造签名所返回的类型的联合

以此顺序。

# 类型别名

类型别名会给一个类型起个新名字。
类型别名有时和接口很像，但是可以作用于原始值，联合类型，元组以及其它任何你需要手写的类型。

```ts
type Name = string;
type NameResolver = () => string;
type NameOrResolver = Name | NameResolver;
function getName(n: NameOrResolver): Name {
    if (typeof n === 'string') {
        return n;
    }
    else {
        return n();
    }
}
```

起别名不会新建一个类型 - 它创建了一个新*名字*来引用那个类型。
给原始类型起别名通常没什么用，尽管可以做为文档的一种形式使用。

同接口一样，类型别名也可以是泛型 - 我们可以添加类型参数并且在别名声明的右侧传入：

```ts
type Container<T> = { value: T };
```

我们也可以使用类型别名来在属性里引用自己：

```ts
type Tree<T> = {
    value: T;
    left: Tree<T>;
    right: Tree<T>;
}
```

与交叉类型一起使用，我们可以创建出一些非常令人费解的类型。

```ts
type LinkedList<T> = T & { next: LinkedList<T> };

interface Person {
    name: string;
}

var people: LinkedList<Person>;
var s = people.name;
var s = people.next.name;
var s = people.next.next.name;
var s = people.next.next.next.name;
```

然而，类型别名不能出现在声明右侧的任何地方。

```ts
type Yikes = Array<Yikes>; // error
```

## 接口 vs. 类型别名

像我们提到的，类型别名可以像接口一样；然而，仍有一些细微差别。

其一，接口创建了一个新的名字，可以在其它任何地方使用。
类型别名并不创建新名字&mdash;比如，错误信息就不会使用别名。
在下面的示例代码里，在编译器中将鼠标悬停在`interfaced`上，显示它返回的是`Interface`，但悬停在`aliased`上时，显示的却是对象字面量类型。

```ts
type Alias = { num: number }
interface Interface {
    num: number;
}
declare function aliased(arg: Alias): Alias;
declare function interfaced(arg: Interface): Interface;
```

另一个重要区别是类型别名不能被`extends`和`implements`（自己也不能`extends`和`implements`其它类型）。
因为[软件中的对象应该对于扩展是开放的，但是对于修改是封闭的](https://en.wikipedia.org/wiki/Open/closed_principle)，你应该尽量去使用接口代替类型别名。

另一方面，如果你无法通过接口来描述一个类型并且需要使用联合类型或元组类型，这时通常会使用类型别名。

# 字符串字面量类型

字符串字面量类型允许你指定字符串必须的固定值。
在实际应用中，字符串字面量类型可以与联合类型，类型保护和类型别名很好的配合。
通过结合使用这些特性，你可以实现类似枚举类型的字符串。

```ts
type Easing = "ease-in" | "ease-out" | "ease-in-out";
class UIElement {
    animate(dx: number, dy: number, easing: Easing) {
        if (easing === "ease-in") {
            // ...
        }
        else if (easing === "ease-out") {
        }
        else if (easing === "ease-in-out") {
        }
        else {
            // error! should not pass null or undefined.
        }
    }
}

let button = new UIElement();
button.animate(0, 0, "ease-in");
button.animate(0, 0, "uneasy"); // error: "uneasy" is not allowed here
```

你只能从三种允许的字符中选择其一来做为参数传递，传入其它值则会产生错误。

```text
Argument of type '"uneasy"' is not assignable to parameter of type '"ease-in" | "ease-out" | "ease-in-out"'
```

字符串字面量类型还可以用于区分函数重载：

```ts
function createElement(tagName: "img"): HTMLImageElement;
function createElement(tagName: "input"): HTMLInputElement;
// ... more overloads ...
function createElement(tagName: string): Element {
    // ... code goes here ...
}
```

# 可辨识联合（Discriminated Unions）

你可以合并字符串字面量类型，联合类型，类型保护和类型别名来创建一个叫做*可辨识联合*的高级模式，它也称做*标签联合*或*代数数据类型*。
可辨识联合在函数式编程很有用处。
一些语言会自动地为你辨识联合；而TypeScript则基于已有的JavaScript模式。
它具有4个要素：

1. 具有普通的字符串字面量属性&mdash;*可辨识的特征*。
2. 一个类型别名包含了那些类型的联合&mdash;*联合*。
3. 此属性上的类型保护。

```ts
interface Square {
    kind: "square";
    size: number;
}
interface Rectangle {
    kind: "rectangle";
    width: number;
    height: number;
}
interface Circle {
    kind: "circle";
    radius: number;
}
```

首先我们声明了将要联合的接口。
每个接口都有`kind`属性但有不同的字符串字面量类型。
`kind`属性称做*可辨识的特征*或*标签*。
其它的属性则特定于各个接口。
注意，目前各个接口间是没有联系的。
下面我们把它们联合到一起：

```ts
type Shape = Square | Rectangle | Circle;
```

现在我们使用可辨识联合:

```ts
function area(s: Shape) {
    switch (s.kind) {
        case "square": return s.size * s.size;
        case "rectangle": return s.height * s.width;
        case "circle": return Math.PI * s.radius ** 2;
    }
}
```

## 完整性检查

当没有涵盖所有可辨识联合的变化时，我们想让编译器可以通知我们。
比如，如果我们添加了`Triangle`到`Shape`，我们同时还需要更新`area`:

```ts
type Shape = Square | Rectangle | Circle | Triangle;
function area(s: Shape) {
    switch (s.kind) {
        case "square": return s.size * s.size;
        case "rectangle": return s.height * s.width;
        case "circle": return Math.PI * s.radius ** 2;
    }
    // should error here - we didn't handle case "triangle"
}
```

有两种方式可以实现。
首先是启用`--strictNullChecks`并且指定一个返回值类型：

```ts
function area(s: Shape): number { // error: returns number | undefined
    switch (s.kind) {
        case "square": return s.size * s.size;
        case "rectangle": return s.height * s.width;
        case "circle": return Math.PI * s.radius ** 2;
    }
}
```

因为`switch`没有包涵所有情况，所以TypeScript认为这个函数有时候会返回`undefined`。
如果你明确地指定了返回值类型为`number`，那么你会看到一个错误，因为实际上返回值的类型为`number | undefined`。
然而，这种方法存在些微妙之处且`--strictNullChecks`对旧代码支持不好。

第二种方法使用`never`类型，编译器用它来进行完整性检查：

```ts
function assertNever(x: never): never {
    throw new Error("Unexpected object: " + x);
}
function area(s: Shape) {
    switch (s.kind) {
        case "square": return s.size * s.size;
        case "rectangle": return s.height * s.width;
        case "circle": return Math.PI * s.radius ** 2;
        default: return assertNever(s); // error here if there are missing cases
    }
}
```

这里，`assertNever`检查`s`是否为`never`类型&mdash;即为除去所有可能情况后剩下的类型。
如果你忘记了某个case，那么`s`将具有一个真实的类型并且你会得到一个错误。
这种方式需要你定义一个额外的函数，但是在你忘记某个case的时候也更加明显。

# 多态的`this`类型

多态的`this`类型表示的是某个包含类或接口的*子类型*。
这被称做*F*-bounded多态性。
它能很容易的表现连贯接口间的继承，比如。
在计算器的例子里，在每个操作之后都返回`this`类型：

```ts
class BasicCalculator {
    public constructor(protected value: number = 0) { }
    public currentValue(): number {
        return this.value;
    }
    public add(operand: number): this {
        this.value += operand;
        return this;
    }
    public multiply(operand: number): this {
        this.value *= operand;
        return this;
    }
    // ... other operations go here ...
}

let v = new BasicCalculator(2)
            .multiply(5)
            .add(1)
            .currentValue();
```

由于这个类使用了`this`类型，你可以继承它，新的类可以直接使用之前的方法，不需要做任何的改变。

```ts
class ScientificCalculator extends BasicCalculator {
    public constructor(value = 0) {
        super(value);
    }
    public sin() {
        this.value = Math.sin(this.value);
        return this;
    }
    // ... other operations go here ...
}

let v = new ScientificCalculator(2)
        .multiply(5)
        .sin()
        .add(1)
        .currentValue();
```

如果没有`this`类型，`ScientificCalculator`就不能够在继承`BasicCalculator`的同时还保持接口的连贯性。
`multiply`将会返回`BasicCalculator`，它并没有`sin`方法。
然而，使用`this`类型，`multiply`会返回`this`，在这里就是`ScientificCalculator`。
