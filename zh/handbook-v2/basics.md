# 基础

JavaScript 中的每个值会随着我们执行不同的操作表现出一系列的行为。这听起来很抽象，看下面的例子，考虑一下针对变量 `message` 可能执行的操作。

```js
// 访问 message 的 toLowerCase 方法并调用它
message.toLowerCase();

// 调用 message 函数
message();
```

如果我们拆分这个过程，那么第一行代码就是访问了 `message` 的 `toLowerCase` 方法并调用它；

第二行代码则尝试直接调用 `message` 函数。

不过让我们假设一下，我们并不知道 `message` 的值——这是很常见的一种情况，仅从上面的代码中我们无法确切得知最终的结果。每个操作的结果完全取决于 `message` 的初始值。

- `message` 是否可以调用？
- 它有 `toLowerCase` 属性吗？
- 如果有这个属性，那么 `toLowerCase` 可以调用吗？
- 如果 `message` 以及它的属性都是可以调用的，那么分别返回什么？

在编写 JavaScript 代码的时候，这些问题的答案经常需要我们自己记在脑子里，而且我们必须得确保自己处理好了所有细节。

假设 `message` 是这样定义的：

```js
const message = "Hello World!";
```

你可能很容易猜到，如果执行 `message.toLowerCase()`，我们将会得到一个所有字母都是小写的字符串。

如果执行第二行代码呢？如果你熟悉 JavaScript 的话，肯定猜到了，这会抛出一个异常：

```txt
TypeError: message is not a function
```

如果可以避免这样的错误就好了。

当我们执行代码的时候，JavaScript 运行时会计算出值的*类型*——根据这种类型有什么行为和功能，从而决定采取什么措施。这就是上面的代码会抛出 `TypeError` 的原因——它表明字符串 `"Hello World!"` 无法作为函数被调用。

对于诸如 `string` 或者 `number` 这样的原始类型，我们可以通过 `typeof` 操作符在运行时计算出它们的类型。但对于像函数这样的类型，并没有对应的运行时机制来判断类型。举个例子，看下面的函数：

```js
function fn(x) {
  return x.flip();
}
```

从代码可以*看出*，仅当将带有可调用的 `flip` 属性的对象作为实参时，这个函数才可以正常运行，但 JavaScript 无法在代码执行时以一种我们可以检查的方式传递这个信息。要让纯 JavaScript 告诉我们 `fn` 在给定特定参数的时候会做什么事，唯一的方法就是实际调用 `fn` 函数。这样的行为使得我们很难在代码执行前进行相关的预测，也意味着我们在编写代码的时候，很难搞清楚代码会做什么事。

从这个角度看，所谓的*类型*其实就是描述了什么值可以安全传递给 `fn`，什么值会引起报错。JavaScript 只提供了*动态*类型——执行代码，然后才能知道会发生什么事。

那么不妨采用一种替代方案，使用*静态*的类型系统，在代码实际执行*前*预测代码的行为。

## 静态类型检查

还记得之前我们将字符串作为函数调用时，抛出的 `TypeError` 错误吗？*大多数人*不希望在执行代码时看到任何错误——毕竟这些都是 bug！当我们编写新代码的时候，我们也会尽量避免引入新的 bug。

如果我们只是添加了一点代码，保存文件，重新运行代码，然后马上看到报错，那么我们或许可以快速定位到问题——但情况并非总是如此。我们可能没有全面、彻底地进行测试，导致没有发现一些潜在错误！或者，如果我们幸运地发现了这个错误，我们可能最终会进行大规模的重构，并添加许多不同的代码。

理想的方案应该是，我们有一个工具可以在代码*执行前*找出 bug。而这正是像 TypeScript 这样的静态类型检查器所做的事情。*静态类型系统*描述了程序运行时值的结构和行为。像 TypeScript 这样的静态类型检查器会利用类型系统提供的信息，并在事态发展不对劲的时候告知我们。

