# TypeScript手册

[TypeScript Handbook](http://www.typescriptlang.org/Handbook)

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

## 基本类型

为了写出有用的程序, 我们需要有能力去处理简单的数据单位: 数字, 字符串, 结构, 布尔值等. 在TypeScript里, 包含了与JavaScript中几乎相同的数据类型, 此外还有便于我们操作的枚举类型.

### Boolean

最基本的数据类型就是true/false值, 在JavaScript和TypeScript里叫做布尔值.

```typescript
var isDone: boolean = false;
```

### Number

与JavaScript一样, 所有的数字在TypeScript里都是浮点数. 它们的类型是'number'.

```typescript
var height: number = 6;
```

### String

像其它语言里一样, 我们使用'string'表示文本数据类型. 与JavaScript里相同, 可以使用双引号(")或单引号(')表示字符串.

```typescript
var name: string = "bob";
name = 'smith';
```

### Array

TypeScript像JavaScript一样, 允许你操作数组数据. 可以用两种方式定义数组. 第一种, 可以在元素类型后面接'[]', 表示由此此类元素构成的一个数组:

```typescript
var list:number[] = [1, 2 ,3];
```

第二种方式是使用数组泛型, Array<元素类型>:

```typescript
var list:Array<number> = [1, 2, 3];
```

### Enum

'enum'类型是对标准JavaScript数据类型的一个补充. 像其它语言, 如C#, 使用枚举类型可以为一组数值赋予友好的名字.

```typescript
enum Color {Red, Green, Blue};
var c: Color = Color.Green;
```

默认情况下, 从0开始为元素编号. 你也可以手动的指定成员的数值. 例如, 我们将上面的例子改成从1开始编号:

```typescript
enum Color {Red = 1, Green, Blue};
var c: Color = Color.Green;
```

或者, 全部都采用手动赋值:

```typescript
enum Color {Red = 1, Green = 2, Blue = 4};
var c: Color = Color.Green;
```

枚举类型一个便利的特点是, 你可以从枚举的值取出它的名字. 例如, 我们知道数值2, 但是不确认它映射到Color里的哪个名字, 我们可以查找相应的名字:

```typescript
enum Color {Red = 1, Green, Blue};
var colorName: string = Color[2];

alert(colorName);
```

### Any

有时, 我们可能会为暂时还不清楚的变量指定类型. 这些值可能来自于动态的内容, 比如第三方程序库. 这种情况下, 我们不希望类型检查器对这些值进行检查或者说让它们直接通过编译阶段的检查. 这时, 我们可以使用'any'类型来标记这些变量:

```typescript
var notSure: any = 4;
notSure = "maybe a string instead";
notSure = false; // okay, definitely a boolean
```

在对现有代码进行改写的时候, 'any'类型是十分有用的, 它允许你在编译时可选择地包含或移除类型检查.

当你仅仅知道一部分数据的类型时, 'any'类型也是很有用的. 比如, 你有一个数组, 它包含了不同的数据类型:

```typescript
var list:any[] = [1, true, "free"];

list[1] = 100;
```

### Void

某种程度上来说, 'void'类型与'any'类型是相反的, 表示没有任何类型. 当一个函数不返回任何值是, 你通常会见到其返回值类型是'void':

```typescript
function warnUser(): void {
    alert("This is my warning message");
}
```

## 接口

TypeScript的核心原则之一是对值所具有的'shape'进行类型检查. 它有时被称做鸭子类型或结构性子类型. 在TypeScript里, 接口负责为这样的类型命名, 它可以为你的代码或第三方代码定义契约.

### 第一个接口例子

下面来看一个很简单的例子:

```typescript
function printLabel(labelledObj: {label: string}) {
  console.log(labelledObj.label);
}

var myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
```

类型检查器查看'printLabel'的调用. 'printLabel'有一个参数, 这个参数应该是一个对象, 并包含一个名字是'label'类型为'string'的属性. 需要注意的是, 我们传入的对象可能有很多个属性, 但是编译器要求至少'label'属性是存在的, 并且其类型是'string':

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

LabelledValue接口可以用来描述上面例子里的契约: 应该具有一个类型是'string'的名字是'label'的属性. 需要注意的是, 在这里我们并不能像在其它语言里一样, 说labelledObj实现了LabelledValue接口. 我们关注的只是值的'shape'. 只要传入的对象满足上面提到的必须条件, 那么就通过检查.

### 可选属性

接口里的属性并不是全部是必须的. 有些是在某些条件下存在, 而有的则根本不需要. 这在使用'option bags'模式时很有用, 即给函数传入的对象中仅存在一部分属性.

下面是应用了'option bags'的例子:

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

带有可选属性的接口与普通的接口定义差不多, 只是在可选属性名字定义的后面加一个'?'符号.

可选属性的好处之一是可以对可能存在的属性进行预定义, 好处之二是可以捕获出现了不存在的属性时的错误. 比如, 我们故意错误的拼写color(collor), 传入'createSquare'的属性名, 我们会得到一个错误提示.

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

接口可以描述大部分JavaScript中的对象类型. 除了描述带有属性的对象外, 接口也可以表示函数类型.

我们可以给接口定义一个调用签名来描述函数类型. 它好比一个只有参数列表和返回值类型的函数定义.

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}
```

定义后, 我们可以像使用其它接口一样使用这个函数接口. 下例展示了如何创建一个函数类型的变量, 并赋予一个同类型的函数值.

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

对函数类型的类型检查来说, 函数参数的名字不需要与接口里定义的名字相匹配. 比如, 我们也用下面的代码重写上面的例子:

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

函数的参数是参照其位置一个接一个的检查. 函数的返回值类型通过其返回值推断出来(此例是false和true). 如果让这个函数返回数字或字符串, 类型检查器会警告我们函数的返回值类型与SearchFunc接口中的定义不匹配.

### 数组类型

与使用接口描述函数类型差不多, 我们也可以描述数组类型. 数组类型具有一个'index'类型表示索引的类型与相应的返回值类型.

```typescript
interface StringArray {
  [index: number]: string;
}

var myArray: StringArray;
myArray = ["Bob", "Fred"];
```

有两种支持的索引类型: 字符串和数字. 你可以为一个数组同时指定这两种索引类型, 但是有一个限制, 数字索引返回值的类型必须是字符串索引返回值的类型的子类型.

索引签名可以很好的描述数组和'字典'模式, 它们也强制所有属性都与索引返回值类型相匹配. 下面的例子里, length属性不匹配索引, 所以类型检查器给出一个错误提示:

```typescript
interface Dictionary {
  [index: string]: string;
  length: number;    // error, the type of 'length' is not a subtype of the indexer
}
```

### 类类型

#### 实现接口

与在C#或Java里接口的基本作用一样, 在TypeScript里它可以明确的强制一个类去符合某种契约.

```typescript
interface ClockInterface {
    currentTime: Date;
}

class Clock implements ClockInterface  {
    currentTime: Date;
    constructor(h: number, m: number) { }
}
```

你也可以在接口中描述一个方法, 在类里实现它, 如同下面的'setTime'方法一样:

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

接口描述了类的公共部分, 而不是公共和私有两部分. 它不会帮你检查类是否具有某些私有成员.

#### 静态成员与类实例的差别

当你操作类和接口的时候, 你要知道类是有两种类型的: 静态部分的类型和实例的类型. 你会注意到, 当你用带有构造器签名去定义一个接口并试图定义一个类去实现这个接口时会得到一个错误:

```typescript
interface ClockInterface {
    new (hour: number, minute: number);
}

class Clock implements ClockInterface  {
    currentTime: Date;
    constructor(h: number, m: number) { }
}
```

这里因为当一个类实现了一个接口, 只有实例部分会进行类型检查. 'constructor'是在类的静态部分, 所以不在检查的范围内.

取而代之, 你应该直接操作类的'静态'部分. 下面的例子, 我们直接操作类:

```typescript
interface ClockStatic {
    new (hour: number, minute: number);
}

class Clock  {
    currentTime: Date;
    constructor(h: number, m: number) { }
}

var cs: ClockStatic = Clock;
var newClock = new cs(7, 30);
```

### 扩展接口

和类一样, 接口也可以相互扩展. 扩展接口时会将其它接口里的属性拷贝到这个接口里, 因此允许你把接口拆分成分开的可重用的组件.

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

接口可以继承多个接口, 创建一个综合的接口.

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

先前我们提过, 接口可以描述JavaScript里存在的丰富的类型. 因为JavaScript有动态的灵活的特点, 有时你会希望一个对象可以同时具有上面提到的多种类型.

一个例子就是, 一个对象可以同时做为函数和对象使用, 并带有额外的属性.

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

使用第三方库的时候, 你可能会上面那样去详细的定义类型.
