# 受保护的类成员

[理解 protected](https://github.com/zhongsp/TypeScript/blob/master/doc/Handbook.md#理解protected)

TypeScript里受保护的成员是参照C#和Java来设计的。
受保护的成员（protected property member）只能在声明它的类中访问或者在这个类的派生类中被访问。
受保护的实例成员（protected instance property member）只能通过包含它的类的实例访问。

详细地说，`C`类里有一个受保护的成员`M`，则`M`只能在类`C`的类体（body of C）中被访问或者是类`C`的派生类的类体中被访问。

而且，在类`D`的类体中，`受保护的实例成员M`以属性访问的形式`E.M`访问时，要求`E`的类型为`D`或者为`D`的派生类类型，不考虑类型参数。

下面的例子描述了私有成员和受保护成员的访问权限：

```typescript
class A {  
    private x: number;  
    protected y: number;  
    static f(a: A, b: B) {  
        a.x = 1;  // Ok  
        b.x = 1;  // Ok  
        a.y = 1;  // Ok  
        b.y = 1;  // Ok  
    }  
}

class B extends A {  
    static f(a: A, b: B) {  
        a.x = 1;  // Error, x only accessible within A  
        b.x = 1;  // Error, x only accessible within A  
        a.y = 1;  // Error, a是A的实例，而A并不是包含类B类型或B的派生类
        b.y = 1;  // Ok  
    }  
}
```