```ts twoslash
// @errors: 2349
const message = "hello!";

message();
```

用 TypeScript 运行之前的例子，它会在我们执行代码之前首先抛出错误。

## 非异常失败

目前为止，我们讨论的都是运行时错误——JavaScript 运行时告诉我们，它觉得某个地方有异常。这些异常之所以能够抛出，是因为 [ECMAScript 规范](https://tc39.github.io/ecma262/)明确规定了针对异常应该表现的行为。

举个例子，规范指出，试图调用无法调用的东西应该抛出一个错误。也许这听上去像是“显而易见的行为”，并且你会觉得，访问对象上不存在的属性时，也会抛出一个错误。但恰恰相反，JavaScript 的表现和我们的预想不同，它返回的是值 `undefined`。

```js
const user = {
    name: 'Daniel',
    age: 26,
};
user.location; // 返回 undefined
```

最终，我们需要一个静态类型系统来告诉我们，哪些代码在这个系统中被标记为错误的代码——即使它是不会马上引起错误的“有效” JavaScript 代码。在 TypeScript 中，下面的代码会抛出错误，指出 `location` 没有定义：

```ts twoslash
// @errors: 2339
const user = {
  name: "Daniel",
  age: 26,
};

user.location;
```

虽然有时候这意味着你需要在表达的内容上进行权衡，但我们的目的是为了找到程序中更多合法的 bug。而 TypeScript 也的确可以捕获到*很多*合法的 bug：

举个例子，拼写错误：

```ts twoslash
// @noErrors
const announcement = "Hello World!";
 
// 你需要花多久才能注意到拼写错误？
announcement.toLocaleLowercase();
announcement.toLocalLowerCase();
 
// 实际上正确的拼写是这样的……
announcement.toLocaleLowerCase();
```

未调用的函数：

```ts twoslash
// @noUnusedLocals
// @errors: 2365
function flipCoin() {
  // 应该是 Math.random()
  return Math.random < 0.5;
}
```

或者是基本的逻辑错误：

```ts twoslash
// @errors: 2367
const value = Math.random() < 0.5 ? "a" : "b";
if (value !== "a") {
  // ...
} else if (value === "b") {
// 永远无法到达这个分支
}
```

## 类型工具

TypeScript 可以在我们的代码出现错误时捕获 bug。这很好，但更关键的是，它*也*能够在一开始就防止我们的代码出现错误。

类型检查器可以通过获取的信息检查我们是否正在访问变量或者其它属性上的正确属性。一旦它获取到了这些信息，它也能够*提示*你可能想要访问的属性。

这意味着 TypeScript 也能用于编辑代码。我们在编辑器中输入的时候，核心的类型检查器能够提供报错信息和代码补全。人们经常会谈到 TypeScript 在工具层面的作用，这就是一个典型的例子。

<!-- prettier-ignore -->

```ts twoslash
// @noErrors
// @esModuleInterop
import express from "express";
const app = express();

app.get("/", function (req, res) {
  res.sen
//       ^|
});

app.listen(3000);
```

TypeScript 在工具层面的作用非常强大，远不止拼写时进行代码补全和错误信息提示。支持 TypeScript 的编辑器可以通过“快速修复”功能自动修复错误，重构产生易组织的代码。同时，它还具备有效的导航功能，能够让我们跳转到某个变量定义的地方，或者找到对于给定变量的所有引用。所有这些功能都建立在类型检查器上，并且是跨平台的，因此[你最喜欢的编辑器很可能也支持了 TypeScript](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support)。

## TypeScript 编译器——`tsc`

我们一直在讨论类型检查器，但目前为止还没上手使用过。是时候和我们的新朋友——TypeScript 编译器 `tsc` 打交道了。首先，通过 npm 进行安装。

```bash
npm install -g typescript
```

> 这将全局安装 TypeScript 的编译器 `tsc`。
> 如果你更倾向于将 `tsc` 安装在本地的 `node_modules` 文件夹中，那你可能需要借助 `npx` 或者类似的工具。

现在，我们新建一个空文件夹，尝试编写第一个 TypeScript 程序：`hello.ts` ：

```ts twoslash
// 和世界打个招呼
console.log('Hello world!');
```

注意这行代码没有任何多余的修饰，它看起来就和使用 JavaScript 编写的“hello world”程序一模一样。现在，让我们运行 `typescript` 安装包自带的 `tsc` 指令进行类型检查。

```sh
tsc hello.ts
```

看！

等等，“看”*什么*呢？我们运行了 `tsc` 指令，但什么事情也没有发生！是的，毕竟这行代码没有类型错误，所以控制台中当然看不到报错信息的输出。不过再检查一下——我们其实得到了一个输出*文件*。如果我们查看当前目录，会发现除了 `hello.ts` 文件外还有一个 `hello.js` 文件。而 `hello.js` 文件是 `tsc` *编译*或者*转换* `hello.ts` 文件之后输出的纯 JavaScript 文件。如果检查 `hello.js` 文件的内容，我们可以看到 TypeScript 编译器处理完 `.ts` 文件后产出的内容：

```js
// 和世界打个招呼
console.log('Hello world!');
```

在这个例子中，TypeScript 几乎没有需要转译的内容，所以转译前后的代码看起来一模一样。编译器总是试图产出清晰可读的代码，这些代码看起来就像正常的开发者编写的一样。虽然这不是一件容易的事情，但 TypeScript 始终保持缩进，关注跨行的代码，并且会尝试保留注释。

如果我们*刻意*引入了类型检查错误呢？让我们重写一下 `hello.ts` ：

```ts twoslash
// @noErrors
// 行业通用打招呼函数
function greet(person, date) {
  console.log(`Hello ${person}, today is ${date}!`);
}

greet("Brendan");
```

如果我们再次执行 `tsc hello.ts`，那么会注意到命令行抛出了错误！

```txt
Expected 2 arguments, but got 1.
```

TypeScript 告诉我们，我们少传了一个参数给 `greet` 函数——本来应该是要传入那个参数的。目前为止，我们编写的仍然是标准的 JavaScript 代码，但类型检查依然可以发现我们代码中的问题。感谢 TypeScript！

## 报错时仍产出文件

有一件事你可能没有注意到，在上面的例子中，我们的 `hello.js` 文件再次发生了改动。如果我们打开这个文件，会发现内容和输入的文件内容是一样的。这可能有点出乎意料，毕竟 `tsc` 刚才报错了。但这种结果其实和 TypeScript 的核心原则有关：大多数时候，*你*比 TypeScript 更了解代码。

再次重申，对代码进行类型检查，会限制可以运行的程序的种类，因此类型检查器会进行权衡，以确定哪些代码是可以被接受的。大多数时候，这样没什么问题，但有的时候，这些检查会对我们造成阻碍。举个例子，想象你现在正把 JavaScript 代码迁移到 TypeScript 代码，并产生了很多类型检查错误。最后，你不得不花费时间解决类型检查器抛出的错误，但问题在于，原始的 JavaScript 代码本身就是可以运行的！为什么把它们转换为 TypeScript 代码之后，反而就不能运行了呢？

所以 TypeScript 并不会对你造成阻碍。当然，随着时间的推移，你可能希望对错误采取更具防御性的措施，同时也让 TypeScript 采取更加严格的行为。在这种情况下，你可以开启 [noEmitOnError](https://www.typescriptlang.org/tsconfig#noEmitOnError) 编译选项。尝试修改你的 `hello.ts` 文件，并使用参数去运行 `tsc` 指令：

```sh
tsc --noEmitOnError hello.ts
```

现在你会发现，`hello.js` 没有再发生改动了。

## 显式类型

目前为止，我们还没有告诉 TypeScript `person` 和 `date` 是什么。我们修改一下代码，告诉 TypeScript `person` 是 `string` ，`data` 则应该是 `Date` 对象。我们也会调用 `date` 的 `toDateString` 方法。

```ts twoslash
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, today is ${date.toDateString()}!`);
}
```

我们所做的事情，是给 `person` 和 `date` 添加*类型注解*，描述 `greet` 调用的时候应该接受什么类型的参数。你可以将这个签名解读为“`greet` 接受 `string` 类型的 `person`，以及 `Date` 类型的 `date`”。

有了类型注解之后，TypeScript 就能告诉我们，哪些情况下对于 `greet` 的调用可能是不正确的。比如……

```ts twoslash
// @errors: 2345
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, today is ${date.toDateString()}!`);
}

greet("Maddison", Date());
```

