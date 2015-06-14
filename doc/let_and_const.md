# 支持let和const

Version 1.4

增加了对ES6块级作用域变量声明的支持，只在`target`为`ES6`时生效，同时也增加了一个新的`target`为`ES6`。

声明包含两种形式，`let`和`const`。总的来说，除了下面列出的情况之外，`let`和`const`与`var`声明大体相同。

* `let`和`const`都不能被重覆声明：

```ts
let a = 0;
a = 1;
let a;  // 错误：重覆声明
```

* 不允许使用`var`重新定义一个块级作用域变量：

```ts
let a = 0;
{
    var a;  // 错误：重覆定义。var会因变量提升而被提升到作用域顶端，因此重覆定义了a
}
```

* 不能在没有被“括起”的语句中使用`let`和`const`

```ts
if (true) {
    let a = 0;  // 可以
}

if (false)
    let b = 0; // 错误

for (let i = 0; i < 10; i++)  // 可以
    console.log(i);
```

* `let`和`const`是属于块级作用域的，不会像其它一些JS声明一样会被提升到函数顶部

```ts
let a = 0;
{
    let a = "local";
    console.log(a);  // local
}
console.log(a);  // 0
```

* `let`和`const`不能在声明之前使用，避免`var`会出现的词法空白区域

```ts
v = 2;  // OK
var v;

a = 2;
let a;  // 错误，在声明之前使用了
```

* `const`声明必须被直接初始化，除非是在外部上下文中

* 对`const`重新赋值被发生错误

```ts
const c = 0;
console.log(c);  // OK: 0

c = 2;  // 错误
c++;    // 错误

{
    const c2 = 0;
    var c2 = 0;  // 不是重覆定义，因为var会发生变量提升，但仍然属于对c2的重新赋值
}
```

* `let`和`const`不能被导出，只有`var`可以
