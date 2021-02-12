# TypeScript 2.6

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.6%22+label%3A%22Breaking+Change%22+is%3Aclosed).

## 只写引用未使用

以下代码用于没有编译错误:

```typescript
function f(n: number) {
    n = 0;
}

class C {
    private m: number;
    constructor() {
        this.m = 0;
    }
}
```

现在，当启用`--noUnusedLocals`和`--noUnusedParameters`[编译器选项](https://www.typescriptlang.org/docs/handbook/compiler-options.html)时，`n`和`m`都将被标记为未使用，因为它们的值永远不会被_读_ 。以前TypeScript只会检查它们的值是否被_引用_。

此外，仅在其自己的实体中调用的递归函数被视为未使用。

```typescript
function f() {
    f(); // Error: 'f' is declared but its value is never read
}
```

## 环境上下文中的导出赋值中禁止使用任意表达式

以前，像这样的结构

```typescript
declare module "foo" {
    export default "some" + "string";
}
```

在环境上下文中未被标记为错误。声明文件和环境模块中通常禁止使用表达式，因为`typeof`之类的意图不明确，因此这与我们在这些上下文中的其他地方处理可执行代码不一致。现在，任何不是标识符或限定名称的内容都会被标记为错误。为具有上述值形状的模块制作DTS的正确方法如下：

```typescript
declare module "foo" {
    const _default: string;
    export default _default;
}
```

编译器已经生成了这样的定义，因此这只应该是手工编写的定义的问题。

