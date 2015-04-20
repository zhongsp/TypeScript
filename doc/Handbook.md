# TypeScript手册

翻译：钟胜平（[@zhongsp](https://github.com/zhongsp)）

2015年4月

TypeScript是微软公司的注册商标.

## 目录

* [基本类型](#基本类型)
  * [Boolean](#boolean)
  * [Number](#number)
  * [String](#string)
  * [Array](#array)
  * [Enum](#enum)
  * [Any](#any)
  * [Void](#void)
* [接口](#接口)
  * [第一个接口例子](#第一个接口例子)
  * [可选属性](#可选属性)
  * [函数类型](#函数类型)
  * [数组类型](#数组类型)
  * [类类型](#类类型)
  * [扩展接口](#扩展接口)
  * [混合类型](#混合类型)
* [类](#类)
  * [类](#Classes)
  * [继承](#继承)
  * [公共与私有的修饰语](#公共与私有修饰语)
  * [存取器](#存取器)
  * [静态属性](#静态属性)
  * [高级技巧](#高级技巧)
* [模块](#模块)
  * [多文件中的模块](#多文件中的模块)
  * [外部模块](#外部模块)
  * [Export =](#Export =)
  * [别名](#别名)
  * [可选模块的加载与其它高级加载的场景](#可选模块的加载与其它高级加载的场景)
  * [使用其它JavaScript库](#使用其它JavaScript库)
  * [模块陷井](#模块陷井)
* [函数](#函数)
  * [函数](#functions)
  * [函数类型](#函数类型)
  * [可选参数和默认参数](#可选参数和默认参数)
  * [剩余参数](#剩余参数)
  * [Lambda表达式和使用‘this’](#lambda)
  * [重载](#重载)
* [泛型](#泛型)
  * [Hello World泛型](#Hello World泛型)
  * [使用泛型变量](#使用泛型变量)
  * [泛型类型](#泛型类型)
  * [泛型类](#泛型类)
  * [泛型约束](#泛型约束)
* [常见错误](#常见错误)
  * [常见疑难问题](#常见疑难问题)
* [Mixins](#Mixins)
  * [Mixin 例子](#Mixin 例子)
  * [理解这个例子](#理解这个例子)
* [声明合并](#声明合并)
  * [基础概念](#基础概念)
  * [合并接口](#合并接口)
  * [合并模块](#合并模块)
  * [模块与类和函数和枚举类型合并](#模块与类和函数和枚举类型合并)
  * [无效的合并](#无效的合并)
* [类型推断](#类型推断)
  * [基础](#基础)
  * [最佳通用类型](#最佳通用类型)
  * [上下文类型](#上下文类型)
* [类型兼容性](#类型兼容性)
  * [开始](#开始)
  * [比较两个函数](#比较两个函数)
  * [Enums](#Enums)
  * [Classes](#Classes)
  * [Generics](#Generics)
  * [高级主题](#高级主题)
* [书写.d.ts文件](#书写.d.ts文件)
  * [指导与说明](#指导与说明)
  * [例子](#例子)

## 基本类型

为了写出有用的程序，我们需要有能力去处理简单的数据单位：数字，字符串，结构，布尔值等。在TypeScript里，包含了与JavaScript中几乎相同的数据类型，此外还有便于我们操作的枚举类型。

### Boolean

最基本的数据类型就是true/false值，在JavaScript和TypeScript里叫做布尔值。

```typescript
var isDone: boolean = false;
```

### Number

与JavaScript一样，所有的数字在TypeScript里都是浮点数。它们的类型是‘number’。

```typescript
var height: number = 6;
```

### String

像其它语言里一样，我们使用‘string’表示文本数据类型。与JavaScript里相同，可以使用双引号（"）或单引号（'）表示字符串。

```typescript
var name: string = "bob";
name = "smith";
```

### Array

TypeScript像JavaScript一样，允许你操作数组数据。可以用两种方式定义数组。第一种，可以在元素类型后面接‘[]’，表示由此此类元素构成的一个数组：

```typescript
var list:number[] = [1, 2 ,3];
```

第二种方式是使用数组泛型，Array<元素类型>：

```typescript
var list:Array<number> = [1, 2, 3];
```

### Enum

‘enum’类型是对标准JavaScript数据类型的一个补充。像其它语言，如C#，使用枚举类型可以为一组数值赋予友好的名字。

```typescript
enum Color {Red, Green, Blue};
var c: Color = Color.Green;
```

默认情况下，从0开始为元素编号。你也可以手动的指定成员的数值。例如，我们将上面的例子改成从1开始编号：

```typescript
enum Color {Red = 1, Green, Blue};
var c: Color = Color.Green;
```

或者，全部都采用手动赋值：

```typescript
enum Color {Red = 1, Green = 2, Blue = 4};
var c: Color = Color.Green;
```

枚举类型一个便利的特点是，你可以从枚举的值取出它的名字。例如，我们知道数值2，但是不确认它映射到Color里的哪个名字，我们可以查找相应的名字：

```typescript
enum Color {Red = 1, Green, Blue};
var colorName: string = Color[2];

alert(colorName);
```

### Any

有时，我们可能会为暂时还不清楚的变量指定类型。这些值可能来自于动态的内容，比如第三方程序库。这种情况下，我们不希望类型检查器对这些值进行检查或者说让它们直接通过编译阶段的检查。这时，我们可以使用‘any’类型来标记这些变量：

```typescript
var notSure: any = 4;
notSure = "maybe a string instead";
notSure = false; // okay，definitely a boolean
```

在对现有代码进行改写的时候，‘any’类型是十分有用的，它允许你在编译时可选择地包含或移除类型检查。

当你仅仅知道一部分数据的类型时，‘any’类型也是很有用的。比如，你有一个数组，它包含了不同的数据类型：

```typescript
var list:any[] = [1, true, "free"];

list[1] = 100;
```

### Void

某种程度上来说，‘void’类型与‘any’类型是相反的，表示没有任何类型。当一个函数不返回任何值是，你通常会见到其返回值类型是‘void’：

```typescript
function warnUser(): void {
    alert("This is my warning message");
}
```

## 接口

TypeScript的核心原则之一是对值所具有的‘shape’进行类型检查。它有时被称做鸭子类型或结构性子类型。在TypeScript里，接口负责为这样的类型命名，它可以为你的代码或第三方代码定义契约。

### 第一个接口例子

下面来看一个很简单的例子：

```typescript
function printLabel(labelledObj: {label: string}) {
  console.log(labelledObj.label);
}

var myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
```

类型检查器查看‘printLabel’的调用。‘printLabel’有一个参数，这个参数应该是一个对象，它拥有一个名字是‘label’并且类型为‘string’的属性。需要注意的是，我们传入的对象可能有很多个属性，但是编译器要求至少存在‘label’属性，并且其类型是‘string’：

```typescript
interface LabelledValue {
  label: string;
}

function printLabel(labelledObj: LabelledValue) {
  console.log(labelledObj.label);
}

var myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
```

LabelledValue接口可以用来描述上面例子里的契约：应该具有一个类型是‘string’，名字是‘label’的属性。需要注意的是，在这里我们并不能像在其它语言里一样，说labelledObj实现了LabelledValue接口。我们关注的只是值的‘shape’。只要传入的对象满足上面提到的必须条件，那么就会通过检查。

### 可选属性

接口里的属性并不是全部是必须的。有些是在某些条件下存在，而有的则根本不需要。这在使用‘option bags’模式时很有用，即给函数传入的对象中仅存在一部分属性。

下面是应用了‘option bags’的例子：

```typescript
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): {color: string; area: number} {
  var newSquare = {color: "white", area: 100};
  if (config.color) {
    newSquare.color = config.color;
  }
  if (config.width) {
    newSquare.area = config.width * config.width;
  }
  return newSquare;
}

var mySquare = createSquare({color: "black"});
```

带有可选属性的接口与普通的接口定义差不多，只是在可选属性名字定义的后面加一个‘?’符号。

可选属性的好处之一是可以对可能存在的属性进行预定义，好处之二是可以捕获使用了不存在的属性时的错误。比如，我们故意错误的拼写传入‘createSquare’的属性名collor，我们会得到一个错误提示。

```typescript
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): {color: string; area: number} {
  var newSquare = {color: "white", area: 100};
  if (config.color) {
    newSquare.color = config.collor;  // Type-checker can catch the mistyped name here
  }
  if (config.width) {
    newSquare.area = config.width * config.width;
  }
  return newSquare;
}

var mySquare = createSquare({color: "black"});
```

### 函数类型

接口可以描述大部分JavaScript中的对象类型。除了描述带有属性的普通对象外，接口也可以表示函数类型。

我们可以给接口定义一个*调用签名*来描述函数类型。它就像是一个只有参数列表和返回值类型的函数定义。

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}
```

这样定义后，我们可以像使用其它接口一样使用这个函数接口。下例展示了如何创建一个函数类型的变量，并赋予一个同类型的函数值。

```typescript
var mySearch: SearchFunc;
mySearch = function(source: string, subString: string) {
  var result = source.search(subString);
  if (result == -1) {
    return false;
  }
  else {
    return true;
  }
}
```

对于函数类型的类型检查来说，函数的参数名不需要与接口里定义的名字相匹配。比如，我们也用下面的代码重写上面的例子：

```typescript
var mySearch: SearchFunc;
mySearch = function(src: string, sub: string) {
  var result = src.search(sub);
  if (result == -1) {
    return false;
  }
  else {
    return true;
  }
}
```

函数的参数是参照其位置依次的检查。函数的返回值类型是通过其返回值推断出来的（此例是false和true）。如果让这个函数返回数字或字符串，类型检查器会警告我们函数的返回值类型与SearchFunc接口中的定义不匹配。

### 数组类型

与使用接口描述函数类型差不多，我们也可以描述数组类型。数组类型具有一个‘index’类型表示索引的类型与相应的返回值类型。

```typescript
interface StringArray {
  [index: number]: string;
}

var myArray: StringArray;
myArray = ["Bob", "Fred"];
```

共有两种支持的索引类型：字符串和数字。你可以为一个数组同时指定这两种索引类型，但是有一个限制，数字索引返回值的类型必须是字符串索引返回值的类型的子类型。

索引签名可以很好的描述数组和‘字典’模式，它们也强制所有属性都与索引返回值类型相匹配。下面的例子里，length属性不匹配索引返回值类型，所以类型检查器给出一个错误提示：

```typescript
interface Dictionary {
  [index: string]: string;
  length: number;    // error, the type of 'length' is not a subtype of the indexer
}
```

### 类类型

#### 实现接口

与在C#或Java里接口的基本作用一样，在TypeScript里它可以明确的强制一个类去符合某种契约。

```typescript
interface ClockInterface {
    currentTime: Date;
}

class Clock implements ClockInterface  {
    currentTime: Date;
    constructor(h: number, m: number) { }
}
```

你也可以在接口中描述一个方法，在类里实现它，如同下面的‘setTime’方法一样：

```typescript
interface ClockInterface {
    currentTime: Date;
    setTime(d: Date);
}

class Clock implements ClockInterface  {
    currentTime: Date;
    setTime(d: Date) {
        this.currentTime = d;
    }
    constructor(h: number, m: number) { }
}
```

接口描述了类的公共部分，而不是公共和私有两部分。它不会帮你检查类是否具有某些私有成员。

#### 静态成员与类实例的差别

当你操作类和接口的时候，你要知道类是具有两个类型的：静态部分的类型和实例的类型。你会注意到，当你用构造器签名去定义一个接口并试图定义一个类去实现这个接口时会得到一个错误：

```typescript
interface ClockInterface {
    new (hour: number, minute: number);
}

class Clock implements ClockInterface  {
    currentTime: Date;
    constructor(h: number, m: number) { }
}
```

这里因为当一个类实现了一个接口时，只对其实例部分进行类型检查。‘constructor’存在于类的静态部分，所以不在检查的范围内。

取而代之，我们应该直接操作类的静态部分。看下面的例子：

```typescript
interface ClockStatic {
    new (hour: number, minute: number);
}

class Clock {
    currentTime: Date;
    constructor(h: number, m: number) { }
}

var cs: ClockStatic = Clock;
var newClock = new cs(7, 30);
```

### 扩展接口

和类一样，接口也可以相互扩展。扩展接口时会将其它接口里的属性拷贝到这个接口里，因此允许你把接口拆分成单独的可重用的组件。

```typescript
interface Shape {
    color: string;
}

interface Square extends Shape {
    sideLength: number;
}

var square = <Square>{};
square.color = "blue";
square.sideLength = 10;
```

一个接口可以继承多个接口，创建出多个接口的组合接口。

```typescript
interface Shape {
    color: string;
}

interface PenStroke {
    penWidth: number;
}

interface Square extends Shape, PenStroke {
    sideLength: number;
}

var square = <Square>{};
square.color = "blue";
square.sideLength = 10;
square.penWidth = 5.0;
```

### 混合类型

先前我们提过，接口可以描述在JavaScript里存在的丰富的类型。因为JavaScript其动态灵活的特点，有时你会希望一个对象可以同时具有上面提到的多种类型。

一个例子就是，一个对象可以同时做为函数和对象使用，并带有额外的属性。

```typescript
interface Counter {
    (start: number): string;
    interval: number;
    reset(): void;
}

var c: Counter;
c(10);
c.reset();
c.interval = 5.0;
```

使用第三方库的时候，你可能会上面那样去详细的定义类型。

## 类

传统的JavaScript程序使用函数和基于原型的继承来创建可重用的组件，但这对于熟悉使用面向对象方式的程序员来说有些棘手，因为他们用的是基于类的继承并且对象是从类构建出来的。从JavaScript的下个版本ECMAScript6开始，JavaScript程序将可以使用这种基于类的面向对象方法。在TypeScript里，我们允许开发者现在就使用这些特性，并且编译后的JavaScript可以在所有主流浏览器和平台上运行，而不需要等到下个JavaScript版本。

### Classes

下面看一个类的例子：

```typescript
class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}

var greeter = new Greeter("world");
```

如果你使用过C#或Java，你会对这种语法非常熟悉。我们声明一个‘Greeter’类。这个类有3个成员：一个叫做‘greeting’的属性，一个构造函数和一个‘greet’方法.

你会注意到，我们在引用任何一个类成员的时候都用了‘this’，它表示我们访问的是类的成员。

最后一行，我们使用‘new’构造了Greeter类的一个实例。它会调用之前定义的构造函数，创建一个Greeter类型的新对象，并执行构造函数初始化它。

### 继承

在TypeScript里，我们可以使用常用的面向对象模式。当然，基于类的程序设计中最基本的模式是允许使用继承来扩展一个类。

看下面的例子：

```typescript
class Animal {
    name: string;
    constructor(theName: string) { this.name = theName; }
    move(meters: number = 0) {
        alert(this.name + " moved " + meters + "m.");
    }
}

class Snake extends Animal {
    constructor(name: string) { super(name); }
    move(meters = 5) {
        alert("Slithering...");
        super.move(meters);
    }
}

class Horse extends Animal {
    constructor(name: string) { super(name); }
    move(meters = 45) {
        alert("Galloping...");
        super.move(meters);
    }
}

var sam = new Snake("Sammy the Python");
var tom: Animal = new Horse("Tommy the Palomino");

sam.move();
tom.move(34);
```

这个例子展示了TypeScript中继承的一些特征，与其它语言类似。我们使用‘extends’来创建子类。你可以看到‘Horse’和‘Snake’类是基类‘Animal’的子类，并且可以访问其属性和方法。

这个例子也说明了，在子类里可以重写父类的方法。‘Snake’类和‘Horse’类都创建了‘move’方法，重写了从‘Animal’继承来的‘move’方法，使得‘move’方法根据不同的类而具有不同的功能。

### 公共与私有的修饰语

#### 默认为public

你会注意到，上面的例子中我们没有用‘public’去修饰任何类成员的可见性。在C#里需要使用‘public’明确地指定成员的可见性。在TypeScript里，所有成员都默认为public。

你也可以把成员标记为‘private’来控制什么是可以在类外部访问的。我们重写一下上面的‘Animal’类：

```typescript
class Animal {
    private name: string;
    constructor(theName: string) { this.name = theName; }
    move(meters: number) {
        alert(this.name + " moved " + meters + "m.");
    }
}
```

#### 理解private

TypeScript使用的是结构性类型系统。当我们比较两种不同的类型时，并不在乎它们从哪儿来的，如果它们中每个成员的类型都是兼容的，我们就说这两个类型是兼容的。

当我们比较具有‘private’成员的类型的时候，会稍有不同。如果一个类型中有个私有成员，那么只有另外一个类型中也存在这样一个私有成员并且它们必须来自同一处定义，我们才认为这两个类型是兼容的。

下面来看一个例子，详细的解释了这点：

```typescript
class Animal {
    private name: string;
    constructor(theName: string) { this.name = theName; }
}

class Rhino extends Animal {
  constructor() { super("Rhino"); }
}

class Employee {
    private name:string;
    constructor(theName: string) { this.name = theName; }
}

var animal = new Animal("Goat");
var rhino = new Rhino();
var employee = new Employee("Bob");

animal = rhino;
animal = employee; //error: Animal and Employee are not compatible
```

这个例子中有‘Animal’和‘Rhino’两个类，‘Rhino’是‘Animal’类的子类。还有一个‘Employee’类，其类型看上去与‘Animal’是相同的。我们创建了几个这些类的实例，并相互赋值来看看会发生什么。因为‘Animal’和‘Rhino’共享了来自‘Animal’里的私有成员定义‘private name: string’，因此它们是兼容的。然而‘Employee’却不是这样。当把‘Employee’赋值给‘Animal’的时候，得到一个错误，说它们的类型不兼容。尽管‘Employee’里也有一个私有成员‘name’，但它明显不是‘Animal’里面定义的那个。

#### 参数属性

‘public’和‘private’关键字也提供了一种简便的方法通过参数属性来创建和初始化类成员。参数属性让你一步就可以创建并初始化一个类成员。下面的代码改写了上面的例子。注意，我们删除了‘name’并直接使用‘private name: string’参数在构造函数里创建并初始化‘name’成员。

```typescript
class Animal {
    constructor(private name: string) { }
    move(meters: number) {
        alert(this.name + " moved " + meters + "m.");
    }
}
```

### 存取器

TypeScript支持getters/setters来截取对对象成员的访问。它能帮助你有效的控制对对象成员的访问。

下面来看如何把一类改写成使用‘get’和‘set’。首先是没用使用存取器的例子：

```typescript
class Employee {
    fullName: string;
}

var employee = new Employee();
employee.fullName = "Bob Smith";
if (employee.fullName) {
    alert(employee.fullName);
}
```

我们可以随意的设置fullName，这是非常方便的，但是这也可能会带来麻烦。

下面这个版本里，我们先检查用户密码是否正确，然后再允许其修改employee。我们把对fullName的直接访问改成了可以检查密码的‘set’方法。我们也加了一个get方法，让上面的例子仍然可以工作。

```typescript
var passcode = "secret passcode";

class Employee {
    private _fullName: string;

    get fullName(): string {
        return this._fullName;
    }
  
    set fullName(newName: string) {
        if (passcode && passcode == "secret passcode") {
            this._fullName = newName;
        }
        else {
            alert("Error: Unauthorized update of employee!");
        }
    }
}

var employee = new Employee();
employee.fullName = "Bob Smith";
if (employee.fullName) {
    alert(employee.fullName);
}
```

我们可以修改一下密码，来验证一下存取器是否是工作的。当密码不对时，会提示我们没有权限去修改employee。

注意：若要使用存取器，要求设置编译器输出目标为ECMAScript 5。

### 静态属性

到目前为止，我们只讨论了类的实例成员，那些仅当类被实例化的时候才会被初始化的属性。我们也可以创建类的静态成员，这些属性存在于类本身上面而不是类的实例上。在这个例子里，我们使用‘static’定义‘origin’，因为它是所有网格都会用到的属性。每个实例想要访问这个属性的时候，都要在origin前面加上类名。如同在实例属性上使用‘this.’前缀来访问属性一样，这里我们使用‘Grid.’来访问静态属性。

```typescript
class Grid {
    static origin = {x: 0, y: 0};
    calculateDistanceFromOrigin(point: {x: number; y: number;}) {
        var xDist = (point.x - Grid.origin.x);
        var yDist = (point.y - Grid.origin.y);
        return Math.sqrt(xDist * xDist + yDist * yDist) / this.scale;
    }
    constructor (public scale: number) { }
}

var grid1 = new Grid(1.0);  // 1x scale
var grid2 = new Grid(5.0);  // 5x scale

alert(grid1.calculateDistanceFromOrigin({x: 10, y: 10}));
alert(grid2.calculateDistanceFromOrigin({x: 10, y: 10}));
```

### 高级技巧

#### 构造函数

当你在TypeScript里定义类的时候，实际上同时定义了很多东西。首先是类的实例的类型。

```typescript
class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}

var greeter: Greeter;
greeter = new Greeter("world");
alert(greeter.greet());
```

在这里，我们写了‘var greeter: Greeter’，意思是Greeter类实例的类型是Greeter。这对于用过其它面向对象语言的程序员来讲已经是老习惯了。

我们也创建了一个叫做*构造函数*的值。这个函数会在我们使用‘new’创建类实例的时候被调用。下面我们来看看，上面的代码被编译成JavaScript后是什么样子的：

```javascript
var Greeter = (function () {
    function Greeter(message) {
        this.greeting = message;
    }
    Greeter.prototype.greet = function () {
        return "Hello, " + this.greeting;
    };
    return Greeter;
})();

var greeter;
greeter = new Greeter("world");
alert(greeter.greet());
```

上面的代码里，‘var Greeter’将被赋值为构造函数。当我们使用‘new’并执行这个函数后，便会得到一个类的实例。这个构造函数也包含了类的所有静态属性。换个角度说，我们可以认为类具有实例部分与静态部分这两个部分。

让我们来改写一下这个例子，看看它们之前的区别：

```typescript
class Greeter {
    static standardGreeting = "Hello, there";
    greeting: string;
    greet() {
        if (this.greeting) {
            return "Hello, " + this.greeting;
        }
        else {
            return Greeter.standardGreeting;
        }
    }
}

var greeter1: Greeter;
greeter1 = new Greeter();
alert(greeter1.greet());

var greeterMaker: typeof Greeter = Greeter;
greeterMaker.standardGreeting = "Hey there!";
var greeter2:Greeter = new greeterMaker();
alert(greeter2.greet());
```

这个例子里，‘greeter1’与之前看到的一样。

再之后，我们直接使用类。我们创建了一个叫做‘greeterMaker’的变量。这个变量保存了这个类或者说保存了类构造函数。然后我们使用‘typeof Greeter’，意思是取Greeter类的类型，而不是实例的类型。或者理确切的说，"告诉我Greeter标识符的类型"，也就是构造函数的类型。这个类型包含了类的所有静态成员和构造函数。之后，就和前面一样，我们在‘greeterMaker’上使用‘new’，创建‘Greeter’的实例。

#### 把类当做接口使用

如上一节里所讲的，类定义会创建两个东西：类实例的类型和一个构造函数。因为类可以创建出类型，所以你能够在可以使用接口的地方使用类。

```typescript
class Point {
    x: number;
    y: number;
}

interface Point3d extends Point {
    z: number;
}

var point3d: Point3d = {x: 1, y: 2, z: 3};
```

## 模块

这节会列出多种在TypeScript里组织代码的方法。我们将介绍内部和外部模块，以及如何在适合的地方使用它们。我们也会涉及到一些高级主题，如怎么使用外部模块，当使用TypeScript模块时如何避免常见的陷井。

**第一步**

让我们先写一段程序，我们将在整个小节中都使用这个例子。我们定义几个简单的字符串验证器，好比你会使用它们来验证表单里的用户输入或验证外部数据。

*所有的验证器都在一个文件里*

```typescript
interface StringValidator {
    isAcceptable(s: string): boolean;
}

var lettersRegexp = /^[A-Za-z]+$/;
var numberRegexp = /^[0-9]+$/;

class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
        return lettersRegexp.test(s);
    }
}

class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: StringValidator; } = {};
validators['ZIP code'] = new ZipCodeValidator();
validators['Letters only'] = new LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

**增加模块支持**

随着我们增加更多的验证器，我们想要将它们组织在一起来保持对它们的追踪记录并且不用担心与其它对象产生命名冲突。我们把验证器包裹到一个模块里，而不是把它们放在全局命名空间下。

这个例子里，我们把所有验证器相关的类型都放到一个叫做*Validation*的模块里。由于我们想在模块外这些接口和类都是可见的，我们需要使用*export*。相反地，变量*lettersRegexp*和*numberRegexp*是具体实现，所以没有使用export，因此它们在模块外部是不可见的。在测试代码的底部，使用模块导出内容的时候需要增加一些限制，比如*Validation.LettersOnlyValidator*。

*模块化的验证器*

```typescript
module Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }

    var lettersRegexp = /^[A-Za-z]+$/;
    var numberRegexp = /^[0-9]+$/;

    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }

    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: Validation.StringValidator; } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

### 多文件中的模块

当应用变得越来越大时，我们需要将代码分散到不同的文件中以便于维护。

现在，我们把Validation模块分散多个文件中。尽管是分开的文件，它们仍可以操作同一个模块，并且使用的时候就好像它们是定义在一个文件中一样。因为在不同文件之间存在依赖关系，我们加入了引用标签来告诉编译器文件之间的关系。我们的测试代码保持不变。

**多文件内部模块**

*Validation.ts*

```typescript
module Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }
}
```

*LettersOnlyValidator.ts*

```typescript
/// <reference path="Validation.ts" />
module Validation {
    var lettersRegexp = /^[A-Za-z]+$/;
    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }
}
```

*ZipCodeValidator.ts*

```typescript
/// <reference path="Validation.ts" />
module Validation {
    var numberRegexp = /^[0-9]+$/;
    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}
```

*Test.ts*

```typescript
/// <reference path="Validation.ts" />
/// <reference path="LettersOnlyValidator.ts" />
/// <reference path="ZipCodeValidator.ts" />

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: Validation.StringValidator; } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

涉及到多文件时，我们必须确保所有编译后的代码都加载了。我们有两种方式。

第一种方式，把所有的输入文件编译为一个输出文件，需要使用 *--out* 标记：

```sh
tsc --out sample.js Test.ts
```

编译器会根据源码里的引用标签自动地对输出进行排序。你也可以单独地指定每个文件。

```sh
tsc --out sample.js Validation.ts LettersOnlyValidator.ts ZipCodeValidator.ts Test.ts
```

第二种方式，我们可以编译每一个文件，之后在页面上通过`<script>`标签把所有生成的js文件按正确的顺序都引进来。比如：

*MyTestPage.html (excerpt)*

```html
<script src="Validation.js" type="text/javascript" />
<script src="LettersOnlyValidator.js" type="text/javascript" />
<script src="ZipCodeValidator.js" type="text/javascript" />
<script src="Test.js" type="text/javascript" />
```

### 外部模块

TypeScript中同样存在外部模块的概念。外部模块在两种情况下会用到：node.js和require.js。对于没有使用node.js和require.js的应用来说是不需要使用外部模块的，最好使用上面说的内部模块的方式来组织代码。

在外部模块，不同文件之间的关系是通过imports和exports来指定的。在TypeScript里，任何具有顶级*import*和*export*的文件都会被视为段级模块。

下面，我们把之前的例子改写成外部模块。注意，我们不再使用module关键字 - 文件本身会被视为一个模块并以文件名来区分。

引用标签用*import*来代替，指明了模块之前的依赖关系。*import*语句有两部分：当前文件使用模块时使用的名字，require关键字指定了依赖模块的路径：

```typescript
import someMod = require('someModule');
```

我们通过顶级的*export*关键字指出了哪些对象在模块外是可见的，如同使用*export*定义内部模块的公共接口一样。

为了编译，我们必须在命令行上指明生成模块的目标类型。对于node.js，使用*--module commonjs*。对于require.js，使用*--module amd*。比如：

```sh
ts --module commonjs Test.ts
```

编译的时候，每个外部模块会变成一个单独的文件。如同引用标签，编译器会按照*import*语句编译相应的文件。

*Validation.ts*

```typescript
export interface StringValidator {
    isAcceptable(s: string): boolean;
}
```

*LettersOnlyValidator.ts*

```typescript
import validation = require('./Validation');
var lettersRegexp = /^[A-Za-z]+$/;
export class LettersOnlyValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return lettersRegexp.test(s);
    }
}
```

*ZipCodeValidator.ts*

```typescript
import validation = require('./Validation');
var numberRegexp = /^[0-9]+$/;
export class ZipCodeValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}
```

*Test.ts*

```typescript
import validation = require('./Validation');
import zip = require('./ZipCodeValidator');
import letters = require('./LettersOnlyValidator');

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: validation.StringValidator; } = {};
validators['ZIP code'] = new zip.ZipCodeValidator();
validators['Letters only'] = new letters.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

**生成外部模块的代码**

根据编译时指定的目标模块类型，编译器会生成相应的代码。想要了解更多关于*define*和*require*函数的使用方法，请阅读相应模块加载器的说明文档。

这个例子展示了在导入导出阶段使用的名字是怎么转换成模块加载代码的。

*SimpleModule.ts*

```typescript
import m = require('mod');
export var t = m.something + 1;
```

*AMD/RequireJS SimpleModule.js*

```javascript
define(["require"，"exports"，"mod"]，function(require, exports, m) {
    exports.t = m.something + 1;
});
```

*CommonJS / Node SimpleModule.js*

```javascript
var m = require('mod');
exports.t = m.something + 1;
```

### <a name="Export =" id="Export ="/>Export =

在上面的例子中，使用验证器的时候，每个模块只导出一个值。像这种情况，在验证器对象前面再加上限定名就显得累赘了，最好是直接使用一个标识符。

‘export =’语法指定了模块导出的单个对象。它可以是类，接口，模块，函数或枚举类型。当import的时候，直接使用模块导出的标识符，不再需要其它限定名。

下面，我们简化验证器的实现，使用‘export =’语法使每个模块导出单一对象。这会简化对模块的使用 - 我们可以用‘zipValidator’代替‘zip.ZipCodeValidator’。

*Validation.ts*

```typescript
export interface StringValidator {
    isAcceptable(s: string): boolean;
}
```

*LettersOnlyValidator.ts*

```typescript
import validation = require('./Validation');
var lettersRegexp = /^[A-Za-z]+$/;
class LettersOnlyValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return lettersRegexp.test(s);
    }
}
export = LettersOnlyValidator;
```

*ZipCodeValidator.ts*

```typescript
import validation = require('./Validation');
var numberRegexp = /^[0-9]+$/;
class ZipCodeValidator implements validation.StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}
export = ZipCodeValidator;
```

*Test.ts*

```typescript
import validation = require('./Validation');
import zipValidator = require('./ZipCodeValidator');
import lettersValidator = require('./LettersOnlyValidator');

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: validation.StringValidator; } = {};
validators['ZIP code'] = new zipValidator();
validators['Letters only'] = new lettersValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

### 别名

另一种简化模块操作的方法是使用*import q = x.y.z*给常用的模块起一个短的名字。不要与*import x = require('name')*用来加载外部模块的语法弄混了，这里的语法是为指定的符号创建一个别名。你可以用这种方法为任意标识符创建别名，也包括导入的外部模块中的对象。

*创建别名基本方法*

```typescript
module Shapes {
    export module Polygons {
        export class Triangle { }
        export class Square { }
    }
}

import polygons = Shapes.Polygons;
var sq = new polygons.Square(); // Same as 'new Shapes.Polygons.Square()'
```

注意，我们并没有使用*require*关键字，而是直接使用导入符号的限定名赋值。这与使用*var*相似，但它还适用于类型和导入的具有命名空间含义的符号。重要的是，对于值来讲，*import*会产生与原始符号不同的引用，所以改变别名的值并不会影响原始变量的值。

### 可选模块的加载与其它高级加载的场景

有些时候，你只想在某种条件下才去加载一个模块。在TypeScript里，我们可以使用下面的方式来实现它以及其它高级加载的场景，直接调用模块加载器而不必担心类型安全问题。

编译器能探测出一个模块是否在生成的JavaScript里被使用到了。对于那些只做为类型系统部分使用的模块来讲，不会生成对应require代码。挑出未使用的引用有益于性能优化，同时也允许可选择性的加载模块。

这种模式的核心是*import id = require('...')*让我们可以访问外部模块导出的类型。模块加载是动态调用的，像下面if语句展示的那样。它利用了挑出对未使用引用的优化，模块只在需要的时候才去加载。为了让这种方法可行，通过import定义的符号只能在表示类型的位置使用（也就是说那段代码永远不会被编译生成JavaScript）。

为了确保使用正确，我们可以使用*typeof*关键字。在要求是类型的位置使用*typeof*关键字时，会得到类型值，在这个例子里得到的是外部模块的类型。

*Dynamic Module Loading in node.js*

```typescript
declare var require;
import Zip = require('./ZipCodeValidator');
if (needZipValidation) {
    var x: typeof Zip = require('./ZipCodeValidator');
    if (x.isAcceptable('.....')) { /* ... */ }
}
```

*Sample: Dynamic Module Loading in require.js*

```typescript
declare var require;
import Zip = require('./ZipCodeValidator');
if (needZipValidation) {
    require(['./ZipCodeValidator'], (x: typeof Zip) => {
        if (x.isAcceptable('...')) { /* ... */ }
    });
}
```

### <a name="使用其它JavaScript库" id="使用其它JavaScript库"/>使用其它JavaScript库

为了描述不是用TypeScript写的程序库的类型，我们需要对程序库暴露的API进行声明。由于大部分程序库只提供少数的顶级对象，因此用模块来表示它们是一个好办法。我们叫它声明不是对执行环境的定义。通常会在‘.d.ts’里写这些定义。如果你熟悉C/C++，你可以把它们当做.h文件或‘extern’。让我们看一些内部和外部的例子。

#### 内部环境模块

流行的程序库D3在全局对象‘D3’里定义它的功能。因为这个库通过一个*script*标签加载（不是通过模块加载器），它的声明文件使用内部模块来定义它的类型。为了让TypeScript编译器识别它的类型，我们使用内部环境模块声明。比如：

*D3.d.ts (simplified excerpt)*

```typescript
declare module D3 {
    export interface Selectors {
        select: {
            (selector: string): Selection;
            (element: EventTarget): Selection;
        };
    }

    export interface Event {
        x: number;
        y: number;
    }

    export interface Base extends Selectors {
        event: Event;
    }
}

declare var d3: D3.Base;
```

#### 外部环境模块

在node.js里，大多数的任务可以通过加载一个或多个模块来完成。我们可以使用顶级export声明来为每个模块定义各自的‘.d.ts’文件，但全部放在一个大的文件中会更方便。为此，我们把模块名用引号括起来，方便之后的import。例如：

*node.d.ts (siplified excerpt)*

```typescript
declare module "url" {
    export interface Url {
        protocol?: string;
        hostname?: string;
        pathname?: string;
    }

    export function parse(urlStr: string, parseQueryString?, slashesDenoteHost?): Url;
}

declare module "path" {
    export function normalize(p: string): string;
    export function join(...paths: any[]): string;
    export var sep: string;
}
```

现在我们可以*///&lt;reference path="node.d.ts"/&gt;*, 然后使用*import url = require('url');*加载这个模块。

```typescript
///<reference path="node.d.ts"/>
import url = require("url");
var myUrl = url.parse("http://www.typescriptlang.org");
```

### 模块陷井

这一节，将会介绍使用内部和外部模块时常见的陷井和怎么去避免它。

#### /// <reference> to an external module

一个常见的错误是使用`/// <reference>`引用外部模块文件，应该使用import。要理解这之间的不同，我们首先应该弄清编译器是怎么找到外部模块的类型信息的。

首先，根据*import x = require(...);*声明查找*.ts*文件。这个文件应该是使用了顶级import或export声明的执行文件。

其次，与前一步相似，去查找*.d.ts*文件，不同的是它不是执行文件而是声明文件（同样具有顶级的import或export声明）。

最后，尝试寻找外部环境模块的声明，此声明里包含了对应的用引号括起来的模块名。

*myModules.d.ts*

```typescript
// In a .d.ts file or .ts file that is not an external module:
declare module "SomeModule" {
    export function fn(): string;
}
```

*myOtherModule.ts*

```typescript
/// <reference path="myModules.d.ts" />
import m = require("SomeModule");
```

这里的引用标签指定了外部环境模块的位置。这就是一些Typescript例子中引用node.d.ts的方法。

#### 不必要的命名空间

如果你想把内部模块转换为外部模块，它可能会像下面这个文件一件：

*shapes.ts*

```typescript
export module Shapes {
    export class Triangle { /* ... */ }
    export class Square { /* ... */ }
}
```

顶层的模块*Shapes*包裹了*Triangle*和*Square*。这对于使用它的人来说是让人迷惑和讨厌的：

*shapeConsumer.ts*

```typescript
import shapes = require('./shapes');
var t = new shapes.Shapes.Triangle(); // shapes.Shapes?
```

TypeScript里外部模块的一个特点是不同的外部模块永远也不会在相同的作用域内使用相同的名字。因为使用外部模块的人会为它们命名，所以完全没有必要把导出的符号包裹在一个命名空间里。

再次重申，不应该对外部模块使用命名空间，使用命名空间是为了提供逻辑分组和避免命名冲突。外部模块文件本身已经是一个逻辑分组，并且它的名字是由导入这个模块的代码指定，所以没有必要为导出的对象增加额外的模块层。

改进的例子：

*shapes.ts*

```typescript
export class Triangle { /* ... */ }
export class Square { /* ... */ }
```

*shapeConsumer.ts*

```typescript
import shapes = require('./shapes');
var t = new shapes.Triangle(); 
```

#### 外部模块的取舍

就像每个JS文件对应一个模块一样，TypeScript里外部模块文件与生成的JS文件也是一一对应的。这会产生一个效果，就是无法使用*--out*来让编译器合并多个外部模块文件为一个JavaScript文件。

## 函数

函数是JavaScript应用程序的基础。它帮助你实现抽象层，模拟类，信息隐藏和模块。在TypeScript里，虽然已经支持类和模块，但函数仍然是主要的定义行为的地方。TypeScript为JavaScript函数添加了额外的功能，让我们可以更容易的使用。

### Functions

和JavaScript一样，TypeScript函数可以创建有名字的函数和匿名函数。你可以随意选择适合应用程序的方式，不论是定义一系列API函数还是只使用一次的函数。

通过下面的例子可以迅速回想起这两种JavaScript中的函数：

```typescript
//Named function
function add(x, y) {
    return x+y;
}

//Anonymous function
var myAdd = function(x, y) { return x+y; };
```

在JavaScript里，函数可以可以访问函数外部的变量。它为什么可以工作以及使用这个特征的好坏已经超出了本文的范围，但是对这种特征的理解对学习JavaScript和TypeScript都是很有好处的。

```typescript
var z = 100;

function addToZ(x, y) {
    return x+y+z;
}
```

### 函数类型

#### 为函数定义类型

让我们为上面的函数例子添加类型：

```typescript
function add(x: number, y: number): number {
    return x+y;
}

var myAdd = function(x: number, y: number): number { return x+y; };
```

我们可以为每个参数添加类型之后为函数本身添加返回值类型。TypeScript能够根据返回语句自动地推断出返回值类型，因此我们通常省略返回值类型。

#### 书写完整函数类型

现在我们已经为函数指定了类型，下面让我们写出函数的完整类型。

```typescript
var myAdd: (x:number, y:number)=>number = 
    function(x: number, y: number): number { return x+y; };
```

函数类型包含两部分：参数类型和返回值类型。当写出完整函数类型的时候，这两部分都是需要的。我们以参数列表的形式写出参数类型，为每个参数指定一个名字和类型。这个名字只是增加可读性。我们也可以这么写：

```typescript
var myAdd: (baseValue:number, increment:number)=>number = 
    function(x: number, y: number): number { return x+y; };
```

只要参数类型是匹配的，那么就认为它是有效的函数类型，而不在乎参数名字是否正确。

对于返回值，我们在函数和返回值类型之前使用(=>)符号，使之清晰明了。如之前提到的，返回值类型是函数类型的必要部分，如果函数没有返回任何值，你也必须指定返回值类型为‘void’而不能留空。

函数的类型只是由参数类型和返回值组成的。函数中使用的外部变量不会体现在类型里。实际上，这此外部变量是函数的隐藏状态不是组成API的一部分。

#### 推断类型

尝试这个例子的时候，你会发现如果你在赋值语句的一边指定了类型但是另一边没有类型的话，TypeScript编译器会自动识别出类型：

```typescript
// myAdd has the full function type
var myAdd = function(x: number, y: number): number { return x+y; };

// The parameters 'x' and 'y' have the type number
var myAdd: (baseValue:number, increment:number)=>number = 
    function(x, y) { return x+y; };
```

这叫做‘按上下文归类’，是类型推断的一种。它帮助我们更好地为程序指定类型。

### 可选参数和默认参数

不同于JavaScript，TypeScript里每个函数参数都是必须的。这并不是说参数一定是个非‘null’值，而是编译器检查用户是否为每个参数都传入了值。编译器还要求你只能传这些参数，也就是说参数的数量也是固定的。

```typescript
function buildName(firstName: string, lastName: string) {
    return firstName + " " + lastName;
}

var result1 = buildName("Bob");  //error, too few parameters
var result2 = buildName("Bob", "Adams", "Sr.");  //error, too many parameters
var result3 = buildName("Bob", "Adams");  //ah, just right
```

JavaScript里，每个参数都是可选的，可传可不传。没传参的时候，它的值就是undefined。在TypeScript里我们可以在参数名旁使用‘?’实现可选参数的功能。比如，我们想让last name是可选的：

```typescript
function buildName(firstName: string, lastName?: string) {
    if (lastName)
        return firstName + " " + lastName;
    else
        return firstName;
}

var result1 = buildName("Bob");  //works correctly now
var result2 = buildName("Bob", "Adams", "Sr.");  //error, too many parameters
var result3 = buildName("Bob", "Adams");  //ah, just right
```

可选参数必须在必须跟在必须参数后面。如果上例我们想让first name是可选的，那么就必须调整它们的位置，把first name放在后面。

TypeScript里，我们还可以为可选参数设置默认值。仍然修改上例，把last name的默认值设置为“Smith”。

```typescript
function buildName(firstName: string, lastName = "Smith") {
    return firstName + " " + lastName;
}

var result1 = buildName("Bob");  //works correctly now, also
var result2 = buildName("Bob", "Adams", "Sr.");  //error, too many parameters
var result3 = buildName("Bob", "Adams");  //ah, just right
```

和可选参数一样，带默认值的参数也要放在必须参数后面。

可选参数与默认值参数共享参数类型。

```typescript
function buildName(firstName: string, lastName?: string) {
```

和

```typescript
function buildName(firstName: string, lastName = "Smith") {
```

共享同样的类型`(firstName: string, lastName?: string)=>string`。默认参数的默认值消失了，只保留了它是一个可选参数的信息。

### 剩余参数

必要参数，默认参数和可选参数有个共同点：它们只代表某一个参数。有时，你想同时操作多个参数，或者你并不知道会有多少参数传递进来。JavaScript里，你可以使用arguments来访问传入的参数。

在TypeScript里，你可以把所有参数收集到一个变量里：

```typescript
function buildName(firstName: string, ...restOfName: string[]) {
  return firstName + " " + restOfName.join(" ");
}

var employeeName = buildName("Joseph", "Samuel", "Lucas", "MacKinzie");
```

剩余参数会被当做个数不限的可选参数。可以一个都没有，同样也可以有任意个。编译器创建参数数组，名字是你在省略号（...）后面给定的名字，你可以在函数体内使用这个数组。

这个省略号也在带有剩余参数的函数类型上使用到。

```typescript
function buildName(firstName: string, ...restOfName: string[]) {
  return firstName + " " + restOfName.join(" ");
}

var buildNameFun: (fname: string, ...rest: string[])=>string = buildName;
```

### <a name="lambda"/>Lambda表达式和使用‘this’

JavaScript里‘this’工作机制对JavaScript程序员来说是老生常谈了。的确，学会如何使用它绝对是JavaScript编程中的一件大事。由于TypeScript是JavaScript的超集，TypeScript程序员也需要弄清‘this’工作机制并且当有bug的时候能够找出错误所在。对于‘this’工作机制可以单独写一本书了，并已有人这么做了。在这里，我们只介绍一些基础。

JavaScript里，‘this’的值在函数被调用的时候才会指定。这是个很强大灵活的特点，但是你需要花点时间弄清楚函数调用上下文是什么。众所周知这不是一件很简单的事，特别是函数当做回调函数使用的时候。

下面看一个例子：

```javascript
var deck = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function() {
        return function() {
            var pickedCard = Math.floor(Math.random() * 52);
            var pickedSuit = Math.floor(pickedCard / 13);
      
            return {suit: this.suits[pickedSuit], card: pickedCard % 13};
        }
    }
}

var cardPicker = deck.createCardPicker();
var pickedCard = cardPicker();

alert("card: " + pickedCard.card + " of " + pickedCard.suit);
```

执行这个例子会报错。因为createCardPicker返回的函数里的‘this’被设置成了‘window’而不是‘deck’。这里没有对‘this’进行动态绑定因此为Window。（注意在严格模式下，会是undefined而不是Window）。

为了解决这个问题，我们可以在函数被返回时就绑好正确的‘this’。这样的话，不论之后怎么使用它，都会引用原先的‘deck’对象。

我们把函数表达式变为使用lambda表达式（()=>{}）。这样就会在函数创建的时候就指定了‘this’值，而不是在函数调用的时候。

```typescript
var deck = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function() {
        // Notice: the line below is now a lambda, allowing us to capture 'this' earlier
        return () => {
            var pickedCard = Math.floor(Math.random() * 52);
            var pickedSuit = Math.floor(pickedCard / 13);
      
            return {suit: this.suits[pickedSuit], card: pickedCard % 13};
        }
    }
}

var cardPicker = deck.createCardPicker();
var pickedCard = cardPicker();

alert("card: " + pickedCard.card + " of " + pickedCard.suit);
```

为了解更多关于‘this’的信息，请阅读Yahuda Katz的[Understanding JavaScript Function Invocation and “this”](#http://yehudakatz.com/2011/08/11/understanding-javascript-function-invocation-and-this/).

### 重载

JavaScript本身是个动态语言。JavaScript里函数根据传入不同的参数而返回不同类型的数据是很常见的。

```typescript
var suits = ["hearts", "spades", "clubs", "diamonds"];

function pickCard(x): any {
    // Check to see if we're working with an object/array
    // if so, they gave us the deck and we'll pick the card
    if (typeof x == "object") {
        var pickedCard = Math.floor(Math.random() * x.length);
        return pickedCard;
    }
    // Otherwise just let them pick the card
    else if (typeof x == "number") {
        var pickedSuit = Math.floor(x / 13);
        return { suit: suits[pickedSuit], card: x % 13 };
    }
}

var myDeck = [{ suit: "diamonds", card: 2 }, { suit: "spades", card: 10 }, { suit: "hearts", card: 4 }];
var pickedCard1 = myDeck[pickCard(myDeck)];
alert("card: " + pickedCard1.card + " of " + pickedCard1.suit);

var pickedCard2 = pickCard(15);
alert("card: " + pickedCard2.card + " of " + pickedCard2.suit);
```

‘pickCard’方法根据传入参数的不同会返回两种不同的类型。如果传入的是代表纸牌的对象，函数作用是抓一张牌。如果用户抓牌，我们告诉他抓到了什么牌。但是这怎么在类型系统里表示呢。

方法是为同一个函数提供多个函数类型定义做为重载。编译器会根据这个列表去处理函数的调用。下面我们来重载‘pickCard’函数。

```typescript
var suits = ["hearts", "spades", "clubs", "diamonds"];

function pickCard(x: {suit: string; card: number; }[]): number;
function pickCard(x: number): {suit: string; card: number; };
function pickCard(x): any {
    // Check to see if we're working with an object/array
    // if so, they gave us the deck and we'll pick the card
    if (typeof x == "object") {
        var pickedCard = Math.floor(Math.random() * x.length);
        return pickedCard;
    }
    // Otherwise just let them pick the card
    else if (typeof x == "number") {
        var pickedSuit = Math.floor(x / 13);
        return { suit: suits[pickedSuit], card: x % 13 };
    }
}

var myDeck = [{ suit: "diamonds", card: 2 }, { suit: "spades", card: 10 }, { suit: "hearts", card: 4 }];
var pickedCard1 = myDeck[pickCard(myDeck)];
alert("card: " + pickedCard1.card + " of " + pickedCard1.suit);

var pickedCard2 = pickCard(15);
alert("card: " + pickedCard2.card + " of " + pickedCard2.suit);
```

这样改变后，重载的函数在调用的时候会进行正确的类型检查。

为了让编译器能够选择正确的检查类型，它与JavaScript里的处理流程相似。它查找重载列表，尝试使用第一个重载定义。如果匹配的话就使用这个。因此，在定义重载的时候，一定要把最精确的定义放在最前面。

注意，‘function pickCard(x): any’并不是重载列表的一部分，因此这里只有两个重载：一个是接收对象另一个接收数字。以其它参数调用‘pickCard’会产生错误。

## 泛型

软件工程中，我们不仅要创建一致的定义良好的API，同时也要考虑可重用性。组件不仅需要支持当前的数据类型，同时也要为未来提供支持，在创建大型系统时能提供良好的兼容性。

在像C#和Java这样的语言中，可以使用‘泛型’来创建可重用的组件，一个组件可以支持多种类型的数据。这样用户就可以以自己的数据类型来使用组件。

### <a name="Hello World泛型" id="Hello World泛型"/>Hello World泛型

下面来创建第一个使用泛型的例子：identity函数。这个函数会返回任何传入它的值。你可以把这个函数当成是‘echo’命令。

不用泛型的话，这个函数可能是下面这样：

```typescript
function identity(arg: number): number {
    return arg;
}
```

或者，我们使用‘any’类型来定义函数：

```typescript
function identity(arg: any): any {
    return arg;
}
```

虽然使用‘any’类型后这个函数已经能接收任何类型的arg参数，但是却丢失了一些信息：传入的类型与返回的类型应该是相同的。

因此，我们需要一种方法使用返回值的类型与传入参数的类型是相同的。这里，我们使用了*类型变量*，它是一种特殊的变量，只用于表示类型而不是值。

```typescript
function identity<T>(arg: T): T {
    return arg;
}
```

我们给identity添加了类型变量‘T’。‘T’帮助我们捕获用户传入的类型（比如：number），之后我们就可以使用这个类型。之后我们再次使用了‘T’当做返回值类型。现在我们可以知道参数类型与返回值类型是相同的了。

我们把这个版本的identity函数叫做泛型，它可以适用于多个类型。不像使用‘any’，它不会丢失信息。同时也可以像第一个例子那像，传入数值类型并返回数值类型。

我们定义了泛型函数后，可以用两种方法使用。第一种是，传入所有的参数，包含类型参数：

```typescript
var output = identity<string>("myString");  // type of output will be 'string'
```

这里我们明确的指定了‘T’是字符串类型，并做为一个参数传给函数，使用了<>括起来。

第二种方法更普遍。利用了类型推断，编译器会根据传入的参数自动地帮助我们确定T的类型：

```typescript
var output = identity("myString");  // type of output will be 'string'
```

注意我们并没用<>明确的指定类型，编译器看到了“myString”，把T设置为此类型。类型推断帮助我们保持代码精简和高可读性。如果编译器不能够自动地推断出类型的话，只能像上面那样明确的传入T的类型，在一些复杂的情况下，这是可能出现的。

### 使用泛型变量
使用泛型创建像‘identity’这样的泛型函数时，编译器要求你在函数体必须正确的使用这个通用的类型。换句话说，你必须把这些参数当做是任意或所有类型。

看下之前的例子：

```typescript
function identity<T>(arg: T): T {
    return arg;
}
```

如果我们想同时打印出arg的‘length’属性值，很可能会这样做：

```typescript
function loggingIdentity<T>(arg: T): T {
    console.log(arg.length);  // Error: T doesn't have .length
    return arg;
}
```

如果这么做，编译器会报错说我们使用了‘arg’的‘length’属性，但是没有地方定义了‘arg’具有这个属性。记住，这些类型变量代表的是任意类型，所以使用这个函数的人可能传入的是个数字，而数字是没有‘length’属性的。

现在假设我们想操作T类型的数组而不直接是T。由于我们操作的是数组，所以‘.length’属性是应该存在的。我们可以像创建其它数组一样创建这个数组：

```typescript
function loggingIdentity<T>(arg: T[]): T[] {
    console.log(arg.length);  // Array has a .length, so no more error
    return arg;
}
```

你可以这样理解loggingIdentity的类型：泛型函数loggingIdentity，接收类型参数T，和函数‘arg’，它是个元素类型是T的数组，并返回元素类型是T的数组。如果我们传入数字数组，将返回一个数字数组，因为此时T的值为数字类型。这可以让我们把泛型变量T当做类型的一部分使用，而不是整个类型，增加了灵活性。

我们也可以这样实现上面的例子：

```typescript
function loggingIdentity<T>(arg: Array<T>): Array<T> {
    console.log(arg.length);  // Array has a .length, so no more error
    return arg;
}
```

使用过其它语言的话，你可能对这种语法已经很熟悉了。在下一节，会介绍如何创建自定义泛型像Array<T>一样。

### 泛型类型

上一节，我们创建了identity通用函数，可以适用于不同的类型。在这节，我们研究一下函数本身的类型，以及如何创建泛型接口。

泛型函数的类型与非泛型函数的类型没什么不同，只是有一个类型参数在最前面，像函数声明一样：

```typescript
function identity<T>(arg: T): T {
    return arg;
}

var myIdentity: <T>(arg: T)=>T = identity;
```

我们也可以使用不同的泛型参数名，只要在数量上和使用方式上能对应上就可以。

```typescript
function identity<T>(arg: T): T {
    return arg;
}

var myIdentity: <U>(arg: U)=>U = identity;
```

我们还可以使用带有调用签名的对象字面量来定义泛型函数：

```typescript
function identity<T>(arg: T): T {
    return arg;
}

var myIdentity: { <T>(arg: T): T} = identity;
```

这引导我们去写第一个泛型接口了。我们把上面例子里的对象字面量拿出来做为一个接口：

```typescript
interface GenericIdentityFn {
    <T>(arg: T): T;
}

function identity<T>(arg: T): T {
    return arg;
}

var myIdentity: GenericIdentityFn = identity;
```

我们可以把泛型类型参数变成接口的一个参数。这样我们就能清楚的知道使用的具体是什么类型。并且接口里的其它成员也能知道这个类型参数。

```typescript
interface GenericIdentityFn<T> {
    (arg: T): T;
}

function identity<T>(arg: T): T {
    return arg;
}

var myIdentity: GenericIdentityFn<number> = identity;
```

我们并没有描述泛型函数，而是使用一个非泛型函数签名作为泛型类型一部分。当我们使用GenericIdentityFn的时候，我也得传入一个类型参数来指定泛型类型（这个例子是：number），锁定了之后代码里使用的类型。

除了泛型接口，我们还可以创建泛型类。注意，无法创建枚举泛型和泛型模块。

### 泛型类

泛型类看上去与泛型接口差不多。泛型类使用<>括起泛型类型，跟在类名后面。

```typescript
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}

var myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) { return x + y; };
```

‘GenericNumber’类的使用是十分直观的，并且你应该注意到了我们并不限制只能使用数字类型。也可以使用字符串或其它更复杂的类型。

```typescript
var stringNumeric = new GenericNumber<string>();
stringNumeric.zerValue = "";
stringNumeric.add = function(x, y) { return x + y; };

alert(stringNumeric.add(stringNumeric.zeroValue, "test"));
```

与接口一样，直接把泛型类型放在类后面，可以帮助我们确认类的所有属性都在使用相同的类型。

我们在[类](#类)那节说过，类有两部分：静态部分和实例部分。泛型类指的是实例部分的类型，所以类的静态属性不能使用这个泛型类型。

### 泛型约束

你应该会记得之前的一个例子，我们有时候想操作某类型的一组值，并且我们知道这组值具有什么样的属性。在‘loggingIdentity’例子中，我们想访问‘arg’的‘length’属性，但是编译器并不能证明每种类型都有‘length’属性，所以就报错了。

```typescript
function loggingIdentity<T>(arg: T): T {
    console.log(arg.length);  // Error: T doesn't have .length
    return arg;
}
```

相比于操作任意类型，我们想要限制函数去处理任意带有‘length’属性的类型。只要传入的类型有这个属性，就允许通过。所以我们必须对T定义约束。

为此，我们定义一个接口来描述约束条件。创建一个包含‘length’属性的接口，使用这个接口和extends关键字还实现约束。

```typescript
interface Lengthwise {
    length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
    console.log(arg.length);  // Now we know it has a .length property, so no more error
    return arg;
}
```

现在这个泛型函数被定义了约束，因此它不再是适用于任意类型：

```typescript
loggingIdentity(3);  // Error, number doesn't have a .length property
```

我们需要传入符合约束类型的值，必须包含必须的属性：

```typescript
loggintIdentity({ length: 10, value: 3 });
```

#### 在泛型约束中使用类型参数

有时候，我们需要使用类型参数去约束另一个类型参数。比如，

```typescript
function find<T, U extends Findable<T>>(n: T, s: U) {  // errors because type parameter used in contraint
  // ... 
}
find(giraffe, myAnimals);
```

可以通过下面的方法来实现，重写上面的代码，

```typescript
function find<T>(n: T, s: Findable<T>) {
  // ...
}
find(giraffe, myAnimals);
```

注意：上面两种写法并不完全等同，因为第一段程序的返回值可能是U，而第二段程序却没有这一限制。

#### 在泛型里使用类类型

在TypeScript使用泛型创建工厂函数时，需要引用构造函数的类类型。比如，

```typescript
function create<T>(c: {new(): T;}): T {
    return new c();
}
```

一个更高级的例子，使用原型属性推断并约束构造函数与类实例的关系。

```typescript
class BeeKeeper {
    hasMask: boolean;
}

class ZooKeeper {
    nametag: string; 
}

class Animal {
    numLegs: number;
}

class Bee extends Animal {
    keeper: BeeKeeper;
}

class Lion extends Animal {
    keeper: ZooKeeper;
}

function findKeeper<A extends Animal, K> (a: {new(): A; 
    prototype: {keeper: K}}): K {

    return a.prototype.keeper;
}

findKeeper(Lion).nametag;  // typechecks!
```

## 常见错误

下面列出了一些在使用TypeScript和编译器的时候常见的错误

### 常见疑难问题

#### "tsc.exe" exited with error code 1.

**Fixes:**

检查文件编码是不是UTF-8 - [https://typescript.codeplex.com/workitem/1587](https://typescript.codeplex.com/workitem/1587)

#### external module XYZ cannot be resolved

**Fixes:**

检查模块路径的大小写 - [https://typescript.codeplex.com/workitem/2134](https://typescript.codeplex.com/workitem/2134)

## Mixins

除了传统的面向对象继承方式，还有一种流行的从可重用组件中创建类的方式，就是通过联合一个简单类的代码。你可能在Scala这样的语言里对mixins已经熟悉了，它在JavaScript中也是很流行的。

### <a name="Mixin 例子" id="Mixin 例子">Mixin 例子

下面的代码演示了如何在TypeScript里使用mixins。后面我们还会解释这段代码是怎么工作的。

```typescript
// Disposable Mixin
class Disposable {
    isDisposed: boolean;
    dispose() {
        this.isDisposed = true;
    }
 
}
 
// Activatable Mixin
class Activatable {
    isActive: boolean;
    activate() {
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }
}
 
class SmartObject implements Disposable, Activatable {
    constructor() {
        setInterval(() => console.log(this.isActive + " : " + this.isDisposed), 500);
    }
 
    interact() {
        this.activate();
    }
 
    // Disposable
    isDisposed: boolean = false;
    dispose: () => void;
    // Activatable
    isActive: boolean = false;
    activate: () => void;
    deactivate: () => void;
}
applyMixins(SmartObject, [Disposable, Activatable])
 
var smartObj = new SmartObject();
setTimeout(() => smartObj.interact(), 1000);
 
////////////////////////////////////////
// In your runtime library somewhere
////////////////////////////////////////

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        })
    }); 
}
```

### 理解这个例子

代码里首先定义了两个类，它们做为mixins。可以看到每个类都只定义了一个特定的行为或能力。稍后我们使用它们来创建一个新类，同时具有这两种能力。

```typescript
// Disposable Mixin
class Disposable {
    isDisposed: boolean;
    dispose() {
        this.isDisposed = true;
    }
 
}
 
// Activatable Mixin
class Activatable {
    isActive: boolean;
    activate() {
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }
}
```

下面创建一个类，结合了这两个mixins。下面来看一下具体是怎么操作的。

```typescript
class SmartObject implements Disposable, Activatable {}
```

首先应该注意到的是，没使用‘extends’而是使用‘implements’。把类当成了接口，仅使用Disposable和Activatable的类型而非其实现。这意味着我们需要在类里面实现接口。但是这是我们在用mixin时想避免的。

我们可以这么做来达到目的，为将要mixin进来的属性方法创建出占位属性。这告诉编译器这些成员在运行时是可用的。这样就能使用mixin带来的便利，虽说需要提前定义一些占位属性。

```typescript
// Disposable
isDisposed: boolean = false;
dispose: () => void;
// Activatable
isActive: boolean = false;
activate: () => void;
deactivate: () => void;
```

最后，把mixins混入定义的类，完成全部实现部分。

```typescript
applyMixins(SmartObjet, [Disposable, Activatable])
```

最后，创建这个帮助函数，帮我们做混入操作。它会遍历mixins上的所有属性，并复制到目标上去，把之前的占位属性替换成真正的实现代码。

```typescript
function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        })
    }); 
}
```

## 声明合并

TypeScript有一些独特的概念，有的是因为我们需要描述JavaScript顶级对象的类型发生了什么变化。这其中之一叫做‘声明合并’。理解了这个概念对于你使用TypeScript去操作现有的JavaScript是大有帮助的。同时，也开启通往更多高级抽象概念的大门。

首先，在了解怎么进行声明合并之前，让我们先看一下什么叫做‘声明合并’。

在这个手册里，声明合并是指编译器会把两个相同的名字的声明合并成一个单独的声明。合并后的声明同时具有那两个被合并的声明的特性。声明合并不限于只合并两个，任意数量都可以。

### 基础概念

Typescript里声明可用于三个地方：命名空间/模块，类型或者值。创建命名空间/模块的声明可以通过（.）标识符访问其中的类型。创建类型的声明就是用给定的名字创建相应类型。最后，创建值的声明是在生成的JavaScript里存在的那部分（比如：函数和变量）。

<table>
  <tbody>
    <tr>
      <th>Declaration Type </th>
      <th>Namespace </th>
      <th>Type </th>
      <th>Value </th>
    </tr>
    <tr>
      <td>Module</td>
      <td>X </td>
      <td></td>
      <td>X </td>
    </tr>
    <tr>
      <td>Class</td>
      <td></td>
      <td>X </td>
      <td>X </td>
    </tr>
    <tr>
      <td>Interface</td>
      <td></td>
      <td>X </td>
      <td></td>
    </tr>
    <tr>
      <td>Function</td>
      <td></td>
      <td></td>
      <td>X </td>
    </tr>
    <tr>
      <td>Variable</td>
      <td></td>
      <td></td>
      <td>X </td>
    </tr>
  </tbody>
</table>

理解每个声明创建了什么，有助于理解当声明合并时什么东西被合并了。

### 合并接口

最简单最常见的就是合并接口，声明合并的种类是：接口合并。从根本上说，合并的机制是把各自声明里的成员放进一个同名的单一接口里。

```typescript
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

```typescript
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

这三个接口合并成一个声明。注意每组接口里的声明顺序保持不变，只是靠后的接口会出现在它前面的接口声明之前。

```typescript
interface Document {
    createElement(tagName: "div"): HTMLDivElement; 
    createElement(tagName: "span"): HTMLSpanElement;
    createElement(tagName: "canvas"): HTMLCanvasElement;
    createElement(tagName: string): HTMLElement;
    createElement(tagName: any): Element;
}
```

### 合并模块

与接口相似，同名的模块也会合并其成员。模块会创建出命名空间和值，我们需要知道这两者都是怎么合并的。

命名空间的合并，模块导出的同名接口进行合并，构成单一命名空间内含合并后的接口。

值的合并，如果当前已经存在给定名字的模块，那么后来的模块的导出成员会被加到已经存在的那个模块里。

‘Animals’声明合并示例：

```typescript
module Animals {
    export class Zebra { }
}

module Animals {
    export interface Legged { numberOfLegs: number; }
    export class Dog { }
}
```

等同于

```typescript
module Animals {
    export interface Legged { numberOfLegs: number; }
    
    export class Zebra { }
    export class Dog { }
}
```

除了这些合并外，你还需要了解非导出成员是如何处理的。非导出成员仅在其原始存在于的模块（未合并的）之内可见。这就是说合并之后，从其它模块合并进来的成员无法访问非导出成员了。

看下例：

```typescript
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

因为haveMuscles并没有导出，只有animalsHaveMuscles函数共享了原始未合并的模块可以访问这个变量。doAnimalsHaveMuscles函数虽是合并模块的一部分，但是访问不了未导出的成员。

### 模块与类和函数和枚举类型合并

模块可以与其它类型的声明进行合并。只要模块的定义符合将要合并类型的定义。合并结果包含两者的声明类型。Typescript使用这个功能去实现一些JavaScript里的设计模式。

首先，尝试将模块和类合并。这让我们可以定义内部类。

```typescript
class Album {
    label: Album.AlbumLabel;
}
module Album {
    export class AlbumLabel { }
}
```

合并规则与上面‘合并模块’小节里讲的规则一致，我们必须导出AlbumLabel类，好让合并的类能访问。合并结果是一个类并带有一个内部类。你也可以使用模块为类增加一些静态属性。

除了内部类的模式，你在JavaScript里，创建一个函数稍后扩展它增加一些属性也是很常见的。Typescript使用声明合并来达到这个目的并保证类型安全。

```typescript
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

```typescript
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

### 无效的合并

并不是所有的合并都被允许。现在，类不能与类合并，变量与类型不能合并，接口与类不能合并。想要模仿类的合并，请参考[Mixins in TypeScript](https://typescript.codeplex.com/wikipage?title=Mixins%20in%20TypeScript&referringTitle=Declaration%20Merging)。

## 类型推断

这节介绍TypeScript里的类型推断。即，类型是在哪里如何被推断的。

### 基础

TypeScript里，在有此没有明确指出类型的地方，类型推断会帮助提供类型。如下面的例子

```typescript
var x = 3;
```

变量x的类型被推断为数字。这种推断发生在初始化变量和成员，设置默认参数值和决定函数返回值时。

大多数情况下，类型推断是直截了当地。后面的小节，我们会浏览类型推断时的细微差别。

### 最佳通用类型

当需要从几个表达式中推断类型时候，会使用这些表达式的类型来推断出一个最合适的通用类型。例如，

```typescript
var x = [0, 1, null];
```

为了推断x的类型，我们必须考虑所有元素的类型。这里有两种选择：数字和null。计算通用类型算法会考虑所有的候选类型，并给出一个兼容所有候选类型的类型。

由于最终的通用类型取自候选类型，有些时候候选类型共享相同的通用类型，但是却没有一个类型能做为所有候选类型的类型。例如：

```typescript
var zoo = [new Rhino(), new Elephant(), new Snake()];
```

这里，我们想让zoo被推断为Animal[]类型，但是这个数组里没有对象是Animal类型的，因此不能推断出这个结果。为了更正，当候选类型不能使用的时候我们需要明确的指出类型：

```typescript
var zoo: Animal[] = [new Rhino(), new Elephant(), new Snake()];
```

如果没有找到最佳通用类型的话，类型推断的结果是空对象类型，{}。因为这个类型没有任何成员，所以访问其成员的时候会报错。

### 上下文类型

TypeScript类型推断也可能按照相反的方向进行。这被叫做“按上下文归类”。按上下文归类会发生在表达式的类型与所处的位置相关时。比如：

```typescript
window.onmousedown = function(mouseEvent) { 
    console.log(mouseEvent.buton);  //<- Error  
};
```

这个例子会得到一个类型错误，TypeScript类型检查器使用Window.onmousedown函数的类型来推断右边函数表达式的类型。因此，就能推断出mouseEvent参数的类型了。如果函数表达式不是在上下文类型的位置，mouseEvent参数的类型需要指定为any，这样也不会报错了。

如果上下文类型表达式包含了明确的类型信息，上下文的类型被忽略。重写上面的例子：

```typescript
window.onmousedown = function(mouseEvent: any) { 
    console.log(mouseEvent.buton);  //<- Now, no error is given  
};
```

这个函数表达式有明确的参数类型注解，上下文类型被忽略。这样的话就不报错了，因为这里不会使用到上下文类型。

上下文归类会在很多情况下使用到。通常包含函数的参数，赋值表达式的右边，类型断言，对象成员和数组字面量和返回值语句。上下文类型也会做为最佳通用类型的候选类型。比如：

```typescript
function createZoo(): Animal[] {
    return [new Rhino(), new Elephant(), new Snake()];
}
```

这个例子里，最佳通用类型有4个候选者：Animal，Rhino，Elephant和Snake。当然，Animal会被做为最佳通用类型。

## 类型兼容性

TypeScript里的类型兼容性是以结构性子类型来判断的。结构性类型是完全根据成员关联类型的一种方式。与正常的类型判断不同。看下面的例子：

```typescript
interface Named {
    name: string;
}

class Person {
    name: string;
}

var p: Named;
// OK, because of structural typing
p = new Person();
```

在正常使用类型的语言像C#或Java中，这段代码会报错，因为Person类没有明确说明其实现了Named接口。

TypeScript的结构性子类型是根据JavaScript代码的通常写法来设计的。因为JavaScript里常用匿名对象像函数表达式或对象字面量，所以用结构性类型系统来描述这些类型比使用正常的类型系统更好。

### 关于稳定性

TypeScript的类型系统允许那些在编译阶段无法否认其安全性的操作。当一个类型系统具有此属性时，被当做是“不稳定”的。TypeScript里允许这种不稳定行为发生的地方是经过仔细考虑的。通过这篇文章，我们会解释什么时候会发生这种情况和其背景。

#### 开始

TypeScript结构化类型系统的基本规则是，如果x与y兼容，那么y至少具有与x相同的属性。比如：

```typescript
interface Named {
    name: string;
}

var x: Named;
// y’s inferred type is { name: string; location: string; }
var y = { name: 'Alice', location: 'Seattle' };
x = y;
```

这里要检查y是否能赋值给x，编译器x中的每个属性，看是否能在y中也找到对应属性。在这个例子中，y必须包含名字是‘name’的string类型成员。y满足条件，因此赋值正确。

检查函数参数时使用相同的规则：

```typescript
function greet(n: Named) {
    alert('Hello, ' + n.name);
}
greet(y); // OK
```

注意，‘y’有个额外的‘location’属性，但这不会引发错误。只有目标类型（这里是‘Named’）的成员会被一一检查是否兼容。

这个比较过程是递归进行的，检查每个成员及子成员。

### 比较两个函数

比较原始类型和对象类型时是容易理解的，问题是如何判断两个函数是兼容的。让我们以两个函数开始，它们仅有参数列表不同：

```typescript
var x = (a: number) => 0;
var y = (b: number, s: string) => 0;

y = x; // OK
x = y; // Error
```

要查看x是否能赋值给y，首先看它们的参数列表。x的每个参数必须能在y里找到对应类型的参数。注意的是参数的名字相同与否无所谓，只看它们的类型。这里，x的每个参数在y中都能找到对应的参数，所以允许赋值。

第二个赋值错误，因为y有个必需的第二个参数，但是x并没有，所以不允许赋值。

你可能会疑惑为什么允许‘忽略’参数，像例子y=x中那样。原因是忽略额外的参数在JavaScript里是很常见的。例如，Array#forEach给回调函数传3个参数：数组元素，索引和整个数组。尽管如此，传入一个只使用第一个参数的回调函数也是很有用的：

```typescript
var items = [1, 2, 3];

// Don't force these extra arguments
items.forEach((item, index, array) => console.log(item));

// Should be OK!
items.forEach((item) => console.log(item));
```

下面来看看如何处理返回值类型，创建两个仅是返回值类型不同的函数：

```typescript
var x = () => ({name: 'Alice'});
var y = () => ({name: 'Alice', location: 'Seattle'});

x = y; // OK
y = x; // Error because x() lacks a location property
```

类型系统强制源函数的返回值类型必须是目标函数返回值类型的子类型。

#### 函数参数双向协变

当比较函数参数类型时，只有源函数参数能够赋值给目标函数或反过来才匹配成功。这是不稳定的，因为调用者可能会被给予一个函数，它接受一个更确切类型，但是调用函数使用不那么确切的类型。实际上，这极少会发生错误，并且能够实现很多JavaScript里的常见模式。例如：

```typescript
enum EventType { Mouse, Keyboard }

interface Event { timestamp: number; }
interface MouseEvent extends Event { x: number; y: number }
interface KeyEvent extends Event { keyCode: number }

function listenEvent(eventType: EventType, handler: (n: Event) => void) {
    /* ... */
}

// Unsound, but useful and common
listenEvent(EventType.Mouse, (e: MouseEvent) => console.log(e.x + ',' + e.y));

// Undesirable alternatives in presence of soundness
listenEvent(EventType.Mouse, (e: Event) => console.log((<MouseEvent>e).x + ',' + (<MouseEvent>e).y));
listenEvent(EventType.Mouse, <(e: Event) => void>((e: MouseEvent) => console.log(e.x + ',' + e.y)));

// Still disallowed (clear error). Type safety enforced for wholly incompatible types
listenEvent(EventType.Mouse, (e: number) => console.log(e));
```

#### 可选参数及剩余参数

比较函数兼容性的时候，可选参数与必须参数是可交换的。

当一个函数有剩余参数时，它被当做无限个可选参数。

这对于类型系统来说是不稳定的，但从运行时的角度来看，可选参数一般来说是不强制的，因为对于大多数函数来说相当于传递了一些‘undefinded’。

有一个好的例子，常见的函数接收一个回调函数并用对于程序员来说是可预知的参数但对类型系统来说是不确定的参数来调用：

```typescript
function invokeLater(args: any[], callback: (...args: any[]) => void) {
    /* ... Invoke callback with 'args' ... */
}

// Unsound - invokeLater "might" provide any number of arguments
invokeLater([1, 2], (x, y) => console.log(x + ', ' + y));

// Confusing (x and y are actually required) and undiscoverable
invokeLater([1, 2], (x?, y?) => console.log(x + ', ' + y));
```

#### 重载的函数

对于有重载的函数，源函数的每个重载都要在目标函数上找到对应的函数签名。这确保了目标函数可以在所有源函数可调用的地方调用。对于特殊的函数重载签名不会用来做兼容性检查。

### Enums

枚举类型与数字类型兼容，并且数字类型与枚举类型兼容。不同枚举类型之间是不兼容的。比如，

```typescript
enum Status { Ready, Waiting };
enum Color { Red, Blue, Green };

var status = Status.Ready;
status = Color.Green;  //error
```

### Classes

类与对象字面量和接口差不多，但有一点不同：类有静态部分和实例部分的类型。比较两个类类型的对象时，只有实例的成员会被比较。静态成员和构造函数不在比较的范围内。

```typescript
class Animal {
    feet: number;
    constructor(name: string, numFeet: number) { }
}

class Size {
    feet: number;
    constructor(numFeet: number) { }
}

var a: Animal;
var s: Size;

a = s;  //OK
s = a;  //OK
```

#### 类的私有成员

私有成员会影响兼容性判断。当类的实例用来检查兼容时，如果它包含一个私有成员，那么目标类型必须包含来自同一个类的这个私有成员。这允许子类赋值给父类，但是不能赋值给其它有同样类型的类。

### 泛型

因为TypeScript是结构性的类型系统，类型参数只影响使用其做为类型一部分的结果类型。比如，

```typescript
interface Empty<T> {
}
var x: Empty<number>;
var y: Empty<string>;

x = y;  // okay, y matches structure of x
```

上面代码里，x和y是兼容的，因为它们的结构使用类型参数时并没有什么不同。把这个例子改变一下，增加一个成员，就能看出是如何工作的了：

```typescript
interface NotEmpty<T> {
    data: T;
}
var x: NotEmpty<number>;
var y: NotEmpty<string>;

x = y;  // error, x and y are not compatible
```

在这里，泛型类型在使用时就好比不是一个泛型类型。

对于没指定泛型类型的泛型参数时，会把所有泛型参数当成‘any'比较。然后用结果类型进行比较，就像上面第一个例子。

比如，

```typescript
var identity = function<T>(x: T): T { 
    // ...
}

var reverse = function<U>(y: U): U {
    // ...
}

identity = reverse;  // Okay because (x: any)=>any matches (y: any)=>any
```

### 高级主题

#### 子类型与赋值

目前为止，我们使用了‘兼容性’，它在语言规范里没有定义。在TypeScript里，有两种类型的兼容性：子类型与赋值。它们的不同点在于，赋值扩展了子类型兼容，允许给‘any’赋值或从‘any’取值和允许数字赋值给枚举类型或枚举类型赋值给数字。

语言里的不同地方分别使用了它们之中的机制。实际上，类型兼容性是由赋值兼容性来控制的甚至在implements和extends语句里。更多信息，请参阅[TypeScript语言规范](http://go.microsoft.com/fwlink/?LinkId=267121).

## <a name="书写.d.ts文件" id="书写.d.ts文件">书写.d.ts文件

当使用外部JavaScript库或新的宿主API时，你需要一个声明文件（.d.ts）定义程序库的shape。这个手册包含了写.d.ts文件的高级概念，并带有一些例子，告诉你怎么去写一个声明文件。

### 指导与说明

#### 流程

最好从程序库的文档开始写.d.ts文件，而不是代码。这样保证不会被具体实现所干扰，而且相比于JS代码更易读。下面的例子会假设你正在参照文档写声明文件。

#### 命名空间

当定义接口（例如：“options”对象），你会选择是否将这些类型放进模块里。这主要是靠主观判断 -- 使用的人主要是用这些类型声明变量和参数，并且类型命名不会引起命名冲突，放在全局命名空间里更好。如果类型不是被直接使用，或者没法起一个唯一的名字的话，就使用模块来避免与其它类型发生冲突。

#### 回调函数

许多JavaScript库接收一个函数做为参数，之后传入已知的参数来调用它。当为这些类型与函数签名的时候，不要把这个参数标记成可选参数。正确的思考方式是“会提供什么样的参数？”，不是“会使用到什么样的参数？”。TypeScript 0.9.7+不会强制这种可选参数的使用，参数可选的双向协变可以被外部的linter强制执行。

#### 扩展与声明合并

写声明文件的时候，要记住TypeScript扩展现有对象的方式。你可以选择用匿名类型或接口类型的方式声明一个变量：

**匿名类型var**

```typescript
declare var MyPoint: { x: number; y: number; };
```

**接口类型var**

```typescript
interface SomePoint { x: number; y: number; }
declare var MyPoint: SomePoint;
```

从使用者角度来讲，它们是相同的，但是SomePoint类型能够通过接口合并来扩展：

```typescript
interface SomePoint { z: number; }
MyPoint.z = 4; // OK
```

是否想让你的声明是可扩展的取决于主观判断。通常来讲，尽量符合library的意图。

#### 类的分解

TypeScript的类会创建出两个类型：实例类型，定义了类型的实例具有哪些成员；构造函数类型，定义了类构造函数具有哪些类型。构造函数类型也被称做类的静态部分类型，因为它包含了类的静态成员。

你可以使用typeof关键字来拿到类静态部分类型，在写声明文件时，想要把类明确的分解成实例类型和静态类型时是有用且必要的。

下面是一个例子，从使用者的角度来看，这两个声明是等同的：

**标准版**

```typescript
class A {
    static st: string;
    inst: number;
    constructor(m: any) {}
}
```

**分解版**

```typescript
interface A_Static {
    new(m: any): A_Instance;
    st: string;
}
interface A_Instance {
    inst: number;
}
declare var A: A_Static;
```

这里的利弊如下：

* 标准方式可以使用extends来继承；分解的类不能。这可能会在未来版本的TypeScript里改变：是否允许任何的extends表达式
* 都允许之后为类添加静态成员
* 允许为分解的类再添加实例成员，标准版不允许
* 使用分解类的时候，为成员起合理的名字

#### 命名规则

一般来讲，不要给接口加I前缀（比如：IColor）。类为TypeScript里的接口类型比C#或Java里的意义更为广泛，IFoo命名不利于这个特点。

### 例子

下面进行例子部分。对于每个例子，先是使用使用方法，然后是类型声明。如果有多个好的声明表示方法，会列出多个。

#### Options Objects

**使用方法**

```javascript
animalFactory.create("dog");
animalFactory.create("giraffe", { name: "ronald" });
animalFactory.create("panda", { name: "bob", height: 400 });

// 错误：如果提供选项，那么必须包含name
animalFactory.create("cat", { height: 32 });
```

**类型**

```typescript
module animalFactory {
    interface AnimalOptions {
        name: string;
        height?: number;
        weight?: number;
    }
    function create(name: string, animalOptions?: AnimalOptions): Animal;
}
```

#### 带属性的函数

**使用方法**

```javascript
zooKeeper.workSchedule = "morning";
zooKeeper(giraffeCage);
```

**类型**

```typescript
// 注意：函数必须在模块之前
function zooKeeper(cage: AnimalCage);
module zooKeeper {
    var workSchedule: string;
}
```

#### 可以用new调用也可以直接调用的方法

**使用方法**

```javascript
var w = widget(32, 16);
var y = new widget("sprocket");
// w and y are both widgets
w.sprock();
y.sprock();
```

**类型**

```typescript
interface Widget {
    sprock(): void;
}

interface WidgetFactory {
    new(name: string): Widget;
    (width: number, height: number): Widget;
}

declare var widget: WidgetFactory;
```

#### 全局的/不清楚的Libraries

**使用方法**

```javascript
// Either
import x = require('zoo');
x.open();
// or
zoo.open();
```

**类型**

```typescript
module zoo {
  function open(): void;
}

declare module "zoo" {
    export = zoo;
}
```

#### 外部模块的单个复杂对象

**使用方法**

```javascript
// Super-chainable library for eagles
import eagle = require('./eagle');
// Call directly
eagle('bald').fly();
// Invoke with new
var eddie = new eagle(1000);
// Set properties
eagle.favorite = 'golden';
```

**类型**

```typescript
// Note: can use any name here, but has to be the same throughout this file
declare function eagle(name: string): eagle;
declare module eagle {
    var favorite: string;
    function fly(): void;
}
interface eagle {
    new(awesomeness: number): eagle;
}

export = eagle;
```

#### 回调函数

**使用方法**

```javascript
addLater(3, 4, (x) => console.log('x = ' + x));
```

**类型**

```typescript
// Note: 'void' return type is preferred here
function addLater(x: number, y: number, (sum: number) => void): void;
```

如果你想看其它模式的实现方式，请在[这里](https://typescript.codeplex.com/wikipage?title=https%3a%2f%2fgithub.com%2fMicrosoft%2fTypeScript%2fissues&referringTitle=Writing%20Definition%20%28.d.ts%29%20Files)留言，我们会尽可能地加到这里来。
