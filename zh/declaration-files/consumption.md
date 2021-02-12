# 使用

在TypeScript 2.0，获取、使用和查找声明文件变得十分容易。 这篇文章将详细说明怎么做这三件事。

## 下载

在TypeScript 2.0以上的版本，获取类型声明文件只需要使用npm。

比如，获取lodash库的声明文件，只需使用下面的命令：

```text
npm install --save @types/lodash
```

如果一个npm包像[Publishing](publishing.md)里所讲的一样已经包含了它的声明文件，那就不必再去下载相应的`@types`包了。

## 使用

下载完后，就可以直接在TypeScript里使用lodash了。 不论是在模块里还是全局代码里使用。

比如，你已经`npm install`安装了类型声明，你可以使用导入：

```typescript
import * as _ from "lodash";
_.padStart("Hello TypeScript!", 20, " ");
```

或者如果你没有使用模块，那么你只需使用全局的变量`_`。

```typescript
_.padStart("Hello TypeScript!", 20, " ");
```

## 查找

大多数情况下，类型声明包的名字总是与它们在`npm`上的包的名字相同，但是有`@types/`前缀， 但如果你需要的话，你可以在[https://aka.ms/types](https://aka.ms/types)这里查找你喜欢的库。

> 注意：如果你要找的声明文件不存在，你可以贡献一份，这样就方便了下一位要使用它的人。 查看DefinitelyTyped[贡献指南页](http://definitelytyped.org/guides/contributing.html)了解详情。

