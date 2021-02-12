声明文件一章的目的是教你如何编写高质量的 TypeScript 声明文件。
我们假设你对 TypeScript 已经有了基本的了解。

如果没有，请先阅读[TypeScript 手册](../handbook/basic-types.md) 来了解一些基本知识，尤其是类型和模块的部分。

需要编写`.d.ts`文件的常见场景是为某个 npm 包添加类型信息。
如果是这种情况，你可以直接阅读[Modules .d.ts](./templates/module.d.ts.md)

这篇指南被分成了以下章节。

## [示例](./by-example.md)

在编写声明文件时，我们经常遇到以下情况，那就是需要根据代码库提供的示例来编写声明文件。
[示例](./by-example.md)一节展示了了许多常见的 API 模式，以及如何为它们编写声明文件。
该指南面向的是 TypeScript 的初学者，这些人可能并不熟悉 TypeScript 语言的每个特性。

## [结构](./library-structures.md)

[结构](./library-structures.md)一节将帮助你了解常见库的格式以及如何为每种格式书写正确的声明文件。
如果你正在编辑一个已有文件，那么你可能不需要阅读此章节。
如果你在编写新的声明文件，那么强烈建议阅读此章节以理解库的不同格式是如何影响声明文件的编写的。

## [模版](./templates.md)

在[模版](./templates.md)一节里，你能找到一些声明文件，它们对于编写新的声明文件来讲会有所帮助。
如果你已经了解了库的结构，那么可以阅读相应的模版文件：

-   [global-modifying-module.d.ts](templates/global-modifying-module.d.ts.md)
-   [global-plugin.d.ts](templates/global-plugin.d.ts.md)
-   [global.d.ts](templates/global.d.ts.md)
-   [module-class.d.ts](templates/module-class.d.ts.md)
-   [module-function.d.ts](templates/module-function.d.ts.md)
-   [module-plugin.d.ts](templates/module-plugin.d.ts.md)
-   [module.d.ts](templates/module.d.ts.md)

## [规范](./do-s-and-don-ts.md)

声明文件里有些常见错误是很容易就可以避免的。
[规范](./do-s-and-don-ts.md)一节列出了常见的错误，并且描述了如何检测以及修复它们。
每个人都应该阅读这个章节以了解如何避免常见错误。

## [深入](./deep-dive.md)

针对那些对声明文件底层工作机制感兴趣的老手们，[深入](./deep-dive.md)一节解释了编写声明文件时的很多高级概念，
并且展示了如何利用这些概念来创建整洁和直观的声明文件。

## [发布到 npm](./publishing.md)

[发布](./publishing.md)一节讲解了如何将声明文件发布为 npm 包，以及如何管理包的依赖。

## [查找与安装声明文件](./consumption.md)

对于 JavaScript 库的使用者来讲，[使用](./consumption.md)一节提供了一些简单步骤来查找与安装相应的声明文件。
