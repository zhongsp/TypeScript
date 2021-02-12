# TypeScript 3.5

## 改进速度

TypeScript 3.5 为类型检查和增量构建采用了几个优化。

### 类型检查速度提升

TypeScript 3.5 包含对 TypeScript 3.4 的某些优化，可以更高效地进行类型检查。 在代码补全列表等类型检查驱动的操作上，这些改进效果显著。

### 改进 `--incremental`

TypeScript 3.5 通过缓存计算状态的信息（编译器设置、寻找文件的原因、文件在哪里被找到等等），改进了在 3.4 中的 `--incremental` 构建模式。[我们发现重新构建花费的时间比 TypeScript 3.4 减少了 68%](https://github.com/Microsoft/TypeScript/pull/31101)!

有关更多信息，你可以查看这些 pull requests

* [缓存模块解析](https://github.com/Microsoft/TypeScript/pull/31100)
* [缓存 `tsconfig.json` 计算](https://github.com/Microsoft/TypeScript/pull/31101)

## `Omit` 辅助类型

TypeScript 3.5 添加了新的 `Omit` 辅助类型，这个类型用来创建从原始类型中移除了某些属性的新类型。

```typescript
type Person = {
  name: string;
  age: number;
  location: string;
};

type QuantumPerson = Omit<Person, "location">;

// 相当于
type QuantumPerson = {
  name: string;
  age: number;
};
```

使用 `Omit` 辅助，我们有能力复制 `Person` 中除了 `location` 之外的所有属性。

有关更多细节，[在 GitHub 查看添加 `Omit` 的 pull request](https://github.com/Microsoft/TypeScript/pull/30552), 以及[有关剩余对象使用 `Omit` 的更改](https://github.com/microsoft/TypeScript/pull/31134)。

### 改进了联合类型中多余属性的检查

在 TypeScript 3.4 及之前的版本中，会出现确实不应该存在的多余属性却被允许存在的情况。 例如，TypeScript 3.4 在对象字面量上允许不正确的 `name` 属性，甚至它的类型在 `Point` 和 `Label` 之中都不匹配。

```typescript
type Point = {
  x: number;
  y: number;
};

type Label = {
  name: string;
};

const thing: Point | Label = {
  x: 0,
  y: 0,
  name: true // uh-oh!
};
```

以前，一个无区别的联合在它的成员上不会进行_任何_多余属性的检查，结果，类型错误的 `name` 属性溜了进来。

在 TypeScript 3.5 中，类型检查器至少会验证所有提供的属性属于_某个_联合类型的成员，且类型恰当，这意味着，上面的例子会正确的进行错误提示。

注意，只要属性类型有效，仍允许部分重叠。

```typescript
const pl: Point | Label = {
  x: 0,
  y: 0,
  name: "origin" // okay
};
```

## `--allowUmdGlobalAccess` 标志

在 TypeScript 3.5 中，使用新的 `--allowUmdGlobalAccess` 标志，你现在可以从任何位置引用全局的 UMD 申明——甚至模块。

```typescript
export as namespace foo;
```

此模式增加了混合和匹配第三方库的灵活性，其中库声明的全局变量总是可以被使用，甚至可以从模块内部使用。

有关更多细节，[查看 GitHub 上的 pull request](https://github.com/Microsoft/TypeScript/pull/30776/files)。

## 更智能的联合类型检查

在 TypeScript 3.4 以及之前的版本中，下面的例子会无效：

```typescript
type S = { done: boolean, value: number }
type T =
  | { done: false, value: number }
  | { done: true, value: number };

declare let source: S;
declare let target: T;

target = source;
```

这是因为 `S` 无法被分配给 `{ done: false, value: number }` 或者 `{ done: true, value: number }`。 为啥？ 因为属性 `done` 在 `S` 不够具体——他是 `boolean`。而 `T` 的的每个成员有一个明确的为 `true` 或者 `false` 属性 `done`。

这就是我们单独检查每个成员的意义：TypeScript 不只是将每个属性合并在一起，看看是否可以赋予 `S` 。

如果这样做，一些糟糕的代码可能会像下面这样：

```typescript
interface Foo {
  kind: "foo";
  value: string;
}

interface Bar {
  kind: "bar";
  value: number;
}

function doSomething(x: Foo | Bar) {
  if (x.kind === "foo") {
    x.value.toLowerCase();
  }
}

// uh-oh - 幸运的是， TypeScript 在这里会提示错误!
doSomething({
  kind: "foo",
  value: 123,
});
```

然而，对于原始的例子，这有点过于严格。 如果你弄清除 `S` 的任何可能值的精确类型，你实际上可以看到它与 `T` 中的类型完全匹配。

在 TypeScript 3.5 中，当分配具有辨别属性的类型时，如 `T`，实际上_将_进一步将类似 `S` 的类型分解为每个可能的成员类型的并集。 在这种情况下，由于 `boolean` 是 `true` 和 `false` 的联合，`S` 将被视为 `{done：false，value：number}` 和 `{done：true，value：number }`。

有关更多细节，你可以[在 GitHub 上查看原始的 pull request](https://github.com/microsoft/TypeScript/pull/30779)。

## 泛型构造函数的高阶类型推断

在 TypeScript 3.4 中，我们改进了对返回函数的泛型函数的推断：

```typescript
function compose<T, U, V>(f: (x: T) => U, g: (y: U) => V): (x: T) => V {
  return x => g(f(x))
}
```

将其他泛型函数作为参数，如下所示：

```typescript
function arrayify<T>(x: T): T[] {
  return [x];
}

type Box<U> = { value: U }
function boxify<U>(y: U): Box<U> {
  return { value: y };
}

let newFn = compose(arrayify, boxify);
```

TypeScript 3.4 的推断允许 `newFn` 是泛型的。它的新类型是 `<T>（x：T）=> Box <T []>`。而不是旧版本推断的，相对无用的类型，如 `（x：{}）=> Box <{} []>`。

TypeScript 3.5 在处理构造函数的时候推广了这种行为。

```typescript
class Box<T> {
  kind: "box";
  value: T;
  constructor(value: T) {
    this.value = value;
  }
}

class Bag<U> {
  kind: "bag";
  value: U;
  constructor(value: U) {
    this.value = value;
  }
}

function composeCtor<T, U, V>(F: new (x: T) => U, G: new (y: U) => V): (x: T) => V {
  return x => new G(new F(x))
}

let f = composeCtor(Box, Bag); // 拥有类型 '<T>(x: T) => Bag<Box<T>>'
let a = f(1024); // 拥有类型 'Bag<Box<number>>'
```

除了上面的组合模式之外，这种对泛型构造函数的新推断意味着在某些 UI 库（如 React ）中对类组件进行操作的函数可以更正确地对泛型类组件进行操作。

```typescript
type ComponentClass<P> = new (props: P) => Component<P>;
declare class Component<P> {
  props: P;
  constructor(props: P);
}

declare function myHoc<P>(C: ComponentClass<P>): ComponentClass<P>;

type NestedProps<T> = { foo: number, stuff: T };

declare class GenericComponent<T> extends Component<NestedProps<T>> { }

// 类型为 'new <T>(props: NestedProps<T>) => Component<NestedProps<T>>'
const GenericComponent2 = myHoc(GenericComponent);
```

想学习更多，[在 GitHub 上查看原始的 pull requet](https://github.com/microsoft/TypeScript/pull/31116)。

## 参考

* [原文](https://github.com/microsoft/TypeScript-Handbook/blob/master/pages/release%20notes/TypeScript%203.5.md)