什么？TypeScript 报错提示第二个参数有问题，但这是为什么呢？你可能会有点惊讶，因为在 JavaScript 中直接调用 `Date()` 返回的是 `string`。另一方面，通过 `new Date()` 去构造 `Date`，则可以如预期那样返回 `Date` 对象。

不管怎样，我们可以快速修复这个错误：

```ts twoslash {4}
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, today is ${date.toDateString()}!`);
}
 
greet("Maddison", new Date());
```

记住，我们并不总是需要显式地进行类型注解。在很多情况下，即使省略了类型注解，TypeScript 也可以为我们*推断出*（或者“搞清楚”）类型。

```ts twoslash
let msg = "hello there!";
//  ^?
```

即使我们没有告诉 TypeScript `msg` 的类型是 `string`，它自己也能够搞清楚。这是一个特性，在类型系统能够正确地进行类型推断的时候，最好不要手动添加类型注解了。

> 注意：代码信息会在上面的代码示例中的气泡中展示出来。如果将鼠标放到变量上面，那么编辑器也会有相同的提示。

## 擦除类型

我们看一下，通过 `tsc` 将上面的 `greet` 函数编译成 JavaScript 后会发生什么事：

```ts twoslash
// @showEmit
// @target: es5
function greet(person: string, date: Date) {
  console.log(`Hello ${person}, today is ${date.toDateString()}!`);
}

