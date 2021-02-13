# 使用

## 下载

想要获取声明文件只需要用到 npm。

比如，想要获取 lodash 库的声明文件，只需使用下面的命令：

```text
npm install --save @types/lodash
```

如果一个 npm 包像[Publishing](publishing.md)里介绍的一样已经包含其声明文件，那就不必再去下载相应的`@types`包了。

## 使用

下载完后，就可以直接在 TypeScript 里使用 lodash 了。 不论是在模块里还是全局代码里使用。

比如，你已经`npm install`安装了声明文件，你可以使用导入：

```ts
import * as _ from 'lodash';
_.padStart('Hello TypeScript!', 20, ' ');
```

或者如果你没有使用模块，那么你只需使用全局的变量`_`。

```ts
_.padStart('Hello TypeScript!', 20, ' ');
```

## 查找

大多数情况下，类型声明包的名字总是与其在`npm`上的包的名字相同，但是有`@types/`前缀。
但如果你需要的话，你可以在[https://aka.ms/types](https://aka.ms/types)上查找你喜欢的库。

> 注意：如果你要找的声明文件不存在，你可以贡献一份，这样就方便了下一位开发者。
> 查看 DefinitelyTyped [贡献指南页](http://definitelytyped.org/guides/contributing.html)了解详情。
