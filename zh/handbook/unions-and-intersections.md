# 联合类型和交叉类型

## 介绍

到目前为止，手册已经涵盖了原子对象的类型。
但是，随着对更多类型进行建模，你会发现自己正在寻找可以组合现有类型的工具，而不是从头开始创建它们。

交叉类型和联合类型是组合类型的方式之一。

## 联合类型

有时，你会遇到一个库，它期望一个参数是 `number` 或 `string` 。
例如下面的函数：

```ts twoslash
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
  throw new Error(`Expected string or number, got '${typeof padding}'.`);
}

padLeft("Hello world", 4); // returns "    Hello world"
```

在上面的例子中，`padLeft`的问题在于其`padding`参数的类型为`any`。
这意味着我们可以用`number`和`string`之外的参数类型来调用它，而TypeScript也能接受。

```ts twoslash
declare function padLeft(value: string, padding: any): string;
// ---cut---
// 编译时通过但是运行时失败。
let indentedString = padLeft("Hello world", true);
```

在传统的面向对象编程中，我们会通过创建一个具有层状结构的类型来抽象这两个类型。
虽然这更明确，但也有点矫枉过正。
`padLeft`的原始版本的一个好处是，我们可以直接传递基本元素。
这意味着用法简单而简洁。
而且如果我们只是想使用一个已经存在于其他地方的函数，这种新方法也无济于事。

为了取代`any`，我们可以为`padding`参数使用 _联合类型_：

```ts twoslash
// @errors: 2345
/**
 * Takes a string and adds "padding" to the left.
 * If 'padding' is a string, then 'padding' is appended to the left side.
 * If 'padding' is a number, then that number of spaces is added to the left side.
 */
function padLeft(value: string, padding: string | number) {
  // ...
}

let indentedString = padLeft("Hello world", true);
```

一个联合类型表示一个值的类型可以是几个类型中的一个。
我们用竖线（`|`）来分隔不同类型，所以`number | string | boolean`是一个可以是`number`、`string`或`boolean`的值的类型。

## 具有公共字段的联合

如果我们有一个联合类型的值，则只能访问联合中所有类型共有的成员。

```ts twoslash
// @errors: 2339

interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

declare function getSmallPet(): Fish | Bird;

let pet = getSmallPet();
pet.layEggs();

// 只有两种可能类型中的一种可用
pet.swim();
```

联合类型在这里可能有点棘手，但它只是需要一点直觉来适应。
如果一个值的类型是`A | B`，我们只能 _确定_ 它有`A` _和_ `B`都有的成员。
在这个例子中，`Bird`有一个名为`fly`的成员。
我们不能确定一个类型为`Bird | Fish`的变量是否有一个`fly`方法。
如果该变量在运行时确实是`Fish`，那么调用`pet.fly()`将会失败。

## 可区分联合

使用联合的一种常用技术是使用字面量类型的单个字段，您可以使用该字段来缩小 TypeScript 可能的当前类型。例如，我们将创建一个包含三种类型的联合，这些类型具有一个共享字段。

```ts
type NetworkLoadingState = {
  state: "loading";
};

type NetworkFailedState = {
  state: "failed";
  code: number;
};

type NetworkSuccessState = {
  state: "success";
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};

// 创建一个只代表上述类型之一的类型，但你还不确定它是哪个。
type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState;
```

上述类型都以一个名为`state`的字段，然后它们也有自己的字段。

| NetworkLoadingState | NetworkFailedState | NetworkSuccessState |
| ------------------- | ------------------ | ------------------- |
| state               | state              | state               |
|                     | code               | response            |

鉴于`state`字段在`NetworkState`的每个类型中都是通用的--你的代码无需存在检查即可安全访问。

有了`state`这个字面类型，你可以将`state`的值与相应的字符串进行比较，TypeScript就会知道当前使用的是哪个类型。

| NetworkLoadingState | NetworkFailedState | NetworkSuccessState |
| ------------------- | ------------------ | ------------------- |
| "loading"           | "failed"           | "success"           |

在这个例子中，你可以使用`switch`语句来缩小在运行时代表哪种类型：

