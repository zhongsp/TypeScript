# 改进调用联合类型时的行为

在TypeScript之前的版本中，将可调用类型联合后仅在它们具有相同的参数列表时才能被调用。

```ts
type Fruit = "apple" | "orange";
type Color = "red" | "orange";

type FruitEater = (fruit: Fruit) => number;     // eats and ranks the fruit
type ColorConsumer = (color: Color) => string;  // consumes and describes the colors

declare let f: FruitEater | ColorConsumer;

// Cannot invoke an expression whose type lacks a call signature.
//   Type 'FruitEater | ColorConsumer' has no compatible call signatures.ts(2349)
f("orange");
```

然而，上例中，`FruitEater`和`ColorConsumer`应该都可以使用`"orange"`，并返回`number`或`string`。

在TypeScript 3.3里，这个错误不存在了。

```ts
type Fruit = "apple" | "orange";
type Color = "red" | "orange";

type FruitEater = (fruit: Fruit) => number;     // eats and ranks the fruit
type ColorConsumer = (color: Color) => string;  // consumes and describes the colors

declare let f: FruitEater | ColorConsumer;

f("orange"); // It works! Returns a 'number | string'.

f("apple");  // error - Argument of type '"apple"' is not assignable to parameter of type '"orange"'.

f("red");    // error - Argument of type '"red"' is not assignable to parameter of type '"orange"'.
```

TypeScript 3.3，这些签名的参数被连结在一起构成了一个新的签名。

在上例中，`fruit`和`color`连结在一起形成新的参数类型`Fruit & Color`。
`Fruit & Color`和`("apple" | "orange") & ("red" | "orange")`是一样的，都相当于`("apple" & "red") | ("apple" & "orange") | ("orange" & "red") | ("orange" & "orange")`。
那些不可能交叉的会规约成`never`类型，只剩下`"orange" & "orange"`，就是`"orange"`。

## 警告
这个新行为仅在满足如下情形时生效：

* 联合类型中最多有一个类型具有多个重载，
* 联合类型中最多有一个类型有泛型签名。

这意味着，像`map`这种操作`number[] | string[]`的方法，还是不能调用，因为`map`是泛型函数。

另一方面，像`forEach`就可以调用，因为它不是泛型函数，但在`noImplicitAny`可能有些问题。

```ts
interface Dog {
    kind: "dog"
    dogProp: any;
}
interface Cat {
    kind: "cat"
    catProp: any;
}

const catOrDogArray: Dog[] | Cat[] = [];

catOrDogArray.forEach(animal => {
    //                ~~~~~~ error!
    // Parameter 'animal' implicitly has an 'any' type.
});
```

添加显式的类型信息可以解决。

```ts
interface Dog {
    kind: "dog"
    dogProp: any;
}
interface Cat {
    kind: "cat"
    catProp: any;
}

const catOrDogArray: Dog[] | Cat[] = [];
catOrDogArray.forEach((animal: Dog | Cat) => {
    if (animal.kind === "dog") {
        animal.dogProp;
        // ...
    }
    else if (animal.kind === "cat") {
        animal.catProp;
        // ...
    }
});
```

# 在合复合工程中增量地监控文件的变化 `--build --watch`

TypeScript 3.0引入了一个新特性来按结构进行build，它叫做“复合工程”。
目的是让用户能够把大型工程拆分成小块快速build并保留项目结构。
正是因为支持复合工程，TypeScript可以使用`--build`模式仅重新编译部分工程和依赖。
可以把它当做工作内部build的一种优化。

TypeScript 2.7 also introduced `--watch` mode builds via a new incremental "builder" API.
In a similar vein, the entire idea is that this mode only re-checks and re-emits changed files or files whose dependencies might impact type-checking.
You can think of this as optimizing *intra*-project builds.

Prior to 3.3, building composite projects using `--build --watch` actually didn't use this incremental file watching infrastructure.
An update in one project under `--build --watch` mode would force a full build of that project, rather than determining which files within that project were affected.

In TypeScript 3.3, `--build` mode's `--watch` flag *does* leverage incremental file watching as well.
That can mean signficantly faster builds under `--build --watch`.
In our testing, this functionality has resulted in **a reduction of 50% to 75% in build times** of the original `--build --watch` times.
[You can read more on the original pull request for the change](https://github.com/Microsoft/TypeScript/pull/29161) to see specific numbers, but we believe most composite project users will see significant wins here.