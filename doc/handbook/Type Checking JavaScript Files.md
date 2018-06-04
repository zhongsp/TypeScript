TypeScript 2.3以后的版本支持使用`--checkJs`对`.js`文件进行类型检查并提示错误的模式。

你可以通过添加`// @ts-nocheck`注释来忽略类型检查；相反你可以通过去掉`--checkJs`设置并添加`// @ts-check`注释来选则检查某些`.js`文件。
你还可以使用`// @ts-ignore`来忽略本行的错误。

下面是一些值得注意的类型检查在`.js`文件与`.ts`文件上的差异：

## 在JSDoc上使用类型

`.js`文件里，类型可以和在`.ts`文件里一样被推断出来。
同样地，当类型不能被推断时，它们可以通过JSDoc来指定，就好比在`.ts`文件里那样。

JSDoc注解修饰的声明会被设置为这个声明的类型。比如：

```js
/** @type {number} */
var x;

x = 0;      // OK
x = false;  // Error: boolean is not assignable to number
```

你可以在这里找到所有JSDoc支持的模式，[JSDoc文档](https://github.com/Microsoft/TypeScript/wiki/JSDoc-support-in-JavaScript)。

## 从类内部赋值语句推断属性声明

ES2015/ES6不存在类属性的声明。属性是动态的赋予的，就如同对象字面量一样。

在`.js`文件里，属性声明是由类内部的属性赋值语句推断出来的。属性的类型是赋值语句右侧所有值的联合。构造函数里定义的属性是永远存在的，在方法存取器里定义的被认为是可选的。

使用JSDoc修饰属性赋值来指定属性类型。例如：

```js
class C {
  constructor() {
    /** @type {number | undefined} */
    this.prop = undefined;

  }
}


let c = new C();
c.prop = 0;         // OK
c.prop = "string";  // Error: string is not assignable to number|undefined
```

如果属性永远都不在类的内部被设置，那么它们被当成是未知的。如果类具有只读的属性，考虑在构造函数里给它初始化成`undefined`，例如`this.prop = undefined;`。

## CommonJS模块输入支持

`.js`文件支持将CommonJS模块做为输入模块格式。对`exports`和`module.exports`的赋值被识别为导出声明。
相似地，`require`函数调用被识别为模块导入。例如：

```ts
// Import module "fs"
const fs = require("fs");


// Export function readFile
module.exports.readFile = function(f) {
  return fs.readFileSync(f);
}
```

## 对象字面量是开放的

默认地，变量声明中的对象字面量本身就提供了类型声明。新的成员不能被加到对象中去。
这个规则在`.js`文件里被放宽了；对象字面量具有开放的类型，允许添加并访问原先没有定义的属性。例如：

```js
var obj = { a: 1 };
obj.b = 2;  // Allowed
```

对象字面量具有默认的索引签名`[x:string]: any`，它们可以被当成开放的映射而不是封闭的对象。

与其它JS检查行为相似，这种行为可以通过指定JSDoc类型来改变，例如：

```js
/** @type {{a: number}} */
var obj = { a: 1 };
obj.b = 2;  // Error, type {a: number} does not have property b
```

## 函数参数是默认可选的

由于JS不支持指定可选参数（不指定一个默认值），`.js`文件里所有函数参数都被当做可选的。使用比预期少的参数调用函数是允许的。

需要注意的一点是，使用过多的参数调用函数会得到一个错误。

例如：

```js
function bar(a, b){
  console.log(a + " " + b);
}

bar(1);       // OK, second argument considered optional
bar(1, 2);
bar(1, 2, 3); // Error, too many arguments
```

使用JSDoc注解的函数会被从这条规则里移除。使用JSDoc可选参数语法来表示可选性。比如：

```js
/**
 * @param {string} [somebody] - Somebody's name.
 */
function sayHello(somebody) {
    if (!somebody) {
        somebody = "John Doe";
    }
    console.log("Hello " + somebody);
}

sayHello();
```

## 由`arguments`推断出的var-args参数声明

如果一个函数的函数体内有对`arguments`的引用，那么这个函数会隐式地被认为具有一个var-arg参数（比如:`(...arg: any[]) => any`)）。使用JSDoc的var-arg语法来指定`arguments`的类型。

## 未指定的类型参数默认为`any`

未指定的泛型参数类型将默认为`any`。有如下几种情形：

#### 在extends语句中

例如，`React.Component`被定义成具有两个泛型参数，`Props`和`State`。
在一个`.js`文件里，没有一个合法的方式在extends语句里指定它们。默认地参数类型为`any`：

```js
import { Component } from "react";

class MyComponent extends Component {
    render() {
        this.props.b; // Allowed, since this.props is of type any
    }
}
```

使用JSDoc的`@augments`来明确地指定类型。例如：

```js
import { Component } from "react";

/**
 * @augments {Component<{a: number}, State>}
 */
class MyComponent extends Component {
    render() {
        this.props.b; // Error: b does not exist on {a:number}
    }
}
```

#### 在JSDoc引用中

JSDoc里未指定的泛型参数默认为`any`：

```js
/** @type{Array} */
var x = [];

x.push(1);        // OK
x.push("string"); // OK, x is of type Array<any>


/** @type{Array.<number>} */
var y = [];

y.push(1);        // OK
y.push("string"); // Error, string is not assignable to number

```

#### 在函数调用中

泛型函数的调用使用`arguments`来推断泛型参数。有时候，这个流程不能够推断出类型，大多是因为缺少推断的源；在这种情况下，泛型参数类型默认为`any`。例如：

```js
var p = new Promise((resolve, reject) => { reject() });

p; // Promise<any>;
```
