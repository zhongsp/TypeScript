这个快速上手指南将会教你如何将TypeScript和[React](http://facebook.github.io/react/)还有[webpack](http://webpack.github.io/)连结在一起使用。

我们假设已经在使用[Node.js](https://nodejs.org/)和[npm](https://www.npmjs.com/)。

# 初始化项目结构

让我们新建一个目录。
将会命名为`proj`，但是你可以改成任何你喜欢的名字。

```shell
mkdir proj
cd proj
```

我们会像下面的结构组织我们的工程：

```text
proj/
   +- src/
   +- dist/
```

TypeScript文件会放在`src`文件夹里，通过TypeScript编译器编译，然后经webpack处理，最后生成一个`bundle.js`文件放在`dist`目录下。

下面来创建基本结构：

```shell
mkdir src
mkdir dist
```

现在把这个目录变成npm包。

```shell
npm init
```

你会看到一些提示。
你可以使用默认项除了开始脚本。
使用`./lib/bundle.js`做为开始脚本。
当然，你也可以随时到生成的`package.json`文件里修改。

# 安装依赖

首先确保TypeScript，typings和webpack已经全局安装了。

```shell
npm install -g typescript typings webpack
```

Webpack这个工具可以将你的所有代码和依赖捆绑成一个单独的`.js`文件。
[Typings](https://www.npmjs.com/package/typings)是一个包管理器，它是用来获取定义文件的。

现在我们添加React和React-DOM依赖到`package.json`文件里：

```shell
npm install --save react react-dom
```

接下来，我们要添加开发时依赖[ts-loader](https://www.npmjs.com/package/ts-loader)和[source-map-loader](https://www.npmjs.com/package/source-map-loader)。

```shell
npm install --save-dev ts-loader source-map-loader
npm link typescript
```

这些依赖会让TypeScript和webpack在一起良好地工作。
ts-loader可以让webpack使用TypeScript的标准配置文件`tsconfig.json`编译TypeScript代码。
source-map-loader使用TypeScript输出的sourcemap文件，来告诉webpack如何生成sourcemap。

链接TypeScript，允许ts-loader使用全局安装的TypeScript，而不需要单独的本地拷贝。
如果你想要一个本地的拷贝，执行`npm install typescript`。

最后，我们使用`typings`工具来获取React的声明文件：

```shell
typings install --ambient --save react
typings install --ambient --save react-dom
```

`--ambient`标记告诉typings从[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)获取声明文件，这是由社区维护的`.d.ts`文件仓库。
这个命令会创建一个名为`typings.json`的文件和一个`typings`目录在当前目录下。

# 写一些代码

下面使用React写一段TypeScript代码。
在`src`目录下创建一个名为`index.tsx`的文件。

```ts
import * as React from "react";
import * as ReactDOM from "react-dom";

class HelloComponent extends React.Component<any, any> {
    render() {
        return <h1>Hello from TypeScript and React!</h1>;
    }
}

ReactDOM.render(
    <HelloComponent />,
    document.getElementById("example")
);
```

注意，这个例子已经很像类了，我们不需要使用类。
其它使用React的方法也应该可以。

我们还需要一个视图来显示`HelloComponent`。
在根目录`proj`创建一个名为`index.html`的文件，如下：

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Hello React!</title>
    </head>
    <body>
        <div id="example"></div>
        <script src="./dist/bundle.js"></script>
    </body>
</html>
```

# 添加TypeScript配置文件

现在，可以把所有TypeScript文件放在一起 - 包括`index.tsx`和类型文件。

现在需要创建`tsconfig.json`文件，它包含输入文件的列表和编译选项。
在根目录下执行下在命令：

```shell
tsc --init ./typings/main.d.ts ./src/index.tsx --jsx react --outDir ./dist --sourceMap --noImplicitAny
```

你可以在[这里](../tsconfig.json.md)学习到更多关于`tsconfig.json`。

# 创建webpack配置文件

新建一个`webpack.config.js`文件在工程根目录下。

```js
module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "./dist/bundle.js",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { test: /\.tsx?$/, loader: "ts-loader" }
        ],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    }
};
```

你可以在[这里](http://webpack.github.io/docs/configuration.html)了解更多如何配置webpack。

# 整合在一起

执行：

```shell
webpack
```

在浏览器里打开`index.html`，工程应该已经可以用了！
你可以看到页面上显示着“Hello from TypeScript and React!”