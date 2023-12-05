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

## 稳定支持 `import type` 上的 `resolution-mode`

TypeScript 4.7 在 `/// <reference types="..." />` 里支持了 `resolution-mode` 属性，
它用来控制一个描述符是使用 `import` 还是 `require` 语义来解析。

```ts
/// <reference types="pkg" resolution-mode="require" />

// or

/// <reference types="pkg" resolution-mode="import" />
```

在 type-only 导入上，导入断言也引入了相应的字段；
然而，它仅在 TypeScript 的夜间版本中得到支持
其原因是在精神上，导入断言并不打算指导模块解析。
因此，这个特性以实验性的方式仅在夜间版本中发布，以获得更多的反馈。

但是，导入属性（Import Attributes）可以指导解析，并且我们也已经看到了有意义的用例，
TypeScript 5.3 在 `import type` 上支持了 `resolution-mode`。

```ts
// Resolve `pkg` as if we were importing with a `require()`
import type { TypeFromRequire } from "pkg" with {
    "resolution-mode": "require"
};

// Resolve `pkg` as if we were importing with an `import`
import type { TypeFromImport } from "pkg" with {
    "resolution-mode": "import"
};

export interface MergedType extends TypeFromRequire, TypeFromImport {}
```

这些导入属性也可以用在 `import()` 类型上。

```ts
export type TypeFromRequire =
    import("pkg", { with: { "resolution-mode": "require" } }).TypeFromRequire;

export type TypeFromImport =
    import("pkg", { with: { "resolution-mode": "import" } }).TypeFromImport;

export interface MergedType extends TypeFromRequire, TypeFromImport {}
```

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/55725)。

## 在所有模块模式中支持 `resolution-mode`

此前，仅在 `moduleResolution` 为 `node16` 和 `nodenext` 时支持 `resolution-mode`。
为了使查找模块更容易，尤其针对类型，`resolution-mode` 现在可以在所有其它的 `moduleResolution` 选项下工作，例如 `bundler`、`node10`，甚至在 `classic` 下也不报错。

更多详情，请参考[PR](https://github.com/microsoft/TypeScript/pull/55725)。
