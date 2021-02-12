# 支持TypeScript的编辑器

## 快捷列表

* [Atom](typescript-editor-support.md#atom)
* [Eclipse](typescript-editor-support.md#eclipse)
* [Emacs](typescript-editor-support.md#emacs)
* [NetBeans](typescript-editor-support.md#netbeans)
* [Sublime Text](typescript-editor-support.md#sublime-text)
* [TypeScript Builder](typescript-editor-support.md#typescript-builder)
* [Vim](typescript-editor-support.md#vim)
* [Visual Studio](typescript-editor-support.md#visual-studio-20132015)
* [Visual Studio Code](typescript-editor-support.md#visual-studio-code)
* [WebStorm](typescript-editor-support.md#webstorm)

## Atom

[Atom-TypeScript](https://atom.io/packages/atom-typescript)，由TypeStrong开发的针对Atom的TypeScript语言服务。

## Eclipse

[Eclipse TypeScript 插件](https://github.com/palantir/eclipse-typescript)，由Palantir开发的Eclipse插件。

## Emacs

[tide](https://github.com/ananthakumaran/tide) - TypeScript Interactive Development Environment for Emacs

## NetBeans

* [nbts](https://github.com/Everlaw/nbts) - NetBeans TypeScript editor plugin
* [Geertjan's TypeScript NetBeans Plugin](https://github.com/GeertjanWielenga/TypeScript)

## Sublime Text

[Sublime的TypeScript插件](https://github.com/Microsoft/TypeScript-Sublime-Plugin)，可以通过[Package Control](https://packagecontrol.io/)来安装，支持Sublime Text 2和Sublime Text 3.

## TypeScript Builder

[TypeScript Builder](http://www.typescriptbuilder.com/)，TypeScript专用IDE.

## Vim

### 语法高亮

* [leafgarland/typescript-vim](https://github.com/leafgarland/typescript-vim)提供了语法文件用来高亮显示`.ts`和`.d.ts`。
* [HerringtonDarkholme/yats.vim](https://github.com/HerringtonDarkholme/yats.vim)提供了更多语法高亮和DOM关键字。

### 语言服务工具

有两个主要的TypeScript插件：

* [Quramy/tsuquyomi](https://github.com/Quramy/tsuquyomi)
* [clausreinke/typescript-tools.vim](https://github.com/clausreinke/typescript-tools.vim)

如果你想要输出时自动补全功能，你可以安装[YouCompleteMe](https://github.com/Valloric/YouCompleteMe)并添加以下代码到`.vimrc`里，以指定哪些符号能用来触发补全功能。YouCompleteMe会调用它们各自TypeScript插件来进行语义查询。

```text
if !exists("g:ycm_semantic_triggers")
  let g:ycm_semantic_triggers = {}
endif
let g:ycm_semantic_triggers['typescript'] = ['.']
```

## Visual Studio 2013/2015

[Visual Studio](https://www.visualstudio.com/)里安装Microsoft Web Tools时就带了TypeScript。

TypeScript for Visual Studio 2015 在[这里](http://www.microsoft.com/en-us/download/details.aspx?id=48593)

TypeScript for Visual Studio 2013 在[这里](https://www.microsoft.com/en-us/download/details.aspx?id=48739)

## Visual Studio Code

[Visual Studio Code](https://code.visualstudio.com/)，是一个轻量级的跨平台编辑器，内置了对TypeScript的支持。

## Webstorm

[WebStorm](https://www.jetbrains.com/webstorm/)，同其它JetBrains IDEs一样，直接包含了对TypeScript的支持。

