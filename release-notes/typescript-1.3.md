# TypeScript 1.3

## 受保护的

类里面新的`protected`修饰符作用与其它语言如C++，C\#和Java中的一样。一个类的`protected`成员只在这个类的子类中可见：

```typescript
class Thing {
  protected doSomething() { /* ... */ }
}

class MyThing extends Thing {
  public myMethod() {
    // OK，可以在子类里访问受保护的成员
    this.doSomething();
  }
}
var t = new MyThing();
t.doSomething(); // Error，不能在类外部访问受保护成员
```

## 元组类型

元组类型表示一个数组，其中元素的类型都是已知的，但是不一样是同样的类型。比如，你可能想要表示一个第一个元素是`string`类型第二个元素是`number`类型的数组：

```typescript
// Declare a tuple type
var x: [string, number];
// 初始化
x = ['hello', 10]; // OK
// 错误的初始化
x = [10, 'hello']; // Error
```

但是访问一个已知的索引，会得到正确的类型：

```typescript
console.log(x[0].substr(1)); // OK
console.log(x[1].substr(1)); // Error, 'number'没有'substr'方法
```

注意在TypeScript1.4里，当访问超出已知索引的元素时，会返回联合类型：

```typescript
x[3] = 'world'; // OK
console.log(x[5].toString()); // OK, 'string'和'number'都有toString
x[6] = true; // Error, boolean不是number或string
```

