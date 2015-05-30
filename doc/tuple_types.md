# Tuple types （元组类型）

元组是一种数据结构，它拥有固定数量的一组元素。
例如一个元组可以是个具有三个元素的数据结构，用来保存一个人的标识信息，第一个元素是姓名，第二个元素是出生年份，第三个元素是当年的收入。

元组类型由`[]`括起，其中的元素使用`,`分隔：

```typescript
[T0, T1, ... , Tn]
```

元组类型如同继承了`Array<T>`的对象类型，具有一系列的以数字命名的成员，其中`T`是元组元素的最佳通用类型：

```typescript
{
    0: T0;
    1: T1;
    ...
    n: Tn;
}
```

如果一个数组字面量按上下文类型推断为元组类型，数组字面量中的每个元素类型会按上下文推断为元组中的数据类型，并且这个数组的类型会是元组类型：

```typescript
var t: [number, string] = [1, "hello"];
t = [];                 // Error
t = [1];                // Error
t = [2, "test"];        // Ok
t = ["test", 2];        // Error
t = [2, "test", true];  // Ok
```

当用数字常量索引去获取元组的元素时，结果类型就是元组中对应元素的类型。比如：

```typescript
var x: [number, string] = [1, "hello"];
var x0 = x[0];  // Type number
var x1 = x[1];  // Type string
var x2 = x[2];  // Type {}
```

元组可以赋值组类型兼容的数组。比如：

```typescript
var a1: number[];
var a2: {}[];
var t1: [number, string];
var t2: [number, number];
a1 = t1;  // Error
a1 = t2;  // Ok
a2 = t1;  // Ok
a2 = t2;  // Ok
```

类型推断能够正确地应用在元组上：

```typescript
function tuple2<T0, T1>(item0: T0, item1: T1): [T0, T1] {
    return [item0, item1];
}
var t = tuple2("test", true);
var t0 = t[0];  // string
var t1 = t[1];  // boolean
```
