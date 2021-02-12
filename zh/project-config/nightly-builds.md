在太平洋标准时间的每日午夜，TypeScript 代码仓库中[master 分支](https://github.com/Microsoft/TypeScript/tree/master)上的代码会自动构建并发布到 npm 上。
下面将介绍如何获取并结合你的工具来使用它。

## 使用 npm

```shell
npm install -g typescript@next
```

## 更新 IDE 来使用每日构建

你还可以配置 IDE 来使用每日构建。
首先你需要通过 npm 来安装代码包。
你可以进行全局安装或者安装到本地的`node_modules`目录下。

在下面的内容中，我们假设你已经安装好了`typescript@next`。

### Visual Studio Code

参考以下示例来更新`.vscode/settings.json`：

```json
"typescript.tsdk": "<path to your folder>/node_modules/typescript/lib"
```

更多详情请参考 [VSCode 文档](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions)。

### Sublime Text

参考以下示例来更新`Settings - User`：

```json
"typescript_tsdk": "<path to your folder>/node_modules/typescript/lib"
```

更多详情请参考 [如何在 Sublime Text 里安装 TypeScript 插件](https://github.com/Microsoft/TypeScript-Sublime-Plugin#installation)。

### Visual Studio 2013 和 2015

> 注意：绝大多数的变更不需要你安装新版本的 VS TypeScript 插件。

目前，每日构建中没有包含完整的插件安装包，但是我们正在试着提供这样的安装包。

1. 下载 [VSDevMode.ps1](https://github.com/Microsoft/TypeScript/blob/master/scripts/VSDevMode.ps1) 脚本。

   > 同时也可以参考 wiki 文档： [使用自定义的语言服务文件](https://github.com/Microsoft/TypeScript/wiki/Dev-Mode-in-Visual-Studio#using-a-custom-language-service-file)。

2. 打开 PowerShell 命令行窗口，并运行：

针对 VS 2015：

```posh
VSDevMode.ps1 14 -tsScript <path to your folder>/node_modules/typescript/lib
```

针对 VS 2013:

```posh
VSDevMode.ps1 12 -tsScript <path to your folder>/node_modules/typescript/lib
```

### IntelliJ IDEA （Mac）

前往 `Preferences` > `Languages & Frameworks` > `TypeScript`：

> TypeScript Version：若通过 npm 安装则为：`/usr/local/lib/node_modules/typescript/lib`

### IntelliJ IDEA （Windows）

前往 `File` > `Settings` > `Languages & Frameworks` > `TypeScript`：

> TypeScript Version：若通过 npm 安装则为：`C:\Users\USERNAME\AppData\Roaming\npm\node_modules\typescript\lib`
