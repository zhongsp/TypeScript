# TypeScript Handbook（繁體中文版）

<img src="./misc/ts_logo.jpg" alt="TypeScript" width="24px" height="24px" style="vertical-align: bottom;"> [TypeScript 2.9 RC (May 16, 2018)](https://blogs.msdn.microsoft.com/typescript/2018/05/16/announcing-typescript-2-9-rc/)

TypeScript 是 Microsoft 公司注册商标。

TypeScript 具有物件導向特性的語言，且是 JavaScript 的超集合。
它可以編譯成普通的 JavaScript 代码。
TypeScript 支援任意瀏覽器，任何環境，任何系统並且開源。

TypeScript 目前仍然在積極的開發中，不斷會有新功能加入。
本手册會跟隨官方的 commit，不斷地更新新的章節以及修改措詞不妥之處。

如果你對 TypeScript 很有興趣，可以訂閱~~and star~~本手册，即時了解 ECMAScript 2015 以及 2016 裡新的原生特性，並借助 TypeScript 提前掌握使用它们的方式！
本 Project 來源，
(https://github.com/zhongsp/TypeScript)。

## 目錄

- [快速上手](./doc/handbook/tutorials/README.html)
  - [5 分钟了解 TypeScript](./doc/handbook/tutorials/TypeScript in 5 minutes.html)
  - [ASP.NET Core](./doc/handbook/tutorials/ASP.NET Core.html)
  - [ASP.NET 4](./doc/handbook/tutorials/ASP.NET 4.html)
  - [Gulp](./doc/handbook/tutorials/Gulp.html)
  - [Knockout.js](./doc/handbook/tutorials/Knockout.html)
  - [React 與 webpack](./doc/handbook/tutorials/React & Webpack.html)
  - [React](./doc/handbook/tutorials/React.html)
  - [Angular 2](./doc/handbook/tutorials/Angular 2.html)
  - [從 JavaScript 轉移到 TypeScript](./doc/handbook/tutorials/Migrating from JavaScript.html)
- [手册](./doc/handbook/README.html)
  - [基礎類型](./doc/handbook/Basic Types.html)
  - [變數宣告](./doc/handbook/Variable Declarations.html)
  - [介面(Interface)](./doc/handbook/Interfaces.html)
  - [類別(Class)](./doc/handbook/Classes.html)
  - [函數(Function)](./doc/handbook/Functions.html)
  - [泛型(Generics)](./doc/handbook/Generics.html)
  - [列舉(Enums)](./doc/handbook/Enums.html)
  - [類型參考](./doc/handbook/Type Inference.html)
  - [類型相容性](./doc/handbook/Type Compatibility.html)
  - [進階類型](./doc/handbook/Advanced Types.html)
  - [符號](./doc/handbook/Symbols.html)
  - [Iterators 和 Generators](./doc/handbook/Iterators and Generators.html)
  - [模組](./doc/handbook/Modules.html)
  - [命名空間](./doc/handbook/Namespaces.html)
  - [命名空間和模組](./doc/handbook/Namespaces and Modules.html)
  - [模組解析](./doc/handbook/Module Resolution.html)
  - [聲明合併](./doc/handbook/Declaration Merging.html)
  - [撰寫.d.ts 文件](./doc/handbook/Writing Definition Files.html)
  - [JSX](./doc/handbook/JSX.html)
  - [Decorators](./doc/handbook/Decorators.html)
  - [混入](./doc/handbook/Mixins.html)
  - [三斜線指令](./doc/handbook/Triple-Slash Directives.html)
  - [JavaScript 中的類型檢查](./doc/handbook/Type Checking JavaScript Files.html)
- [如何寫聲明文件](./doc/handbook/declaration files/Introduction.html)
  - [結構](./doc/handbook/declaration files/Library Structures.html)
  - [規範](./doc/handbook/declaration files/Do's and Don'ts.html)
  - [例子](./doc/handbook/declaration files/By Example.html)
  - [深入探討](./doc/handbook/declaration files/Deep Dive.html)
  - [發布](./doc/handbook/declaration files/Publishing.html)
  - [使用](./doc/handbook/declaration files/Consumption.html)
- [工程配置](./doc/handbook/tsconfig.json.html)
  - [tsconfig.json](./doc/handbook/tsconfig.json.html)
  - [NPM 中的類別](./doc/handbook/Typings for NPM Packages.html)
  - [編譯選項](./doc/handbook/Compiler Options.html)
  - [在 MSBuild 裡使用編譯選項](./doc/handbook/Compiler Options in MSBuild.html)
  - [與其它建構工具整合](./doc/handbook/Integrating with Build Tools.html)
  - [使用 TypeScript 的每日釋出版本](./doc/handbook/Nightly Builds.html)
- [Wiki](./doc/wiki/README.html)
  - [TypeScript 中的 this](./doc/wiki/this-in-TypeScript.html)
  - [程式規範](./doc/wiki/coding_guidelines.html)
  - [常見編譯錯誤](./doc/wiki/Common Errors.html)
  - [支持 TypeScript 的编辑器](./doc/wiki/TypeScript-Editor-Support.html)
  - [结合 ASP.NET v5 使用 TypeScript](./doc/wiki/Using-TypeScript-With-ASP.NET-5.html)
  - [架構概述](./doc/wiki/Architectural-Overview.html)
  - [發展路線圖](./doc/wiki/Roadmap.html)
- [新增功能](./doc/release-notes/README.html)
  - [TypeScript 2.8](./doc/release-notes/TypeScript 2.8.html)
  - [TypeScript 2.7](./doc/release-notes/TypeScript 2.7.html)
  - [TypeScript 2.6](./doc/release-notes/TypeScript 2.6.html)
  - [TypeScript 2.5](./doc/release-notes/TypeScript 2.5.html)
  - [TypeScript 2.4](./doc/release-notes/TypeScript 2.4.html)
  - [TypeScript 2.3](./doc/release-notes/TypeScript 2.3.html)
  - [TypeScript 2.2](./doc/release-notes/TypeScript 2.2.html)
  - [TypeScript 2.1](./doc/release-notes/TypeScript 2.1.html)
  - [TypeScript 2.0](./doc/release-notes/TypeScript 2.0.html)
  - [TypeScript 1.8](./doc/release-notes/TypeScript 1.8.html)
  - [TypeScript 1.7](./doc/release-notes/TypeScript 1.7.html)
  - [TypeScript 1.6](./doc/release-notes/TypeScript 1.6.html)
  - [TypeScript 1.5](./doc/release-notes/TypeScript 1.5.html)
  - [TypeScript 1.4](./doc/release-notes/TypeScript 1.4.html)
  - [TypeScript 1.3](./doc/release-notes/TypeScript 1.3.html)
  - [TypeScript 1.1](./doc/release-notes/TypeScript 1.1.html)
- [Breaking Changes](./doc/breaking-changes/breaking-changes.html)
  - [TypeScript 2.3](./doc/breaking-changes/TypeScript 2.3.html)
  - [TypeScript 2.2](./doc/breaking-changes/TypeScript 2.2.html)
  - [TypeScript 2.1](./doc/breaking-changes/TypeScript 2.1.html)
  - [TypeScript 2.0](./doc/breaking-changes/TypeScript 2.0.html)
  - [TypeScript 1.8](./doc/breaking-changes/TypeScript 1.8.html)
  - [TypeScript 1.7](./doc/breaking-changes/TypeScript 1.7.html)
  - [TypeScript 1.6](./doc/breaking-changes/TypeScript 1.6.html)
  - [TypeScript 1.5](./doc/breaking-changes/TypeScript 1.5.html)
  - [TypeScript 1.4](./doc/breaking-changes/TypeScript 1.4.html)

## 主要修改 (Latest 5 updates)

- 2017-11-07 新增章节：[JavaScript 中的類型檢查](./doc/handbook/Type Checking JavaScript Files.html)
- 2017-05-16 新增章节：[教程-5 分鐘了解 TypeScript](./doc/handbook/tutorials/TypeScript in 5 minutes.html)
- 2017-05-01 新增章节：[教程-React](./doc/handbook/tutorials/React.html)
- 2016-11-27 新增章节：[使用`/// <reference types="..." />`](./doc/handbook/Triple-Slash Directives.html)
- 2016-11-23 新增章节：[變數聲明 - ](./doc/handbook/Variable Declarations.html)
- 2016-10-23 新增章节：[高級類別 - ](./doc/handbook/Advanced Types.html)

## 相關連結

- [TypeScript 官網](http://typescriptlang.org)
- [TypeScript on Github](https://github.com/Microsoft/TypeScript)
- [TypeScript 語言規範](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)
- [本手册中文版 Github 地址](https://github.com/skytim/TypeScript)
- [本手册原位置 Github 地址](https://github.com/zhongsp/TypeScript)
