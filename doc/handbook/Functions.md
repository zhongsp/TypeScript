# 介绍

函数是JavaScript应用程序的基础。
它帮助你实现抽象层，模拟类，信息隐藏和模块。
在TypeScript里，虽然已经支持类，命名空间和模块，但函数仍然是主要的定义*行为*的地方。
TypeScript为JavaScript函数添加了额外的功能，让我们可以更容易的使用。

# 函数

和JavaScript一样，TypeScript函数可以创建有名字的函数和匿名函数。
你可以随意选择适合应用程序的方式，不论是定义一系列API函数还是只使用一次的函数。

通过下面的例子可以迅速回想起这两种JavaScript中的函数：

```ts
// Named function
function add(x, y) {
    return x + y;
}

// Anonymous function
let myAdd = function(x, y) { return x + y; };
```

在JavaScript里，函数可以使用函数体外部的变量。
当函数这么做时，我们说它‘捕获’了这些变量。
至于为什么可以这样做以及其中的利弊超出了本文的范围，但是深刻理解这个机制对学习JavaScript和TypeScript会很有帮助。

```ts
let z = 100;

function addToZ(x, y) {
    return x + y + z;
}
```

# 函数类型

## 为函数定义类型

让我们为上面那个函数添加类型：

```ts
function add(x: number, y: number): number {
    return x + y;
}

let myAdd = function(x: number, y: number): number { return x+y; };
```

我们可以给每个参数添加类型之后再为函数本身添加返回值类型。
TypeScript能够根据返回语句自动推断出返回值类型，因此我们通常省略它。

## 书写完整函数类型

现在我们已经为函数指定了类型，下面让我们写出函数的完整类型。

```ts
let myAdd: (x:number, y:number)=>number =
    function(x: number, y: number): number { return x+y; };
```

函数类型包含两部分：参数类型和返回值类型。
当写出完整函数类型的时候，这两部分都是需要的。
我们以参数列表的形式写出参数类型，为每个参数指定一个名字和类型。
这个名字只是为了增加可读性。
我们也可以这么写：

```ts
let myAdd: (baseValue:number, increment:number) => number =
    function(x: number, y: number): number { return x + y; };
```

只要参数类型是匹配的，那么就认为它是有效的函数类型，而不在乎参数名是否正确。

第二部分是返回值类型。
对于返回值，我们在函数和返回值类型之前使用(`=>`)符号，使之清晰明了。
如之前提到的，返回值类型是函数类型的必要部分，如果函数没有返回任何值，你也必须指定返回值类型为`void`而不能留空。

函数的类型只是由参数类型和返回值组成的。
函数中使用的捕获变量不会体现在类型里。
实际上，这些变量是函数的隐藏状态并不是组成API的一部分。

## 推断类型

尝试这个例子的时候，你会发现如果你在赋值语句的一边指定了类型但是另一边没有类型的话，TypeScript编译器会自动识别出类型：

```ts
// myAdd has the full function type
let myAdd = function(x: number, y: number): number { return x + y; };

// The parameters `x` and `y` have the type number
let myAdd: (baseValue:number, increment:number) => number =
    function(x, y) { return x + y; };
```

这叫做“按上下文归类”，是类型推论的一种。
它帮助我们更好地为程序指定类型。

# 可选参数和默认参数

TypeScript里的每个函数参数都是必须的。
这不是指不能传递`null`或`undefined`作为参数，而是说编译器检查用户是否为每个参数都传入了值。
编译器还会假设只有这些参数会被传递进函数。
简短地说，传递给一个函数的参数个数必须与函数期望的参数个数一致。

```ts
function buildName(firstName: string, lastName: string) {
    return firstName + " " + lastName;
}

let result1 = buildName("Bob");                  // error, too few parameters
let result2 = buildName("Bob", "Adams", "Sr.");  // error, too many parameters
let result3 = buildName("Bob", "Adams");         // ah, just right
```

JavaScript里，每个参数都是可选的，可传可不传。
没传参的时候，它的值就是undefined。
在TypeScript里我们可以在参数名旁使用`?`实现可选参数的功能。
比如，我们想让last name是可选的：

```ts
function buildName(firstName: string, lastName?: string) {
    if (lastName)
        return firstName + " " + lastName;
    else
        return firstName;
}

let result1 = buildName("Bob");  // works correctly now
let result2 = buildName("Bob", "Adams", "Sr.");  // error, too many parameters
let result3 = buildName("Bob", "Adams");  // ah, just right
```

