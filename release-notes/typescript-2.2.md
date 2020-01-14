# TypeScript 2.2

## 支持混合类

TypeScript 2.2 增加了对 ECMAScript 2015 混合类模式 \(见[MDN混合类的描述](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Mix-ins)及[JavaScript类的"真"混合](http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/)了解更多\) 以及使用交叉来类型表达结合混合构造函数的签名及常规构造函数签名的规则.

#### 首先是一些术语

**混合构造函数类型**指仅有单个构造函数签名，且该签名仅有一个类型为 any\[\] 的变长参数，返回值为对象类型. 比如, 有 X 为对象类型, new \(...args: any\[\]\) =&gt; X 是一个实例类型为 X 的混合构造函数类型。

**混合类**指一个`extends`\(扩展\)了类型参数类型的表达式的类声明或表达式. 以下规则对混合类声明适用：

* `extends`表达式的类型参数类型必须是混合构造函数.
* 混合类的构造函数 \(如果有\) 必须有且仅有一个类型为`any[]`的变长参数, 并且必须使用展开运算符在`super(...args)`调用中将这些参数传递。

假设有类型参数为`T`且约束为`X`的表达式`Bas`，处理混合类`class C extends Base {...}`时会假设`Base`有`X`类型，处理结果为交叉类型`typeof C & T`。换言之，一个混合类被表达为混合类构造函数类型与参数基类构造函数类型的交叉类型.

在获取一个包含了混合构造函数类型的交叉类型的构造函数签名时，混合构造函数签名会被丢弃，而它们的实例类型会被混合到交叉类型中其他构造函数签名的返回类型中. 比如，交叉类型`{ new(...args: any[]) => A } & { new(s: string) => B }`仅有一个构造函数签名`new(s: string) => A & B`。

#### 将以上规则放到一个例子中

```typescript
class Point {
    constructor(public x: number, public y: number) {}
}

class Person {
    constructor(public name: string) {}
}

type Constructor<T> = new(...args: any[]) => T;

function Tagged<T extends Constructor<{}>>(Base: T) {
    return class extends Base {
        _tag: string;
        constructor(...args: any[]) {
            super(...args);
            this._tag = "";
        }
    }
}

const TaggedPoint = Tagged(Point);

let point = new TaggedPoint(10, 20);
point._tag = "hello";

class Customer extends Tagged(Person) {
    accountBalance: number;
}

let customer = new Customer("Joe");
customer._tag = "test";
customer.accountBalance = 0;
```

混合类可以通过在类型参数中限定构造函数签名的返回值类型来限制它们可以被混入的类的类型。举例来说，下面的`WithLocation`函数实现了一个为满足`Point`接口 （也就是有类型为`number`的`x`和`y`属性）的类添加`getLocation`方法的子类工厂。

```typescript
interface Point {
    x: number;
    y: number;
}

const WithLocation = <T extends Constructor<Point>>(Base: T) =>
    class extends Base {
        getLocation(): [number, number] {
            return [this.x, this.y];
        }
    }
```

## `object`类型

TypeScript没有表示非基本类型的类型，即不是`number` \| `string` \| `boolean` \| `symbol` \| `null` \| `undefined`的类型。一个新的`object`类型登场。

使用`object`类型，可以更好地表示类似`Object.create`这样的API。例如：

```typescript
declare function create(o: object | null): void;

create({ prop: 0 }); // OK
create(null); // OK

create(42); // Error
create("string"); // Error
create(false); // Error
create(undefined); // Error
```

## 支持`new.target`

`new.target`元属性是ES2015引入的新语法。当通过`new`构造函数创建实例时，`new.target`的值被设置为对最初用于分配实例的构造函数的引用。如果一个函数不是通过`new`构造而是直接被调用，那么`new.target`的值被设置为`undefined`。

当在类的构造函数中需要设置`Object.setPrototypeOf`或`__proto__`时，`new.target`就派上用场了。在NodeJS v4及更高版本中继承`Error`类就是这样的使用案例。

### 示例

```typescript
class CustomError extends Error {
    constructor(message?: string) {
        super(message); // 'Error' breaks prototype chain here
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}
```

生成JS代码：

```javascript
var CustomError = (function (_super) {
  __extends(CustomError, _super);
  function CustomError() {
    var _newTarget = this.constructor;
    var _this = _super.apply(this, arguments);  // 'Error' breaks prototype chain here
    _this.__proto__ = _newTarget.prototype; // restore prototype chain
    return _this;
  }
  return CustomError;
})(Error);
```

new.target也适用于编写可构造的函数，例如：

```typescript
function f() {
  if (new.target) { /* called via 'new' */ }
}
```

编译为：

```javascript
function f() {
  var _newTarget = this && this instanceof f ? this.constructor : void 0;
  if (_newTarget) { /* called via 'new' */ }
}
```

## 更好地检查表达式的操作数中的`null` / `undefined`

TypeScript 2.2改进了对表达式中可空操作数的检查。具体来说，这些现在被标记为错误：

* 如果`+`运算符的任何一个操作数是可空的，并且两个操作数都不是`any`或`string`类型。
* 如果`-`，`*`，`**`，`/`，`％`，`<<`，`>>`，`>>>`, `&`, `|` 或 `^`运算符的任何一个操作数是可空的。
* 如果`<`，`>`，`<=`，`>=`或`in`运算符的任何一个操作数是可空的。
* 如果`instanceof`运算符的右操作数是可空的。
* 如果一元运算符`+`，`-`，`~`，`++`或者`--`的操作数是可空的。

如果操作数的类型是`null`或`undefined`或者包含`null`或`undefined`的联合类型，则操作数视为可空的。注意：包含`null`或`undefined`的联合类型只会出现在`--strictNullChecks`模式中，因为常规类型检查模式下`null`和`undefined`在联合类型中是不存在的。

## 字符串索引签名类型的点属性

具有字符串索引签名的类型可以使用`[]`符号访问，但不允许使用`.`符号访问。从TypeScript 2.2开始两种方式都允许使用。

```typescript
interface StringMap<T> {
    [x: string]: T;
}

const map: StringMap<number>;

map["prop1"] = 1;
map.prop2 = 2;
```

这仅适用于具有显式字符串索引签名的类型。在类型使用上使用`.`符号访问未知属性仍然是一个错误。

## 支持在JSX子元素上使用扩展运算符

TypeScript 2.2增加了对在JSX子元素上使用扩展运算符的支持。更多详情请看[facebook/jsx\#57](https://github.com/facebook/jsx/issues/57)。

### 示例

```typescript
function Todo(prop: { key: number, todo: string }) {
    return <div>{prop.key.toString() + prop.todo}</div>;
}

function TodoList({ todos }: TodoListProps) {
    return <div>
        {...todos.map(todo => <Todo key={todo.id} todo={todo.todo} />)}
    </div>;
}

let x: TodoListProps;

<TodoList {...x} />
```

## 新的`jsx: react-native`

React-native构建管道期望所有文件都具有.js扩展名，即使该文件包含JSX语法。新的`--jsx`编译参数值`react-native`将在输出文件中坚持JSX语法，但是给它一个`.js`扩展名。

