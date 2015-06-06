# 命名空间

[`[PR#2923`]](https://github.com/Microsoft/TypeScript/pull/2923)

`namespace`是TS1.5新加的关键字，它用来定义以前版本的内部模块。变更如下：

* **内部模块 - Internal module**变为**命名空间 - Namespace**。
* **外部模块 - External module**变为**模块 - Module**。

为了兼容性的考虑，目前仍然可以使用`module`关键字来定义命名空间，已有的代码不会受到任何影响。我们会考虑使用一个编译选项来阻止使用`module`关键字定义命名空间。

下文截取自 [`[Handbook: 命名空间和模块`]](https://github.com/zhongsp/TypeScript/blob/master/doc/Handbook.md#4)

### 使用命名空间

随着我们增加更多的验证器，我们想要将它们组织在一起来保持对它们的追踪记录并且不用担心与其它对象产生命名冲突。
我们把验证器包裹到一个命名空间内，而不是把它们放在全局命名空间下。

这个例子里，我们把所有验证器相关的类型都放到一个叫做`Validation`的命名空间里。
因为我们想让这些接口和类在命名空间外也是可访问的，所以我们需要使用`export`。
相反的，变量`lettersRegexp`和`numberRegexp`是具体实现，所以没有导出，因此它们在命名空间外是不能访问的。
在文件末尾的测试代码里，我们需要限制类型名称，因为这是在命名空间外访问，比如`Validation.LettersOnlyValidator`。

#### 使用命名空间的验证器

```typescript
namespace Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }

    var lettersRegexp = /^[A-Za-z]+$/;
    var numberRegexp = /^[0-9]+$/;

    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }

    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: Validation.StringValidator; } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```
### 分割成多文件

当应用变得越来越大时，我们需要将代码分散到不同的文件中以便于维护。

### <a name="4.1"></a>多文件中的命名空间

现在，我们把`Validation`命名空间分割成多个文件。
尽管是不同的文件，它们仍是同一个命名空间，并且在使用的时候就如同它们在一个文件中定义的一样。
因为不同文件之间存在依赖关系，所以我们加入了引用标签来告诉编译器文件之间的关联。
我们的测试代码保持不变。

#### Validation.ts

```typescript
namespace Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }
}
```

#### LettersOnlyValidator.ts

```typescript
/// <reference path="Validation.ts" />
namespace Validation {
    var lettersRegexp = /^[A-Za-z]+$/;
    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }
}
```

#### ZipCodeValidator.ts

```typescript
/// <reference path="Validation.ts" />
namespace Validation {
    var numberRegexp = /^[0-9]+$/;
    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}
```

#### Test.ts

```typescript
/// <reference path="Validation.ts" />
/// <reference path="LettersOnlyValidator.ts" />
/// <reference path="ZipCodeValidator.ts" />

// Some samples to try
var strings = ['Hello', '98052', '101'];
// Validators to use
var validators: { [s: string]: Validation.StringValidator; } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
```

当涉及到多文件时，我们必须确保所有编译后的代码都被加载了。
我们有两种方式。

第一种方式，把所有的输入文件编译为一个输出文件，需要使用`--out`标记：

```Shell
tsc --out sample.js Test.ts
```

编译器会根据源码里的引用标签自动地对输出进行排序。你也可以单独地指定每个文件。

```Shell
tsc --out sample.js Validation.ts LettersOnlyValidator.ts ZipCodeValidator.ts Test.ts
```

第二种方式，我们可以编译每一个文件（默认方式），那么每个源文件都会对应生成一个JavaScript文件。
然后，在页面上通过`<script>`标签把所有生成的JavaScript文件按正确的顺序引进来，比如：

#### MyTestPage.html（摘录部分）

```html
<script src="Validation.js" type="text/javascript" />
<script src="LettersOnlyValidator.js" type="text/javascript" />
<script src="ZipCodeValidator.js" type="text/javascript" />
<script src="Test.js" type="text/javascript" />
```
