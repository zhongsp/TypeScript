工程引用是TypeScript 3.0的新特性，它支持将TypeScript程序的结构分割成更小的组成部分。

这样可以改善构建时间，强制在逻辑上对组件进行分离，更好地组织你的代码。

TypeScript 3.0还引入了`tsc`的一种新模式，即`--build`标记，它与工程引用协同工作可以加速TypeScript的构建。

# 一个工程示例

让我们来看一个非常普通的工程，并瞧瞧工程引用特性是如何帮助我们更好地组织代码的。
假设这个工程具有两个模块：`converter`和`unites`，以及相应的测试代码：

```shell
/src/converter.ts
/src/units.ts
/test/converter-tests.ts
/test/units-tests.ts
/tsconfig.json
```

测试文件导入相应的实现文件并进行测试：

```ts
// converter-tests.ts
import * as converter from "../converter";

assert.areEqual(converter.celsiusToFahrenheit(0), 32);
```

在之前，这种使用单一`tsconfig`文件的结构会稍显笨拙：

* 实现文件也可以导入测试文件
* 无法同时构建`test`和`src`，除非把`src`也放在输出文件夹中，但通常并不想这样做
* 仅对实现文件的*内部*细节进行改动，必需再次对测试进行*类型检查*，尽管这是根本不必要的
* 仅对测试文件进行改动，必需再次对实现文件进行*类型检查*，尽管其实什么都没有变

你可以使用多个`tsconfig`文件来解决*部分*问题，但是又会出现新问题：

* 缺少内置的实时检查，因此你得多次运行`tsc`
* 多次调用`tsc`会增加我们等待的时间
* `tsc -w`不能一次在多个配置文件上运行

工程引用可以解决全部这些问题，而且还不止。

# 何为工程引用？

`tsconfig.json`增加了一个新的顶层属性`references`。它是一个对象的数组，指明要引用的工程：

```js
{
    "compilerOptions": {
        // The usual
    },
    "references": [
        { "path": "../src" }
    ]
}
```

每个引用的`path`属性都可以指向到包含`tsconfig.json`文件的目录，或者直接指向到配置文件本身（名字是任意的）。

当你引用一个工程时，会发生下面的事：

* 导入引用工程中的模块实际加载的是它*输出*的声明文件（`.d.ts`）。
* 如果引用的工程生成一个`outFile`，那么这个输出文件的`.d.ts`文件里的声明对于当前工程是可见的。
* 构建模式（后文）会根据需要自动地构建引用的工程。

当你拆分成多个工程后，会显著地加速类型检查和编译，减少编辑器的内存占用，还会改善程序在逻辑上进行分组。

# `composite`

引用的工程必须启用新的`composite`设置。
这个选项用于帮助TypeScript快速确定引用工程的输出文件位置。
若启用`composite`标记则会发生如下变动：

* 对于`rootDir`设置，如果没有被显式指定，默认为包含`tsconfig`文件的目录
* 所有的实现文件必须匹配到某个`include`模式或在`files`数组里列出。如果违反了这个限制，`tsc`会提示你哪些文件未指定。
* 必须开启`declaration`选项。

# `declarationMaps`