可选参数必须跟在必须参数后面。
如果上例我们想让first name是可选的，那么就必须调整它们的位置，把first name放在后面。

在TypeScript里，我们也可以为参数提供一个默认值当用户没有传递这个参数或传递的值是`undefined`时。
它们叫做有默认初始化值的参数。
让我们修改上例，把last name的默认值设置为`"Smith"`。

```ts
function buildName(firstName: string, lastName = "Smith") {
    return firstName + " " + lastName;
}

let result1 = buildName("Bob");                  // works correctly now, returns "Bob Smith"
let result2 = buildName("Bob, undefined");       // still works, also returns "Bob Smith"
let result3 = buildName("Bob", "Adams", "Sr.");  // error, too many parameters
let result4 = buildName("Bob", "Adams");         // ah, just right
```

在所有必须参数后面的带默认初始化的参数都是可选的，与可选参数一样，在调用函数的时候可以省略。
也就是说可选参数与末尾的默认参数共享参数类型。

```ts
function buildName(firstName: string, lastName?: string) {
    // ...
}
```

和

```ts
function buildName(firstName: string, lastName = "Smith") {
    // ...
}
```

共享同样的类型`(firstName: string, lastName?: string) => string`。
默认参数的默认值消失了，只保留了它是一个可选参数的信息。

与普通可选参数不同的是，带默认值的参数不需要放在必须参数的后面。
如果带默认值的参数出现在必须参数前面，用户必须明确的传入`undefined`值来获得默认值。
例如，我们重写最后一个例子，让`firstName`是带默认值的参数：

```ts
function buildName(firstName = "Will", lastName: string) {
    return firstName + " " + lastName;
}

let result1 = buildName("Bob");                  // error, too few parameters
let result2 = buildName("Bob", "Adams", "Sr.");  // error, too many parameters
let result3 = buildName("Bob", "Adams");         // okay and returns "Bob Adams"
let result4 = buildName(undefined, "Adams");     // okay and returns "Will Adams"
```

# 剩余参数

必要参数，默认参数和可选参数有个共同点：它们表示某一个参数。
有时，你想同时操作多个参数，或者你并不知道会有多少参数传递进来。
在JavaScript里，你可以使用`arguments`来访问所有传入的参数。

在TypeScript里，你可以把所有参数收集到一个变量里：

```ts
function buildName(firstName: string, ...restOfName: string[]) {
  return firstName + " " + restOfName.join(" ");
}

let employeeName = buildName("Joseph", "Samuel", "Lucas", "MacKinzie");
```

剩余参数会被当做个数不限的可选参数。
可以一个都没有，同样也可以有任意个。
编译器创建参数数组，名字是你在省略号（`...`）后面给定的名字，你可以在函数体内使用这个数组。

这个省略号也会在带有剩余参数的函数类型定义上使用到：

```ts
function buildName(firstName: string, ...restOfName: string[]) {
  return firstName + " " + restOfName.join(" ");
}

let buildNameFun: (fname: string, ...rest: string[]) => string = buildName;
```

# Lambda表达式和使用`this`

JavaScript里`this`的工作机制对JavaScript程序员来说已经是老生常谈了。
的确，学会如何使用它绝对是JavaScript编程中的一件大事。
由于TypeScript是JavaScript的超集，TypeScript程序员也需要弄清`this`工作机制并且当有bug的时候能够找出错误所在。
`this`的工作机制可以单独写一本书了，并确已有人这么做了。在这里，我们只介绍一些基础知识。

JavaScript里，`this`的值在函数被调用的时候才会指定。
这是个既强大又灵活的特点，但是你需要花点时间弄清楚函数调用的上下文是什么。
众所周知这不是一件很简单的事，特别是函数当做回调函数使用的时候。

下面看一个例子：

```ts
let deck = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function() {
        return function() {
            let pickedCard = Math.floor(Math.random() * 52);
            let pickedSuit = Math.floor(pickedCard / 13);

            return {suit: this.suits[pickedSuit], card: pickedCard % 13};
        }
    }
}

let cardPicker = deck.createCardPicker();
let pickedCard = cardPicker();

alert("card: " + pickedCard.card + " of " + pickedCard.suit);
```

