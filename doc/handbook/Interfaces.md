# 介绍

TypeScript的核心原则之一是对值所具有的`shape`进行类型检查。
它有时被称做“鸭式辨型法”或“结构性子类型化”。
在TypeScript里，接口的作用就是为这些类型命名和为你的代码或第三方代码定义契约。

# 接口初探

下面通过一个简单示例来观察接口是如何工作的：

```TypeScript
function printLabel(labelledObj: { label: string }) {
  console.log(labelledObj.label);
}

var myObj = { size: 10, label: "Size 10 Object" };
printLabel(myObj);
```

类型检查器会查看`printLabel`的调用。
`printLabel`有一个参数，并要求这个对象参数有一个名为`label`类型为`string`的属性。
需要注意的是，我们传入的对象参数实际上会包含很多属性，但是编译器只会检查那些必需的属性是否存在，并且其类型是否匹配。

下面我们重写上面的例子，这次使用接口来描述：必须包含一个`label`属性且类型为`string`：

```TypeScript
interface LabelledValue {
  label: string;
}

function printLabel(labelledObj: LabelledValue) {
  console.log(labelledObj.label);
}

var myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
```

`LabelledValue`接口就好比一个名字，用来描述上面例子里的要求。
它代表了有一个`label`属性且类型为`string`的对象。
需要注意的是，我们在这里并不能像在其它语言里一样，说传给`printLabel`的对象实现了这个接口。我们只会去关注值的外形。
只要传入的对象满足上面提到的必要条件，那么它就是被允许的。

还有一点值得提的是，类型检查器不会去检查属性的顺序，只要相应的属性存在并且类型也是对的就可以。
