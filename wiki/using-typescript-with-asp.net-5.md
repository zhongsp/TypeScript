# 结合ASP.NET v5使用TypeScript

与ASP.NET v5一起使用TypeScript需要你用特定的方式来设置你的工程。 更多关于ASP.NET v5的详细信息请查看[ASP.NET v5 文档](http://docs.asp.net/en/latest/conceptual-overview/index.html) 在Visual Studio的工程里支持当前的tsconfig.json还在开发之中，可以在这里查看进度[\#3983](https://github.com/Microsoft/TypeScript/issues/3983)。

## 工程设置

我们就以在Visual Studio 2015里创建一个空的ASP.NET v5工程开始，如果你对ASP.NET v5还不熟悉，可以查看[这个教程](http://docs.asp.net/en/latest/tutorials/your-first-aspnet-application.html)。

![&#x65B0;&#x521B;&#x5EFA;&#x4E00;&#x4E2A;&#x7A7A;&#x7684;&#x5DE5;&#x7A0B;](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/aspnet-screenshots/new-project.png)

然后在工程根目录下添加一个`scripts`目录。 这就是我们将要添加TypeScript文件和[`tsconfig.json`](../tsconfig.json/tsconfig.json.md)文件来设置编译选项的地方。 请注意目录名和路径都必须这样才能正常工作。 添加`tsconfig.json`文件，右键点击`scripts`目录，选择`Add`，`New Item`。 在`Client-side`下，你能够找到它，如下所示。

![&#x5728; Visual Studio &#x91CC;&#x6DFB;&#x52A0;&apos;tsconfig.json&apos;&#x6587;&#x4EF6;](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/aspnet-screenshots/add-tsconfig.png)

![A project in Visual Studio&apos;s Solution Explorer](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/aspnet-screenshots/project.png)

最后我们还要将下面的选项添加到`tsconfig.json`文件的`"compilerOptions"`节点里，让编译器输出重定向到`wwwroot`文件夹：

```javascript
"outDir": "../wwwroot/"
```

下面是配置好`tsconfig.json`后可能的样子

```javascript
{
    "compilerOptions": {
        "noImplicitAny": false,
        "noEmitOnError": true,
        "removeComments": false,
        "sourceMap": true,
        "target": "es5",
        "outDir": "../wwwroot"
    }
}
```

现在如果我们构建这个工程，你就会注意到`app.js`和`app.js.map`文件被创建在`wwwroot`目录里。

![&#x6784;&#x5EFA;&#x540E;&#x7684;&#x6587;&#x4EF6;](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/aspnet-screenshots/postbuild.png)

### 工程与虚拟工程

当添加了一个`tsconfig.json`文件，你要明白很重要的一点是我们创建了一个虚拟TypeScript工程，在包含`tsconfig.json`文件的目录下。 被当作这个虚拟工程一部分的TypeScript文件是不会在保存的时候编译的。 在包含`tsconfig.json`文件的目录_外层_里存在的TypeScript文件_不会_被当作虚拟工程的一部分。 下图中，可以见到这个虚拟工程，在红色矩形里。

![A virtual project in Visual Studio&apos;s Solution Explorer](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/aspnet-screenshots/virtual-project.png)

### 保存时编译

想要启用ASP.NET v5项目的_保存时编译_功能，你必须为不是虚拟TypeScript工程一部分的TypeScript文件启用_保存时编译_功能。 如果工程里存在`tsconfig.json`文件，那么模块类型选项的设置会被忽略。

![Compile on Save](https://raw.githubusercontent.com/wiki/Microsoft/TypeScript/aspnet-screenshots/compile-on-save.png)

