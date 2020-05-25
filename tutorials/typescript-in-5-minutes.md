# 5分钟了解TypeScript

让我们使用TypeScript来创建一个简单的Web应用。

## 安装TypeScript

有两种主要的方式来获取TypeScript工具：

* 通过npm（Node.js包管理器）
* 安装Visual Studio的TypeScript插件

Visual Studio 2017和Visual Studio 2015 Update 3默认包含了TypeScript。 如果你的Visual Studio还没有安装TypeScript，你可以下载它。

针对使用npm的用户：

```text
> npm install -g typescript
```

## 构建你的第一个TypeScript文件

在编辑器，将下面的代码输入到`greeter.ts`文件里：

```typescript
function greeter(person) {
    return "Hello, " + person;
}

let user = "Jane User";

document.body.textContent = greeter(user);
```

## 编译代码

我们使用了`.ts`扩展名，但是这段代码仅仅是JavaScript而已。 你可以直接从现有的JavaScript应用里复制/粘贴这段代码。

在命令行上，运行TypeScript编译器：

```text
tsc greeter.ts
```

输出结果为一个`greeter.js`文件，它包含了和输入文件中相同的JavsScript代码。 一切准备就绪，我们可以运行这个使用TypeScript写的JavaScript应用了！

接下来让我们看看TypeScript工具带来的高级功能。 给`person`函数的参数添加`: string`类型注解，如下：

```typescript
function greeter(person: string) {
    return "Hello, " + person;
}

let user = "Jane User";

document.body.textContent = greeter(user);
```

## 类型注解

TypeScript里的类型注解是一种轻量级的为函数或变量添加约束的方式。 在这个例子里，我们希望`greeter`函数接收一个字符串参数。 然后尝试把`greeter`的调用改成传入一个数组：

```typescript
function greeter(person: string) {
    return "Hello, " + person;
}

let user = [0, 1, 2];

document.body.textContent = greeter(user);
```

重新编译，你会看到产生了一个错误。

```text
error TS2345: Argument of type 'number[]' is not assignable to parameter of type 'string'.
```

类似地，尝试删除`greeter`调用的所有参数。 TypeScript会告诉你使用了非期望个数的参数调用了这个函数。 在这两种情况中，TypeScript提供了静态的代码分析，它可以分析代码结构和提供的类型注解。

要注意的是尽管有错误，`greeter.js`文件还是被创建了。 就算你的代码里有错误，你仍然可以使用TypeScript。但在这种情况下，TypeScript会警告你代码可能不会按预期执行。

## 接口

让我们开发这个示例应用。这里我们使用接口来描述一个拥有`firstName`和`lastName`字段的对象。 在TypeScript里，只要两个类型内部的结构兼容那么这两个类型就是兼容的。 这就允许我们在实现接口时候只要保证包含了接口要求的结构就可以，而不必明确地使用`implements`语句。

```typescript
interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person: Person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}

let user = { firstName: "Jane", lastName: "User" };

document.body.textContent = greeter(user);
```

## 类

最后，让我们使用类来改写这个例子。 TypeScript支持JavaScript的新特性，比如支持基于类的面向对象编程。

让我们创建一个`Student`类，它带有一个构造函数和一些公共字段。 注意类和接口可以一起共作，程序员可以自行决定抽象的级别。

还要注意的是，在构造函数的参数上使用`public`等同于创建了同名的成员变量。

```typescript
class Student {
    fullName: string;
    constructor(public firstName: string, public middleInitial: string, public lastName: string) {
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}

interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person: Person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}

let user = new Student("Jane", "M.", "User");

document.body.textContent = greeter(user);
```

重新运行`tsc greeter.ts`，你会看到生成的JavaScript代码和原先的一样。 TypeScript里的类只是JavaScript里常用的基于原型面向对象编程的简写。

## 运行TypeScript Web应用

在`greeter.html`里输入如下内容：

```markup
<!DOCTYPE html>
<html>
    <head><title>TypeScript Greeter</title></head>
    <body>
        <script src="greeter.js"></script>
    </body>
</html>
```

在浏览器里打开`greeter.html`运行这个应用！

可选地：在Visual Studio里打开`greeter.ts`或者把代码复制到TypeScript playground。 将鼠标悬停在标识符上查看它们的类型。 注意在某些情况下它们的类型可以被自动地推断出来。 重新输入一下最后一行代码，看一下自动补全列表和参数列表，它们会根据DOM元素类型而变化。 将光标放在`greeter`函数上，点击F12可以跟踪到它的定义。 还有一点，你可以右键点击标识，使用重构功能来重命名。

这些类型信息以及工具可以很好的和JavaScript一起工作。 更多的TypeScript功能演示，请查看本网站的示例部分。

