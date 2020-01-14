# TypeScript 1.7

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+1.7%22+label%3A%22breaking+change%22)。

## 从`this`中推断类型发生了变化

在类里，`this`值的类型将被推断成`this`类型。 这意味着随后使用原始类型赋值时可能会发生错误。

**例子：**

```typescript
class Fighter {
    /** @returns the winner of the fight. */
    fight(opponent: Fighter) {
        let theVeryBest = this;
        if (Math.rand() < 0.5) {
            theVeryBest = opponent; // error
        }
        return theVeryBest
    }
}
```

**推荐：**

添加类型注解：

```typescript
class Fighter {
    /** @returns the winner of the fight. */
    fight(opponent: Fighter) {
        let theVeryBest: Fighter = this;
        if (Math.rand() < 0.5) {
            theVeryBest = opponent; // no error
        }
        return theVeryBest
    }
}
```

## 类成员修饰符后面会自动插入分号

关键字`abstract，public，protected`和`private`是ECMAScript 3里的_保留关键字_并适用于自动插入分号机制。 之前，在这些关键字出现的行尾，TypeScript是不会插入分号的。 现在，这已经被改正了，在上例中`abstract class D`不再能够正确地继承`C`了，而是声明了一个`m`方法和一个额外的属性`abstract`。

注意，`async`和`declare`已经能够正确自动插入分号了。

**例子：**

```typescript
abstract class C {
    abstract m(): number;
}
abstract class D extends C {
    abstract
    m(): number;
}
```

**推荐：**

在定义类成员时删除关键字后面的换行。通常来讲，要避免依赖于自动插入分号机制。

