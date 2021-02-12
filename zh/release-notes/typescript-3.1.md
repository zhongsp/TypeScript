# TypeScript 3.1

## 元组和数组上的映射类型

TypeScript 3.1，在元组和数组上的映射对象类型现在会生成新的元组/数组，而非创建一个新的类型并且这个类型上具有如`push()`，`pop()`和`length`这样的成员。 例子：

```typescript
type MapToPromise<T> = { [K in keyof T]: Promise<T[K]> };

type Coordinate = [number, number]

type PromiseCoordinate = MapToPromise<Coordinate>; // [Promise<number>, Promise<number>]
```

`MapToPromise`接收参数`T`，当它是个像`Coordinate`这样的元组时，只有数值型属性会被转换。 `[number, number]`具有两个数值型属性：`0`和`1`。 针对这样的数组，`MapToPromise`会创建一个新的元组，`0`和`1`属性是原类型的一个`Promise`。 因此`PromiseCoordinate`的类型为`[Promise<number>, Promise<number>]`。

## 函数上的属性声明

TypeScript 3.1提供了在函数声明上定义属性的能力，还支持`const`声明的函数。只需要在函数直接给属性赋值就可以了。 这样我们就可以规范JavaScript代码，不必再借助于`namespace`。 例子：

```typescript
function readImage(path: string, callback: (err: any, image: Image) => void) {
    // ...
}

readImage.sync = (path: string) => {
    const contents = fs.readFileSync(path);
    return decodeImageSync(contents);
}
```

这里，`readImage`函数异步地读取一张图片。 此外，我们还在`readImage`上提供了一个便捷的函数`readImage.sync`。

一般来说，使用ECMAScript导出是个更好的方式，但这个新功能支持此风格的代码能够在TypeScript里执行。 此外，这种属性声明的方式允许我们表达一些常见的模式，例如React函数组件（之前叫做SFC）里的`defaultProps`和`propTpes` 。

```typescript
export const FooComponent = ({ name }) => (
    <div>Hello! I am {name}</div>
);

FooComponent.defaultProps = {
    name: "(anonymous)",
};
```

\[1\] 更确切地说，是上面那种同态映射类型。

## 使用`typesVersions`选择版本

由社区的反馈还有我们的经验得知，利用最新的TypeScript功能的同时容纳旧版本的用户很困难。 TypeScript引入了叫做`typesVersions`的新特性来解决这种情况。

在TypeScript 3.1里使用Node模块解析时，TypeScript会读取`package.json`文件，找到它需要读取的文件，它首先会查看名字为`typesVersions`的字段。 一个带有`typesVersions`字段的`package.json`文件：

```javascript
{
  "name": "package-name",
  "version": "1.0",
  "types": "./index.d.ts",
  "typesVersions": {
    ">=3.1": { "*": ["ts3.1/*"] }
  }
}
```

`package.json`告诉TypeScript去检查当前版本的TypeScript是否正在运行。 如果是3.1或以上的版本，它会找出你导入的包的路径，然后读取这个包里面的`ts3.1`文件夹里的内容。 这就是`{ "*": ["ts3.1/*"] }`的意义 - 如果你对路径映射熟悉，它们的工作方式类似。

因此在上例中，如果我们正在从`"package-name"`中导入，并且正在运行的TypeScript版本为3.1，我们会尝试从`[...]/node_modules/package-name/ts3.1/index.d.ts`开始解析。 如果是从`package-name/foo`导入，由会查找`[...]/node_modules/package-name/ts3.1/foo.d.ts`和`[...]/node_modules/package-name/ts3.1/foo/index.d.ts`。

那如果当前运行的TypeScript版本不是3.1呢？ 如果`typesVersions`里没有能匹配上的版本，TypeScript将回退到查看`types`字段，因此TypeScript 3.0及之前的版本会重定向到`[...]/node_modules/package-name/index.d.ts`。

### 匹配行为

TypeScript使用Node的[semver ranges](https://github.com/npm/node-semver#ranges)去决定编译器和语言版本。

### 多个字段

`typesVersions`支持多个字段，每个字段都指定了一个匹配范围。

```javascript
{
  "name": "package-name",
  "version": "1.0",
  "types": "./index.d.ts",
  "typesVersions": {
    ">=3.2": { "*": ["ts3.2/*"] },
    ">=3.1": { "*": ["ts3.1/*"] }
  }
}
```

因为范围可能会重叠，因此指定的顺序是有意义的。 在上例中，尽管`>=3.2`和`>=3.1`都匹配TypeScript 3.2及以上版本，反转它们的顺序将会有不同的结果，因此上例与下面的代码并不等同。

```text
{
  "name": "package-name",
  "version": "1.0",
  "types": "./index.d.ts",
  "typesVersions": {
    // 注意，这样写不生效
    ">=3.1": { "*": ["ts3.1/*"] },
    ">=3.2": { "*": ["ts3.2/*"] }
  }
}
```

