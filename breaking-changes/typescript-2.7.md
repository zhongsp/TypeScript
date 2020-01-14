# TypeScript 2.7

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.7%22+label%3A%22Breaking+Change%22+is%3Aclosed).

## 元组现在具有固定长度的属性

以下代码用于没有编译错误：

```typescript
var pair: [number, number] = [1, 2];
var triple: [number, number, number] = [1, 2, 3];
pair = triple;
```

但是，这_是_一个错误：

```typescript
triple = pair;
```

现在，相互赋值是一个错误。 这是因为元组现在有一个长度属性，其类型是它们的长度。 所以`pair.length: 2`，但是`triple.length: 3`。

请注意，之前允许某些非元组模式，但现在不再允许：

```typescript
const struct: [string, number] = ['key'];
for (const n of numbers) {
  struct.push(n);
}
```

对此最好的解决方法是创建扩展Array的自己的类型：

```typescript
interface Struct extends Array<string | number> {
  '0': string;
  '1'?: number;
}
const struct: Struct = ['key'];
for (const n of numbers) {
  struct.push(n);
}
```

## 在`allowSyntheticDefaultImports`下，对于TS和JS文件来说默认导入的类型合成不常见

在过去，我们在类型系统中合成一个默认导入，用于TS或JS文件，如下所示：

```typescript
export const foo = 12;
```

意味着模块的类型为`{foo: number, default: {foo: number}}`。 这是错误的，因为文件将使用`__esModule`标记发出，因此在加载文件时没有流行的模块加载器会为它创建合成默认值，并且类型系统推断的`default`成员永远不会在运行时存在。现在我们在`ESModuleInterop`标志下的发出中模拟了这个合成默认行为，我们收紧了类型检查器的行为，以匹配你期望在运行时所看到的内容。如果运行时没有其他工具的介入，此更改应仅指出错误的错误默认导入用法，应将其更改为命名空间导入。

## 更严格地检查索引访问泛型类型约束

以前，仅当类型具有索引签名时才计算索引访问类型的约束，否则它是`any`。这样就可以取消选中无效赋值。在TS 2.7.1中，编译器在这里有点聪明，并且会将约束计算为此处所有可能属性的并集。

```typescript
interface O {
    foo?: string;
}

function fails<K extends keyof O>(o: O, k: K) {
    var s: string = o[k]; // Previously allowed, now an error
                          // string | undefined is not assignable to a string
}
```

## `in`表达式被视为类型保护

对于`n in x`表达式，其中`n`是字符串文字或字符串文字类型而`x`是联合类型，"true"分支缩小为具有可选或必需属性`n`的类型，并且 "false"分支缩小为具有可选或缺少属性`n`的类型。 如果声明类型始终具有属性`n`，则可能导致在false分支中将变量的类型缩小为`never`的情况。

```typescript
var x: { foo: number };

if ("foo" in x) {
    x; // { foo: number }
}
else {
    x; // never
}
```

## 在条件运算符中不减少结构上相同的类

以前在结构上相同的类在条件或`||`运算符中被简化为最佳公共类型。现在这些类以联合类型维护，以便更准确地检查`instanceof`运算符。

```typescript
class Animal {

}

class Dog {
    park() { }
}

var a = Math.random() ? new Animal() : new Dog();
// typeof a now Animal | Dog, previously Animal
```

## `CustomEvent`现在是一个泛型类型

`CustomEvent`现在有一个`details`属性类型的类型参数。如果要从中扩展，则需要指定其他类型参数。

```typescript
class MyCustomEvent extends CustomEvent {
}
```

应该成为

```typescript
class MyCustomEvent extends CustomEvent<any> {
}
```

