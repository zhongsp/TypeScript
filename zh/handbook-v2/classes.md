# 类

<blockquote class='bg-reading'>
  <p>背景阅读：<br /><a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes'>类（MDN）</a></p>
</blockquote>

TypeScript 对 ES2015 引入的 `class` 关键字提供了全面支持。

与其他 JavaScript 语言特性一样，TypeScript 添加了类型注解和其他语法，使你能够表达类和其他类型之间的关系。

## 类成员

下面是一个最基本的类——空类：

```ts twoslash
class Point {}
```

这个类目前还没有什么用，所以我们添加一些成员。

### 字段

字段声明在类上创建了一个公共可写属性：

```ts twoslash
// @strictPropertyInitialization: false
class Point {
  x: number;
  y: number;
}

const pt = new Point();
pt.x = 0;
pt.y = 0;
```

与其他位置一样，类型注解是可选的，但如果未指定，则会隐式为 `any` 类型。

字段还可以有_初始化器_；当类被实例化时，它们将自动运行：

```ts twoslash
class Point {
  x = 0;
  y = 0;
}

const pt = new Point();
// 输出 0, 0
console.log(`${pt.x}, ${pt.y}`);
```

与 `const`、`let` 和 `var` 一样，类属性的初始化器会用于推断其类型：

```ts twoslash
// @errors: 2322
class Point {
  x = 0;
  y = 0;
}
// ---cut---
const pt = new Point();
pt.x = "0";
```

#### `--strictPropertyInitialization`

