# JSX

## 介绍

[JSX](https://facebook.github.io/jsx/)是一种嵌入式的类似XML的语法。 它可以被转换成合法的JavaScript，尽管转换的语义是依据不同的实现而定的。 JSX因[React](https://reactjs.org/)框架而流行，但也存在其它的实现。 TypeScript支持内嵌，类型检查以及将JSX直接编译为JavaScript。

## 基本用法

想要使用JSX必须做两件事：

1. 给文件一个`.tsx`扩展名
2. 启用`jsx`选项

TypeScript具有三种JSX模式：`preserve`，`react`和`react-native`。 这些模式只在代码生成阶段起作用 - 类型检查并不受影响。 在`preserve`模式下生成代码中会保留JSX以供后续的转换操作使用（比如：[Babel](https://babeljs.io/)）。 另外，输出文件会带有`.jsx`扩展名。 `react`模式会生成`React.createElement`，在使用前不需要再进行转换操作了，输出文件的扩展名为`.js`。 `react-native`相当于`preserve`，它也保留了所有的JSX，但是输出文件的扩展名是`.js`。

| 模式 | 输入 | 输出 | 输出文件扩展名 |
| :--- | :--- | :--- | :--- |
| `preserve` | `<div />` | `<div />` | `.jsx` |
| `react` | `<div />` | `React.createElement("div")` | `.js` |
| `react-native` | `<div />` | `<div />` | `.js` |

你可以通过在命令行里使用`--jsx`标记或[tsconfig.json](../tsconfig.json/tsconfig.json.md)里的选项来指定模式。

> \*注意：当输出目标为`react JSX`时，你可以使用`--jsxFactory`指定JSX工厂函数（默认值为`React.createElement`）

## `as`操作符

回想一下怎么写类型断言：

```typescript
var foo = <foo>bar;
```

这里断言`bar`变量是`foo`类型的。 因为TypeScript也使用尖括号来表示类型断言，在结合JSX的语法后将带来解析上的困难。因此，TypeScript在`.tsx`文件里禁用了使用尖括号的类型断言。

由于不能够在`.tsx`文件里使用上述语法，因此我们应该使用另一个类型断言操作符：`as`。 上面的例子可以很容易地使用`as`操作符改写：

```typescript
var foo = bar as foo;
```

`as`操作符在`.ts`和`.tsx`里都可用，并且与尖括号类型断言行为是等价的。

## 类型检查

为了理解JSX的类型检查，你必须首先理解固有元素与基于值的元素之间的区别。 假设有这样一个JSX表达式`<expr />`，`expr`可能引用环境自带的某些东西（比如，在DOM环境里的`div`或`span`）或者是你自定义的组件。 这是非常重要的，原因有如下两点：

1. 对于React，固有元素会生成字符串（`React.createElement("div")`），然而由你自定义的组件却不会生成（`React.createElement(MyComponent)`）。
2. 传入JSX元素里的属性类型的查找方式不同。

   固有元素属性_本身_就支持，然而自定义的组件会自己去指定它们具有哪个属性。

TypeScript使用[与React相同的规范](http://facebook.github.io/react/docs/jsx-in-depth.html#html-tags-vs.-react-components) 来区别它们。 固有元素总是以一个小写字母开头，基于值的元素总是以一个大写字母开头。

### 固有元素

固有元素使用特殊的接口`JSX.IntrinsicElements`来查找。 默认地，如果这个接口没有指定，会全部通过，不对固有元素进行类型检查。 然而，如果这个接口存在，那么固有元素的名字需要在`JSX.IntrinsicElements`接口的属性里查找。 例如：

```typescript
declare namespace JSX {
    interface IntrinsicElements {
        foo: any
    }
}

<foo />; // 正确
<bar />; // 错误
```

在上例中，`<foo />`没有问题，但是`<bar />`会报错，因为它没在`JSX.IntrinsicElements`里指定。

> 注意：你也可以在`JSX.IntrinsicElements`上指定一个用来捕获所有字符串索引：

```typescript
declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}
```

### 基于值的元素

基于值的元素会简单的在它所在的作用域里按标识符查找。

```typescript
import MyComponent from "./myComponent";

<MyComponent />; // 正确
<SomeOtherComponent />; // 错误
```

有两种方式可以定义基于值的元素：

1. 函数组件 \(FC\)
2. 类组件

由于这两种基于值的元素在JSX表达式里无法区分，因此TypeScript首先会尝试将表达式做为函数组件进行解析。如果解析成功，那么TypeScript就完成了表达式到其声明的解析操作。如果按照函数组件解析失败，那么TypeScript会继续尝试以类组件的形式进行解析。如果依旧失败，那么将输出一个错误。

#### 函数组件

正如其名，组件被定义成JavaScript函数，它的第一个参数是`props`对象。 TypeScript会强制它的返回值可以赋值给`JSX.Element`。

```typescript
interface FooProp {
  name: string;
  X: number;
  Y: number;
}

declare function AnotherComponent(prop: {name: string});
function ComponentFoo(prop: FooProp) {
  return <AnotherComponent name={prop.name} />;
}

const Button = (prop: {value: string}, context: { color: string }) => <button>
```

由于函数组件是简单的JavaScript函数，所以我们还可以利用函数重载。

```typescript
interface ClickableProps {
  children: JSX.Element[] | JSX.Element
}

interface HomeProps extends ClickableProps {
  home: JSX.Element;
}

interface SideProps extends ClickableProps {
  side: JSX.Element | string;
}

function MainButton(prop: HomeProps): JSX.Element;
function MainButton(prop: SideProps): JSX.Element {
  ...
}
```

> 注意：函数组件之前叫做无状态函数组件（SFC）。由于在当前React版本里，函数组件不再被当作是无状态的，因此类型`SFC`和它的别名`StatelessComponent`被废弃了。

#### 类组件

我们可以定义类组件的类型。 然而，我们首先最好弄懂两个新的术语：_元素类的类型_和_元素实例的类型_。

现在有`<Expr />`，_元素类的类型_为`Expr`的类型。 所以在上面的例子里，如果`MyComponent`是ES6的类，那么类类型就是类的构造函数和静态部分。 如果`MyComponent`是个工厂函数，类类型为这个函数。

一旦建立起了类类型，实例类型由类构造器或调用签名（如果存在的话）的返回值的联合构成。 再次说明，在ES6类的情况下，实例类型为这个类的实例的类型，并且如果是工厂函数，实例类型为这个函数返回值类型。

```typescript
class MyComponent {
  render() {}
}

// 使用构造签名
var myComponent = new MyComponent();

// 元素类的类型 => MyComponent
// 元素实例的类型 => { render: () => void }

function MyFactoryFunction() {
  return {
    render: () => {
    }
  }
}

// 使用调用签名
var myComponent = MyFactoryFunction();

// 元素类的类型 => MyFactoryFunction
// 元素实例的类型 => { render: () => void }
```

元素的实例类型很有趣，因为它必须赋值给`JSX.ElementClass`或抛出一个错误。 默认的`JSX.ElementClass`为`{}`，但是它可以被扩展用来限制JSX的类型以符合相应的接口。

```typescript
declare namespace JSX {
  interface ElementClass {
    render: any;
  }
}

class MyComponent {
  render() {}
}
function MyFactoryFunction() {
  return { render: () => {} }
}

<MyComponent />; // 正确
<MyFactoryFunction />; // 正确

class NotAValidComponent {}
function NotAValidFactoryFunction() {
  return {};
}

<NotAValidComponent />; // 错误
<NotAValidFactoryFunction />; // 错误
```

### 属性类型检查

属性类型检查的第一步是确定_元素属性类型_。 这在固有元素和基于值的元素之间稍有不同。

对于固有元素，这是`JSX.IntrinsicElements`属性的类型。

```typescript
declare namespace JSX {
  interface IntrinsicElements {
    foo: { bar?: boolean }
  }
}

// `foo`的元素属性类型为`{bar?: boolean}`
<foo bar />;
```

对于基于值的元素，就稍微复杂些。 它取决于先前确定的在元素实例类型上的某个属性的类型。 至于该使用哪个属性来确定类型取决于`JSX.ElementAttributesProperty`。 它应该使用单一的属性来定义。 这个属性名之后会被使用。 TypeScript 2.8，如果未指定`JSX.ElementAttributesProperty`，那么将使用类元素构造函数或函数组件调用的第一个参数的类型。

```typescript
declare namespace JSX {
  interface ElementAttributesProperty {
    props; // 指定用来使用的属性名
  }
}

class MyComponent {
  // 在元素实例类型上指定属性
  props: {
    foo?: string;
  }
}

// `MyComponent`的元素属性类型为`{foo?: string}`
<MyComponent foo="bar" />
```

元素属性类型用于的JSX里进行属性的类型检查。 支持可选属性和必须属性。

```typescript
declare namespace JSX {
  interface IntrinsicElements {
    foo: { requiredProp: string; optionalProp?: number }
  }
}

<foo requiredProp="bar" />; // 正确
<foo requiredProp="bar" optionalProp={0} />; // 正确
<foo />; // 错误, 缺少 requiredProp
<foo requiredProp={0} />; // 错误, requiredProp 应该是字符串
<foo requiredProp="bar" unknownProp />; // 错误, unknownProp 不存在
<foo requiredProp="bar" some-unknown-prop />; // 正确, `some-unknown-prop`不是个合法的标识符
```

> 注意：如果一个属性名不是个合法的JS标识符（像`data-*`属性），并且它没出现在元素属性类型里时不会当做一个错误。

另外，JSX还会使用`JSX.IntrinsicAttributes`接口来指定额外的属性，这些额外的属性通常不会被组件的props或arguments使用 - 比如React里的`key`。还有，`JSX.IntrinsicClassAttributes<T>`泛型类型也可以用来为类组件（非函数组件）指定相同种类的额外属性。这里的泛型参数表示类实例类型。在React里，它用来允许`Ref<T>`类型上的`ref`属性。通常来讲，这些接口上的所有属性都是可选的，除非你想要用户在每个JSX标签上都提供一些属性。

延展操作符也可以使用：

```jsx
var props = { requiredProp: 'bar' };
<foo {...props} />; // 正确

var badProps = {};
<foo {...badProps} />; // 错误
```

### 子孙类型检查

从TypeScript 2.3开始，我们引入了_children_类型检查。_children_是_元素属性\(attribute\)类型_的一个特殊属性\(property\)，子_JSXExpression_将会被插入到属性里。 与使用`JSX.ElementAttributesProperty`来决定_props_名类似，我们可以利用`JSX.ElementChildrenAttribute`来决定_children_名。 `JSX.ElementChildrenAttribute`应该被声明在单一的属性\(property\)里。

```typescript
declare namespace JSX {
  interface ElementChildrenAttribute {
    children: {};  // specify children name to use
  }
}
```

如不特殊指定子孙的类型，我们将使用[React typings](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react)里的默认类型。

```typescript
<div>
  <h1>Hello</h1>
</div>;

<div>
  <h1>Hello</h1>
  World
</div>;

const CustomComp = (props) => <div>{props.children}</div>
<CustomComp>
  <div>Hello World</div>
  {"This is just a JS expression..." + 1000}
</CustomComp>
```

```typescript
interface PropsType {
  children: JSX.Element
  name: string
}

class Component extends React.Component<PropsType, {}> {
  render() {
    return (
      <h2>
        {this.props.children}
      </h2>
    )
  }
}

// OK
<Component name="foo">
  <h1>Hello World</h1>
</Component>

// Error: children is of type JSX.Element not array of JSX.Element
<Component name="bar">
  <h1>Hello World</h1>
  <h2>Hello World</h2>
</Component>

// Error: children is of type JSX.Element not array of JSX.Element or string.
<Component name="baz">
  <h1>Hello</h1>
  World
</Component>
```

## JSX结果类型

默认地JSX表达式结果的类型为`any`。 你可以自定义这个类型，通过指定`JSX.Element`接口。 然而，不能够从接口里检索元素，属性或JSX的子元素的类型信息。 它是一个黑盒。

## 嵌入的表达式

JSX允许你使用`{ }`标签来内嵌表达式。

```jsx
var a = <div>
  {['foo', 'bar'].map(i => <span>{i / 2}</span>)}
</div>
```

上面的代码产生一个错误，因为你不能用数字来除以一个字符串。 输出如下，若你使用了`preserve`选项：

```jsx
var a = <div>
  {['foo', 'bar'].map(function (i) { return <span>{i / 2}</span>; })}
</div>
```

## React整合

要想一起使用JSX和React，你应该使用[React类型定义](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react)。 这些类型声明定义了`JSX`合适命名空间来使用React。

```typescript
/// <reference path="react.d.ts" />

interface Props {
  foo: string;
}

class MyComponent extends React.Component<Props, {}> {
  render() {
    return <span>{this.props.foo}</span>
  }
}

<MyComponent foo="bar" />; // 正确
<MyComponent foo={0} />; // 错误
```

## 工厂函数

`jsx: react`编译选项使用的工厂函数是可以配置的。可以使用`jsxFactory`命令行选项，或内联的`@jsx`注释指令在每个文件上设置。比如，给`createElement`设置`jsxFactory`，`<div />`会使用`createElement("div")`来生成，而不是`React.createElement("div")`。

注释指令可以像下面这样使用（在TypeScript 2.8里）：

```typescript
import preact = require("preact");
/* @jsx preact.h */
const x = <div />;
```

生成：

```typescript
const preact = require("preact");
const x = preact.h("div", null);
```

工厂函数的选择同样会影响`JSX`命名空间的查找（类型检查）。如果工厂函数使用`React.createElement`定义（默认），编译器会先检查`React.JSX`，之后才检查全局的`JSX`。如果工厂函数定义为`h`，那么在检查全局的`JSX`之前先检查`h.JSX`。