我们增加了对[declaration source maps](https://github.com/Microsoft/TypeScript/issues/14479)的支持。
如果启用`--declarationMap`，在某些编辑器上，你可以使用诸如“Go to Definition”，重命名以及跨工程编辑文件等编辑器特性。

# 带`prepend`的`outFile`

你可以在引用中使用`prepend`选项来启用前置某个依赖的输出：

```js
   "references": [
       { "path": "../utils", "prepend": true }
   ]
```

前置工程会将工程的输出添加到当前工程的输出之前。
它对`.js`文件和`.d.ts`文件都有效，`source map`文件也同样会正确地生成。

`tsc`永远只会使用磁盘上已经存在的文件来进行这个操作，因此你可能会创建出一个无法生成正确输出文件的工程，因为有些工程的输出可能会在结果文件中重覆了多次。
例如：

```txt
   A
  ^ ^
 /   \
B     C
 ^   ^
  \ /
   D
```

这种情况下，不能前置引用，因为在`D`的最终输出里会有两份`A`存在 - 这可能会发生未知错误。

# 关于工程引用的说明

工程引用在某些方面需要你进行权衡.

因为有依赖的工程要使用它的依赖生成的`.d.ts`，因此你必须要检查相应构建后的输出*或*在下载源码后进行构建，然后才能在编辑器里自由地导航。
我们是在操控幕后的`.d.ts`生成过程，我们应该减少这种情况，但是目前还们建议提示开发者在下载源码后进行构建。

此外，为了兼容已有的构建流程，`tsc`*不会*自动地构建依赖项，除非启用了`--build`选项。
下面让我们看看`--build`。

# TypeScript构建模式

在TypeScript工程里支持增量构建是个期待已久的功能。
在TypeScrpt 3.0里，你可以在`tsc`上使用`--build`标记。
它实际上是个新的`tsc`入口点，它更像是一个构建的协调员而不是简简单单的编译器。

运行`tsc --build`（简写`tsc -b`）会执行如下操作：

* 找到所有引用的工程
* 检查它们是否为最新版本
* 按顺序构建非最新版本的工程

可以给`tsc -b`指定多个配置文件地址（例如：`tsc -b src test`）。
如同`tsc -p`，如果配置文件名为`tsconfig.json`，那么文件名则可省略。

## `tsc -b`命令行

你可以指令任意数量的配置文件：

```shell
 > tsc -b                                # Build the tsconfig.json in the current directory
 > tsc -b src                            # Build src/tsconfig.json
 > tsc -b foo/release.tsconfig.json bar  # Build foo/release.tsconfig.json and bar/tsconfig.json
```

不需要担心命令行上指定的文件顺序 - `tsc`会根据需要重新进行排序，被依赖的项会优先构建。

`tsc -b`还支持其它一些选项：

* `--verbose`：打印详细的日志（可以与其它标记一起使用）
* `--dry`: 显示将要执行的操作但是并不真正进行这些操作
* `--clean`: 删除指定工程的输出（可以与`--dry`一起使用）
* `--force`: 把所有工程当作非最新版本对待
* `--watch`: 观察模式（可以与`--verbose`一起使用）

# 说明

一般情况下，就算代码里有语法或类型错误，`tsc`也会生成输出（`.js`和`.d.ts`），除非你启用了`noEmitOnError`选项。
这在增量构建系统里就不好了 - 如果某个过期的依赖里有一个新的错误，那么你只能看到它*一次*，因为后续的构建会跳过这个最新的工程。
正是这个原因，`tsc -b`的作用就好比在所有工程上启用了`noEmitOnError`。

如果你想要提交所有的构建输出（`.js`, `.d.ts`, `.d.ts.map`等），你可能需要运行`--force`来构建，因为一些源码版本管理操作依赖于源码版本管理工具保存的本地拷贝和远程拷贝的时间戳。

# MSBuild

如果你的工程使用msbuild，你可以用下面的方式开启构建模式。

```xml
    <TypeScriptBuildMode>true</TypeScriptBuildMode>
```

将这段代码添加到`proj`文件。它会自动地启用增量构建模式和清理工作。

注意，在使用`tsconfig.json` / `-p`时，已存在的TypeScript工程属性会被忽略 - 因此所有的设置需要在`tsconfig`文件里进行。

一些团队已经设置好了基于msbuild的构建流程，并且`tsconfig`文件具有和它们匹配的工程一致的*隐式*图序。
若你的项目如此，那么可以继续使用`msbuild`和`tsc -p`以及工程引用；它们是完全互通的。

# 指导

## 整体结构

当`tsconfig.json`多了以后，通常会使用[配置文件继承](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)来集中管理公共的编译选项。
这样你就可以在一个文件里更改配置而不必在多个文件中进行修改。

另一个最佳实践是有一个`solution`级别的`tsconfig.json`文件，它仅仅用于引用所有的子工程。
它用于提供一个简单的入口；比如，在TypeScript源码里，我们可以简单地运行`tsc -b src`来构建所有的节点，因为我们在`src/tsconfig.json`文件里列出了所有的子工程。
注意从3.0开始，如果`tsconfig.json`文件里有至少一个工程引用`reference`，那么`files`数组为空的话也不会报错。

你可以在TypeScript源码仓库里看到这些模式 - 阅读`src/tsconfig_base.json`，`src/tsconfig.json`和`src/tsc/tsconfig.json`。

## 相对模块的结构

通常地，将代码转成使用相对模块并不需要改动太多。
只需在某个给定父目录的每个子目录里放一个`tsconfig.json`文件，并相应添加`reference`。
然后将`outDir`指定为输出目录的子目录或将`rootDir`指定为所有工程的某个公共根目录。

## `outFile`的结构

使用了`outFile`的编译输出结构十分灵活，因为相对路径是无关紧要的。
要注意的是，你通常不需要使用`prepend` - 因为这会改善构建时间并结省I/O。
TypeScript项目本身是一个好的参照 - 我们有一些“library”的工程和一些“endpoint”工程，“endpoint”工程会确保足够小并仅仅导入它们需要的“library”。

<!--
## Structuring for monorepos

TODO: Experiment more and figure this out. Rush and Lerna seem to have different models that imply different things on our end
-->
