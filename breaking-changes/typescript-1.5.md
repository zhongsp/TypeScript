# TypeScript 1.5

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+1.5%22+label%3A%22breaking+change%22)。

## 不允许在箭头函数里引用`arguments`

这是为了遵循ES6箭头函数的语义。之前箭头函数里的`arguments`会绑定到箭头函数的参数。参照[ES6规范草稿](http://wiki.ecmascript.org/doku.php?id=harmony:specification_drafts) 9.2.12，箭头函数不存在`arguments`对象。 从TypeScript 1.5开始，在箭头函数里使用`arguments`会被标记成错误以确保你的代码转成ES6时没语义上的错误。

**例子：**

```typescript
function f() {
    return () => arguments; // Error: The 'arguments' object cannot be referenced in an arrow function.
}
```

**推荐：**

```typescript
// 1. 使用带名字的剩余参数
function f() {
    return (...args) => { args; }
}

// 2. 使用函数表达式
function f() {
    return function(){ arguments; }
}
```

## 内联枚举引用的改动

对于正常的枚举，在1.5之前，编译器_仅会_内联常量成员，且成员仅在使用字面量初始化时才被当做是常量。这在判断检举值是使用字面量初始化还是表达式时会行为不一致。从TypeScript 1.5开始，所有非const枚举成员都不会被内联。

**例子：**

```typescript
var x = E.a;  // previously inlined as "var x = 1; /*E.a*/"

enum E {
   a = 1
}
```

**推荐：** 在枚举声明里添加`const`修饰符来确保它总是被内联。 更多信息，查看[\#2183](https://github.com/Microsoft/TypeScript/issues/2183)。

## 上下文的类型将作用于`super`和括号表达式

在1.5之前，上下文的类型不会作用于括号表达式内部。这就要求做显示的类型转换，尤其是在_必须_使用括号来进行表达式转换的场合。

在下面的例子里，`m`具有上下文的类型，它在之前的版本里是没有的。

```typescript
var x: SomeType = (n) => ((m) => q);
var y: SomeType = t ? (m => m.length) : undefined;

class C extends CBase<string> {
    constructor() {
        super({
            method(m) { return m.length; }
        });
    }
}
```

更多信息，查看[\#1425](https://github.com/Microsoft/TypeScript/issues/1425)和[\#920](https://github.com/Microsoft/TypeScript/issues/920)。

## DOM接口的改动

TypeScript 1.5改进了`lib.d.ts`库里的DOM类型。这是自TypeScript 1.0以来第一次大的改动；为了拥抱标准DOM规范，很多特定于IE的定义被移除了，同时添加了新的类型如Web Audio和触摸事件。

**变通方案：**

你可以使用旧的`lib.d.ts`配合新版本的编译器。你需要在你的工程里引入之前版本的一个拷贝。这里是[本次改动之前的lib.d.ts文件\(TypeScript 1.5-alpha\)](https://github.com/Microsoft/TypeScript/blob/v1.5.0-alpha/bin/lib.d.ts)。

**变动列表：**

* 属性`selection`从`Document`类型上移除
* 属性`clipboardData`从`Window`类型上移除
* 删除接口`MSEventAttachmentTarget`
* 属性`onresize`，`disabled`，`uniqueID`，`removeNode`，`fireEvent`，`currentStyle`，`runtimeStyle`从`HTMLElement`类型上移除
* 属性`url`从`Event`类型上移除
* 属性`execScript`，`navigate`，`item`从`Window`类型上移除
* 属性`documentMode`，`parentWindow`，`createEventObject`从`Document`类型上移除
* 属性`parentWindow`从`HTMLDocument`类型上移除
* 属性`setCapture`被完全移除
* 属性`releaseCapture`被完全移除
* 属性`setAttribute`，`styleFloat`，`pixelLeft`从`CSSStyleDeclaration`类型上移除
* 属性`selectorText`从`CSSRule`类型上移除
* `CSSStyleSheet.rules`现在是`CSSRuleList`类型，而非`MSCSSRuleList`
* `documentElement`现在是`Element`类型，而非`HTMLElement`
* `Event`具有一个新的必需属性`returnValue`
* `Node`具有一个新的必需属性`baseURI`
* `Element`具有一个新的必需属性`classList`
* `Location`具有一个新的必需属性`origin`
* 属性`MSPOINTER_TYPE_MOUSE`，`MSPOINTER_TYPE_TOUCH`从`MSPointerEvent`类型上移除
* `CSSStyleRule`具有一个新的必需属性`readonly`
* 属性`execUnsafeLocalFunction`从`MSApp`类型上移除
* 全局方法`toStaticHTML`被移除
* `HTMLCanvasElement.getContext`现在返回`CanvasRenderingContext2D | WebGLRenderingContex`
* 移除扩展类型`Dataview`，`Weakmap`，`Map`，`Set`
* `XMLHttpRequest.send`具有两个重载`send(data?: Document): void;`和`send(data?: String): void;`
* `window.orientation`现在是`string`类型，而非`number`
* 特定于IE的`attachEvent`和`detachEvent`从`Window`上移除

**以下是被新加的DOM类型所部分或全部取代的代码库的代表：**

* `DefinitelyTyped/auth0/auth0.d.ts`
* `DefinitelyTyped/gamepad/gamepad.d.ts`
* `DefinitelyTyped/interactjs/interact.d.ts`
* `DefinitelyTyped/webaudioapi/waa.d.ts`
* `DefinitelyTyped/webcrypto/WebCrypto.d.ts`

更多信息，查看[完整改动](https://github.com/Microsoft/TypeScript/pull/2739)。

## 类代码体将以严格格式解析

按照[ES6规范](http://www.ecma-international.org/ecma-262/6.0/#sec-strict-mode-code)，类代码体现在以严格模式进行解析。行为将相当于在类作用域顶端定义了`"use strict"`；它包括限制了把`arguments`和`eval`做为变量名或参数名的使用，把未来保留字做为变量或参数使用，八进制数字字面量的使用等。

