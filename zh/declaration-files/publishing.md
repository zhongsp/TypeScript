# 发布

现在我们已经按照指南里的步骤写好了一个声明文件，是时候把它发布到 npm 了。
有两种主要方式用来将声明文件发布到 npm：

1. 与你的 npm 包捆绑在一起，或
2. 发布到 npm 上的[@types organization](https://www.npmjs.com/~types)。

如果声明文件是由你写的源码生成的，那么就将声明文件与源码一起发布。
TypeScript 工程和 JavaScript 工程都可以使用[`--declaration`](/tsconfig#declaration)选项来生成声明文件。

否则，我们推荐你将声明文件提交到 DefinitelyTyped，它会被发布到 npm 的`@types`里。

## 包含声明文件到你的 npm 包

如果你的包有一个主`.js`文件，你还需要在`package.json`里指定主声明文件。
设置`types`属性指向捆绑在一起的声明文件。 比如：

```json
{
    "name": "awesome",
    "author": "Vandelay Industries",
    "version": "1.0.0",
    "main": "./lib/main.js",
    "types": "./lib/main.d.ts"
}
```

注意`"typings"`与`"types"`具有相同的意义，也可以使用它。

同样要注意的是如果主声明文件名是`index.d.ts`并且位置在包的根目录里（与`index.js`并列），你就不需要使用`"types"`属性指定了。

## 依赖

所有的依赖是由 npm 管理的。
确保所依赖的声明包都在`package.json`的`"dependencies"`里指明了。
比如，假设我们写了一个包，它依赖于 Browserify 和 TypeScript。

```json
{
    "name": "browserify-typescript-extension",
    "author": "Vandelay Industries",
    "version": "1.0.0",
    "main": "./lib/main.js",
    "types": "./lib/main.d.ts",
    "dependencies": {
        "browserify": "latest",
        "@types/browserify": "latest",
        "typescript": "next"
    }
}
```

这里，我们的包依赖于`browserify`和`typescript`包。 `browserify`没有把它的声明文件捆绑在它的 npm 包里，所以我们需要依赖于`@types/browserify`得到它的声明文件。
而`typescript`则相反，它把声明文件放在了 npm 包里，因此我们不需要依赖额外的包。

我们的包要从这两个包里暴露出声明文件，因此`browserify-typescript-extension`的用户也需要这些依赖。 正因此，我们使用`"dependencies"`而不是`"devDependencies"`，否则用户将需要手动安装那些包。 如果我们只是在写一个命令行应用，并且我们的包不会被当做一个库使用的话，那么就可以使用`devDependencies`。

## 危险信号

### `/// <reference path="..." />`

*不要*在声明文件里使用`/// <reference path="..." />`。

```ts
/// <reference path="../typescript/lib/typescriptServices.d.ts" />
....
```

*应该*使用`/// <reference types="..." />`代替

```ts
/// <reference types="typescript" />
....
```

务必阅读[利用依赖](./library-structures.md#利用依赖)一节了解详情。

### 打包所依赖的声明

如果你的类型声明依赖于另一个包：

-   *不要*把依赖的包放进你的包里，保持它们在各自的文件里。
-   *不要*将声明拷贝到你的包里。
-   *应该*依赖在 npm 上的类型声明包，如果依赖包没包含它自己的声明文件的话。

## 使用`typesVersions`选择版本

当 TypeScript 打开一个`package.json`文件来决定要读取哪个文件，它首先会检查`typesVersions`字段。

带有`typesVersions`字段的`package.json`可能如下：

```json
{
    "name": "package-name",
    "version": "1.0",
    "types": "./index.d.ts",
    "typesVersions": {
        ">=3.1": { "*": ["ts3.1/*"] }
    }
}
```

该`package.json`告诉 TypeScript 去检查当前正在运行的 TypeScript 版本。
如果是 3.1 及以上版本，则会相对于`package.json`的位置来读取`ts3.1`目录的内容。
这就是`{ "*": ["ts3.1/*"] }`的含义 - 如果你熟悉路径映射的话，它们是相似的工作方式。

上例中，如果我们从`"package-name"`导入，当 TypeScript 版本为 3.1 时，TypeScript 会尝试解析`[...]/node_modules/package-name/ts3.1/index.d.ts`（及其它相应路径）。
如果导入的是`package-name/foo`，那么会尝试加载`[...]/node_modules/package-name/ts3.1/foo.d.ts`和`[...]/node_modules/package-name/ts3.1/foo/index.d.ts`。

那么如果不是在 TypeScript 3.1 环境中呢？
如果`typesVersions`中的每个字段都无法匹配，TypeScript 会回退到`types`字段，因此在 TypeScript 3.0 及之前的版本中会加载`[...]/node_modules/package-name/index.d.ts`文件。

## 匹配行为

TypeScript 是根据 Node.js 的[语言化版本](https://github.com/npm/node-semver#ranges)来进行编译器及语言版本匹配的。

## 存在多个字段

`typesVersions`支持同时指定多个字段，每个字段都指定了匹配的范围。

```json tsconfig
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

由于指定的范围有发生重叠的潜在风险，因此声明文件的解析与指定的顺序是相关的。
也就是说，虽然`>=3.2`和`>=3.1`都匹配 TypeScript 3.2 及以上版本，但调换顺序后会有不同的行为，因此上例不同于下例。

```jsonc tsconfig
{
    "name": "package-name",
    "version": "1.0",
    "types": "./index.d.ts",
    "typesVersions": {
        // NOTE: this doesn't work!
        ">=3.1": { "*": ["ts3.1/*"] },
        ">=3.2": { "*": ["ts3.2/*"] }
    }
}
```

## 发布到[@types](https://www.npmjs.com/~types)

[@types](https://www.npmjs.com/~types)里的包是使用[types-publisher 工具](https://github.com/Microsoft/types-publisher)从[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)里自动发布的。
如果想让你的包发布为`@types`包，提交一个 pull request 到[https://github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)。
更多详情请参考[contribution guidelines page](http://definitelytyped.org/guides/contributing.html)。
