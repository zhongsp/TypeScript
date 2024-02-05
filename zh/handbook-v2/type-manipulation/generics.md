# 泛型

软件工程中的一个要点，是构建具有明确定义且一致的 API 的组件，同时这些组件还要具备可重用性。既能够处理当下数据，也能够处理未来数据的组件，将帮助你更加灵活地构建大型软件系统。

在像 C# 和 Java 这样的语言中，创建可重用组件的主要工具之一是*泛型*，即能够创建可以处理多种类型而不仅限于单一类型的组件。这允许用户使用自己的类型来使用这些组件。

## 泛型的 Hello World

首先，让我们来看一下泛型的“Hello World”： identify 函数。 identify 函数会返回传入的参数。你可以将其类比为 `echo` 命令行命令。

在没有泛型的情况下，我们要么为 identify 函数指定特定类型：

```ts twoslash
function identity(arg: number): number {
  return arg;
}
```

要么，使用 `any` 类型来描述 identify 函数：

```ts twoslash
function identity(arg: any): any {
  return arg;
}
```

虽然使用 `any` 使函数接收任何类型的 `arg` 具有泛型的特性，但是我们将丢失有关返回类型的信息。如果我们传入数字，我们只知道任何类型都可能返回。

相反，我们需要一种能够捕获参数类型并在返回类型中使用它的方式。在这里，我们将使用*类型变量*，这是一种特殊类型的变量，用于处理类型而不是值。

```ts twoslash
function identity<Type>(arg: Type): Type {
  return arg;
}
```

我们现在在 identify 函数中添加了类型变量 `Type`。这个 `Type` 可以捕获用户提供的类型（例如 `number`），以便我们以后可以使用该信息。在这里，我们再次使用 `Type` 作为返回类型。检查一下，我们现在可以看到参数类型和返回类型都是同一种。这样的话，我们可以在函数的一侧传递类型信息，并在另一侧传递出去。

这个版本的 `identity` 函数是泛型的，因为它适用于各种类型。与使用 `any` 不同，它也与使用数字作为参数和返回类型的第一个 `identity` 函数一样精确（即不丢失任何信息）。

在编写了泛型 identify 函数之后，我们可以通过两种方式调用它。第一种方式是将所有实参（包括类型实参）传递给函数：

```ts twoslash
function identity<Type>(arg: Type): Type {
  return arg;
}
// ---cut---
let output = identity<string>("myString");
//       ^?
```

这里我们明确将 `Type` 设置为函数调用的一个实参（即 `string`），使用 `<>` 将参数括起来而不是 `()`。

第二种方式也许是最常用的。这里我们使用*类型参数推断*——即，我们让编译器根据我们传入的实参的类型自动为我们设置 `Type` 的值：

```ts twoslash
function identity<Type>(arg: Type): Type {
  return arg;
}
// ---cut---
let output = identity("myString");
//       ^?
```

请注意，我们不必显式传递尖括号 (`<>`) 中的类型；编译器只需查看值 `"myString"` 并将 `Type` 设置为其类型。虽然类型参数推断可以使代码更简洁、更易读，但在一些更复杂的情况中，编译器无法推断类型的情况下，你可能需要像前面的示例中那样显式传递类型参数。

## 使用泛型类型变量

当你开始使用泛型时，你会注意到，当你创建像 `identity` 这样的泛型函数时，编译器将强制你在函数体中正确使用任何泛型的参数。也就是说，你实际上要将这些参数视为可能是任何类型。

让我们以前面的 `identity` 函数为例：

```ts twoslash
function identity<Type>(arg: Type): Type {
  return arg;
}
```

如果我们还想在每次调用时将参数 `arg` 的长度记录到控制台，我们可能会这样写：

```ts twoslash
// @errors: 2339
function loggingIdentity<Type>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
```

这样做时，编译器会给出一个错误，指出我们正在使用 `arg` 的 `.length` 成员，但我们并没有说明 `arg` 具有这个成员。请记住，我们前面说过，这些类型变量代表任何类型，因此使用该函数的人可以传入没有 `.length` 成员的 `number` 类型。

假设我们实际上打算让这个函数在 `Type` 类型的数组上工作，而不是直接在 `Type` 上。由于我们正在处理数组，`.length` 成员是可用的。我们可以像创建其他类型的数组一样描述它：

```ts twoslash {1}
function loggingIdentity<Type>(arg: Type[]): Type[] {
  console.log(arg.length);
  return arg;
}
```

