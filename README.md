# TypeScript

[![Build Status](https://travis-ci.org/zhongsp/TypeScript.svg?branch=master)](https://travis-ci.org/zhongsp/TypeScript) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## 上新！

之前有许多小伙伴提出希望能将该手册发布为**Book**，
近来该项目又持续不断地有新的朋友关注，
因此现将所有文档整理发布为**图书**样式。希望大家能够喜欢!

线上阅读地址：[http://zhongsp.github.io/TypeScript](http://zhongsp.github.io/TypeScript)

---

🏮 祝所有开发者：牛年大吉！🏮

<img src="./zh/misc/ts_logo.jpg" alt="TypeScript" width="24px" height="24px" style="vertical-align: bottom;">  [TypeScript 4.7 (2022年5月24日)](https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/)
|
[版本发布说明](zh/release-notes/typescript-4.7.md)

:heavy_check_mark: TypeScript语言用于大规模应用的JavaScript开发。  :heavy_check_mark: TypeScript支持类型，是JavaScript的超集且可以编译成纯JavaScript代码。  :heavy_check_mark: TypeScript兼容所有浏览器，所有宿主环境，所有操作系统。  :heavy_check_mark: TypeScript是开源的。

:new::new::new:

<a href="https://github.com/zhongsp/TypeScript/issues/310"><img src="./zh/misc/ts-intro.png" alt="TypeScript入门与实战" width="200px" height="200px" style="vertical-align: bottom;"></a>  `ISBN 9787111669722`

各位朋友们，本人近期出版了[《TypeScript入门与实战》](https://github.com/zhongsp/TypeScript/issues/310)一书。在该书中，尝试着尽可能完整地介绍TypeScript语言的基础知识，并结合了一些本人的使用经验和体会。它主要面向的是TypeScript语言的初级和中级使用者。

本人还处于TypeScript语言的学习阶段，可能存在理解错误的地方，还请大家指正，一起进步。此外，由于这是本人人生中出版的第一本书，难免会有纰漏，请大家多多包涵！

<img src="./zh/misc/reward.jpg" alt="Reward the Author" width="200px" height="200px" style="vertical-align: bottom;">

如果觉得不错可以微信打赏哟 <3

## 目录

* [快速上手](zh/tutorials/README.md)
  * [5分钟了解TypeScript](zh/tutorials/typescript-in-5-minutes.md)
  * [ASP.NET Core](zh/tutorials/asp.net-core.md)
  * [ASP.NET 4](zh/tutorials/asp.net-4.md)
  * [Gulp](zh/tutorials/gulp.md)
  * [Knockout.js](zh/tutorials/knockout.md)
  * [React与webpack](zh/tutorials/react-and-webpack.md)
  * [React](zh/tutorials/react.md)
  * [Angular 2](zh/tutorials/angular-2.md)
  * [从JavaScript迁移到TypeScript](zh/tutorials/migrating-from-javascript.md)
* [手册](zh/handbook/README.md)
  * [基础类型](zh/handbook/basic-types.md)
  * [接口](zh/handbook/interfaces.md)
  * [函数](zh/handbook/functions.md)
  * [字面量类型](zh/handbook/literal-types.md)
  * _@todo 联合类型和交叉类型_
  * [类](zh/handbook/classes.md)
  * [枚举](zh/handbook/enums.md)
  * [泛型](zh/handbook/generics.md)
* [手册（进阶）](zh/reference/README.md)
  * [高级类型](zh/reference/advanced-types.md)
  * [实用工具类型](zh/reference/utility-types.md)
  * [Decorators](zh/reference/decorators.md)
  * [声明合并](zh/reference/declaration-merging.md)
  * [Iterators 和 Generators](zh/reference/iterators-and-generators.md)
  * [JSX](zh/reference/jsx.md)
  * [混入](zh/reference/mixins.md)
  * [模块](zh/reference/modules.md)
  * [模块解析](zh/reference/module-resolution.md)
  * [命名空间](zh/reference/namespaces.md)
  * [命名空间和模块](zh/reference/namespaces-and-modules.md)
  * [Symbols](zh/reference/symbols.md)
  * [三斜线指令](zh/reference/triple-slash-directives.md)
  * [类型兼容性](zh/reference/type-compatibility.md)
  * [类型推论](zh/reference/type-inference.md)
  * [变量声明](zh/reference/variable-declarations.md)
* 手册（v2）
  * [模版字面量类型](zh/handbook-v2/type-manipulation/template-literal-types.md)
* [如何书写声明文件](zh/declaration-files/README.md)
  * [介绍](zh/declaration-files/introduction.md)
  * [举例](zh/declaration-files/by-example.md)
  * [库结构](zh/declaration-files/library-structures.md)
  * [模板](zh/declaration-files/templates.md)
  * [最佳实践](zh/declaration-files/do-s-and-don-ts.md)
  * [深入](zh/declaration-files/deep-dive.md)
  * [发布](zh/declaration-files/publishing.md)
  * [使用](zh/declaration-files/consumption.md)
* JavaScript
  * [JavaScript文件里的类型检查](zh/javascript/type-checking-javascript-files.md)
* [工程配置](zh/project-config/README.md)
  * [tsconfig.json](zh/project-config/tsconfig.json.md)
  * [工程引用](zh/project-config/project-references.md)
  * [NPM包的类型](zh/project-config/typings-for-npm-packages.md)
  * [编译选项](zh/project-config/compiler-options.md)
  * [配置 Watch](zh/project-config/configuring-watch.md)
  * [在MSBuild里使用编译选项](zh/project-config/compiler-options-in-msbuild.md)
  * [与其它构建工具整合](zh/project-config/integrating-with-build-tools.md)
  * [使用TypeScript的每日构建版本](zh/project-config/nightly-builds.md)
* [Wiki](zh/wiki/README.md)
  * [TypeScript里的this](zh/wiki/this-in-typescript.md)
  * [编码规范](zh/wiki/coding_guidelines.md)
  * [常见编译错误](zh/wiki/common-errors.md)
  * [支持TypeScript的编辑器](zh/wiki/typescript-editor-support.md)
  * [结合ASP.NET v5使用TypeScript](zh/wiki/using-typescript-with-asp.net-5.md)
  * [架构概述](zh/wiki/architectural-overview.md)
  * [发展路线图](zh/wiki/roadmap.md)
* [新增功能](zh/release-notes/README.md)
  * [TypeScript 4.7](zh/release-notes/typescript-4.7.md)
  * [TypeScript 4.6](zh/release-notes/typescript-4.6.md)
  * [TypeScript 4.5](zh/release-notes/typescript-4.5.md)
  * [TypeScript 4.4](zh/release-notes/typescript-4.4.md)
  * [TypeScript 4.3](zh/release-notes/typescript-4.3.md)
  * [TypeScript 4.2](zh/release-notes/typescript-4.2.md)
  * [TypeScript 4.1](zh/release-notes/typescript-4.1.md)
  * [TypeScript 4.0](zh/release-notes/typescript-4.0.md)
  * [TypeScript 3.9](zh/release-notes/typescript-3.9.md)
  * [TypeScript 3.8](zh/release-notes/typescript-3.8.md)
  * [TypeScript 3.7](zh/release-notes/typescript-3.7.md)
  * [TypeScript 3.6](zh/release-notes/typescript-3.6.md)
  * [TypeScript 3.5](zh/release-notes/typescript-3.5.md)
  * [TypeScript 3.4](zh/release-notes/typescript-3.4.md)
  * [TypeScript 3.3](zh/release-notes/typescript-3.3.md)
  * [TypeScript 3.2](zh/release-notes/typescript-3.2.md)
  * [TypeScript 3.1](zh/release-notes/typescript-3.1.md)
  * [TypeScript 3.0](zh/release-notes/typescript-3.0.md)
  * [TypeScript 2.9](zh/release-notes/typescript-2.9.md)
  * [TypeScript 2.8](zh/release-notes/typescript-2.8.md)
  * [TypeScript 2.7](zh/release-notes/typescript-2.7.md)
  * [TypeScript 2.6](zh/release-notes/typescript-2.6.md)
  * [TypeScript 2.5](zh/release-notes/typescript-2.5.md)
  * [TypeScript 2.4](zh/release-notes/typescript-2.4.md)
  * [TypeScript 2.3](zh/release-notes/typescript-2.3.md)
  * [TypeScript 2.2](zh/release-notes/typescript-2.2.md)
  * [TypeScript 2.1](zh/release-notes/typescript-2.1.md)
  * [TypeScript 2.0](zh/release-notes/typescript-2.0.md)
  * [TypeScript 1.8](zh/release-notes/typescript-1.8.md)
  * [TypeScript 1.7](zh/release-notes/typescript-1.7.md)
  * [TypeScript 1.6](zh/release-notes/typescript-1.6.md)
  * [TypeScript 1.5](zh/release-notes/typescript-1.5.md)
  * [TypeScript 1.4](zh/release-notes/typescript-1.4.md)
  * [TypeScript 1.3](zh/release-notes/typescript-1.3.md)
  * [TypeScript 1.1](zh/release-notes/typescript-1.1.md)
* [Breaking Changes](zh/breaking-changes/README.md)
  * [TypeScript 3.6](zh/breaking-changes/typescript-3.6.md)
  * [TypeScript 3.5](zh/breaking-changes/typescript-3.5.md)
  * [TypeScript 3.4](zh/breaking-changes/typescript-3.4.md)
  * [TypeScript 3.2](zh/breaking-changes/typescript-3.2.md)
  * [TypeScript 3.1](zh/breaking-changes/typescript-3.1.md)
  * [TypeScript 3.0](zh/breaking-changes/typescript-3.0.md)
  * [TypeScript 2.9](zh/breaking-changes/typescript-2.9.md)
  * [TypeScript 2.8](zh/breaking-changes/typescript-2.8.md)
  * [TypeScript 2.7](zh/breaking-changes/typescript-2.7.md)
  * [TypeScript 2.6](zh/breaking-changes/typescript-2.6.md)
  * [TypeScript 2.4](zh/breaking-changes/typescript-2.4.md)
  * [TypeScript 2.3](zh/breaking-changes/typescript-2.3.md)
  * [TypeScript 2.2](zh/breaking-changes/typescript-2.2.md)
  * [TypeScript 2.1](zh/breaking-changes/typescript-2.1.md)
  * [TypeScript 2.0](zh/breaking-changes/typescript-2.0.md)
  * [TypeScript 1.8](zh/breaking-changes/typescript-1.8.md)
  * [TypeScript 1.7](zh/breaking-changes/typescript-1.7.md)
  * [TypeScript 1.6](zh/breaking-changes/typescript-1.6.md)
  * [TypeScript 1.5](zh/breaking-changes/typescript-1.5.md)
  * [TypeScript 1.4](zh/breaking-changes/typescript-1.4.md)

**TypeScript手册官方英文版**

* [TypeScript手册（英文版）](http://www.typescriptlang.org/docs/home.html)

**TypeScript语言规范**

* [TypeScript语言规范](https://github.com/microsoft/TypeScript/blob/master/doc/spec-ARCHIVED.md)

期待你为翻译做出贡献:)
