# TypeScript手册

[TypeScript Handbook](http://www.typescriptlang.org/Handbook)

## 基本类型

为了写出有用的程序, 我们需要有能力去处理简单的数据单位: 数字, 字符串, 结构, 布尔值等. 在TypeScript里, 包含了JavaScript中几乎相同的数据类型, 还有便于我们处理的枚举类型.

### Boolean

最基本的数据类型就是true/false值, 在JavaScript和TypeScript里叫做布尔值.

```typescript
var isDone: boolean = false;
```

### Number

与JavaScript一样, 所有的数字在TypeScript里都是浮点数. 它们的类型是'number'.

```typescript
var height: number = 6;
```

### String

像其它语言里一样, 我们使用'string'表示文本数据类型. 与JavaScript里一样, 可以使用双引号(")或单引号(')表示字符串.

```typescript
var name: string = "bob";
name = 'smith';
```

