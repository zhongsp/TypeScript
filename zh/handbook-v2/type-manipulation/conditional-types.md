# 条件类型

大多数有效程序的核心是，我们必须依据输入做出一些决定。JavaScript 程序也是如此，但是由于值可以很容易地被内省，这些决定也是基于输入的类型。*条件类型*有助于描述输入和输出类型之间的关系。

```ts twoslash
interface Animal {
  live(): void;
}
interface Dog extends Animal {
  woof(): void;
}

type Example1 = Dog extends Animal ? number : string;
//   ^?

type Example2 = RegExp extends Animal ? number : string;
//   ^?
```

条件类型看起来有点像 JavaScript 中的条件表达式（`条件 ? true 表达式 : false 表达式`）：

```ts twoslash
type SomeType = any;
type OtherType = any;
type TrueType = any;
type FalseType = any;
type Stuff =
  // ---cut---
  SomeType extends OtherType ? TrueType : FalseType;
```

当 `extends` 左边的类型可以赋值给右边的类型时，你将获得第一个分支（“true”分支）中的类型；否则你将获得后一个分支（“false”分支）中的类型。

上面的例子中，条件类型可能不是很有用——我们可以告诉自己是否 `Dog extends Animal` 并选择 `number` 或 `string`！但是条件类型的威力来自于将它们与泛型一起使用。

让我们以下面的 `createLabel` 函数为例：

```ts twoslash
interface IdLabel {
  id: number /* 一些字段 */;
}
interface NameLabel {
  name: string /* 其它字段 */;
}

function createLabel(id: number): IdLabel;
function createLabel(name: string): NameLabel;
function createLabel(nameOrId: string | number): IdLabel | NameLabel;
function createLabel(nameOrId: string | number): IdLabel | NameLabel {
  throw "unimplemented";
}
```

这些 `createLabel` 的重载描述了一个单独的 JavaScript 函数，根据其输入的类型进行选择。请注意以下几点：

1. 如果一个库在其 API 中不断进行相同类型的选择，这将变得很繁琐。
2. 我们需要创建三个重载：对于我们确定类型的情况（一个针对 `string`，一个针对 `number`），以及最通用情况的重载（接受 `string | number`）。对于 `createLabel` 能处理的每种新类型，重载的数量呈指数级增长。

相反，我们可以将该逻辑转换为条件类型：

```ts twoslash
interface IdLabel {
  id: number /* 一些字段 */;
}
interface NameLabel {
  name: string /* 其它字段 */;
}
// ---cut---
type NameOrId<T extends number | string> = T extends number
  ? IdLabel
  : NameLabel;
```

然后，我们可以使用该条件类型将重载简化为没有重载的单个函数。

```ts twoslash
interface IdLabel {
  id: number /* 一些字段 */;
}
interface NameLabel {
  name: string /* 其它字段 */;
}
type NameOrId<T extends number | string> = T extends number
  ? IdLabel
  : NameLabel;
// ---cut---
function createLabel<T extends number | string>(idOrName: T): NameOrId<T> {
  throw "unimplemented";
}

let a = createLabel("typescript");
//  ^?

let b = createLabel(2.8);
//  ^?

let c = createLabel(Math.random() ? "hello" : 42);
//  ^?
```

### 条件类型约束

通常，条件类型的检查将为我们提供一些新信息。就像使用类型守卫缩小范围可以给我们提供更具体的类型一样，条件类型的 true 分支将根据我们检查的类型进一步约束泛型。

让我们来看看下面的例子：

```ts twoslash
// @errors: 2536
type MessageOf<T> = T["message"];
```

在本例中，TypeScript 产生错误是因为不知道 `T` 有一个名为 `message` 的属性。我们可以约束 `T`，这样 TypeScript 就不会再报错了：

```ts twoslash
type MessageOf<T extends { message: unknown }> = T["message"];

interface Email {
  message: string;
}

interface Dog {
  bark(): void;
}

type EmailMessageContents = MessageOf<Email>;
//   ^?
```