greet("Maddison", new Date());
```

注意到有两个变化：

1. 我们的 `person` 和 `date` 参数的类型注解不见了。
2. 我们的“模板字符串”（使用反引号（`` ` ``）包裹的字符串）变成了通过 `+` 拼接的普通字符串。

稍后再解释第二点，我们先来看第一个变化。类型注解并不属于 JavaScript（或者专业上所说的 ECMAScript）的内容，所以没有任何浏览器或者运行时能够直接执行不经处理的 TypeScript 代码。这也是为什么 TypeScript 首先需要一个编译器——它需要经过编译，才能去除或者转换 TypeScript 独有的代码，从而让这些代码可以在浏览器上运行。大多数 TypeScript 独有的代码都会被擦除，在这个例子中，可以看到类型注解的代码完全被擦除了。

> **记住：** 类型注解永远不会改变你的程序在运行时的行为

## 降级

上面的另一个变化，就是我们的模板字符串从：

```js
`Hello ${person}, today is ${date.toDateString()}!`;
```

被重写为：

```js
"Hello " + person + ", today is " + date.toDateString() + "!";
```

为什么会这样子呢？

模板字符串是 ECMAScript 2015（或者 ECMAScript6、ES2015、ES6 等）引入的新特性。TypeScript 可以将高版本 ECMAScript 的代码重写为类似 ECMAScript3 或者 ECMAScript5（也就是 ES3 或者 ES5）这样较低版本的代码。类似这样将更新或者“更高”版本的 ECMAScript 向下降级为更旧或者“更低”版本的代码，就是所谓的*降级*。

