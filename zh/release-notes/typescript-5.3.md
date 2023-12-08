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

## `switch (true)` 类型细化

TypeScript 5.3 会针对 `switch (true)` 里的每一个 `case` 条件进行类型细化。

```ts
function f(x: unknown) {
  switch (true) {
    case typeof x === 'string':
      // 'x' is a 'string' here
      console.log(x.toUpperCase());
    // falls through...

    case Array.isArray(x):
      // 'x' is a 'string | any[]' here.
      console.log(x.length);
    // falls through...

    default:
    // 'x' is 'unknown' here.
    // ...
  }
}
```

感谢 Mateusz Burzyński 的[贡献](https://github.com/microsoft/TypeScript/pull/55991)。

## 类型细化与布尔值的比较

有时，您可能会发现自己在条件语句中直接与 `true` 或 `false` 进行比较。
通常情况下，这些比较是不必要的，但您可能出于风格上的考虑或为了避免 JavaScript 中真值相关的某些问题而偏好这样做。
不过，之前 TypeScript 在进行类型细化时并不识别这样的形式。

TypeScript 5.3 在类型细化时可以理解这类表达式。

```ts
interface A {
    a: string;
}

interface B {
    b: string;
}

type MyType = A | B;

function isA(x: MyType): x is A {
    return "a" in x;
}

function someFn(x: MyType) {
    if (isA(x) === true) {
        console.log(x.a); // works!
    }
}
```

感谢 Mateusz Burzyński 的 [PR](https://github.com/microsoft/TypeScript/pull/53681)。

## 利用 `Symbol.hasInstance` 来细化 `instanceof`

JavaScript 的一个稍微晦涩的特性是可以覆盖 `instanceof` 运算符的行为。
为此，`instanceof` 运算符右侧的值需要具有一个名为 `Symbol.hasInstance` 的特定方法。

```ts
class Weirdo {
    static [Symbol.hasInstance](testedValue) {
        // wait, what?
        return testedValue === undefined;
    }
}

// false
console.log(new Thing() instanceof Weirdo);

// true
console.log(undefined instanceof Weirdo);
```

为了更好地支持 `instanceof` 的行为，TypeScript 现在会检查是否存在 `[Symbol.hasInstance]` 方法且被定义为类型判定函数。
如果有的话，`instanceof` 运算符左侧的值会按照类型判定进行细化。

```ts
interface PointLike {
    x: number;
    y: number;
}

class Point implements PointLike {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceFromOrigin() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    static [Symbol.hasInstance](val: unknown): val is PointLike {
        return !!val && typeof val === "object" &&
            "x" in val && "y" in val &&
            typeof val.x === "number" &&
            typeof val.y === "number";
    }
}


function f(value: unknown) {
    if (value instanceof Point) {
        // Can access both of these - correct!
        value.x;
        value.y;

        // Can't access this - we have a 'PointLike',
        // but we don't *actually* have a 'Point'.
        value.distanceFromOrigin();
    }
}
```

能够看到例子中，`Point` 定义了自己的 `[Symbol.hasInstance]` 方法。
它实际上充当了对称为 `PointLike` 的单独类型的自定义类型保护。
在函数 `f` 中，我们能够使用 `instanceof` 将 `value` 细化为 `PointLike`，但不能细化到 `Point`。
这意味着我们可以访问属性 `x` 和 `y`，但无法访问 `distanceFromOrigin` 方法。

更多详情请参考[PR](https://github.com/microsoft/TypeScript/pull/55052)。
