# TypeScript 2.9

## `keyof`和映射类型支持用`number`和`symbol`命名的属性

TypeScript 2.9增加了在索引类型和映射类型上支持用`number`和`symbol`命名属性。 在之前，`keyof`操作符和映射类型只支持`string`命名的属性。

改动包括：

* 对某些类型`T`，索引类型`keyof T`是`string | number | symbol`的子类型。
* 映射类型`{ [P in K]: XXX }`，其中`K`允许是可以赋值给`string | number | symbol`的任何值。
* 针对泛型`T`的对象的`for...in`语句，迭代变量推断类型之前为`keyof T`，现在是`Extract<keyof T, string>`。（换句话说，是`keyof T`的子集，它仅包含类字符串的值。）

对于对象类型`X`，`keyof X`将按以下方式解析：

* 如果`X`带有字符串索引签名，则`keyof X`为`string`，`number`和表示symbol-like属性的字面量类型的联合，否则
* 如果`X`带有数字索引签名，则`keyof X`为`number`和表示string-like和symbol-like属性的字面量类型的联合，否则
* `keyof X`为表示string-like，number-like和symbol-like属性的字面量类型的联合。

在何处：

* 对象类型的string-like属性，是那些使用标识符，字符串字面量或计算后值为字符串字面量类型的属性名所声明的。
* 对象类型的number-like属性是那些使用数字字面量或计算后值为数字字面量类型的属性名所声明的。
* 对象类型的symbol-like属性是那些使用计算后值为symbol字面量类型的属性名所声明的。

对于映射类型`{ [P in K]: XXX }`，`K`的每个字符串字面量类型都会引入一个名字为字符串的属性，`K`的每个数字字面量类型都会引入一个名字为数字的属性，`K`的每个symbol字面量类型都会引入一个名字为symbol的属性。 并且，如果`K`包含`string`类型，那个同时也会引入字符串索引类型，如果`K`包含`number`类型，那个同时也会引入数字索引类型。

### 例子

```typescript
const c = "c";
const d = 10;
const e = Symbol();

const enum E1 { A, B, C }
const enum E2 { A = "A", B = "B", C = "C" }

type Foo = {
    a: string;       // String-like name
    5: string;       // Number-like name
    [c]: string;     // String-like name
    [d]: string;     // Number-like name
    [e]: string;     // Symbol-like name
    [E1.A]: string;  // Number-like name
    [E2.A]: string;  // String-like name
}

type K1 = keyof Foo;  // "a" | 5 | "c" | 10 | typeof e | E1.A | E2.A
type K2 = Extract<keyof Foo, string>;  // "a" | "c" | E2.A
type K3 = Extract<keyof Foo, number>;  // 5 | 10 | E1.A
type K4 = Extract<keyof Foo, symbol>;  // typeof e
```

现在通过在键值类型里包含`number`类型，`keyof`就能反映出数字索引签名的存在，因此像`Partial<T>`和`Readonly<T>`的映射类型能够正确地处理带数字索引签名的对象类型：

```typescript
type Arrayish<T> = {
    length: number;
    [x: number]: T;
}

type ReadonlyArrayish<T> = Readonly<Arrayish<T>>;

declare const map: ReadonlyArrayish<string>;
let n = map.length;
let x = map[123];  // Previously of type any (or an error with --noImplicitAny)
```

此外，由于`keyof`支持用`number`和`symbol`命名的键值，现在可以对对象的数字字面量（如数字枚举类型）和唯一的symbol属性的访问进行抽象。

```typescript
const enum Enum { A, B, C }

const enumToStringMap = {
    [Enum.A]: "Name A",
    [Enum.B]: "Name B",
    [Enum.C]: "Name C"
}

const sym1 = Symbol();
const sym2 = Symbol();
const sym3 = Symbol();

const symbolToNumberMap = {
    [sym1]: 1,
    [sym2]: 2,
    [sym3]: 3
};

type KE = keyof typeof enumToStringMap;     // Enum (i.e. Enum.A | Enum.B | Enum.C)
type KS = keyof typeof symbolToNumberMap;   // typeof sym1 | typeof sym2 | typeof sym3

function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

let x1 = getValue(enumToStringMap, Enum.C);  // Returns "Name C"
let x2 = getValue(symbolToNumberMap, sym3);  // Returns 3
```

这是一个破坏性改动；之前，`keyof`操作符和映射类型只支持`string`命名的属性。 那些把总是把`keyof T`的类型当做`string`的代码现在会报错。

### 例子

```typescript
function useKey<T, K extends keyof T>(o: T, k: K) {
    var name: string = k;  // 错误：keyof T不能赋值给字符串
}
```

### 推荐

* 如果函数只能处理字符串命名属性的键，在声明里使用`Extract<keyof T, string>`：

  ```typescript
  function useKey<T, K extends Extract<keyof T, string>>(o: T, k: K) {
    var name: string = k;  // OK
  }
  ```