默认情况下，TypeScript 会转化为 ES3 代码，这是一个非常旧的 ECMAScript 版本。我们可以使用 [target](https://www.typescriptlang.org/tsconfig#target) 选项将代码往较新的 ECMAScript 版本转换。通过使用 `--target es2015` 参数进行编译，我们可以得到 ECMAScript2015 版本的目标代码，这意味着这些代码能够在支持 ECMAScript2015 的环境中执行。因此，运行 `tsc --target es2015 hello.ts` 之后，我们会得到如下代码：

```js
function greet(person, date) {
  console.log(`Hello ${person}, today is ${date.toDateString()}!`);
}
greet("Maddison", new Date());
```

> 虽然默认的目标代码采用的是 ES3 语法，但现在浏览器大多数都已经支持 ES2015 了。 >
> 所以，大多数开发者可以安全地指定目标代码采用 ES2015 或者是更高的 ES 版本，除非你需要着重兼容某些古老的浏览器。

## 严格性

不同的用户会由于不同的理由去选择使用 TypeScript 的类型检查器。一些用户寻求的是一种更加松散、可选的开发体验，他们希望类型检查仅作用于部分代码，同时还可享受 TypeScript 提供的功能。这也是 TypeScript 默认提供的开发体验，类型是可选的，推断会使用最松散的类型，对于潜在的 `null/undefined` 类型的值也不会进行检查。就像 `tsc` 在编译报错的情况下仍然能够正常产出文件一样，这些默认的配置会确保不对你的开发过程造成阻碍。如果你正在迁移现有的 JavaScript 代码，那么这样的配置可能刚好适合。

另一方面，一些用户更希望 TypeScript 可以快速地、尽可能多地检查代码，这也是这门语言提供了严格性设置的原因。这些严格性设置将静态的类型检查从一种切换开关的模式（对于你的代码，要么全部进行检查，要么完全不检查）转换为接近于刻度盘那样的模式。你越是调节它，TypeScript 就会为你检查越多东西。这可能需要额外的工作，但从长远来看，这是值得的，它可以带来更彻底的检查以及更精细的工具。如果可能，新的代码库应该始终启用这些严格性配置。

TypeScript 有几个和类型检查相关的严格性标志，它们可以随时打开或关闭，如若没有特殊说明，我们文档中的例子都是在开启所有严格性设置的情况下执行的。CLI 中的 [strict](/tsconfig#strict) 标志，或者 [`tsconfig.json`](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) 中的 `"strict: true"` 设置，可以一次性开启全部严格性选项。但我们也可以单独开启或者关闭某个选项。在所有这些设置中，尤其需要关注的是 [`noImplicitAny`](/tsconfig#noImplicitAny) 和 [`strictNullChecks`](/tsconfig#strictNullChecks)。

## `noImplicitAny`

回想一下，在前面的某些例子中，TypeScript 没有为我们进行类型推断，这时候变量会采用最宽泛的类型：`any`。这并不是一件最糟糕的事情——毕竟，使用 `any` 类型基本就和纯 JavaScript 一样了。

但是，使用 `any` 通常会和使用 TypeScript 的目的相违背。你的程序使用越多的类型，那么在验证和工具辅助上你的收益就越多，这意味着在编码的时候你会遇到越少的 bug。启用 [noImplicitAny](/tsconfig#noImplicitAny) 配置项，在遇到被隐式推断为 `any` 类型的变量时就会抛出一个错误。

## `strictNullChecks`

默认情况下，`null` 和 `undefined` 可以被赋值给其它任意类型。这会让你的编码更加容易，但世界上无数多的 bug 正是由于忘记处理 `null` 和 `undefined` 导致的——有时候它甚至会带来[数十亿美元的损失](https://www.youtube.com/watch?v=ybrQvs4x0Ps)！[strictNullChecks](/tsconfig#strictNullChecks) 标志让处理 `null` 和 `undefined` 的过程更加明显，让我们*不用*担心自己是否*忘记*处理 `null` 和 `undefined`。
