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
   |    +- components/
   |
   +- dist/
```

TypeScript文件会放在`src`文件夹里，通过TypeScript编译器编译，然后经webpack处理，最后生成一个`bundle.js`文件放在`dist`目录下。
我们自定义的组件将会放在`src/components`文件夹下。

下面来创建基本结构：

```shell
mkdir src
cd src
mkdir components
cd ..
mkdir dist
```

# 初始化工程

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

Webpack这个工具可以将你的所有代码和可选择地将依赖捆绑成一个单独的`.js`文件。
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
source-map-loader使用TypeScript输出的sourcemap文件来告诉webpack何时生成*自己的*sourcemaps。
这就允许你在调试最终生成的文件时就好像在调试TypeScript源码一样。

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
首先，在`src/components`目录下创建一个名为`Hello.tsx`的文件，代码如下：

```ts
import * as React from "react";
import * as ReactDOM from "react-dom";

export class HelloComponent extends React.Component<any, any> {
    render() {
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
    }
}

```

注意一点这个例子已经很像类了，我们不再需要使用类。
使用React的其它方式（比如[无状态的功能组件](https://facebook.github.io/react/docs/reusable-components.html#stateless-functions)）。

接下来，在`src`下创建`index.tsx`文件，源码如下：

```ts
import * as React from "react";
import * as ReactDOM from "react-dom";

import { HelloComponent } from "./components/Hello";

ReactDOM.render(
    <HelloComponent compiler="TypeScript" framework="React" />,
    document.getElementById("example")
);
```

我们仅仅将`Hello`组件导入`index.tsx`。
注意，不同于`"react"`或`"react-dom"`，我们使用`index.tsx`的*相对路径* - 这很重要。
如果不这样做，TypeScript只会尝试在`node_modules`文件夹里查找。
其它使用React的方法也应该可以。

我们还需要一个页面来显示`Hello`组件。
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

        <!-- Dependencies -->
        <script src="./node_modules/react/dist/react.js"></script>
        <script src="./node_modules/react-dom/dist/react-dom.js"></script>

        <!-- Main -->
        <script src="./dist/bundle.js"></script>
    </body>
</html>
```

需要注意一点我们是从`node_modules`引入的文件。
React和React-DOM的npm包里包含了独立的`.js`文件，你可以在页面上引入它们，这里我们为了快捷就直接引用了。
可以随意地将它们拷贝到其它目录下，或者从CDN上引用。
Facebook在CND上提供了一系列可用的React版本，你可以在这里查看[更多内容](http://facebook.github.io/react/downloads.html#development-vs.-production-builds)。

# 添加TypeScript配置文件

现在，可以把所有TypeScript文件放在一起 - 包括我们编写的代码和必要的typings文件。

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
    }，

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
};
```

大家可能对`externals`字段有所疑惑。
我们想要避免把所有的React都放到一个文件里，因为会增加编译时间并且浏览器还能够缓存没有发生改变的库文件。
理想情况下，我们只需要在浏览器里引入React模块，但是大部分浏览器还没有支持模块。
因此大部分代码库会把自己包裹在一个单独的全局变量内，比如：`jQuery`或`_`。
这叫做“命名空间”模式，webpack也允许我们继续使用通过这种方式写的代码库。
通过我们的设置`"react": "React"`，webpack会神奇地将所有对`"react"`的导入转换成从`React`全局变量中加载。

你可以在[这里](http://webpack.github.io/docs/configuration.html)了解更多如何配置webpack。

# 整合在一起

执行：

```shell
webpack
```

在浏览器里打开`index.html`，工程应该已经可以用了！
你可以看到页面上显示着“Hello from TypeScript and React!”
