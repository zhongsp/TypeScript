# TypeScript 手册

## 关于本手册

引入编程社区以来的 20 多年后，JavaScript 现在是最广泛使用的跨平台语言之一。JavaScript 最初是一个用于为网页添加简单交互的脚本语言，但现在已经发展成为前端和后端应用程序的首选语言，无论规模大小。尽管 JavaScript 程序的大小、范围和复杂性呈指数级增长，但 JavaScript 语言表达代码单元之间关系的能力并没有相应增长。再加上 JavaScript 具有相当特殊的运行时语义，这种语言和程序复杂性之间的不匹配使得 JavaScript 开发在规模较大时变得困难。

程序员常犯的最常见错误是类型错误：在期望使用某种类型的值时使用了另外一种类型的值。这可能是由于简单的拼写错误、未理解库的 API、对运行时行为的错误假设或其他错误导致的。TypeScript 的目标是成为 JavaScript 程序的静态类型检查器，也就是说，在你的代码运行之前（静态）运行的工具，确保程序的类型是正确的（类型检查）。

如果你没有 JavaScript 背景，打算把 TypeScript 作为你的第一门语言学习，我们建议你首先阅读 [微软 JavaScript 学习教程](https://developer.microsoft.com/javascript/)或阅读 [Mozilla Web 文档中的 JavaScript](https://developer.mozilla.org/docs/Web/JavaScript/Guide) 教程。

如果你有其他语言的经验，通过阅读本手册，你应该能够很快掌握 JavaScript 语法。

## 本手册结构

本手册分为两个部分：

- **手册**

  TypeScript 手册旨在向普通程序员详细解释 TypeScript。你可以按照左侧导航从上到下阅读手册。

  每个章节或页面都能让你对给定概念获得深入理解。TypeScript 手册不是完整的语言规范，但它旨在成为语言的所有特性和行为的全面指南。

  完成手册阅读的读者应该能够：

  - 阅读和理解常用的 TypeScript 语法和模式
  - 解释重要编译器选项的影响
  - 在大多数情况下正确预测类型系统的行为

  为了清晰和简洁起见，手册的主要内容不会探讨特性的每个细枝末节。你可以在参考文章中找到有关特定概念的更多详细信息。

- **参考文件**

  手册下方导航栏中的参考部分旨在提供对 TypeScript 的特定部分如何工作的更深入理解。你可完整阅读它，但每个部分都只是旨在更详细地解释某个特定概念，因此没有连续性的要求。

### 非目标

本手册还旨在成为一份简明的文档，你可以在几个小时内轻松阅读完成。为了保持简洁，某些主题将不会涉及。

具体来说，本手册不会完全介绍核心 JavaScript 基础知识，如函数、类和闭包。在适当的情况下，我们将提供背景相关的链接，你可以用来了解这些概念。

本手册也不打算替代语言规范。在某些情况下，会跳过边界情况或形式化行为描述，而选择使用概括、易于理解的解释。相反，有单独的参考页面更准确、更形式地描述 TypeScript 的许多方面的行为。参考页面不是为不熟悉 TypeScript 的读者准备的，因此可能会使用高级术语或引用你尚未阅读过的主题。

最后，本手册不会涵盖 TypeScript 与其他工具的交互方式，除非有必要。像如何使用 webpack、rollup、parcel、react、babel、closure、lerna、rush、bazel、preact、vue、angular、svelte、jquery、yarn 或 npm 配置 TypeScript 这样的主题超出了范围——你可以在网络上的其他地方找到这些资源。

## 开始学习

在开始学习[基础知识](/docs/handbook/2/basic-types.html)之前，我们建议挑一个以下介绍页面阅读。这些介绍旨在突出 TypeScript 与你喜欢的编程语言之间的主要相似性和差异，并澄清与这些语言特定的常见误解。

- [适用于新程序员的 TypeScript](/docs/handbook/typescript-from-scratch.html)
- [适用于 JavaScript 程序员的 TypeScript](/docs/handbook/typescript-in-5-minutes.html)
- [适用于 Java/C# 程序员的 TypeScript](/docs/handbook/typescript-in-5-minutes-oop.html)
- [适用于函数式程序员的 TypeScript](/docs/handbook/typescript-in-5-minutes-func.html)

否则，你可以直接跳转到[基础知识](/docs/handbook/2/basic-types.html) 部分。
