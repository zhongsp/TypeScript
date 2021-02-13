# 最佳实践

## 常规类型

### `Number`，`String`，`Boolean`，`Symbol`和`Object`

*不要*使用以下类型`Number`，`String`，`Boolean`，`Symbol`或`Object`。
这些类型表示是非原始的封箱后的对象类型，它们几乎没有在 JavaScript 代码里被正确地使用过。

```ts
/* 错误 */
function reverse(s: String): String;
```

*应该*使用`number`，`string`，`boolean`和`symbol`类型。

```ts
/* 正确 */
function reverse(s: string): string;
```

使用非原始的`object`类型来代替`Object`类型（[在 TypeScript 2.2 中新增](../release-notes/typeScript-2.2.md#object类型)）

### 泛型

*不要*定义没有使用过类型参数的泛型类型。
更多详情请参考：[TypeScript FAQ page](https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-type-inference-work-on-this-interface-interface-foot---)。

### any

请尽量不要使用`any`类型，除非你正在将 JavaScript 代码迁移到 TypeScript 代码。
编译器实际上会将`any`视作“对其关闭类型检查”。
使用它与在每个变量前使用`@ts-ignore`注释是一样的。
它只在首次将 JavaScript 工程迁移到 TypeScript 工程时有用，因为你可以把还没有迁移完的实体标记为`any`类型，但在完整的 TypeScript 工程中，这样做就会禁用掉类型检查。

如果你不清楚要接收什么类型的数据，或者你希望接收任意类型并直接向下传递而不使用它，那么就可以使用[`unknown`](../handbook/basic-types.md#unknown)类型。

## 回调函数类型

### 回调函数的返回值类型

*不要*为返回值会被忽略的回调函数设置返回值类型`any`：

```ts
/* 错误 */
function fn(x: () => any) {
    x();
}
```

*应该*为返回值会被忽略的回调函数设置返回值类型`void`：

```ts
/* 正确 */
function fn(x: () => void) {
    x();
}
```

_原因_：使用`void`相对安全，因为它能防止不小心使用了未经检查的`x`的返回值：

```ts
function fn(x: () => void) {
    var k = x(); // oops! meant to do something else
    k.doSomething(); // error, but would be OK if the return type had been 'any'
}
```

### 回调函数里的可选参数

*不要*在回调函数里使用可选参数，除非这是你想要的：

```ts
/* 错误 */
interface Fetcher {
    getObject(done: (data: any, elapsedTime?: number) => void): void;
}
```

这里有具体的意义：`done`回调函数可以用 1 个参数或 2 个参数调用。
代码的大意是说该回调函数不关注是否有`elapsedTime`参数， 但是不需要把这个参数定义为可选参数来达到此目的 --
因为总是允许提供一个接收较少参数的回调函数。

*应该*将回调函数定义为无可选参数：

```ts
/* 正确 */
interface Fetcher {
    getObject(done: (data: any, elapsedTime: number) => void): void;
}
```

### 重载与回调函数

*不要*因回调函数的参数数量不同而编写不同的重载。

```ts
/* WRONG */
declare function beforeAll(action: () => void, timeout?: number): void;
declare function beforeAll(
    action: (done: DoneFn) => void,
    timeout?: number
): void;
```

*应该*只为最大数量参数的情况编写一个重载：

```ts
/* 正确 */
declare function beforeAll(
    action: (done: DoneFn) => void,
    timeout?: number
): void;
```

_原因_：回调函数总是允许忽略某个参数的，因此没必要为缺少可选参数的情况编写重载。
为缺少可选参数的情况提供重载可能会导致类型错误的回调函数被传入，因为它会匹配到第一个重载。

## 函数重载

### 顺序

*不要*把模糊的重载放在具体的重载前面：

```ts
/* 错误 */
declare function fn(x: any): any;
declare function fn(x: HTMLElement): number;
declare function fn(x: HTMLDivElement): string;

var myElem: HTMLDivElement;
var x = fn(myElem); // x: any, wat?
```

*应该*将重载排序，把具体的排在模糊的之前：

```ts
/* 正确 */
declare function fn(x: HTMLDivElement): string;
declare function fn(x: HTMLElement): number;
declare function fn(x: any): any;

var myElem: HTMLDivElement;
var x = fn(myElem); // x: string, :)
```

_原因_：当解析函数调用的时候，TypeScript 会选择*匹配到的第一个重载*。
当位于前面的重载比后面的“更模糊”，那么后面的会被隐藏且不会被选用。

### 使用可选参数

*不要*因为只有末尾参数不同而编写不同的重载：

```ts
/* WRONG */
interface Example {
    diff(one: string): number;
    diff(one: string, two: string): number;
    diff(one: string, two: string, three: boolean): number;
}
```

*应该*尽可能使用可选参数：

```ts
/* OK */
interface Example {
    diff(one: string, two?: string, three?: boolean): number;
}
```

注意，这只在返回值类型相同的情况是没问题的。

_原因_：有以下两个重要原因。

TypeScript 解析签名兼容性时会查看是否某个目标签名能够使用原参数调用，
_且允许额外的参数_。
下面的代码仅在签名被正确地使用可选参数定义时才会暴露出一个 bug：

```ts
function fn(x: (a: string, b: number, c: number) => void) {}
var x: Example;
// When written with overloads, OK -- used first overload
// When written with optionals, correctly an error
fn(x.diff);
```

第二个原因是当使用了 TypeScript “严格检查 null” 的特性时。
因为未指定的参数在 JavaScript 里表示为`undefined`，通常明确地为可选参数传入一个`undefined`不会有问题。
这段代码在严格 `null` 模式下可以工作：

```ts
var x: Example;
// When written with overloads, incorrectly an error because of passing 'undefined' to 'string'
// When written with optionals, correctly OK
x.diff("something", true ? undefined : "hour");
```

### 使用联合类型

*不要*仅因某个特定位置上的参数类型不同而定义重载：

```ts
/* 错误 */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number): Moment;
  utcOffset(b: string): Moment;
}
```

*应该*尽可能地使用联合类型：

```ts
/* 正确 */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number | string): Moment;
}
```

注意，我们没有让`b`成为可选的，因为签名的返回值类型不同。

_原因_：这对于那些为该函数传入了值的使用者来说很重要。

```ts
function fn(x: string): void;
function fn(x: number): void;
function fn(x: number | string) {
  // When written with separate overloads, incorrectly an error
  // When written with union types, correctly OK
  return moment().utcOffset(x);
}
```
