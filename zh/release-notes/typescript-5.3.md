# TypeScript 5.3

## 导入属性（Import Attributes）

TypeScript 5.3 支持了最新的 [import attributes](https://github.com/tc39/proposal-import-attributes) 提案。

该特性的一个用例是为运行时提供期望的模块格式信息。

```ts
// We only want this to be interpreted as JSON,
// not a runnable/malicious JavaScript file with a `.json` extension.
import obj from "./something.json" with { type: "json" };
```

TypeScript 不会检查属性内容，因为它们是宿主环境相关的。
TypeScript 会原样保留它们，浏览器和运行时会处理它们。

```ts
// TypeScript is fine with this.
// But your browser? Probably not.
import * as foo from "./foo.js" with { type: "fluffy bunny" };
```

动态的 `import()` 调用也可以在第二个参数里使用该特性。

```ts
const obj = await import('./something.json', {
  with: { type: 'json' },
});
```

第二个参数的期望类型为 `ImportCallOptions`，默认只支持一个名为 `with` 的属性。

请注意，导入属性是之前提案[“导入断言”](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/#import-assertions)的演进，该提案已在 TypeScript 4.5 中实现。
最明显的区别是使用`with`关键字而不是`assert`关键字。
但不太明显的区别是，现在运行时可以自由地使用属性来指导导入路径的解析和解释，而导入断言只能在加载模块后断言某些特性。

随着时间的推移，TypeScript 将逐渐弃用旧的导入断言语法，转而采用导入属性的提议语法。现有的使用`assert`的代码应该迁移到`with`关键字。而需要导入属性的新代码应该完全使用`with`关键字。

感谢 Oleksandr Tarasiuk 实现了这个功能！
也感谢 Wenlu Wang 实现了 import assertions!
