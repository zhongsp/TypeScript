在太平洋标准时间每天午夜会自动构建[TypeScript的`master`](https://github.com/Microsoft/TypeScript/tree/master)分支代码并发布到NPM和NuGet上。
下面将介绍如何获得并在工具里使用它们。

## 使用 npm

```shell
npm install -g typescript@next
```

## 使用 NuGet 和 MSBuild

> 注意：你需要配置工程来使用NuGet包。
详细信息参考[配置MSBuild工程来使用NuGet](https://github.com/Microsoft/TypeScript/wiki/Configuring-MSBuild-projects-to-use-NuGet)。

[www.myget.org](https://www.myget.org/gallery/typescript-preview)。

有两个包：

* `Microsoft.TypeScript.Compiler`: 仅包含工具 (`tsc.exe`，`lib.d.ts`，等。) 。
* `Microsoft.TypeScript.MSBuild`: 和上面一样的工具，还有MSBuild的任务和目标(`Microsoft.TypeScript.targets`，`Microsoft.TypeScript.Default.props`，等。)

## 更新IDE来使用每日构建

你还可以配置IDE来使用每日构建。
首先你要通过npm安装包。
你可以进行全局安装或者安装到本地的`node_modules`目录下。

下面的步骤里我们假设你已经安装好了`typescript@next`。

### Visual Studio Code

更新`.vscode/settings.json`如下：

```json
"typescript.tsdk": "<path to your folder>/node_modules/typescript/lib"
```

详细信息参见[VSCode文档](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions)。

### Sublime Text

更新`Settings - User`如下：

```json
"typescript_tsdk": "<path to your folder>/node_modules/typescript/lib"
```

详细信息参见[如何在Sublime Text里安装TypeScript插件](https://github.com/Microsoft/TypeScript-Sublime-Plugin#installation)。

### Visual Studio 2013 and 2015

> 注意：大多数的改变不需要你安装新版本的VS TypeScript插件。

当前的每日构建不包含完整的插件安装包，但是我们正在试着提供每日构建的安装包。

1. 下载[VSDevMode.ps1](https://github.com/Microsoft/TypeScript/blob/master/scripts/VSDevMode.ps1)脚本。

   > 参考wiki文档：[使用自定义语言服务文件](https://github.com/Microsoft/TypeScript/wiki/Dev-Mode-in-Visual-Studio#using-a-custom-language-service-file)。

2. 在PowerShell命令行窗口里执行：

  VS 2015：

  ```posh
  VSDevMode.ps1 14 -tsScript <path to your folder>/node_modules/typescript/lib
  ```

  VS 2013：

  ```posh
  VSDevMode.ps1 12 -tsScript <path to your folder>/node_modules/typescript/lib
  ```
