# TypeScript 1.4

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+1.4%22+label%3A%22breaking+change%22)。

阅读[issue \#868](https://github.com/Microsoft/TypeScript/issues/868)以了解更多关于联合类型的破坏性改动。

## 多个最佳通用类型候选

当有多个最佳通用类型可用时，现在编译器会做出选择（依据编译器的具体实现）而不是直接使用第一个。

```typescript
var a: { x: number; y?: number };
var b: { x: number; z?: number };

// 之前 { x: number; z?: number; }[]
// 现在 { x: number; y?: number; }[]
var bs = [b, a];
```

这会在多种情况下发生。具有一组共享的必需属性和一组其它互斥的（可选或其它）属性，空类型，兼容的签名类型（包括泛型和非泛型签名，当类型参数上应用了`any`时）。

**推荐** 使用类型注解指定你要使用的类型。

```typescript
var bs: { x: number; y?: number; z?: number }[] = [b, a];
```

## 泛型接口

当在多个T类型的参数上使用了不同的类型时会得到一个错误，就算是添加约束也不行：

```typescript
declare function foo<T>(x: T, y:T): T;
var r = foo(1, ""); // r used to be {}, now this is an error
```

添加约束：

```typescript
interface Animal { x }
interface Giraffe extends Animal { y }
interface Elephant extends Animal { z }
function f<T extends Animal>(x: T, y: T): T { return undefined; }
var g: Giraffe;
var e: Elephant;
f(g, e);
```

在这里查看[详细解释](https://github.com/Microsoft/TypeScript/pull/824#discussion_r18665727)。

**推荐** 如果这种不匹配的行为是故意为之，那么明确指定类型参数：

```typescript
var r = foo<{}>(1, ""); // Emulates 1.0 behavior
var r = foo<string|number>(1, ""); // Most useful
var r = foo<any>(1, ""); // Easiest
f<Animal>(g, e);
```

_或_重写函数定义指明就算不匹配也没问题：

```typescript
declare function foo<T,U>(x: T, y:U): T|U;
function f<T extends Animal, U extends Animal>(x: T, y: U): T|U { return undefined; }
```

## 泛型剩余参数

不能再使用混杂的参数类型：

```typescript
function makeArray<T>(...items: T[]): T[] { return items; }
var r = makeArray(1, ""); // used to return {}[], now an error
```

`new Array(...)`也一样

**推荐** 声明向后兼容的签名，如果1.0的行为是你想要的：

```typescript
function makeArray<T>(...items: T[]): T[];
function makeArray(...items: {}[]): {}[];
function makeArray<T>(...items: T[]): T[] { return items; }
```

## 带类型参数接口的重载解析

```typescript
var f10: <T>(x: T, b: () => (a: T) => void, y: T) => T;
var r9 = f10('', () => (a => a.foo), 1); // r9 was any, now this is an error
```

**推荐** 手动指定一个类型参数

```typescript
var r9 = f10<any>('', () => (a => a.foo), 1);
```

## 类声明与类型表达式以严格模式解析

ECMAScript 2015语言规范\(ECMA-262 6th Edition\)指明_ClassDeclaration_和_ClassExpression_使用严格模式。 因此，在解析类声明或类表达式时将使用额外的限制。

例如：

```typescript
class implements {}  // Invalid: implements is a reserved word in strict mode
class C {
    foo(arguments: any) {   // Invalid: "arguments" is not allow as a function argument
        var eval = 10;      // Invalid: "eval" is not allowed as the left-hand-side expression
        arguments = [];     // Invalid: arguments object is immutable
    }
}
```

关于严格模式限制的完整列表，请阅读 Annex C - The Strict Mode of ECMAScript of ECMA-262 6th Edition。

