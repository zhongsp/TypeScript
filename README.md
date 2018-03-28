# TypeScript

[![Build Status](https://travis-ci.org/zhongsp/TypeScript.svg?branch=master)](https://travis-ci.org/zhongsp/TypeScript) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

<img src="./misc/ts_logo.jpg" alt="TypeScript" width="24px" height="24px" style="vertical-align: bottom;">  [TypeScript 2.8 (March 27, 2018)](https://blogs.msdn.microsoft.com/typescript/2018/03/27/announcing-typescript-2-8/)

* 条件性类型（Conditional Types）
* 新增标记：仅输出声明文件
* @jsx编译注释
* JSX将使用工厂函数进行解析
* Map类型修饰符上的细粒度控制
* 重新组织导入语句
* 快速修复未初始化属性

TypeScript是JavaScript的超集并且能够编译输出为纯粹的JavaScript.

请阅读 :book: [TypeScript Handbook 中文版 - Published with GitBook](http://zhongsp.gitbooks.io/typescript-handbook/content/)

:link: [一大波新的快速开始指南：React，Angular，Nodejs，ASP.NET Core，React Native，Vue，Glimmer，WeChat，Dojo2，Knockout等](./doc/quick-start/README.md)

## 目录

* [快速上手](./doc/handbook/tutorials/README.md)
  * [5分钟了解TypeScript](./doc/handbook/tutorials/TypeScript%20in%205%20minutes.md)
  * [ASP.NET Core](./doc/handbook/tutorials/ASP.NET%20Core.md)
  * [ASP.NET 4](./doc/handbook/tutorials/ASP.NET%204.md)
  * [Gulp](./doc/handbook/tutorials/Gulp.md)
  * [Knockout.js](./doc/handbook/tutorials/Knockout.md)
  * [React与webpack](./doc/handbook/tutorials/React%20&%20Webpack.md)
  * [React](./doc/handbook/tutorials/React.md)
  * [Angular 2](./doc/handbook/tutorials/Angular%202.md)
  * [从JavaScript迁移到TypeScript](./doc/handbook/tutorials/Migrating%20from%20JavaScript.md)
* [手册](./doc/handbook/README.md)
  * [基础类型](./doc/handbook/Basic%20Types.md)
  * [变量声明](./doc/handbook/Variable%20Declarations.md)
  * [接口](./doc/handbook/Interfaces.md)
  * [类](./doc/handbook/Classes.md)
  * [函数](./doc/handbook/Functions.md)
  * [泛型](./doc/handbook/Generics.md)
  * [枚举](./doc/handbook/Enums.md)
  * [类型推论](./doc/handbook/Type%20Inference.md)
  * [类型兼容性](./doc/handbook/Type%20Compatibility.md)
  * [高级类型](./doc/handbook/Advanced%20Types.md)
  * [Symbols](./doc/handbook/Symbols.md)
  * [Iterators 和 Generators](./doc/handbook/Iterators%20and%20Generators.md)
  * [模块](./doc/handbook/Modules.md)
  * [命名空间](./doc/handbook/Namespaces.md)
  * [命名空间和模块](./doc/handbook/Namespaces%20and%20Modules.md)
  * [模块解析](./doc/handbook/Module%20Resolution.md)
  * [声明合并](./doc/handbook/Declaration%20Merging.md)
  * [书写.d.ts文件](./doc/handbook/Writing%20Definition%20Files.md)
  * [JSX](./doc/handbook/JSX.md)
  * [Decorators](./doc/handbook/Decorators.md)
  * [混入](./doc/handbook/Mixins.md)
  * [三斜线指令](./doc/handbook/Triple-Slash%20Directives.md)
  * [JavaScript文件里的类型检查](./doc/handbook/Type%20Checking%20JavaScript%20Files.md)
* [如何书写声明文件](./doc/handbook/declaration%20files/Introduction.md)
  * [结构](./doc/handbook/declaration%20files/Library%20Structures.md)
  * [规范](./doc/handbook/declaration%20files/Do's%20and%20Don'ts.md)
  * [举例](./doc/handbook/declaration%20files/By%20Example.md)
  * [深入](./doc/handbook/declaration%20files/Deep%20Dive.md)
  * [发布](./doc/handbook/declaration%20files/Publishing.md)
  * [使用](./doc/handbook/declaration%20files/Consumption.md)
* [工程配置](./doc/handbook/tsconfig.json.md)
  * [tsconfig.json](./doc/handbook/tsconfig.json.md)
  * [NPM包的类型](./doc/handbook/Typings%20for%20NPM%20Packages.md)
  * [编译选项](./doc/handbook/Compiler%20Options.md)
  * [在MSBuild里使用编译选项](./doc/handbook/Compiler%20Options%20in%20MSBuild.md)
  * [与其它构建工具整合](./doc/handbook/Integrating%20with%20Build%20Tools.md)
  * [使用TypeScript的每日构建版本](./doc/handbook/Nightly%20Builds.md)
* [Wiki](./doc/wiki/README.md)
  * [TypeScript里的this](./doc/wiki/this-in-TypeScript.md)
  * [编码规范](./doc/wiki/coding_guidelines.md)
  * [常见编译错误](./doc/wiki/Common%20Errors.md)
  * [支持TypeScript的编辑器](./doc/wiki/TypeScript-Editor-Support.md)
  * [结合ASP.NET v5使用TypeScript](./doc/wiki/Using-TypeScript-With-ASP.NET-5.md)
  * [架构概述](./doc/wiki/Architectural-Overview.md)
  * [发展路线图](./doc/wiki/Roadmap.md)
* [新增功能](./doc/release-notes/README.md)
  * [TypeScript 2.7](./doc/release-notes/TypeScript%202.7.md)
  * [TypeScript 2.6](./doc/release-notes/TypeScript%202.6.md)
  * [TypeScript 2.5](./doc/release-notes/TypeScript%202.5.md)
  * [TypeScript 2.4](./doc/release-notes/TypeScript%202.4.md)
  * [TypeScript 2.3](./doc/release-notes/TypeScript%202.3.md)
  * [TypeScript 2.2](./doc/release-notes/TypeScript%202.2.md)
  * [TypeScript 2.1](./doc/release-notes/TypeScript%202.1.md)
  * [TypeScript 2.0](./doc/release-notes/TypeScript%202.0.md)
  * [TypeScript 1.8](./doc/release-notes/TypeScript%201.8.md)
  * [TypeScript 1.7](./doc/release-notes/TypeScript%201.7.md)
  * [TypeScript 1.6](./doc/release-notes/TypeScript%201.6.md)
  * [TypeScript 1.5](./doc/release-notes/TypeScript%201.5.md)
  * [TypeScript 1.4](./doc/release-notes/TypeScript%201.4.md)
  * [TypeScript 1.3](./doc/release-notes/TypeScript%201.3.md)
  * [TypeScript 1.1](./doc/release-notes/TypeScript%201.1.md)
* [Breaking Changes](./doc/breaking-changes/breaking-changes.md)
  * [TypeScript 2.3](./doc/breaking-changes/TypeScript%202.3.md)
  * [TypeScript 2.2](./doc/breaking-changes/TypeScript%202.2.md)
  * [TypeScript 2.1](./doc/breaking-changes/TypeScript%202.1.md)
  * [TypeScript 2.0](./doc/breaking-changes/TypeScript%202.0.md)
  * [TypeScript 1.8](./doc/breaking-changes/TypeScript%201.8.md)
  * [TypeScript 1.7](./doc/breaking-changes/TypeScript%201.7.md)
  * [TypeScript 1.6](./doc/breaking-changes/TypeScript%201.6.md)
  * [TypeScript 1.5](./doc/breaking-changes/TypeScript%201.5.md)
  * [TypeScript 1.4](./doc/breaking-changes/TypeScript%201.4.md)

**TypeScript Handbook**

* Read [TypeScript Handbook (Recommended, BUT not up to date officially)](http://www.typescriptlang.org/Handbook)
* Read [TypeScript手册中文版 - Published with GitBook（持续更新中，最新版）](http://zhongsp.gitbooks.io/typescript-handbook/content/):book:

**TypeScript Language Specification**

* Read [TypeScript Language Specification](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)

I'd love for you to contribute to the translation:)
