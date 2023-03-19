# TypeScript 5.0

## 装饰器 Decorators

装饰器是即将到来的 ECMAScript 特性，它允许我们定制可重用的类以及类成员。

考虑如下的代码：

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person('Ron');
p.greet();
```

这里的 `greet` 很简单，但我们假设它很复杂 - 例如包含异步的逻辑，是递归的，具有副作用等。
不管你把它想像成多么混乱复杂，现在我们想插入一些 `console.log` 语句来调试 `greet`。

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log('LOG: Entering method.');

    console.log(`Hello, my name is ${this.name}.`);

    console.log('LOG: Exiting method.');
  }
}
```

这个做法太常见了。
如果有种办法能给每一个类方法都添加打印功能就太好了！

这就是装饰器的用武之地。
让我们编写一个函数 `loggedMethod`：

```ts
function loggedMethod(originalMethod: any, _context: any) {
  function replacementMethod(this: any, ...args: any[]) {
    console.log('LOG: Entering method.');
    const result = originalMethod.call(this, ...args);
    console.log('LOG: Exiting method.');
    return result;
  }

  return replacementMethod;
}
```

"这些 `any` 是怎么回事？都啥啊？"

先别急 - 这里我们是想简化一下问题，将注意力集中在函数的功能上。
注意一下 `loggedMethod` 接收原方法（`originalMethod`）作为参数并返回一个函数：

1. 打印 `"Entering…"` 消息
1. 将 `this` 值以及所有的参数传递给原方法
1. 打印 `"Exiting..."` 消息，并且
1. 返回原方法的返回值。

现在可以使用 `loggedMethod` 来*装饰* `greet` 方法：

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person('Ron');
p.greet();

// 输出:
//
//   LOG: Entering method.
//   Hello, my name is Ron.
//   LOG: Exiting method.
```

我们刚刚在 `greet` 上使用了 `loggedMethod` 装饰器 - 注意一下写法 `@loggedMethod`。
这样做之后，`loggedMethod` 被调用时会传入被装饰的目标 `target` 以及一个上下文对象 `context object` 作为参数。
因为 `loggedMethod` 返回了一个新函数，因此这个新函数会替换掉 `greet` 的原始定义。

在 `loggedMethod` 的定义中带有第二个参数。
它就是上下文对象 `context object`，包含了一些有关于装饰器声明细节的有用信息 -
例如是否为 `#private` 成员，或者 `static`，或者方法的名称。
让我们重写 `loggedMethod` 来使用这些信息，并且打印出被装饰的方法的名字。

```ts
function loggedMethod(
  originalMethod: any,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }

  return replacementMethod;
}
```

我们使用了上下文参数。
TypeScript 提供了名为 `ClassMethodDecoratorContext` 的类型用于描述装饰器方法接收的上下文对象。

除了元数据外，上下文对象中还提供了一个有用的函数 `addInitializer`。
它提供了一种方式来 hook 到构造函数的起始位置。

例如在 JavaScript 中，下面的情形很常见：

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;

    this.greet = this.greet.bind(this);
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}
```

或者，`greet` 可以被声明为使用箭头函数初始化的属性。

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet = () => {
    console.log(`Hello, my name is ${this.name}.`);
  };
}
```

这类代码的目的是确保 `this` 值不会被重新绑定，当 `greet` 被独立地调用或者在用作回调函数时。

```ts
const greet = new Person('Ron').greet;

// 我们不希望下面的调用失败
greet();
```

我们可以定义一个装饰器来利用 `addInitializer` 在构造函数里调用 `bind`。

```ts
function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  if (context.private) {
    throw new Error(
      `'bound' cannot decorate private properties like ${methodName as string}.`
    );
  }
  context.addInitializer(function () {
    this[methodName] = this[methodName].bind(this);
  });
}
```

`bound` 没有返回值 - 因此当它装饰一个方法时，不会影响原先的方法。
但是，它会在字段被初始化前添加一些逻辑。

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  @bound
  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person('Ron');
const greet = p.greet;

// Works!
greet();
```

我们将两个装饰器叠在了一起 - `@bound` 和 `@loggedMethod`。
这些装饰器以“相反的”顺序执行。
也就是说，`@loggedMethod` 装饰原始方法 `greet`，
`@bound` 装饰的是 `@loggedMethod` 的结果。
此例中，这不太重要 - 但如果你的装饰器带有副作用或者期望特定的顺序，那就不一样了。

值得注意的是：如果你在乎代码样式，也可以将装饰器放在同一行上。

```ts
@bound @loggedMethod greet() {
  console.log(`Hello, my name is ${this.name}.`);
}
```

可能不太明显的一点是，你甚至可以定义一个返回装饰器函数的函数。
这样我们可以在一定程序上定制最终的装饰器。
我们可以让 `loggedMethod` 返回一个装饰器并且定制如何打印消息。

```ts
function loggedMethod(headMessage = 'LOG:') {
  return function actualDecorator(
    originalMethod: any,
    context: ClassMethodDecoratorContext
  ) {
    const methodName = String(context.name);

    function replacementMethod(this: any, ...args: any[]) {
      console.log(`${headMessage} Entering method '${methodName}'.`);
      const result = originalMethod.call(this, ...args);
      console.log(`${headMessage} Exiting method '${methodName}'.`);
      return result;
    }

    return replacementMethod;
  };
}
```

这样做之后，在使用 `loggedMethod` 装饰器之前需要先调用它。
接下来就可以传入任意字符串作为打印消息的前缀。

```ts
class Person {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    @loggedMethod("")
    greet() {
        console.log(`Hello, my name is ${this.name}.`);
    }
}

const p = new Person("Ron");
p.greet();

// Output:
//
//    Entering method 'greet'.
//   Hello, my name is Ron.
//    Exiting method 'greet'.
```

装饰器不仅可以用在方法上！
它们也可以被用在属性/字段，存取器（getter/setter）以及自动存取器。
甚至，类本身也可以被装饰，用于处理子类化和注册。

想深入了解装饰器，可以阅读 Axel Rauschmayer 的[文章](https://2ality.com/2022/10/javascript-decorators.html)。

更多详情请参考 [PR](https://github.com/microsoft/TypeScript/pull/50820)。

## 与旧的实验性的装饰器的差异

如果你有一定的 TypeScript 经验，你会发现 TypeScript 多年前就已经支持了“实验性的”装饰器特性。
虽然实验性的装饰器非常地好用，但是它实现的是旧版本的装饰器规范，并且总是需要启用 `--experimentalDecorators` 编译器选项。
若没有启用它并且使用了装饰器，TypeScript 会报错。

在未来的一段时间内，`--experimentalDecorators` 依然会存在；
然而，如果不使用该标记，在新代码中装饰器语法也是合法的。
在 `--experimentalDecorators` 之外，它们的类型检查和代码生成方式也不同。
类型检查和代码生成规则存在巨大差异，以至于虽然装饰器*可以*被定义为同时支持新、旧装饰器的行为，但任何现有的装饰器函数都不太可能这样做。

新的装饰器提案与 `--emitDecoratorMetadata` 的实现不兼容，并且不支持在参数上使用装饰器。
未来的 ECMAScript 提案可能会弥补这个差距。

最后要注意的是：除了可以在 `export` 关键字之前使用装饰器，还可以在 `export` 或者 `export default` 之后使用。
但是不允许混合使用两种风格。

```ts
//  allowed
@register export default class Foo {
    // ...
}

//  also allowed
export default @register class Bar {
    // ...
}

//  error - before *and* after is not allowed
@before export @after class Bar {
    // ...
}
```