* 如果函数能处理任何属性的键，那么可以在下游进行改动：

  ```typescript
  function useKey<T, K extends keyof T>(o: T, k: K) {
    var name: string | number | symbol = k;
  }
  ```

* 否则，使用`--keyofStringsOnly`编译器选项来禁用新的行为。

## JSX元素里的泛型参数

JSX元素现在允许传入类型参数到泛型组件里。

### 例子

```typescript
class GenericComponent<P> extends React.Component<P> {
    internalProp: P;
}

type Props = { a: number; b: string; };

const x = <GenericComponent<Props> a={10} b="hi"/>; // OK

const y = <GenericComponent<Props> a={10} b={20} />; // Error
```

## 泛型标记模版里的泛型参数

标记模版是ECMAScript 2015引入的一种调用形式。 类似调用表达式，可以在标记模版里使用泛型函数，TypeScript会推断使用的类型参数。

TypeScript 2.9允许传入泛型参数到标记模版字符串。

### 例子

```typescript
declare function styledComponent<Props>(strs: TemplateStringsArray): Component<Props>;

interface MyProps {
  name: string;
  age: number;
}

styledComponent<MyProps> `
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

declare function tag<T>(strs: TemplateStringsArray, ...args: T[]): T;

// inference fails because 'number' and 'string' are both candidates that conflict
let a = tag<string | number> `${100} ${"hello"}`;
```

## `import`类型

模块可以导入在其它模块里声明的类型。但是非模块的全局脚本不能访问模块里声明的类型。这里，`import`类型登场了。

在类型注释的位置使用`import("mod")`，就可以访问一个模块和它导出的声明，而不必导入它。

### 例子

在一个模块文件里，有一个`Pet`类的声明：

```typescript
// module.d.ts

export declare class Pet {
   name: string;
}
```

它可以被用在非模块文件`global-script.ts`：

```typescript
// global-script.ts

function adopt(p: import("./module").Pet) {
    console.log(`Adopting ${p.name}...`);
}
```

它也可以被放在`.js`文件的JSDoc注释里，来引用模块里的类型：

```javascript
// a.js

/**
 * @param p { import("./module").Pet }
 */
function walk(p) {
    console.log(`Walking ${p.name}...`);
}
```

## 放开声明生成时可见性规则

随着`import`类型的到来，许多在声明文件生成阶段报的可见性错误可以被编译器正确地处理，而不需要改变输入。

例如：

```typescript
import { createHash } from "crypto";

export const hash = createHash("sha256");
//           ^^^^
// Exported variable 'hash' has or is using name 'Hash' from external module "crypto" but cannot be named.
```

TypeScript 2.9不会报错，生成文件如下：

```typescript
export declare const hash: import("crypto").Hash;
```

## 支持`import.meta`

TypeScript 2.9引入对`import.meta`的支持，它是当前[TC39建议](https://github.com/tc39/proposal-import-meta)里的一个元属性。

`import.meta`类型是全局的`ImportMeta`类型，它在`lib.es5.d.ts`里定义。 这个接口地使用十分有限。 添加众所周知的Node和浏览器属性需要进行接口合并，还有可能需要根据上下文来增加全局空间。

### 例子

假设`__dirname`永远存在于`import.meta`，那么可以通过重新开放`ImportMeta`接口来进行声明：

```typescript
// node.d.ts
interface ImportMeta {
    __dirname: string;
}
```

用法如下：

```typescript
import.meta.__dirname // Has type 'string'
```

`import.meta`仅在输出目标为`ESNext`模块和ECMAScript时才生效。

## 新的`--resolveJsonModule`

在Node.js应用里经常需要使用`.json`。TypeScript 2.9的`--resolveJsonModule`允许从`.json`文件里导入，获取类型。

### 例子

```typescript
// settings.json

{
    "repo": "TypeScript",
    "dry": false,
    "debug": false
}
```

```typescript
// a.ts

import settings from "./settings.json";

settings.debug === true;  // OK
settings.dry === 2;  // Error: Operator '===' cannot be applied boolean and number
```

```typescript
// tsconfig.json

{
    "compilerOptions": {
        "module": "commonjs",
        "resolveJsonModule": true,
        "esModuleInterop": true
    }
}
```

## 默认`--pretty`输出

从TypeScript 2.9开始，如果应用支持彩色文字，那么错误输出时会默认应用`--pretty`。 TypeScript会检查输出流是否设置了[`isTty`](https://nodejs.org/api/tty.html)属性。

使用`--pretty false`命令行选项或`tsconfig.json`里设置`"pretty": false`来禁用`--pretty`输出。

## 新的`--declarationMap`

随着`--declaration`一起启用`--declarationMap`，编译器在生成`.d.ts`的同时还会生成`.d.ts.map`。 语言服务现在也能够理解这些map文件，将声明文件映射到源码。

换句话说，在启用了`--declarationMap`后生成的`.d.ts`文件里点击go-to-definition，将会导航到源文件里的位置（`.ts`），而不是导航到`.d.ts`文件里。

