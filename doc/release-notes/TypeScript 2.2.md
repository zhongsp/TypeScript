# TypeScript 2.2

## `object`类型

TypeScript没有表示非基本类型的类型，即不是`number` | `string` | `boolean` | `symbol` | `null` | `undefined`的类型。一个新的`object`类型登场。

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

#### 示例

```typescript
class CustomError extends Error {
    constructor(message?: string) {
        super(message); // 'Error' breaks prototype chain here
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}
```

生成JS代码：

```js
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

```js
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

## 支持在JSX元素children上使用扩展运算符

TypeScript 2.2增加了对在JSX元素children上使用扩展运算符的支持。更多详情请看[facebook/jsx#57](https://github.com/facebook/jsx/issues/57)。

#### 示例

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