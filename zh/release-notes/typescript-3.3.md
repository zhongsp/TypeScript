# TypeScript 3.3

## 改进调用联合类型时的行为

在 TypeScript 之前的版本中，将可调用类型联合后仅在它们具有相同的参数列表时才能被调用。

```typescript
type Fruit = "apple" | "orange";
type Color = "red" | "orange";

type FruitEater = (fruit: Fruit) => number; // eats and ranks the fruit
type ColorConsumer = (color: Color) => string; // consumes and describes the colors

declare let f: FruitEater | ColorConsumer;

// Cannot invoke an expression whose type lacks a call signature.
//   Type 'FruitEater | ColorConsumer' has no compatible call signatures.ts(2349)
f("orange");
```

然而，上例中，`FruitEater`和`ColorConsumer`应该都可以使用`"orange"`，并返回`number`或`string`。

在 TypeScript 3.3 里，这个错误不存在了。

```typescript
type Fruit = "apple" | "orange";
type Color = "red" | "orange";

type FruitEater = (fruit: Fruit) => number; // eats and ranks the fruit
type ColorConsumer = (color: Color) => string; // consumes and describes the colors

declare let f: FruitEater | ColorConsumer;

f("orange"); // It works! Returns a 'number | string'.

f("apple"); // error - Argument of type '"apple"' is not assignable to parameter of type '"orange"'.

f("red"); // error - Argument of type '"red"' is not assignable to parameter of type '"orange"'.
```

TypeScript 3.3，这些签名的参数被连结在一起构成了一个新的签名。

在上例中，`fruit`和`color`连结在一起形成新的参数类型`Fruit & Color`。 `Fruit & Color`和`("apple" | "orange") & ("red" | "orange")`是一样的，都相当于`("apple" & "red") | ("apple" & "orange") | ("orange" & "red") | ("orange" & "orange")`。 那些不可能交叉的会规约成`never`类型，只剩下`"orange" & "orange"`，就是`"orange"`。

### 警告

这个新行为仅在满足如下情形时生效：

* 联合类型中最多有一个类型具有多个重载，
* 联合类型中最多有一个类型有泛型签名。

这意味着，像`map`这种操作`number[] | string[]`的方法，还是不能调用，因为`map`是泛型函数。

另一方面，像`forEach`就可以调用，因为它不是泛型函数，但在`noImplicitAny`模式可能有些问题。

```typescript
interface Dog {
  kind: "dog";
  dogProp: any;
}
interface Cat {
  kind: "cat";
  catProp: any;
}

const catOrDogArray: Dog[] | Cat[] = [];

catOrDogArray.forEach(animal => {
  //                ~~~~~~ error!
  // Parameter 'animal' implicitly has an 'any' type.
});
```

添加显式的类型信息可以解决。

```typescript
interface Dog {
  kind: "dog";
  dogProp: any;
}
interface Cat {
  kind: "cat";
  catProp: any;
}

const catOrDogArray: Dog[] | Cat[] = [];
catOrDogArray.forEach((animal: Dog | Cat) => {
  if (animal.kind === "dog") {
    animal.dogProp;
    // ...
  } else if (animal.kind === "cat") {
    animal.catProp;
    // ...
  }
});
```

## 在合复合工程中增量地检测文件的变化 `--build --watch`

TypeScript 3.0 引入了一个新特性来按结构进行构建，称做“复合工程”。 目的是让用户能够把大型工程拆分成小的部分从而快速构建并保留项目结构。 正是因为支持了复合工程，TypeScript 可以使用`--build`模式仅重新编译部分工程和依赖。 可以把它当做工作内部构建的一种优化。

TypeScript 2.7 还引入了`--watch`构建模式，它使用了新的增量"builder"API。 背后的想法都是仅重新检查和生成改动过的文件或者是依赖项可能影响类型检查的文件。 可以把它们当成工程内部构建的优化。

在 3.3 之前，使用`--build --watch`构建复合工程不会真正地使用增量文件检测机制。 在`--build --watch`模式下，一个工程里的一处改动会导致整个工程重新构建，而非仅检查那些真正受到影响的文件。

在 TypeScript 3.3 里，`--build`模式的`--watch`标记也会使用增量文件检测。 因此`--build --watch`模式下构建非常快。 我们的测试结果显示，这个功能会减少 50%到 75%的构建时间，相比于原先的`--build --watch`。 具体数字在这这个[pull request](https://github.com/Microsoft/TypeScript/pull/29161)里，我们相信大多数复合工程用户会看到明显效果。

