# 混入

## Table of contents

[介绍](mixins.md#introduction)

[混入示例](mixins.md#mixin-sample)

[理解示例](mixins.md#understanding-the-sample)

## 介绍

[**↥ 回到顶端**](mixins.md#table-of-contents)

除了传统的面向对象继承方式，还流行一种通过可重用组件创建类的方式，就是联合另一个简单类的代码。 你可能在Scala等语言里对mixins及其特性已经很熟悉了，但它在JavaScript中也是很流行的。

## 混入示例

[**↥ 回到顶端**](mixins.md#table-of-contents)

下面的代码演示了如何在TypeScript里使用混入。 后面我们还会解释这段代码是怎么工作的。

```typescript
// Disposable Mixin
class Disposable {
    isDisposed: boolean;
    dispose() {
        this.isDisposed = true;
    }

}

// Activatable Mixin
class Activatable {
    isActive: boolean;
    activate() {
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }
}

class SmartObject {
    constructor() {
        setInterval(() => console.log(this.isActive + " : " + this.isDisposed), 500);
    }

    interact() {
        this.activate();
    }
}

interface SmartObject extends Disposable, Activatable {}
applyMixins(SmartObject, [Disposable, Activatable]);

let smartObj = new SmartObject();
setTimeout(() => smartObj.interact(), 1000);

////////////////////////////////////////
// In your runtime library somewhere
////////////////////////////////////////

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
        });
    });
}
```

## 理解示例

[**↥ 回到顶端**](mixins.md#table-of-contents)

代码里首先定义了两个类，它们将做为mixins。 可以看到每个类都只定义了一个特定的行为或功能。 稍后我们使用它们来创建一个新类，同时具有这两种功能。

```typescript
// Disposable Mixin
class Disposable {
    isDisposed: boolean;
    dispose() {
        this.isDisposed = true;
    }

}

// Activatable Mixin
class Activatable {
    isActive: boolean;
    activate() {
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }
}
```

下面创建一个类，结合了这两个mixins。 下面来看一下具体是怎么操作的：

```typescript
class SmartObject {
    ...
}

interface SmartObject extends Disposable, Activatable {}
```

首先注意到的是，我们没有在`SmartObject`类里面继承`Disposable`和`Activatable`，而是在`SmartObject`接口里面继承的。由于[声明合并](declaration-merging.md)的存在，`SmartObject`接口会被混入到`SmartObject`类里面。

它将类视为接口，且只会混入Disposable和Activatable背后的类型到SmartObject类型里，不会混入实现。也就是说，我们要在类里面去实现。 这正是我们想要在混入时避免的行为。

最后，我们将混入融入到了类的实现中去。

```typescript
// Disposable
isDisposed: boolean = false;
dispose: () => void;
// Activatable
isActive: boolean = false;
activate: () => void;
deactivate: () => void;
```

最后，把mixins混入定义的类，完成全部实现部分。

```typescript
applyMixins(SmartObject, [Disposable, Activatable]);
```

最后，创建这个帮助函数，帮我们做混入操作。 它会遍历mixins上的所有属性，并复制到目标上去，把之前的占位属性替换成真正的实现代码。

```typescript
function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
        })
    });
}
```