你可以将 `loggingIdentity` 的类型解读为“泛型函数 `loggingIdentity` 接受类型参数 `Type` 和实参 `arg`，该实参是 `Type` 的数组，并返回（另一个） `Type` 的数组”。如果我们传入一个数字数组，我们将得到一个数字数组作为返回值，因为 `Type` 将绑定到 `number`。这允许我们在我们对正在处理的类型使用泛型类型变量 `Type`，从而提供更大的灵活性。

我们还可以用另一种方式编写示例：

```ts twoslash {1}
function loggingIdentity<Type>(arg: Array<Type>): Array<Type> {
  console.log(arg.length); // 数组有 .length 属性，因此不再报错
  return arg;
}
```

你可能已经熟悉这种类型的写法，它在其他语言中也是常见的。在下一节中，我们将介绍如何创建自己的泛型类型，比如 `Array<Type>`。

## 泛型类型

在前面的部分中，我们创建了适用于多种类型的泛型 identity 函数。在本节中，我们将探讨函数本身的类型以及如何创建泛型接口。

泛型函数的类型与非泛型函数的类型类似，类型参数在前面列出，类似于函数声明：

```ts twoslash
function identity<Type>(arg: Type): Type {
  return arg;
}

let myIdentity: <Type>(arg: Type) => Type = identity;
```

我们也可以在类型中使用不同的名称来表示泛型类型参数，只要类型变量的数量和类型变量的使用方式对应即可。

```ts twoslash
function identity<Input>(arg: Input): Input {
  return arg;
}

let myIdentity: <Input>(arg: Input) => Input = identity;
```

我们还可以将泛型类型写成对象字面量类型的调用签名：

```ts twoslash
function identity<Type>(arg: Type): Type {
  return arg;
}

let myIdentity: { <Type>(arg: Type): Type } = identity;
```

这引导我们来编写我们的第一个泛型接口。让我们将前面示例中的对象字面量移动到一个接口中：

```ts twoslash
interface GenericIdentityFn {
  <Type>(arg: Type): Type;
}

function identity<Type>(arg: Type): Type {
  return arg;
}

let myIdentity: GenericIdentityFn = identity;
```

在类似的示例中，我们可能希望将泛型参数移到整个接口的参数位置。这样可以让我们看到我们泛型化的类型或类型（例如 `Dictionary<string>` 而不仅仅是 `Dictionary`）。这将使类型参数对接口的所有其他成员可见。

```ts twoslash
interface GenericIdentityFn<Type> {
  (arg: Type): Type;
}

function identity<Type>(arg: Type): Type {
  return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

请注意，我们的示例发生了一些变化。我们现在不再描述一个泛型函数，而是一个非泛型函数签名，它是泛型类型的一部分。当我们使用 `GenericIdentityFn` 时，我们现在还需要指定相应的类型实参（在这里是 `number`），从而确切地确定调用签名将使用的类型。了解何时直接将类型参数放在调用签名上，何时将其放在接口本身上，有助于描述类型的哪些方面是泛型的。

除了泛型接口，我们还可以创建泛型类。请注意，无法创建泛型枚举和泛型命名空间。

## 泛型类

泛型类的形式和泛型接口相似。泛型类在类名后面使用尖括号 (`<>`) 来指定泛型类型参数列表。

```ts twoslash
// @strict: false
class GenericNumber<NumType> {
  zeroValue: NumType;
  add: (x: NumType, y: NumType) => NumType;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function (x, y) {
  return x + y;
};
```

这是对 `GenericNumber` 类的一种直接的使用方式，但你可能已经注意到，它没有限制只能使用 `number` 类型。我们也可以使用 `string` 或者更复杂的对象。

```ts twoslash
// @strict: false
class GenericNumber<NumType> {
  zeroValue: NumType;
  add: (x: NumType, y: NumType) => NumType;
}
// ---cut---
let stringNumeric = new GenericNumber<string>();
stringNumeric.zeroValue = "";
stringNumeric.add = function (x, y) {
  return x + y;
};

console.log(stringNumeric.add(stringNumeric.zeroValue, "test"));
```

与接口一样，将类型参数放在类本身上可以确保类的所有属性均使用相同的类型。

正如我们在[介绍类的部分](/zh/docs/handbook/2/classes.html)中所介绍的，类有两个方面的类型：静态方面和实例方面。泛型类只能在实例方面使用泛型，而不能在静态方面使用，因此在处理类时，静态成员无法使用类的类型参数。

## 通用约束

如果你还记得之前的例子，有时你可能希望编写一个通用函数，该函数适用于一组类型，你对该类型集合的某些特点有*一些*了解。在我们的 `loggingIdentity` 示例中，我们希望能够访问 `arg` 的 `.length` 属性，但编译器无法证明每种类型都有 `.length` 属性，所以它警告我们不能做出这种假设。

```ts twoslash
// @errors: 2339
function loggingIdentity<Type>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
```

我们希望将此函数限制为仅适用于具有 `.length` 属性的任何类型，而不是处理任何类型。只要类型具有这个成员，我们就允许它，否则就不允许。为此，我们必须将我们的要求作为对 `Type` 的约束来列出。

我们可以创建描述我们的约束的接口。下面这个例子中，我们创建了具有 `.length` 属性的接口，然后我们使用这个接口和 `extends` 关键字来表示我们的约束：

```ts twoslash
interface Lengthwise {
  length: number;
}

function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
  console.log(arg.length); // 现在我们知道它有 .length 属性，所以不会再出现错误
  return arg;
}
```

由于这个泛型函数现在受到约束，它将不再适用于任意类型：

```ts twoslash
// @errors: 2345
interface Lengthwise {
  length: number;
}