然而，如果我们希望 `MessageOf` 接受任何类型，并且在 `message` 属性不可用的情况下将其默认为 `never` 之类的类型，我们应该怎么做呢？我们可以通过移出约束并引入条件类型来实现这一点：

```ts twoslash
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;

interface Email {
  message: string;
}

interface Dog {
  bark(): void;
}

type EmailMessageContents = MessageOf<Email>;
//   ^?

type DogMessageContents = MessageOf<Dog>;
//   ^?
```

在 true 分支中，TypeScript 知道 `T` *会*有 `message` 属性。

举另一个示例，我们还可以编写名为 `Flatten` 的类型，如果是数组类型的话，将其类型展平为其元素类型，否则类型保持不变：

```ts twoslash
type Flatten<T> = T extends any[] ? T[number] : T;

// 提取出元素类型。
type Str = Flatten<string[]>;
//   ^?

// 保持类型不变。
type Num = Flatten<number>;
//   ^?
```

当 `Flatten` 接收到数组类型时，它使用 `number` 进行索引访问来提取出 `string[]` 的元素类型。否则，它会直接返回原类型。

### 在条件类型中推断

我们刚才使用条件类型来应用约束并提取出类型。这种操作非常常见，条件类型使得这一过程更加简单。

条件类型提供了从我们在 true 分支中进行比较的类型中进行类型推断的方式，这通过使用 `infer` 关键字来实现。例如，在 `Flatten` 中，我们可以推断出元素类型，而不是使用索引访问类型来“手动”提取：

```ts twoslash
type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;
```

在这里，我们使用 `infer` 关键字声明性地引入名为 `Item` 的新泛型类型变量，而不是在 true 分支中指定如何检索 `Type` 的元素类型。这样，我们就不需要考虑如何解构我们的类型的结构。

我们可以使用 `infer` 关键字编写一些有用的辅助类型别名。例如，对于简单的情况，我们可以从函数类型中提取返回类型：

```ts twoslash
type GetReturnType<Type> = Type extends (...args: never[]) => infer Return
  ? Return
  : never;

type Num = GetReturnType<() => number>;
//   ^?

type Str = GetReturnType<(x: string) => string>;
//   ^?

type Bools = GetReturnType<(a: boolean, b: boolean) => boolean[]>;
//   ^?
```

当从具有多个调用签名的类型（如重载函数的类型）进行推断时，将从*最后一个*签名进行推断（这也许是最宽松的万能情况）。无法基于实参类型列表对重载函数进行决策。

```ts twoslash
declare function stringOrNum(x: string): number;
declare function stringOrNum(x: number): string;
declare function stringOrNum(x: string | number): string | number;

type T1 = ReturnType<typeof stringOrNum>;
//   ^?
```

## 分布式条件类型

当条件类型作用于泛型类型时，如果给定一个联合类型，它们就变成了*分布式*类型。例如，考虑以下代码：

```ts twoslash
type ToArray<Type> = Type extends any ? Type[] : never;
```

如果我们将联合类型传递给 `ToArray`，那么条件类型将应用于联合类型的每个成员。

```ts twoslash
type ToArray<Type> = Type extends any ? Type[] : never;

type StrArrOrNumArr = ToArray<string | number>;
//   ^?
```

这里发生的是 `ToArray` 在以下代码上进行了分布：

```ts twoslash
type StrArrOrNumArr =
  // ---cut---
  string | number;
```

并且对联合类型的每个成员类型进行了映射，实际上相当于：

```ts twoslash
type ToArray<Type> = Type extends any ? Type[] : never;
type StrArrOrNumArr =
  // ---cut---
  ToArray<string> | ToArray<number>;
```

这样我们就得到：

```ts twoslash
type StrArrOrNumArr =
  // ---cut---
  string[] | number[];
```

通常，分布性是期望的行为。要避免这种行为，可以在 `extends` 关键字的两边加上方括号。

```ts twoslash
type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;

// ‘ArrOfStrOrNum’不再是联合类型。
type ArrOfStrOrNum = ToArrayNonDist<string | number>;
//   ^?
```
