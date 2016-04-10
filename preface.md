# TypeScript Handbook（中文版）

> 从前打心眼儿里讨厌编译成JavaScript的这类语言，像Coffee，Dart等。
> 但是在15年春节前后却爱上了TypeScript。
> 同时非常喜欢的框架Dojo，Angularjs也宣布使用TypeScript做新版本的开发。
> 那么TypeScript究竟为何物？又有什么魅力呢？

TypeScript是Microsoft公司注册商标。

TypeScript具有类型系统，且是JavaScript的超集。
它可以编译成普通的JavaScript代码。
TypeScript支持任意浏览器，任意环境，任意系统并且是开源的。

TypeScript目前还在积极的开发完善之中，不断地会有新的特性加入进来。
因此本手册也会紧随官方的每个commit，不断地更新新的章节以及修改措词不妥之处。

如果你对TypeScript一见钟情，可以订阅~~and star~~本手册，及时了解ECMAScript 2015以及2016里新的原生特性，并借助TypeScript提前掌握使用它们的方式！
如果你对TypeScript的爱愈发浓烈，可以与楼主一起边翻译边学习，*[PRs Welcome!!!](https://github.com/zhongsp/TypeScript/pulls)*
在[相关链接](#相关链接)的末尾可以找到本手册的[Github地址](https://github.com/zhongsp/TypeScript)。


## 目录

* [快速上手](./doc/handbook/quick-start/README.html)
  * [React与webpack](./doc/handbook/quick-start/react-webpack.html)
  * [ASP.NET 4](./doc/handbook/quick-start/asp-net.html)
* [新增功能](./doc/release-notes/README.html)
  * [TypeScript 1.4](./doc/release-notes/TypeScript 1.4.html)
  * [TypeScript 1.3](./doc/release-notes/TypeScript 1.3.html)
  * [TypeScript 1.1](./doc/release-notes/TypeScript 1.1.html)
* [手册](./doc/handbook/README.html)
  * [基础类型](./doc/handbook/Basic Types.html)
  * [枚举](./doc/handbook/Enums.html)
  * [变量声明](./doc/handbook/Variable Declarations.html)
  * [接口](./doc/handbook/Interfaces.html)
  * [高级类型](./doc/handbook/Advanced Types.html)
  * [类](./doc/handbook/Classes.html)
  * [命名空间和模块](./doc/handbook/Namespaces and Modules.html)
  * [命名空间](./doc/handbook/Namespaces.html)
  * [模块](./doc/handbook/Modules.html)
  * [模块解析](./doc/handbook/Module Resolution.html)
  * [函数](./doc/handbook/Functions.html)
  * [泛型](./doc/handbook/Generics.html)
  * [混入](./doc/handbook/Mixins.html)
  * [声明合并](./doc/handbook/Declaration Merging.html)
  * [类型推论](./doc/handbook/Type Inference.html)
  * [类型兼容性](./doc/handbook/Type Compatibility.html)
  * [书写.d.ts文件](./doc/handbook/Writing Definition Files.html)
  * [Iterators 和 Generators](./doc/handbook/Iterators and Generators.html)
  * [Symbols](./doc/handbook/Symbols.html)
  * [Decorators](./doc/handbook/Decorators.html)
  * [JSX](./doc/handbook/JSX.html)
* [工程配置](./doc/handbook/README.html)
  * [tsconfig.json](./doc/handbook/tsconfig.json.html)
  * [NPM包的类型](./doc/handbook/Typings for NPM Packages.html)
  * [编译选项](./doc/handbook/Compiler Options.html)
  * [在MSBuild里使用编译选项](./doc/handbook/Compiler Options in MSBuild.html)
  * [与其它构建工具整合](./doc/handbook/Integrating with Build Tools.html)
* [Wiki](./doc/wiki/README.html)
  * [TypeScript里的this](./doc/wiki/this-in-TypeScript.html)
  * [编码规范](./doc/wiki/coding_guidelines.html)
  * [常见编译错误](./doc/wiki/Common Errors.html)
  * [支持TypeScript的编辑器](./doc/wiki/TypeScript-Editor-Support.html)
  * [结合ASP.NET v5使用TypeScript](./doc/wiki/Using-TypeScript-With-ASP.NET-5.html)
  * [架构概述](./doc/wiki/Architectural-Overview.html)
  * [发展路线图](./doc/wiki/Roadmap.html)


## 主要修改 (Latest 10 updates)

* 2016-04-02 新增章节：[模块解析](./doc/handbook/Module Resolution.html)
* 2016-04-01 新增特性：[多态的`this`类型](./doc/handbook/Advanced Types.html)
* 2016-04-01 新增特性：[字符串字面量类型](./doc/handbook/Advanced Types.html)
* 2016-02-27 新增章节：快速上手[React和webpack](./doc/handbook/quick-start/react-webpack.html)
* 2016-01-31 新增章节：[TypeScript里的this](./doc/wiki/this-in-TypeScript.html)
* 2016-01-24 新增章节：[发展路线图](./doc/wiki/Roadmap.html)
* 2016-01-23 新增章节：[编码规范](./doc/wiki/coding_guidelines.html)
* 2016-01-23 新增章节：[架构概述](./doc/wiki/Architectural-Overview.html)
* 2015-12-27 新增章节：[结合ASP.NET v5使用TypeScript](./doc/wiki/Using-TypeScript-With-ASP.NET-5.html)
* 2015-12-26 新增章节：[支持TypeScript的编辑器](./doc/wiki/TypeScript-Editor-Support.html)


## 相关链接

* [TypeScript官网](http://typescriptlang.org)
* [TypeScript on Github](https://github.com/Microsoft/TypeScript)
* [TypeScript语言规范](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)
* [本手册中文版Github地址](https://github.com/zhongsp/TypeScript)