```ts twoslash
// @errors: 2339
type NetworkLoadingState = {
  state: "loading";
};

type NetworkFailedState = {
  state: "failed";
  code: number;
};

type NetworkSuccessState = {
  state: "success";
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};
// ---cut---
type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState;

function logger(state: NetworkState): string {
  // 现在，TypeScript不知道state是三种可能类型中的哪一种。

  // 试图访问一个不是所有类型都共享的属性将引发一个错误
  state.code;

  // 通过选择state，TypeScript可以在代码流分析中缩小联合的范围
  switch (state.state) {
    case "loading":
      return "Downloading...";
    case "failed":
      // 这里的类型一定是NetworkFailedState，所以访问`code`字段是安全的。
      return `Error ${state.code} downloading`;
    case "success":
      return `Downloaded ${state.response.title} - ${state.response.summary}`;
  }
}
```

## 联合的穷尽性检查

我们希望编译器能在我们没能覆盖可区分联合的所有变体时告诉我们。
比如，如果我们添加`NetworkFromCachedState`到`NetworkState`，我们也需要更新`logger`：

```ts twoslash
// @errors: 2366
type NetworkLoadingState = { state: "loading" };
type NetworkFailedState = { state: "failed"; code: number };
type NetworkSuccessState = {
  state: "success";
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};
// ---cut---
type NetworkFromCachedState = {
  state: "from_cache";
  id: string;
  response: NetworkSuccessState["response"];
};

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;

function logger(s: NetworkState) {
  switch (s.state) {
    case "loading":
      return "loading request";
    case "failed":
      return `failed with code ${s.code}`;
    case "success":
      return "got response";
  }
}
```

这里有两种方法实现。
第一种方法是打开[`strictNullChecks`](/tsconfig#strictNullChecks)并指定返回类型：

```ts twoslash
// @errors: 2366
type NetworkLoadingState = { state: "loading" };
type NetworkFailedState = { state: "failed"; code: number };
type NetworkSuccessState = { state: "success" };
type NetworkFromCachedState = { state: "from_cache" };

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;

// ---cut---
function logger(s: NetworkState): string {
  switch (s.state) {
    case "loading":
      return "loading request";
    case "failed":
      return `failed with code ${s.code}`;
    case "success":
      return "got response";
  }
}
```

因为`switch`不再是详尽的，TypeScript知道函数有时可能会返回`undefined`。
如果你有一个明确的返回类型`string`，那么你会得到一个错误，返回类型实际上是`string | undefined`。
然而，这种方法是相当微妙的，此外，[`strictNullChecks`](/tsconfig#strictNullChecks)并不总是对旧代码起作用。

第二种方法是使用编译器用来检查穷尽性的`never`类型：

```ts twoslash
// @errors: 2345
type NetworkLoadingState = { state: "loading" };
type NetworkFailedState = { state: "failed"; code: number };
type NetworkSuccessState = { state: "success" };
type NetworkFromCachedState = { state: "from_cache" };

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;
// ---cut---
function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

function logger(s: NetworkState): string {
  switch (s.state) {
    case "loading":
      return "loading request";
    case "failed":
      return `failed with code ${s.code}`;
    case "success":
      return "got response";
    default:
      return assertNever(s);
  }
}
```

在这里，`assertNever`检查`s`是否属于`never`类型&mdash;即所有其他情况都被移除后剩下的类型。
如果你忘记了这个情况，那么`s`将会有一个实际的类型，而你将会得到一个类型错误。
这个方法需要你定义一个额外的函数，但是当你忘记的时候就更明显了，因为错误信息中包括了丢失的类型名称。

## 交叉类型

交叉类型与联合类型密切相关，但它们的使用方式非常不同。
交叉类型将多个类型合并为一个。
这允许你把现有的类型加在一起，得到一个具有你需要的所有功能的单个类型。
例如，`Person & Serializable & Loggable`是一种类型，它是`Person`、`Serializable`_和_`Loggable`的全部。
这意味着这种类型的对象将拥有这三种类型的所有成员。

例如，如果你有具有一致的错误处理的网络请求，那么你可以将错误处理分离到它自己的类型中，与对应于单个响应类型的类型合并。

```ts twoslash
interface ErrorHandling {
  success: boolean;
  error?: { message: string };
}

interface ArtworksData {
  artworks: { title: string }[];
}

interface ArtistsData {
  artists: { name: string }[];
}

// 这些接口被组合后拥有一致的错误处理，和它们自己的数据

type ArtworksResponse = ArtworksData & ErrorHandling;
type ArtistsResponse = ArtistsData & ErrorHandling;

const handleArtistsResponse = (response: ArtistsResponse) => {
  if (response.error) {
    console.error(response.error.message);
    return;
  }

  console.log(response.artists);
};
```