[`strictPropertyInitialization`](/tsconfig#strictPropertyInitialization) 设置项控制是否需要在构造函数中初始化类字段。

```ts twoslash
// @errors: 2564
class BadGreeter {
  name: string;
}
```

```ts twoslash
class GoodGreeter {
  name: string;

  constructor() {
    this.name = "hello";
  }
}
```

请注意，字段需要在_构造函数内部_进行初始化。TypeScript 在检测初始化时不会分析从构造函数中调用的方法，因为派生类可能会覆写这些方法，并未初始化成员。

如果你打算通过构造函数以外的方式明确初始化字段（例如，也许外部库填充类的一部分内容），你可以使用_明确赋值断言操作符_ `!`：

```ts twoslash
class OKGreeter {
  // 没有初始化，但没有错误
  name!: string;
}
```

### `readonly`

字段可以使用 `readonly` 修饰符进行前缀标记。这将阻止在构造函数之外对字段进行赋值。

```ts twoslash
// @errors: 2540 2540
class Greeter {
  readonly name: string = "world";

  constructor(otherName?: string) {
    if (otherName !== undefined) {
      this.name = otherName;
    }
  }

  err() {
    this.name = "不可以";
  }
}
const g = new Greeter();
g.name = "同样不可以";
```

### 构造函数

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/constructor'>构造函数（MDN）</a><br/>
   </p>
</blockquote>

类构造函数与函数非常相似。你可以添加带有类型注解、默认值和重载的参数：

```ts twoslash
class Point {
  x: number;
  y: number;

  // 带有默认值的普通签名
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}
```

```ts twoslash
class Point {
  // 重载
  constructor(x: number, y: string);
  constructor(s: string);
  constructor(xs: any, y?: any) {
    // 待定
  }
}
```

类构造函数签名与函数签名之间只有一些小的区别：

- 构造函数不能有类型参数——这些属于外部类声明的部分，我们稍后会学习到
- 构造函数不能有返回类型注解——返回的类型始终是类实例的类型

#### 调用父类构造函数

与 JavaScript 类似，如果你有一个基类，在使用任何 `this.` 成员之前，需要在构造函数体中调用 `super();`：

```ts twoslash
// @errors: 17009
class Base {
  k = 4;
}

class Derived extends Base {
  constructor() {
    // 在 ES5 中输出错误的值；在 ES6 中抛出异常
    console.log(this.k);
    super();
  }
}
```

忘记调用 `super` 是在 JavaScript 中很容易犯的错误，但是 TypeScript 会在必要时告诉你。

### 方法

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Method_definitions'>方法定义</a><br/>
   </p>
</blockquote>

类中的函数属性称为_方法_。方法可以使用与函数和构造函数相同的类型注解：

```ts twoslash
class Point {
  x = 10;
  y = 10;

  scale(n: number): void {
    this.x *= n;
    this.y *= n;
  }
}
```

除了标准的类型注解外，TypeScript 对方法没有引入任何新的内容。

请注意，在方法体内部，仍然必须通过 `this.` 访问字段和其他方法。在方法体中的未限定名称始终会引用封闭作用域中的某个内容：

```ts twoslash
// @errors: 2322
let x: number = 0;

class C {
  x: string = "hello";

  m() {
    // 这是尝试修改第 1 行的‘x’，而不是类属性
    x = "world";
  }
}
```

### Getter / Setter

类也可以拥有_访问器_：

```ts twoslash
class C {
  _length = 0;
  get length() {
    return this._length;
  }
  set length(value) {
    this._length = value;
  }
}
```

> 注意，在 JavaScript 中，如果一个字段的 get/set 对没有额外的逻辑，它很少有用处。
> 如果在 get/set 操作期间不需要添加其他逻辑，可以直接暴露公共字段。

TypeScript 对访问器有一些特殊的类型推断规则：

- 如果存在 `get` 但不存在 `set`，则属性自动为 `readonly`
- 如果 setter 参数的类型未指定，则从 getter 的返回类型进行推断
- getter 和 setter 的[成员可见性](#成员可见性)必须相同

自 [TypeScript 4.3](https://devblogs.microsoft.com/typescript/announcing-typescript-4-3/) 起，可以在获取和设置时使用不同的类型。

```ts twoslash
class Thing {
  _size = 0;

  get size(): number {
    return this._size;
  }

  set size(value: string | number | boolean) {
    let num = Number(value);

    // 不允许 NaN、Infinity 等

    if (!Number.isFinite(num)) {
      this._size = 0;
      return;
    }

    this._size = num;
  }
}
```

### 索引签名

类可以声明索引签名；这与[其他对象类型的索引签名](/zh/docs/handbook/2/objects.html#索引签名)相同：

```ts twoslash
class MyClass {
  [s: string]: boolean | ((s: string) => boolean);

  check(s: string) {
    return this[s] as boolean;
  }
}
```

由于索引签名类型还需要捕获方法的类型，因此很难有用地使用这些类型。通常最好将索引数据存储在类实例本身以外的其他位置。

## 类继承

与其他具有面向对象特性的语言一样，JavaScript 中的类可以从基类继承。

### `implements` 子句

你可以使用 `implements` 子句来检查一个类是否满足特定的接口。如果类未能正确实现接口，将会发出错误提示：

```ts twoslash
// @errors: 2420
interface Pingable {
  ping(): void;
}

class Sonar implements Pingable {
  ping() {
    console.log("ping!");
  }
}

class Ball implements Pingable {
  pong() {
    console.log("pong!");
  }
}
```

类也可以实现多个接口，例如 `class C implements A, B {`。

#### 注意事项

重要的是要理解，`implements` 子句仅仅是一个检查，用于判断类是否可以被视为接口类型。它_完全_不会改变类或其方法的类型。一个常见的错误是认为 `implements` 子句会改变类的类型——实际上并不会！

```ts twoslash
// @errors: 7006
interface Checkable {
  check(name: string): boolean;
}

class NameChecker implements Checkable {
  check(s) {
    // 注意这里没有错误
    return s.toLowerCase() === "ok";
    //         ^?
  }
}
```

在这个例子中，我们可能认为 `s` 的类型会受到 `check` 方法的 `name: string` 参数的影响。但实际上不会——`implements` 子句不会改变对类的检查或类型推断的方式。

类似地，实现具有可选属性的接口并不会创建该属性：

```ts twoslash
// @errors: 2339
interface A {
  x: number;
  y?: number;
}
class C implements A {
  x = 0;
}
const c = new C();
c.y = 10;
```

### `extends` 子句

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/extends'>extends 关键字（MDN）</a><br/>
   </p>
</blockquote>

类可以从基类进行 `extends` 继承。派生类具有其基类的所有属性和方法，并且还可以定义额外的成员。

```ts twoslash
class Animal {
  move() {
    console.log("继续前进！");
  }
}

class Dog extends Animal {
  woof(times: number) {
    for (let i = 0; i < times; i++) {
      console.log("汪！");
    }
  }
}

const d = new Dog();
// 基类方法
d.move();
// 派生类方法
d.woof(3);
```

#### 覆写方法

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/super'>super 关键字（MDN）</a><br/>
   </p>
</blockquote>

派生类还可以覆写基类的字段或属性。你可以使用 `super.` 语法来访问基类的方法。请注意，由于 JavaScript 类是一个简单的查找对象，没有“super 字段”的概念。

TypeScript 强制要求派生类始终是其基类的子类型。

例如，以下是一种覆写方法的合法方式：

```ts twoslash
class Base {
  greet() {
    console.log("你好，世界！");
  }
}

class Derived extends Base {
  greet(name?: string) {
    if (name === undefined) {
      super.greet();
    } else {
      console.log(`你好，${name.toUpperCase()}`);
    }
  }
}

const d = new Derived();
d.greet();
d.greet("reader");
```

派生类必须遵循其基类的约定。请记住，通过基类引用来引用派生类实例是非常常见的做法（并且始终是合法的）：

```ts twoslash
class Base {
  greet() {
    console.log("你好，世界！");
  }
}
class Derived extends Base {}
const d = new Derived();
// ---cut---
// 通过基类引用来声明派生类实例的别名
const b: Base = d;
// 没有问题
b.greet();
```

那么如果 `Derived` 不遵循 `Base` 的约定会怎样呢？

```ts twoslash
// @errors: 2416
class Base {
  greet() {
    console.log("你好，世界！");
  }
}

class Derived extends Base {
  // 使这个参数成为必需的
  greet(name: string) {
    console.log(`你好，${name.toUpperCase()}`);
  }
}
```

如果我们无视错误，仍编译了这段代码，那么这个示例将会崩溃：

```ts twoslash
declare class Base {
  greet(): void;
}
declare class Derived extends Base {}
// ---cut---
const b: Base = new Derived();
// 由于“name”为 undefined，所以崩溃
b.greet();
```

#### 仅类型字段声明

当 `target >= ES2022` 或 [`useDefineForClassFields`](/tsconfig#useDefineForClassFields) 为 `true` 时，类字段在父类构造函数完成后进行初始化，覆盖了父类设置的任何值。这在你只想为继承字段声明更准确的类型时可能会成为问题。为了处理这些情况，你可以使用 `declare` 来告诉 TypeScript 此字段声明不会产生运行时效果。

```ts twoslash
interface Animal {
  dateOfBirth: any;
}

interface Dog extends Animal {
  breed: any;
}

class AnimalHouse {
  resident: Animal;
  constructor(animal: Animal) {
    this.resident = animal;
  }
}

class DogHouse extends AnimalHouse {
  // 不会生成 JavaScript 代码，
  // 只是确保类型正确
  declare resident: Dog;
  constructor(dog: Dog) {
    super(dog);
  }
}
```

#### 初始化顺序

JavaScript 类的初始化顺序在某些情况下可能会出人意料。让我们来看一下这段代码：

```ts twoslash
class Base {
  name = "基础";
  constructor() {
    console.log("我是" + this.name);
  }
}

class Derived extends Base {
  name = "派生";
}

// 输出“基础”，而不是“派生”
const d = new Derived();
```

怎么回事？

按照 JavaScript 的定义，类的初始化顺序如下：

- 初始化基类字段
- 运行基类构造函数
- 初始化派生类字段
- 运行派生类构造函数

这意味着在运行基类构造函数期间，它看到的是自己的 `name` 值，因为派生类字段的初始化尚未运行。

#### 继承内置类型

> 注意：如果你不打算继承像 `Array`、`Error`、`Map` 等内置类型，或者你的编译目标明确设置为 `ES6`/`ES2015` 或更高版本，则可以跳过本节。

在 ES2015 中，返回对象的构造函数会隐式地用 `this` 的值替换 `super(...)` 的调用者。生成的构造函数代码需要捕获 `super(...)` 的潜在返回值并将其替换为 `this`。

因此，`Error`、`Array` 等类型的继承可能不再按预期工作。这是因为 `Error`、`Array` 等类型的构造函数使用 ECMAScript 6 的 `new.target` 来调整原型链；然而，在 ECMAScript 5 中，在调用构造函数时无法确保为 `new.target` 设置一个值。其他降级编译器通常都有相同的限制。

对于以下子类：

```ts twoslash
class MsgError extends Error {
  constructor(m: string) {
    super(m);
  }
  sayHello() {
    return "你好" + this.message;
  }
}
```

你可能会发现：

- 在构造这些子类的对象时，方法可能为 `undefined`，因此调用 `sayHello` 将导致错误。
- 子类实例与其实例之间的 `instanceof` 将会失效，因此 `(new MsgError()) instanceof MsgError` 将返回 `false`。

作为建议，你可以在任何 `super(...)` 调用之后手动调整原型。

```ts twoslash
class MsgError extends Error {
  constructor(m: string) {
    super(m);

    // 显式地设置原型。
    Object.setPrototypeOf(this, MsgError.prototype);
  }

  sayHello() {
    return "hello " + this.message;
  }
}
```

但是，`MsgError` 的任何子类也必须手动设置原型。对于不支持 [`Object.setPrototypeOf`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf) 的运行时环境，你可以使用 [`__proto__`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/proto)。

不幸的是，[这些解决方法在 Internet Explorer 10 及更早版本中不起作用](<https://msdn.microsoft.com/zh-cn/library/s4esdbwz(v=vs.94).aspx>)。你可以手动将原型上的方法复制到实例本身（即将 `MsgError.prototype` 复制到 `this`），但原型链本身无法修复。

## 成员可见性

你可以使用 TypeScript 控制某些方法或属性对类外部代码的可见性。

### `public`

类成员的默认可见性是 `public`。`public` 成员可以在任何地方访问：

```ts twoslash
class Greeter {
  public greet() {
    console.log("嗨！");
  }
}
const g = new Greeter();
g.greet();
```

因为 `public` 已经是默认的可见性修饰符，所以你不*需要*在类成员上写它，但出于风格或可读性的原因，你可以选择这样做。

### `protected`

`protected` 成员只对声明它们的类的子类可见。

```ts twoslash
// @errors: 2445
class Greeter {
  public greet() {
    console.log("你好，" + this.getName());
  }
  protected getName() {
    return "嗨";
  }
}

class SpecialGreeter extends Greeter {
  public howdy() {
    // 可以在这里访问受保护的成员
    console.log("Howdy, " + this.getName());
    //                          ^^^^^^^^^^^^^^
  }
}
const g = new SpecialGreeter();
g.greet(); // 可以
g.getName();
```

#### 暴露 `protected` 成员

派生类需要遵循其基类的约定，但可以选择暴露具有更多功能的基类子类型。这包括将 `protected` 成员改为 `public`：

```ts twoslash
class Base {
  protected m = 10;
}
class Derived extends Base {
  // 没有修饰符，所以默认是‘public’
  m = 15;
}
const d = new Derived();
console.log(d.m); // 可以
```

请注意，`Derived` 已经能够自由读取和写入 `m`，因此这种情况下并不会实质性地改变“安全性”。这里需要注意的主要事项是，在派生类中，如果这种暴露不是有意的，请小心重复使用 `protected` 修饰符。

#### 跨层级的 `protected` 访问

不同的面向对象编程语言对于通过基类引用访问 `protected` 成员是否合法存在分歧：

```ts twoslash
// @errors: 2446
class Base {
  protected x: number = 1;
}
class Derived1 extends Base {
  protected x: number = 5;
}
class Derived2 extends Base {
  f1(other: Derived2) {
    other.x = 10;
  }
  f2(other: Derived1) {
    other.x = 10;
  }
}
```

例如，Java 认为这是合法的。另一方面，C# 和 C++ 则认为这段代码应该是非法的。

TypeScript 在这里与 C# 和 C++ 保持一致，因为只有从 `Derived2` 的子类中才能合法地访问 `Derived2` 中的 `x`，而 `Derived1` 不是其中之一。此外，如果通过 `Derived1` 引用访问 `x` 是非法的（肯定应该是！），那么通过基类引用访问它是无法改变这种情况的。

参见[为何不能访问派生类的 Protected 成员？](https://blogs.msdn.microsoft.com/ericlippert/2005/11/09/why-cant-i-access-a-protected-member-from-a-derived-class/)，其中更详细地解释了 C# 的原理。

### `private`

`private` 和 `protected` 类似，但甚至不允许从子类中访问该成员：

```ts twoslash
// @errors: 2341
class Base {
  private x = 0;
}
const b = new Base();
// 无法从类外部访问
console.log(b.x);
```

```ts twoslash
// @errors: 2341
class Base {
  private x = 0;
}
// ---cut---
class Derived extends Base {
  showX() {
    // 无法在子类中访问
    console.log(this.x);
  }
}
```

由于 `private` 成员对派生类不可见，派生类无法增加它们的可见性：

```ts twoslash
// @errors: 2415
class Base {
  private x = 0;
}
class Derived extends Base {
  x = 1;
}
```

#### 跨实例的 `private` 访问

不同的面向对象编程语言在是否允许同一类的不同实例访问彼此的 `private` 成员上存在分歧。Java、C#、C++、Swift 和 PHP 等语言允许这样做，但 Ruby 不允许。

TypeScript 允许跨实例的 `private` 访问：

```ts twoslash
class A {
  private x = 10;

  public sameAs(other: A) {
    // 没有错误
    return other.x === this.x;
  }
}
```

#### 注意事项

与 TypeScript 类型系统的其他方面一样，`private` 和 `protected` [仅在类型检查期间执行](https://www.typescriptlang.org/play?removeComments=true&target=99&ts=4.3.4#code/PTAEGMBsEMGddAEQPYHNQBMCmVoCcsEAHPASwDdoAXLUAM1K0gwQFdZSA7dAKWkoDK4MkSoByBAGJQJLAwAeAWABQIUH0HDSoiTLKUaoUggAW+DHorUsAOlABJcQlhUy4KpACeoLJzrI8cCwMGxU1ABVPIiwhESpMZEJQTmR4lxFQaQxWMm4IZABbIlIYKlJkTlDlXHgkNFAAbxVQTIAjfABrAEEC5FZOeIBeUAAGAG5mmSw8WAroSFIqb2GAIjMiIk8VieVJ8Ar01ncAgAoASkaAXxVr3dUwGoQAYWpMHBgCYn1rekZmNg4eUi0Vi2icoBWJCsNBWoA6WE8AHcAiEwmBgTEtDovtDaMZQLM6PEoQZbA5wSk0q5SO4vD4-AEghZoJwLGYEIRwNBoqAzFRwCZCFUIlFMXECdSiAhId8YZgclx0PsiiVqOVOAAaUAFLAsxWgKiC35MFigfC0FKgSAVVDTSyk+W5dB4fplHVVR6gF7xJrKFotEk-HXIRE9PoDUDDcaTAPTWaceaLZYQlmoPBbHYx-KcQ7HPDnK43FQqfY5+IMDDISPJLCIuqoc47UsuUCofAME3Vzi1r3URvF5QV5A2STtPDdXqunZDgDaYlHnTDrrEAF0dm28B3mDZg6HJwN1+2-hg57ulwNV2NQGoZbjYfNrYiENBwEFaojFiZQK08C-4fFKTVCozWfTgfFgLkeT5AUqiAA)。

这意味着像 `in` 或简单的属性查询这样的 JavaScript 运行时构造仍然可以访问 `private` 或 `protected` 成员：

```ts twoslash
class MySafe {
  private secretKey = 12345;
}
```

```js
// 在 JavaScript 文件中...
const s = new MySafe();
// 将打印 12345
console.log(s.secretKey);
```

`private` 还允许在类型检查期间使用方括号表示法进行访问。这使得对 `private` 声明的字段的访问在单元测试等情况下更容易，缺点是这些字段是_软私有的_，不严格执行私有化。

```ts twoslash
// @errors: 2341
class MySafe {
  private secretKey = 12345;
}

const s = new MySafe();

// 在类型检查期间不允许
console.log(s.secretKey);

// 可以
console.log(s["secretKey"]);
```

与 TypeScript 的 `private` 不同，JavaScript 的[私有字段](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/Private_class_fields)（`#`）在编译后仍然保持私有，并且不提供先前提到的方括号访问等逃逸口，使得它们成为_硬私有_字段。

```ts twoslash
class Dog {
  #barkAmount = 0;
  personality = "happy";

  constructor() {}
}
```

```ts twoslash
// @target: esnext
// @showEmit
class Dog {
  #barkAmount = 0;
  personality = "happy";

  constructor() {}
}
```

当编译为 ES2021 或更低版本时，TypeScript 将使用 WeakMaps 代替 `#`。

```ts twoslash
// @target: es2015
// @showEmit
class Dog{
  #barkAmount = 0;
  personality = "happy";

  constructor() {}
}
```

如果你需要保护类中的值免受恶意操作，你应该使用提供硬运行时私有的机制，例如闭包、WeakMaps 或私有字段。请注意，这些在运行时添加的隐私检查可能会影响性能。

## 静态成员

<blockquote class='bg-reading'>
   <p>背景阅读<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/static'>静态成员（MDN）</a><br/>
   </p>
</blockquote>

类可以具有 `static` 成员。这些成员不与类的特定实例关联。可以通过类构造器对象本身访问它们：

```ts twoslash
class MyClass {
  static x = 0;
  static printX() {
    console.log(MyClass.x);
  }
}
console.log(MyClass.x);
MyClass.printX();
```

静态成员也可以使用相同的 `public`、`protected` 和 `private` 可见性修饰符：

```ts twoslash
// @errors: 2341
class MyClass {
  private static x = 0;
}
console.log(MyClass.x);
```

静态成员也会被继承：

```ts twoslash
class Base {
  static getGreeting() {
    return "你好世界";
  }
}
class Derived extends Base {
  myGreeting = Derived.getGreeting();
}
```

### 特殊的静态名称

通常情况下，覆盖 `Function` 原型的属性是不安全/不可能的。由于类本身是可以使用 `new` 调用的函数，因此不能使用某些静态名称。诸如 `name`、`length` 和 `call` 的函数属性不能作为 `static` 成员定义：

```ts twoslash
// @errors: 2699
class S {
  static name = "S!";
}
```

### 为什么没有静态类？

TypeScript（以及 JavaScript）没有类似于 C# 的 `static class` 构造。

这些构造的存在*仅*是因为这些语言强制要求所有的数据和函数都在类内部；因为 TypeScript 中不存在这种限制，所以也就没有必要使用它们。在 JavaScript/TypeScript 中，通常将只有一个实例的类表示为普通的_对象_。

例如，在 TypeScript 中我们不需要“static class”语法，因为普通的对象（甚至是顶级函数）同样可以完成工作：

```ts twoslash
// 不必要的“static”类
class MyStaticClass {
  static doSomething() {}
}

// 首选（替代方案 1）
function doSomething() {}

// 首选（替代方案 2）
const MyHelperObject = {
  dosomething() {},
};
```

## 类中的 `static` 块

静态块允许你编写一系列具有自己作用域的语句，这些语句可以访问包含类中的私有字段。这意味着我们可以编写具有所有语句编写功能、没有变量泄漏以及对类内部的完全访问权限的初始化代码。

```ts twoslash
declare function loadLastInstances(): any[]
// ---cut---
class Foo {
    static #count = 0;

    get count() {
        return Foo.#count;
    }

    static {
        try {
            const lastInstances = loadLastInstances();
            Foo.#count += lastInstances.length;
        }
        catch {}
    }
}
```

## 泛型类

类，类似于接口，可以是泛型的。当使用 `new` 实例化泛型类时，其类型参数的推断方式与函数调用相同：

```ts twoslash
class Box<Type> {
  contents: Type;
  constructor(value: Type) {
    this.contents = value;
  }
}

const b = new Box("你好！");
//    ^?
```

类可以像接口一样使用泛型约束和默认值。

### 静态成员中的类型参数

下面的代码是不合法的，可能并不明显为什么会出错：

```ts twoslash
// @errors: 2302
class Box<Type> {
  static defaultValue: Type;
}
```

请记住，类型始终会完全擦除！在运行时，只有*一个* `Box.defaultValue` 属性槽位。这意味着设置 `Box<string>.defaultValue`（如果可能的话）也会同时改变 `Box<number>.defaultValue`——不太好。泛型类的 `static` 成员永远不能引用类的类型参数。

## 类的运行时 `this`

<blockquote class='bg-reading'>
   <p>背景阅读<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/this'>this 关键字（MDN）</a><br/>
   </p>
</blockquote>

请记住，TypeScript 不会改变 JavaScript 的运行时行为，而 JavaScript 因其某些怪异的运行时行为而有一定的“声名”。

JavaScript 对 `this` 的处理方式确实有些不寻常：

```ts twoslash
class MyClass {
  name = "MyClass";
  getName() {
    return this.name;
  }
}
const c = new MyClass();
const obj = {
  name: "obj",
  getName: c.getName,
};

// 输出“obj”，而不是“MyClass”
console.log(obj.getName());
```

简而言之，默认情况下，函数内部的 `this` 值取决于*函数的调用方式*。在这个例子中，因为函数是通过 `obj` 引用调用的，它的 `this` 值是 `obj` 而不是类的实例。

这通常不是你想要的结果！TypeScript 提供了一些方法来减轻或防止这种类型的错误。

### 箭头函数

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions'>箭头函数（MDN）</a><br/>
   </p>
</blockquote>

如果一个函数在调用时经常丢失其 `this` 上下文，那么使用箭头函数属性而不是方法定义可能是有意义的：

```ts twoslash
class MyClass {
  name = "MyClass";
  getName = () => {
    return this.name;
  };
}
const c = new MyClass();
const g = c.getName;
// 输出“MyClass”而不会崩溃
console.log(g());
```

这种方式有一些权衡：

- `this` 值在运行时保证是正确的，即使对于未经 TypeScript 检查的代码也是如此。
- 这会使用更多的内存，因为每个类实例都会有自己的这种方式定义的函数副本。
- 无法在派生类中使用 `super.getName`，因为原型链中没有条目来获取基类方法。

### `this` 参数

在 TypeScript 中，方法或函数定义中的名为 `this` 的初始参数具有特殊含义。这些参数在编译过程中被擦除：

```ts twoslash
type SomeType = any;
// ---cut---
// TypeScript 输入带有‘this’参数
function fn(this: SomeType, x: number) {
  /* ... */
}
```

```js
// JavaScript 输出
function fn(x) {
  /* ... */
}
```

TypeScript 检查调用带有 `this` 参数的函数时，确保使用了正确的上下文。除了使用箭头函数外，我们还可以在方法定义中添加 `this` 参数，以静态地强制执行正确的方法调用：

```ts twoslash
// @errors: 2684
class MyClass {
  name = "MyClass";
  getName(this: MyClass) {
    return this.name;
  }
}
const c = new MyClass();
// 正确调用
c.getName();

// 错误，会导致崩溃
const g = c.getName;
console.log(g());
```

这种方法具有与箭头函数方法相反的权衡：

- JavaScript 调用者可能仍然在不知情的情况下错误地使用类方法。
- 每个类定义只分配一个函数，而不是每个类实例一个函数。
- 仍然可以通过 `super` 调用基本方法定义。

## `this` 类型

在类中，一个特殊的类型 `this` *动态地*指向当前类的类型。让我们看一下它的用法：

<!-- prettier-ignore -->
```ts twoslash
class Box {
  contents: string = "";
  set(value: string) {
//  ^?
    this.contents = value;
    return this;
  }
}
```

在这里，TypeScript 推断出 `set` 的返回类型是 `this`，而不是 `Box`。现在让我们创建 `Box` 的一个子类：

```ts twoslash
class Box {
  contents: string = "";
  set(value: string) {
    this.contents = value;
    return this;
  }
}
// ---cut---
class ClearableBox extends Box {
  clear() {
    this.contents = "";
  }
}

const a = new ClearableBox();
const b = a.set("你好");
//    ^?
```

你还可以在参数类型注释中使用 `this`：

```ts twoslash
class Box {
  content: string = "";
  sameAs(other: this) {
    return other.content === this.content;
  }
}
```

这与编写 `other: Box` 是不同的——如果你有一个派生类，它的 `sameAs` 方法现在只接受同一派生类的其他实例：

```ts twoslash
// @errors: 2345
class Box {
  content: string = "";
  sameAs(other: this) {
    return other.content === this.content;
  }
}

class DerivedBox extends Box {
  otherContent: string = "?";
}

const base = new Box();
const derived = new DerivedBox();
derived.sameAs(base);
```

### 基于 `this` 的类型护卫

在类和接口的方法中，你可以在返回位置使用 `this is Type`。当与类型缩小（例如 `if` 语句）混合使用时，目标对象的类型将缩小为指定的 `Type`。

<!-- prettier-ignore -->
```ts twoslash
// @strictPropertyInitialization: false
class FileSystemObject {
  isFile(): this is FileRep {
    return this instanceof FileRep;
  }
  isDirectory(): this is Directory {
    return this instanceof Directory;
  }
  isNetworked(): this is Networked & this {
    return this.networked;
  }
  constructor(public path: string, private networked: boolean) {}
}

class FileRep extends FileSystemObject {
  constructor(path: string, public content: string) {
    super(path, false);
  }
}

class Directory extends FileSystemObject {
  children: FileSystemObject[];
}

interface Networked {
  host: string;
}

const fso: FileSystemObject = new FileRep("foo/bar.txt", "foo");

if (fso.isFile()) {
  fso.content;
// ^?
} else if (fso.isDirectory()) {
  fso.children;
// ^?
} else if (fso.isNetworked()) {
  fso.host;
// ^?
}
```

基于 `this` 的类型护卫的常见用例是允许对特定字段进行延迟验证。例如，以下示例在 `hasValue` 被验证为 true 时，从 box 中删除了 `undefined` 值：

```ts twoslash
class Box<T> {
  value?: T;

  hasValue(): this is { value: T } {
    return this.value !== undefined;
  }
}

const box = new Box();
box.value = "Gameboy";

box.value;
//  ^?

if (box.hasValue()) {
  box.value;
  //  ^?
}
```

## 参数属性

TypeScript 提供了一种特殊的语法，可以将构造函数的参数转换为具有相同名称和值的类属性。这些被称为*参数属性*，通过在构造函数参数前加上可见性修饰符 `public`、`private`、`protected` 或 `readonly` 来创建。生成的字段将具有这些修饰符：

```ts twoslash
// @errors: 2341
class Params {
  constructor(
    public readonly x: number,
    protected y: number,
    private z: number
  ) {
    // 不需要主体代码
  }
}
const a = new Params(1, 2, 3);
console.log(a.x);
//            ^?
console.log(a.z);
```

## 类表达式

<blockquote class='bg-reading'>
   <p>背景阅读：<br />
   <a href='https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/class'>类表达式（MDN）</a><br/>
   </p>
</blockquote>

类表达式与类声明非常相似。唯一的真正区别是类表达式不需要名称，尽管我们可以通过将它们绑定到标识符来引用它们：

```ts twoslash
const someClass = class<Type> {
  content: Type;
  constructor(value: Type) {
    this.content = value;
  }
};

const m = new someClass("你好，世界");
//    ^?
```

## 构造函数签名

JavaScript 类使用 `new` 运算符进行实例化。对于某个类本身的类型，[InstanceType](/zh/docs/handbook/utility-types.html#instancetype) 类型模拟了这个操作。

```ts twoslash
class Point {
  createdAt: number;
  x: number;
  y: number
  constructor(x: number, y: number) {
    this.createdAt = Date.now()
    this.x = x;
    this.y = y;
  }
}
type PointInstance = InstanceType<typeof Point>

function moveRight(point: PointInstance) {
  point.x += 5;
}

const point = new Point(3, 4);
moveRight(point);
point.x; // => 8
```

## `abstract` 类和成员

在 TypeScript 中，类、方法和字段可以是*抽象的*。

*抽象方法*或*抽象字段*是指没有提供实现的方法或字段。这些成员必须存在于*抽象类*中，抽象类不能直接被实例化。

抽象类的作用是作为子类的基类，子类需要实现所有的抽象成员。当一个类没有任何抽象成员时，它被称为*具体类*。

让我们来看一个例子：

```ts twoslash
// @errors: 2511
abstract class Base {
  abstract getName(): string;

  printName() {
    console.log("你好，" + this.getName());
  }
}

const b = new Base();
```

我们不能使用 `new` 实例化 `Base`，因为它是抽象的。相反，我们需要创建派生类并实现抽象成员：

```ts twoslash
abstract class Base {
  abstract getName(): string;
  printName() {}
}
// ---cut---
class Derived extends Base {
  getName() {
    return "世界";
  }
}

const d = new Derived();
d.printName();
```

请注意，如果我们忘记实现基类的抽象成员，将会遇到错误：

```ts twoslash
// @errors: 2515
abstract class Base {
  abstract getName(): string;
  printName() {}
}
// ---cut---
class Derived extends Base {
  // 忘记实现任何内容
}
```

### 抽象构造函数签名

有时候，你希望接受某个类构造函数，该构造函数生成的实例派生自某个抽象类。

例如，你可能希望编写以下代码：

```ts twoslash
// @errors: 2511
abstract class Base {
  abstract getName(): string;
  printName() {}
}
class Derived extends Base {
  getName() {
    return "";
  }
}
// ---cut---
function greet(ctor: typeof Base) {
  const instance = new ctor();
  instance.printName();
}
```

TypeScript 正确地告诉你，你正在尝试实例化一个抽象类。毕竟，根据 `greet` 的定义，编写以下代码是完全合法的，这将构造一个抽象类：

```ts twoslash
declare const greet: any, Base: any;
// ---cut---
// 错误！
greet(Base);
```

相反，你想编写一个接受具有构造函数签名的内容的函数：

```ts twoslash
// @errors: 2345
abstract class Base {
  abstract getName(): string;
  printName() {}
}
class Derived extends Base {
  getName() {
    return "";
  }
}
// ---cut---
function greet(ctor: new () => Base) {
  const instance = new ctor();
  instance.printName();
}
greet(Derived);
greet(Base);
```

现在 TypeScript 正确地告诉你哪些类构造函数可以调用——`Derived` 可以，因为它是具体类，但 `Base` 不能。

## 类之间的关系

在大多数情况下，TypeScript 中的类是按照结构进行比较的，与其他类型一样。

例如，这两个类可以互相替换使用，因为它们是相同的：

```ts twoslash
class Point1 {
  x = 0;
  y = 0;
}

class Point2 {
  x = 0;
  y = 0;
}

// 正常
const p: Point1 = new Point2();
```

类之间的子类型关系也存在，即使没有显式的继承：

```ts twoslash
// @strict: false
class Person {
  name: string;
  age: number;
}

class Employee {
  name: string;
  age: number;
  salary: number;
}

// 正常
const p: Person = new Employee();
```

这听起来很简单，但有一些情况会让人感到很奇怪。

空类没有成员。在结构类型系统中，没有成员的类型通常是其他任何类型的超类型。因此，如果你编写一个空类（不要这样做！），则可以使用任何类型来替代它：

```ts twoslash
class Empty {}

function fn(x: Empty) {
  // 对于 'x' 无法执行任何操作，所以我们不会做任何事情
}

// 全部都可以！
fn(window);
fn({});
fn(fn);
```
