# TypeScript 4.2

## 更智能地保留类型别名

在 TypeScript 中，使用类型别名能够给某个类型起个新名字。
倘若你定义了一些函数，并且它们全都使用了 `string | number | boolean` 类型，那么你就可以定义一个类型别名来避免重复。

```ts
type BasicPrimitive = number | string | boolean;
```

TypeScript 使用了一系列规则来推测是否该在显示类型时使用类型别名。
例如，有如下的代码。

```ts
export type BasicPrimitive = number | string | boolean;

export function doStuff(value: BasicPrimitive) {
    let x = value;
    return x;
}
```

如果在 Visual Studio，Visual Studio Code 或者 [TypeScript 演练场](https://www.typescriptlang.org/play?ts=4.1.3#code/KYDwDg9gTgLgBDAnmYcBCBDAzgSwMYAKUOAtjjDgG6oC8cAdgK4kBGwUcAPnFjMfQHMucFhAgAbYBnoBuAFBzQkWHABmjengoR6cACYQAyjEarVACkoZxjYAC502fEVLkqwAJRwA3nLj+4SXgQODorG2B5ALgoYBMoXRB5AF8gA)编辑器中把鼠标光标放在 `x` 上，我们就会看到信息面板中显示出了 `BasicPrimitive` 类型。
同样地，如果我们查看由该文件生成的声明文件（`.d.ts`），那么 TypeScript 会显示出 `doStuff` 的返回值类型为 `BasicPrimitive` 类型。

那么你猜一猜，如果返回值类型为 `BasicPrimitive` 或 `undefined` 时会发生什么？

```ts
export type BasicPrimitive = number | string | boolean;

export function doStuff(value: BasicPrimitive) {
    if (Math.random() < 0.5) {
        return undefined;
    }

    return value;
}
```

可以在[TypeScript 4.1 演练场](https://www.typescriptlang.org/play?ts=4.1.3#code/KYDwDg9gTgLgBDAnmYcBCBDAzgSwMYAKUOAtjjDgG6oC8cAdgK4kBGwUcAPnFjMfQHMucFhAgAbYBnoBuALAAoRQHplcABIRqHCPTgByACYQAyjEYAzC-pHBxEAO4IIPYKgcALDPAAqyYCZ4xGDwhjhYYOIYiFhwFtAIHqhQwOZQekgoAHQqagDqqGQCHvBe1HCgKHgwwIZw5M5wYPzw2Lm5cJ2YuITEZBTl3Iz0hsAWOPS1HR0sjPBs9k5+KIHB8AAsWQBMADT18BO8UnVhEVExcG0Kqh2dTKzswrz8QtyiElJ6QyNjE1PXykUlWg8Asw2qOF0cGMZksFgAFJQMOJGMAAFzobD4IikchUYAASjgAG9FJ1yTgLHB4QBZbweLJQaTGEjwokAHjgAAYsgBWImkhTk4WdFJpPTDUbjSaGeRC4UAX0UZOFYsY6TgSJRwDlcAVQA)中查看结果。
虽然我们希望 TypeScript 将 `doStuff` 的返回值类型显示为 `BasicPrimitive | undefined`，但是它却显示成了 `string | number | boolean | undefined` 类型！
这是怎么回事？

这与 TypeScript 内部的类型表示方式有关。
当基于一个联合类型来创建另一个联合类型时，TypeScript 会将类型*标准化*，也就是把类型展开为一个新的联合类型 - 但这么做也可能会丢失信息。
类型检查器不得不根据 `string | number | boolean | undefined` 类型来尝试每一种可能的组合并查看使用了哪些类型别名，即便这样也可能会有多个类型别名指向 `string | number | boolean` 类型。

TypeScript 4.2 的内部实现更加智能了。
我们会记录类型是如何被构造的，会记录它们原本的编写方式和之后的构造方式。
我们同样会记录和区分不同的类型别名！

有能力根据类型使用的方式来回显这个类型就意味着，对于 TypeScript 用户来讲能够避免显示很长的类型；同时也意味着会生成更友好的 `.d.ts` 声明文件、错误消息和编辑器内显示的类型及签名帮助信息。
这会让 TypeScript 对于初学者来讲更友好一些。

更多详情，请参考[PR：改进保留类型别名的联合](https://github.com/microsoft/TypeScript/pull/42149)，以及[PR：保留间接的类型别名](https://github.com/microsoft/TypeScript/pull/42284)。

## 元组类型中前导的/中间的剩余元素

在 TypeScript 中，元组类型用于表示固定长度和元素类型的数组。

```ts
// 存储了一对数字的元组
let a: [number, number] = [1, 2];

// 存储了一个string，一个number和一个boolean的元组
let b: [string, number, boolean] = ['hello', 42, true];
```

随着时间的推移，TypeScript 中的元组类型变得越来越复杂，因为它们也被用来表示像 JavaScript 中的参数列表类型。
结果就是，它可能包含可选元素和剩余元素，以及用于工具和提高可读性的标签。

```ts
// 包含一个或两个元素的元组。
let c: [string, string?] = ['hello'];
c = ['hello', 'world'];

// 包含一个或两个元素的标签元组。
let d: [first: string, second?: string] = ['hello'];
d = ['hello', 'world'];

// 包含剩余元素的元组 - 至少前两个元素是字符串，
// 以及后面的任意数量的布尔元素。
let e: [string, string, ...boolean[]];

e = ['hello', 'world'];
e = ['hello', 'world', false];
e = ['hello', 'world', true, false, true];
```

在 TypeScript 4.2 中，剩余元素会按它们的使用方式进行展开。
在之前的版本中，TypeScript 只允许 `...rest` 元素位于元组的末尾。

但现在，剩余元素可以出现在元组中的任意位置 - 但有一点限制。

```ts
let foo: [...string[], number];

foo = [123];
foo = ['hello', 123];
foo = ['hello!', 'hello!', 'hello!', 123];

let bar: [boolean, ...string[], boolean];

bar = [true, false];
bar = [true, 'some text', false];
bar = [true, 'some', 'separated', 'text', false];
```

唯一的限制是，剩余元素之后不能出现可选元素或其它剩余元素。
换句话说，一个元组中只允许有一个剩余元素，并且剩余元素之后不能有可选元素。

```ts twoslash
interface Clown {
    /*...*/
}
interface Joker {
    /*...*/
}

let StealersWheel: [...Clown[], 'me', ...Joker[]];
//                                    ~~~~~~~~~~ 错误

let StringsAndMaybeBoolean: [...string[], boolean?];
//                                        ~~~~~~~~ 错误
```

这些不在结尾的剩余元素能够用来描述，可接收任意数量的前导参数加上固定数量的结尾参数的函数。

```ts
declare function doStuff(
    ...args: [...names: string[], shouldCapitalize: boolean]
): void;

doStuff(/*shouldCapitalize:*/ false);
doStuff('fee', 'fi', 'fo', 'fum', /*shouldCapitalize:*/ true);
```

尽管 JavaScript 中没有声明前导剩余参数的语法，但我们仍可以将 `doStuff` 函数的参数声明为带有前导剩余元素 `...args` 的元组类型。
使用这种方式可以帮助我们描述许多的 JavaScript 代码！

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/41544)。

## 更严格的 `in` 运算符检查

在 JavaScript 中，如果 `in` 运算符的右操作数是非对象类型，那么会产生运行时错误。
TypeScript 4.2 确保了该错误能够在编译时被捕获。

```ts twoslash
'foo' in 42;
// The right-hand side of an 'in' expression must not be a primitive.
```

这个检查在大多数情况下是相当保守的，如果你看到提示了这个错误，那么代码中很可能真的有问题。

非常感谢外部贡献者 [Jonas Hübotter](https://github.com/jonhue) 的 [PR](https://github.com/microsoft/TypeScript/pull/41928)！

## `--noPropertyAccessFromIndexSignature`

在 TypeScript 刚开始支持索引签名时，它只允许使用方括号语法来访问索引签名中定义的元素，例如 `person["name"]`。

```ts
interface SomeType {
    /** 这是索引签名 */
    [propName: string]: any;
}

function doStuff(value: SomeType) {
    let x = value['someProperty'];
}
```

这就导致了在处理带有任意属性的对象时变得烦锁。
例如，假设有一个容易出现拼写错误的 API，容易出现在属性名的末尾位置多写一个字母 `s` 的错误。

```ts
interface Options {
    /** 要排除的文件模式。 */
    exclude?: string[];

    /**
     * 这会将其余所有未声明的属性定义为 'any' 类型。
     */
    [x: string]: any;
}

function processOptions(opts: Options) {
    // 注意，我们想要访问 `excludes` 而不是 `exclude`
    if (opts.excludes) {
        console.error(
            'The option `excludes` is not valid. Did you mean `exclude`?'
        );
    }
}
```

为了便于处理以上情况，在从前的时候，TypeScript 允许使用点语法来访问通过字符串索引签名定义的属性。
这会让从 JavaScript 代码到 TypeScript 代码的迁移工作变得容易。

然而，放宽限制同样意味着更容易出现属性名拼写错误。

```ts
interface Options {
    /** 要排除的文件模式。 */
    exclude?: string[];

    /**
     * 这会将其余所有未声明的属性定义为 'any' 类型。
     */
    [x: string]: any;
}
// ---cut---
function processOptions(opts: Options) {
    // ...

    // 注意，我们不小心访问了错误的 `excludes`。
    // 但是！这是合法的！
    for (const excludePattern of opts.excludes) {
        // ...
    }
}
```

在某些情况下，用户会想要选择使用索引签名 - 在使用点号语法进行属性访问时，如果访问了没有明确定义的属性，就得到一个错误。

这就是为什么 TypeScript 引入了一个新的 `--noPropertyAccessFromIndexSignature` 编译选项。
在该模式下，你可以有选择的启用 TypeScript 之前的行为，即在上述使用场景中产生错误。
该编译选项不属于 `strict` 编译选项集合的一员，因为我们知道该功能只适用于部分用户。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/40171/)。
我们同时要感谢 [Wenlu Wang](https://github.com/Kingwl) 为该功能的付出！

## `abstract` 构造签名

TypeScript 允许将一个类标记为 _abstract_。
这相当于告诉 TypeScript 这个类只是用于继承，并且有些成员需要在子类中实现，以便能够真正地创建出实例。

```ts twoslash
abstract class Shape {
    abstract getArea(): number;
}

// 不能创建抽象类的实例
new Shape();

class Square extends Shape {
    #sideLength: number;

    constructor(sideLength: number) {
        super();
        this.#sideLength = sideLength;
    }

    getArea() {
        return this.#sideLength ** 2;
    }
}

// 没问题
new Square(42);
```

为了能够确保一贯的对 `new` 一个 `abstract` 类进行限制，不允许将 `abstract` 类赋值给接收构造签名的值。

```ts twoslash
abstract class Shape {
    abstract getArea(): number;
}

interface HasArea {
    getArea(): number;
}

// 不能将抽象构造函数类型赋值给非抽象构造函数类型。
let Ctor: new () => HasArea = Shape;
```

如果有代码调用了 `new Ctor`，那么上述的行为是正确的，但若想要编写 `Ctor` 的子类，就会出现过度限制的情况。

```ts
abstract class Shape {
    abstract getArea(): number;
}

interface HasArea {
    getArea(): number;
}

function makeSubclassWithArea(Ctor: new () => HasArea) {
    return class extends Ctor {
        getArea() {
            return 42;
        }
    };
}

// 不能将抽象构造函数类型赋值给非抽象构造函数类型。
let MyShape = makeSubclassWithArea(Shape);
```

对于内置的工具类型`InstanceType`来讲，它也不是工作得很好。

```ts
// 错误！
// 不能将抽象构造函数类型赋值给非抽象构造函数类型。
type MyInstance = InstanceType<typeof Shape>;
```

这就是为什么 TypeScript 4.2 允许在构造签名上指定 `abstract` 修饰符。

```ts
abstract class Shape {
  abstract getArea(): number;
}
// ---cut---
interface HasArea {
    getArea(): number;
}

// Works!
let Ctor: abstract new () => HasArea = Shape;
```

在构造签名上添加 `abstract` 修饰符表示可以传入一个 `abstract` 构造函数。
它不会阻止你传入其它具体的类/构造函数 - 它只是想表达不会直接调用这个构造函数，因此可以安全地传入任意一种类类型。

这个特性允许我们编写支持抽象类的*混入工厂函数*。
例如，在下例中，我们可以同时使用混入函数 `withStyles` 和 `abstract` 类 `SuperClass`。

```ts
abstract class SuperClass {
    abstract someMethod(): void;
    badda() {}
}

type AbstractConstructor<T> = abstract new (...args: any[]) => T

function withStyles<T extends AbstractConstructor<object>>(Ctor: T) {
    abstract class StyledClass extends Ctor {
        getStyles() {
            // ...
        }
    }
    return StyledClass;
}

class SubClass extends withStyles(SuperClass) {
    someMethod() {
        this.someMethod()
    }
}
```

注意，`withStyles` 展示了一个特殊的规则，若一个类（`StyledClass`）继承了被抽象构造函数所约束的泛型值，那么这个类也需要被声明为 `abstract`。
由于无法知道传入的类是否拥有更多的抽象成员，因此也无法知道子类是否实现了所有的抽象成员。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/36392)。

## 使用 `--explainFiles` 来理解工程的结构

TypeScript 用户时常会问“为什么 TypeScript 包含了这个文件？”。
推断程序中所包含的文件是个很复杂的过程，比如有很多原因会导致使用了 `lib.d.ts` 文件的组合，会导致 `node_modules` 中的文件被包含进来，会导致有些已经 `exclude` 的文件被包含进来。

这就是 TypeScript 提供 `--explainFiles` 的原因。

```sh
tsc --explainFiles
```

在使用了该选项时，TypeScript 编译器会输出非常详细的信息来说明某个文件被包含进工程的原因。
为了更易理解，我们可以把输出结果存到文件里，或者通过管道使用其它命令来查看它。

```sh
# 将输出保存到文件
tsc --explainFiles > expanation.txt

# 将输出传递给工具程序 `less`，或编辑器 VS Code
tsc --explainFiles | less

tsc --explainFiles | code -
```

通常，输出结果首先会给列出包含 `lib.d.ts` 文件的原因，然后是本地文件，再然后是 `node_modules` 文件。

```
TS_Compiler_Directory/4.2.2/lib/lib.es5.d.ts
  Library referenced via 'es5' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2015.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2015.d.ts
  Library referenced via 'es2015' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2016.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2016.d.ts
  Library referenced via 'es2016' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2017.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2017.d.ts
  Library referenced via 'es2017' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2018.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2018.d.ts
  Library referenced via 'es2018' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2019.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2019.d.ts
  Library referenced via 'es2019' from file 'TS_Compiler_Directory/4.2.2/lib/lib.es2020.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.es2020.d.ts
  Library referenced via 'es2020' from file 'TS_Compiler_Directory/4.2.2/lib/lib.esnext.d.ts'
TS_Compiler_Directory/4.2.2/lib/lib.esnext.d.ts
  Library 'lib.esnext.d.ts' specified in compilerOptions

... More Library References...

foo.ts
  Matched by include pattern '**/*' in 'tsconfig.json'
```

目前，TypeScript 不保证输出文件的格式 - 它在将来可能会改变。
关于这一点，我们也打算改进输出文件格式，请给出你的建议！

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/40011)！

## 改进逻辑表达式中的未被调用函数检查

感谢 [Alex Tarasyuk](https://github.com/a-tarasyuk) 提供的持续改进，TypeScript 中的未调用函数检查现在也作用于 `&&` 和 `||` 表达式。

在 `--strictNullChecks` 模式下，下面的代码会产生错误。

```ts
function shouldDisplayElement(element: Element) {
    // ...
    return true;
}

function getVisibleItems(elements: Element[]) {
    return elements.filter((e) => shouldDisplayElement && e.children.length);
    //                          ~~~~~~~~~~~~~~~~~~~~
    // 该条件表达式永远返回 true，因为函数永远是定义了的。
    // 你是否想要调用它？
}
```

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/issues/40197)。

## 解构出来的变量可以被明确地标记为未使用的

感谢 [Alex Tarasyuk](https://github.com/a-tarasyuk) 提供的另一个 PR，你可以使用下划线（`_` 字符）将解构变量标记为未使用的。

```ts
let [_first, second] = getValues();
```

在之前，如果 `_first` 未被使用，那么在启用了 `noUnusedLocals` 时 TypeScript 会产生一个错误。
现在，TypeScript 会识别出使用了下划线的 `_first` 变量是有意的未使用的变量。

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/41378)。

## 放宽了在可选属性和字符串索引签名间的限制

字符串索引签名可用于为类似于字典的对象添加类型，它表示允许使用任意的键来访问对象：

```ts
const movieWatchCount: { [key: string]: number } = {};

function watchMovie(title: string) {
    movieWatchCount[title] = (movieWatchCount[title] ?? 0) + 1;
}
```

当然了，对于不在字典中的电影名而言 `movieWatchCount[title]` 的值为 `undefined`。（TypeScript 4.1 增加了 [`--noUncheckedIndexedAccess`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#checked-indexed-accesses---nouncheckedindexedaccess) 选项，在访问索引签名时会增加 `undefined` 值。）
即便一定会有 `movieWatchCount` 中不存在的属性，但在之前的版本中，由于 `undefined` 值的存在，TypeScript 会将可选对象属性视为不可以赋值给兼容的索引签名。

```ts
type WesAndersonWatchCount = {
    'Fantastic Mr. Fox'?: number;
    'The Royal Tenenbaums'?: number;
    'Moonrise Kingdom'?: number;
    'The Grand Budapest Hotel'?: number;
};

declare const wesAndersonWatchCount: WesAndersonWatchCount;
const movieWatchCount: { [key: string]: number } = wesAndersonWatchCount;
//    ~~~~~~~~~~~~~~~ 错误！
// 类型 'WesAndersonWatchCount' 不允许赋值给类型 '{ [key: string]: number; }'。
//    属性 '"Fantastic Mr. Fox"' 与索引签名不兼容。
//      类型 'number | undefined' 不允许赋值给类型 'number'。
//        类型 'undefined' 不允许赋值给类型 'number'。 (2322)
```

TypeScript 4.2 允许这样赋值。
但是不允许使用带有 `undefined` 类型的非可选属性进行赋值，也不允许将 `undefined` 值直接赋值给某个属性：

```ts
type BatmanWatchCount = {
    'Batman Begins': number | undefined;
    'The Dark Knight': number | undefined;
    'The Dark Knight Rises': number | undefined;
};

declare const batmanWatchCount: BatmanWatchCount;

// 在 TypeScript 4.2 中仍是错误。
const movieWatchCount: { [key: string]: number } = batmanWatchCount;

// 在 TypeScript 4.2 中仍是错误。
// 索引签名不允许显式地赋值 `undefined`。
movieWatchCount["It's the Great Pumpkin, Charlie Brown"] = undefined;
```

这条新规则不适用于数字索引签名，因为它们被当成是类数组的并且是稠密的：

```ts
declare let sortOfArrayish: { [key: number]: string };
declare let numberKeys: { 42?: string };

sortOfArrayish = numberKeys;
```

更多详情，请参考 [PR](https://github.com/microsoft/TypeScript/pull/41921)。

## 声明缺失的函数

感谢 [Alexander Tarasyuk](https://github.com/a-tarasyuk) 提交的 [PR](https://github.com/microsoft/TypeScript/pull/41215)，TypeScript 支持了一个新的快速修复功能，那就是根据调用方来生成新的函数和方法声明！

![一个未被声明的 `foo` 函数被调用了，使用快速修复](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2021/01/addMissingFunction-4.2.gif)

<!--
## Breaking Changes

We always strive to minimize breaking changes in a release.
TypeScript 4.2 contains some breaking changes, but we believe they should be manageable in an upgrade.

### `lib.d.ts` Updates

As with every TypeScript version, declarations for `lib.d.ts` (especially the declarations generated for web contexts), have changed.
There are various changes, though `Intl` and `ResizeObserver`'s may end up being the most disruptive.

### `noImplicitAny` Errors Apply to Loose `yield` Expressions

When the value of a `yield` expression is captured, but TypeScript can't immediately figure out what type you intend for it to receive (i.e. the `yield` expression isn't contextually typed), TypeScript will now issue an implicit `any` error.

```ts twoslash
// @errors: 7057
function* g1() {
    const value = yield 1;
}

function* g2() {
    // No error.
    // The result of `yield 1` is unused.
    yield 1;
}

function* g3() {
    // No error.
    // `yield 1` is contextually typed by 'string'.
    const value: string = yield 1;
}

function* g4(): Generator<number, void, string> {
    // No error.
    // TypeScript can figure out the type of `yield 1`
    // from the explicit return type of `g3`.
    const value = yield 1;
}
```

See more details in [the corresponding changes](https://github.com/microsoft/TypeScript/pull/41348).

### Expanded Uncalled Function Checks

As described above, uncalled function checks will now operate consistently within `&&` and `||` expressions when using `--strictNullChecks`.
This can be a source of new breaks, but is typically an indication of a logic error in existing code.

### Type Arguments in JavaScript Are Not Parsed as Type Arguments

Type arguments were already not allowed in JavaScript, but in TypeScript 4.2, the parser will parse them in a more spec-compliant way.
So when writing the following code in a JavaScript file:

```ts
f<T>(100);
```

TypeScript will parse it as the following JavaScript:

```js
f < T > 100;
```

This may impact you if you were leveraging TypeScript's API to parse type constructs in JavaScript files, which may have occurred when trying to parse Flow files.

See [the pull request](https://github.com/microsoft/TypeScript/pull/41928) for more details on what's checked.

### Tuple size limits for spreads

Tuple types can be made by using any sort of spread syntax (`...`) in TypeScript.

```ts
// Tuple types with spread elements
type NumStr = [number, string];
type NumStrNumStr = [...NumStr, ...NumStr];

// Array spread expressions
const numStr = [123, 'hello'] as const;
const numStrNumStr = [...numStr, ...numStr] as const;
```

Sometimes these tuple types can accidentally grow to be huge, and that can make type-checking take a long time.
Instead of letting the type-checking process hang (which is especially bad in editor scenarios), TypeScript has a limiter in place to avoid doing all that work.

You can [see this pull request](https://github.com/microsoft/TypeScript/pull/42448) for more details.

### `.d.ts` Extensions Cannot Be Used In Import Paths

In TypeScript 4.2, it is now an error for your import paths to contain `.d.ts` in the extension.

```ts
// must be changed something like
//   - "./foo"
//   - "./foo.js"
import { Foo } from './foo.d.ts';
```

Instead, your import paths should reflect whatever your loader will do at runtime.
Any of the following imports might be usable instead.

```ts
import { Foo } from './foo';
import { Foo } from './foo.js';
import { Foo } from './foo/index.js';
```

### Reverting Template Literal Inference

This change removed a feature from TypeScript 4.2 beta.
If you haven't yet upgraded past our last stable release, you won't be affected, but you may still be interested in the change.

The beta version of TypeScript 4.2 included a change in inference to template strings.
In this change, template string literals would either be given template string types or simplify to multiple string literal types.
These types would then _widen_ to `string` when assigning to mutable variables.

```ts
declare const yourName: string;

// 'bar' is constant.
// It has type '`hello ${string}`'.
const bar = `hello ${yourName}`;

// 'baz' is mutable.
// It has type 'string'.
let baz = `hello ${yourName}`;
```

This is similar to how string literal inference works.

```ts
// 'bar' has type '"hello"'.
const bar = 'hello';

// 'baz' has type 'string'.
let baz = 'hello';
```

For that reason, we believed that making template string expressions have template string types would be "consistent";
however, from what we've seen and heard, that isn't always desirable.

In response, we've reverted this feature (and potential breaking change).
If you _do_ want a template string expression to be given a literal-like type, you can always add `as const` to the end of it.

```ts
declare const yourName: string;

// 'bar' has type '`hello ${string}`'.
const bar = `hello ${yourName}` as const;
//                              ^^^^^^^^

// 'baz' has type 'string'.
const baz = `hello ${yourName}`;
```

### TypeScript's `lift` Callback in `visitNode` Uses a Different Type

TypeScript has a `visitNode` function that takes a `lift` function.
`lift` now expects a `readonly Node[]` instead of a `NodeArray<Node>`.
This is technically an API breaking change which you can read more on [here](https://github.com/microsoft/TypeScript/pull/42000).
-->