如果我们运行这个程序，会发现它并没有弹出对话框而是报错了。
因为`createCardPicker`返回的函数里的`this`被设置成了`window`而不是`deck`对象。
当你调用`cardPicker()`时会发生这种情况。这里没有对`this`进行动态绑定因此为window。（注意在严格模式下，会是undefined而不是window）。

为了解决这个问题，我们可以在函数被返回时就绑好正确的`this`。
这样的话，无论之后怎么使用它，都会引用绑定的‘deck’对象。

我们把函数表达式变为使用lambda表达式（ () => {} ）。
这样就会在函数创建的时候就指定了‘this’值，而不是在函数调用的时候。

```ts
let deck = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function() {
        // Notice: the line below is now a lambda, allowing us to capture `this` earlier
        return () => {
            let pickedCard = Math.floor(Math.random() * 52);
            let pickedSuit = Math.floor(pickedCard / 13);

            return {suit: this.suits[pickedSuit], card: pickedCard % 13};
        }
    }
}

let cardPicker = deck.createCardPicker();
let pickedCard = cardPicker();

alert("card: " + pickedCard.card + " of " + pickedCard.suit);
```

为了解更多关于`this`的信息，请阅读Yahuda Katz的[Understanding JavaScript Function Invocation and "this"](http://yehudakatz.com/2011/08/11/understanding-javascript-function-invocation-and-this/)。

# 重载

JavaScript本身是个动态语言。
JavaScript里函数根据传入不同的参数而返回不同类型的数据是很常见的。

```ts
let suits = ["hearts", "spades", "clubs", "diamonds"];

function pickCard(x): any {
    // Check to see if we're working with an object/array
    // if so, they gave us the deck and we'll pick the card
    if (typeof x == "object") {
        let pickedCard = Math.floor(Math.random() * x.length);
        return pickedCard;
    }
    // Otherwise just let them pick the card
    else if (typeof x == "number") {
        let pickedSuit = Math.floor(x / 13);
        return { suit: suits[pickedSuit], card: x % 13 };
    }
}

let myDeck = [{ suit: "diamonds", card: 2 }, { suit: "spades", card: 10 }, { suit: "hearts", card: 4 }];
let pickedCard1 = myDeck[pickCard(myDeck)];
alert("card: " + pickedCard1.card + " of " + pickedCard1.suit);

let pickedCard2 = pickCard(15);
alert("card: " + pickedCard2.card + " of " + pickedCard2.suit);
```

`pickCard`方法根据传入参数的不同会返回两种不同的类型。
如果传入的是代表纸牌的对象，函数作用是从中抓一张牌。
如果用户想抓牌，我们告诉他抓到了什么牌。
但是这怎么在类型系统里表示呢。

方法是为同一个函数提供多个函数类型定义来进行函数重载。
编译器会根据这个列表去处理函数的调用。
下面我们来重载`pickCard`函数。

```ts
let suits = ["hearts", "spades", "clubs", "diamonds"];

function pickCard(x: {suit: string; card: number; }[]): number;
function pickCard(x: number): {suit: string; card: number; };
function pickCard(x): any {
    // Check to see if we're working with an object/array
    // if so, they gave us the deck and we'll pick the card
    if (typeof x == "object") {
        let pickedCard = Math.floor(Math.random() * x.length);
        return pickedCard;
    }
    // Otherwise just let them pick the card
    else if (typeof x == "number") {
        let pickedSuit = Math.floor(x / 13);
        return { suit: suits[pickedSuit], card: x % 13 };
    }
}

let myDeck = [{ suit: "diamonds", card: 2 }, { suit: "spades", card: 10 }, { suit: "hearts", card: 4 }];
let pickedCard1 = myDeck[pickCard(myDeck)];
alert("card: " + pickedCard1.card + " of " + pickedCard1.suit);

let pickedCard2 = pickCard(15);
alert("card: " + pickedCard2.card + " of " + pickedCard2.suit);
```

这样改变后，重载的`pickCard`函数在调用的时候会进行正确的类型检查。

为了让编译器能够选择正确的检查类型，它与JavaScript里的处理流程相似。
它查找重载列表，尝试使用第一个重载定义。
如果匹配的话就使用这个。
因此，在定义重载的时候，一定要把最精确的定义放在最前面。

注意，`function pickCard(x): any`并不是重载列表的一部分，因此这里只有两个重载：一个是接收对象另一个接收数字。
以其它参数调用`pickCard`会产生错误。
