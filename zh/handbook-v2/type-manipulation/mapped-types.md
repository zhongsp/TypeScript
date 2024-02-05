# 映射类型

如果你想避免重复代码，那么可以基于某个类型创建另一个类型。

映射类型建立在索引签名的语法基础上，索引签名用于声明未提前声明的属性的类型：

```ts twoslash
type Horse = {};
// ---cut---
type OnlyBoolsAndHorses = {
  [key: string]: boolean | Horse;
};

const conforms: OnlyBoolsAndHorses = {
  del: true,
  rodney: false,
};
```

映射类型是一种泛型类型，它使用 `PropertyKey` 的联合类型（通常[通过 `keyof`](/zh/docs/handbook/2/indexed-access-types.html) 创建）来遍历键以创建类型：

```ts twoslash
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
```

在此示例中，`OptionsFlags` 将获取类型 `Type` 的所有属性，并将它们的值更改为布尔值。

```ts twoslash
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
// ---cut---
type Features = {
  darkMode: () => void;
  newUserProfile: () => void;
};

type FeatureOptions = OptionsFlags<Features>;
//   ^?
```

### 映射修饰符

在映射过程中，可以应用两个额外的修饰符：`readonly` 和 `?`，分别影响可变性和可选性。

你可以通过以 `-` 或 `+` 为前缀来移除或添加这些修饰符。如果你不添加前缀，则默认为 `+`。

```ts twoslash
// 从类型的属性中移除‘readonly’属性
type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};

type LockedAccount = {
  readonly id: string;
  readonly name: string;
};

type UnlockedAccount = CreateMutable<LockedAccount>;
//   ^?
```

```ts twoslash
// 从类型的属性中移除‘optional’属性
type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property];
};

type MaybeUser = {
  id: string;
  name?: string;
  age?: number;
};

type User = Concrete<MaybeUser>;
//   ^?
```

## 通过 `as` 进行键重映射

从 TypeScript 4.1 开始，你可以在映射类型中使用 `as` 子句重新映射键：

```ts
type MappedTypeWithNewProperties<Type> = {
    [Properties in keyof Type as NewKeyType]: Type[Properties]
}
```

你可以利用[模板字面量类型](/zh/docs/handbook/2/template-literal-types.html)等特性，根据先前的属性创建新的属性名：

```ts twoslash
type Getters<Type> = {
    [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property]
};

interface Person {
    name: string;
    age: number;
    location: string;
}

type LazyPerson = Getters<Person>;
//   ^?
```

你可以通过条件类型产生 `never` 来过滤掉键：

```ts twoslash
// 移除 'kind' 属性
type RemoveKindField<Type> = {
    [Property in keyof Type as Exclude<Property, "kind">]: Type[Property]
};

interface Circle {
    kind: "circle";
    radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;
//   ^?
```

你可以对任意联合类型进行映射，不仅仅是 `string | number | symbol` 的联合类型，可以是任意类型的联合类型：

```ts twoslash
type EventConfig<Events extends { kind: string }> = {
    [E in Events as E["kind"]]: (event: E) => void;
}

type SquareEvent = { kind: "square", x: number, y: number };
type CircleEvent = { kind: "circle", radius: number };

type Config = EventConfig<SquareEvent | CircleEvent>
//   ^?
```

### 进一步探索

映射类型可以与本手册类型操作部分中介绍的其他特性很好地配合使用，例如，以下是[使用条件类型的映射类型](/zh/docs/handbook/2/conditional-types.html)示例，根据对象是否具有设置为字面量 `true` 的属性 `pii` 来返回 `true` 或 `false`：

```ts twoslash
type ExtractPII<Type> = {
  [Property in keyof Type]: Type[Property] extends { pii: true } ? true : false;
};

type DBFields = {
  id: { format: "incrementing" };
  name: { type: string; pii: true };
};

type ObjectsNeedingGDPRDeletion = ExtractPII<DBFields>;
//   ^?
```