function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
// ---cut---
loggingIdentity(3);
```

相反，我们需要传入具有所有必需属性的值的类型：

```ts twoslash
interface Lengthwise {
  length: number;
}

function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
// ---cut---
loggingIdentity({ length: 10, value: 3 });
```

## 在泛型约束中使用类型参数

你可以声明受到另一个类型参数的约束的类型参数。例如，我们想根据对象的属性名获取对象的属性。我们希望确保不会意外地获取一个在 `obj` 上不存在的属性，因此我们将在这两个类型之间添加约束：

```ts twoslash
// @errors: 2345
function getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
  return obj[key];
}

let x = { a: 1, b: 2, c: 3, d: 4 };

getProperty(x, "a");
getProperty(x, "m");
```

## 在泛型中使用类的类型

在 TypeScript 中使用泛型创建工厂时，需要通过构造函数来引用类的类型。例如，

```ts twoslash
function create<Type>(c: { new (): Type }): Type {
  return new c();
}
```

更高级的示例使用原型属性来推断和约束构造函数和类的类型的实例之间的关系。

```ts twoslash
// @strict: false
class BeeKeeper {
  hasMask: boolean = true;
}

class ZooKeeper {
  nametag: string = "Mikle";
}

class Animal {
  numLegs: number = 4;
}

class Bee extends Animal {
  numLegs = 6;
  keeper: BeeKeeper = new BeeKeeper();
}

class Lion extends Animal {
  keeper: ZooKeeper = new ZooKeeper();
}

function createInstance<A extends Animal>(c: new () => A): A {
  return new c();
}

createInstance(Lion).keeper.nametag;
createInstance(Bee).keeper.hasMask;
```

这种模式被用于实现 [mixins](/zh/docs/handbook/mixins.html) 设计模式。

## 泛型参数默认值

通过为泛型参数声明默认值，可以选择性地指定相应的类型参数。例如，一个创建新的 `HTMLElement` 的函数。在不带参数调用该函数时，生成一个 `HTMLDivElement`；在将元素作为第一个参数调用该函数时，生成一个与参数类型相对应的元素。还可以选择性地传递子元素列表。以前，你必须将函数定义为：

```ts twoslash
type Container<T, U> = {
  element: T;
  children: U;
};

// ---cut---
declare function create(): Container<HTMLDivElement, HTMLDivElement[]>;
declare function create<T extends HTMLElement>(element: T): Container<T, T[]>;
declare function create<T extends HTMLElement, U extends HTMLElement>(
  element: T,
  children: U[]
): Container<T, U[]>;
```

有了泛型参数默认值，我们可以将其简化为：

```ts twoslash
type Container<T, U> = {
  element: T;
  children: U;
};

// ---cut---
declare function create<T extends HTMLElement = HTMLDivElement, U = T[]>(
  element?: T,
  children?: U
): Container<T, U>;

const div = create();
//    ^?

const p = create(new HTMLParagraphElement());
//    ^?
```

泛型参数默认值遵循以下规则：

- 如果类型参数有默认值，则被视为可选的。
- 必需的类型参数不能在可选的类型参数之后。
- 类型参数的默认类型必须满足类型参数的约束（如果存在）。
- 在指定类型参数时，只需要为必需的类型参数指定类型参数。未指定的类型参数将解析为其默认类型。
- 如果指定了默认类型并且无法推断出候选项，则会推断为默认类型。
- 与现有类或接口声明合并的类或接口声明可以引入对现有类型参数的默认值。
- 与现有类或接口声明合并的类或接口声明可以引入新的类型参数，只要它指定了默认值。
