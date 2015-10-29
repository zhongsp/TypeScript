# 介绍

为了让程序有价值，我们需要能够处理最简单的数据单元：数字，字符串，结构体，布尔值等。
TypeScript支持与JavaScript几乎相同的数据类型，此外还提供了实用的枚举类型方便我们使用。

# 布尔值

最基本的数据类型就是简单的true/false值，在JavaScript和TypeScript里叫做`boolean`（其它语言中也一样）。

```typescript
var isDone: boolean = false;
```

# 数字

和JavaScript一样，TypeScript里的所有数字都是浮点数。
这些浮点数的类型是`number`。

```typescript
var height: number = 6;
```

# 字符串

JavaScript程序的另一项基本操作是处理网页或服务器端的文本数据。
像其它语言里一样，我们使用`string`表示文本数据类型。
和JavaScript一样，可以使用双引号（`"`）或单引号（`'`）表示字符串。

```TypeScript
var name: string = "bob";
name = "smith";
```

你还可以使用*模版字符串*，它可以定义多行文本和内嵌表达式。
这种字符串是被反引号包围（`` ` ``），并且以`${ expr }`这种形式嵌入表达式

```TypeScript
var name: string = `Gene`;
var age: number = 37;
var sentence: string = `Hello, my name is ${ name }.

I'll be ${ age + 1 } years old next month.`;
```

这与下面定义`sentence`的方式效果相同：

```TypeScript
var sentence: string = "Hello, my name is " + name + ".\n\n" +
    "I'll be " + (age + 1) + " years old next month.";
```

# 数组

TypeScript像JavaScript一样可以操作数组元素。
有两种方式可以定义数组。
第一种，可以在元素类型后面接上`[]`，表示由此类型元素组成的一个数组：

```TypeScript
var list: number[] = [1, 2, 3];
```

第二种方式是使用数组泛型，`Array<元素类型>`：

```TypeScript
var list: Array<number> = [1, 2, 3];
```

# 枚举

`enum`类型是对JavaScript标准数据类型的一个补充。
像C#等其它语言一样，使用枚举类型可以为一组数值赋予友好的名字。

```TypeScript
enum Color {Red, Green, Blue};
var c: Color = Color.Green;
```

默认情况下，从`0`开始为元素编号。
你也可以手动的指定成员的数值。
例如，我们将上面的例子改成从`1`开始编号：

```TypeScript
enum Color {Red = 1, Green, Blue};
var c: Color = Color.Green;
```

或者，全部都采用手动赋值：

```TypeScript
enum Color {Red = 1, Green = 2, Blue = 4};
var c: Color = Color.Green;
```

枚举类型提供的一个便利是你可以由枚举的值得到它的名字。
例如，我们知道数值为2，但是不确定它映射到Color里的哪个名字，我们可以查找相应的名字：

```TypeScript
enum Color {Red = 1, Green, Blue};
var colorName: string = Color[2];

alert(colorName);
```

# 任意值

有时，我们可能会想要给在编写程序时并不清楚的变量指定其类型。
这些值可能来自于动态的内容，比如来自用户或第三方代码库。
这种情况下，我们不希望类型检查器对这些值进行检查或者说让它们直接通过编译阶段的检查。
那么我们可以使用`any`类型来标记这些变量：

```TypeScript
var notSure: any = 4;
notSure = "maybe a string instead";
notSure = false; // okay, definitely a boolean
```

在对现有代码进行改写的时候，`any`类型是十分有用的，它允许你在编译时可选择地包含或移除类型检查。

当你只知道数据的类型的一部分时，`any`类型也是有用的。
比如，你有一个数组，它包含了不同的数据类型：

```TypeScript
var list: any[] = [1, true, "free"];

list[1] = 100;
```

# 空值

某种程度上来说，`void`类型与`any`类型是相反的，它表示没有任何类型。
当一个函数没有返回值时，你通常会见到其返回值类型是`void`：

```TypeScript
function warnUser(): void {
    alert("This is my warning message");
}
```
