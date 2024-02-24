# 索引访问类型

我们可以使用*索引访问类型*在另一个类型上查找特定的属性：

```ts twoslash
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];
//   ^?
```

索引类型本身就是一种类型，因此我们可以使用联合类型、`keyof` 或其他完全不同的类型：

```ts twoslash
type Person = { age: number; name: string; alive: boolean };
// ---cut---
type I1 = Person["age" | "name"];
//   ^?

type I2 = Person[keyof Person];
//   ^?

type AliveOrName = "alive" | "name";
type I3 = Person[AliveOrName];
//   ^?
```

如果你尝试索引不存在的属性，会看到一个错误：

```ts twoslash
// @errors: 2339
type Person = { age: number; name: string; alive: boolean };
// ---cut---
type I1 = Person["alve"];
```

使用任意类型进行索引的另一个示例是使用 `number` 来获取数组元素的类型。我们可以将其与 `typeof` 结合使用，方便地捕获数组字面量的元素类型：

```ts twoslash
const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];

type Person = typeof MyArray[number];
//   ^?
type Age = typeof MyArray[number]["age"];
//   ^?
// 或者
type Age2 = Person["age"];
//   ^?
```

在进行索引时，你只能使用类型，这意味着不能使用 `const` 来进行变量引用：

```ts twoslash
// @errors: 2538 2749
type Person = { age: number; name: string; alive: boolean };
// ---cut---
const key = "age";
type Age = Person[key];
```

但是，你可以使用类型别名来进行类似的重构：

```ts twoslash
type Person = { age: number; name: string; alive: boolean };
// ---cut---
type key = "age";
type Age = Person[key];
```
