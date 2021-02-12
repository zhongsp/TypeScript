# TypeScript 2.5

## 可选的`catch`语句变量

得益于[@tinganho](https://github.com/tinganho)所做的工作，TypeScript 2.5实现了一个新的ECMAScript特性，允许用户省略`catch`语句中的变量。 例如，当使用`JSON.parse`时，你可能需要将对应的函数调用放在`try` / `catch`中，但是最后可能并不会用到输入有误时会抛出的`SyntaxError`（语法错误）。

```typescript
let input = "...";
try {
    JSON.parse(input);
}
catch {
    // ^ 注意我们的 `catch` 语句并没有声明一个变量
    console.log("传入的 JSON 不合法\n\n" + input)
}
```

## `checkJs`/`@ts-check` 模式中的类型断言/转换语法

TypeScript 2.5 引入了在[使用纯 JavaScript 的项目中断言表达式类型](https://github.com/Microsoft/TypeScript/issues/5158)的能力。对应的语法是`/** @type {...} */`标注注释后加上被圆括号括起来，类型需要被重新演算的表达式。举例:

```typescript
var x = /** @type {SomeType} */ (AnyParenthesizedExpression);
```

## 包去重和重定向

在 TypeScript 2.5 中使用`Node`模块解析策略进行导入时，编译器现在会检查文件是否来自 "相同" 的包。如果一个文件所在的包的`package.json`包含了与之前读取的包相同的`name`和`version`，那么TypeScript会将它重定向到最顶层的包。这可以解决两个包可能会包含相同的类声明，但因为包含`private`成员导致他们在结构上不兼容的问题.

这也带来一个额外的好处，可以通过避免从重复的包中加载`.d.ts`文件减少内存使用和编译器及语言服务的运行时计算.

## `--preserveSymlinks`（保留符号链接）编译器选项

TypeScript 2.5带来了`preserveSymlinks`选项，它对应了[Node.js 中 `--preserve-symlinks`选项](https://nodejs.org/api/cli.html#cli_preserve_symlinks)的行为。这一选项也会带来和Webpack的`resolve.symlinks`选项相反的行为（也就是说，将TypeScript的`preserveSymlinks`选项设置为`true`对应了将Webpack的`resolve.symlinks`选项设为`false`，反之亦然）。

在这一模式中，对于模块和包的引用（比如`import`语句和`/// <reference type=".." />`指令）都会以相对符号链接文件的位置被解析，而不是相对于符号链接解析到的路径。更具体的例子，可以参考[Node.js网站的文档](https://nodejs.org/api/cli.html#cli_preserve_symlinks)。

