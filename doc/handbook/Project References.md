工程引用是TypeScript 3.0的新特性，它支持将TypeScript程序的结构分割成更小的组成部分。

这样，就可以改善构建时间，强制在逻辑上对组件进行分离，更好地组织你的代码。

TypeScript 3.0还引入了一种`tsc`的新模式，即`--build`标记，它与工程引用协同工作可以加速TypeScript的构建。

# 一个工程示例

让我们来看一个非常普通的工程，并瞧瞧工程引用特性是如何帮助我们更好地组织代码的。
假设这个工程具有两个模块，`converter`和`unites`，还有相应的测试代码：

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

在之前，这种使用单一`tsconfig`文件的结构稍显笨拙：

* 具体实现的文件也可以导入测试文件
* 无法同时构建`test`和`src`，除非把`src`也放在输出文件夹中，但这通常是不想要的
* 仅对具体实现文件的*内部*细节进行改动，必需再次对测试进行*类型检查*，尽管这是根本不必要的
* 仅对测试文件进行改动，必需再次对具体实现文件进行*类型检查*，尽管什么都没有变

你可以使用多个`tsconfig`文件来解决*部分*问题，但是又会出现新问题：

* 没有内置的实时检查，因此你得多次运行`tsc`
* 多次调用`tsc`会增加等待启动时间
* `tsc -w`不能一次在多个配置文件上运行

工程引用可以解决全部这些问题，而且还不止。

# 何为工程引用？

`tsconfig.json`有了一个新的顶层属性，`references`。它是一个对象的数组，指明要引用的工程：

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

* 从引用工程中导入模块会加载它的*输出*声明文件（`.d.ts`）。
* 如果引用的工程产生一个`outFile`，那么这个输出文件`.d.ts`文件的声明对于这个工程是可见的。
* 构建模式（后文）会根据需要自动地构建引用的工程。

当你拆分成多个工程后，会显著地加速类型检查和编译，减少编辑器的内存使用，还会改善对程序进行逻辑上地分组。

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

前置工程会将工程的输出添加到当前工程输出之前。
它对`.js`文件和`.d.ts`文件都启作用，`source map`文件也同样会正确地生成。

`tsc`永远只会使用磁盘上已经存在的文件来进行这个操作，因此创建一个无法生成正确的输出文件的工程是可能的，因为有些工程的输出可能会在结果文件中重覆多次。
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

这种情况下，不能前置引用，因为在`D`的最终输出里会有两份`A`存在 - 这可能会发生未预料的错误。

# 关于工程引用的说明

工程引用在某些方面需要你进行权衡.

因为有依赖的工程要使用它的依赖生成的`.d.ts`，因此你必须要检查相应构建后的输出*或*在下载源码后进行构建，然后才能在编辑器里自由地导航。
我们是在操作在幕后的`.d.ts`生成过程，我们应该减少这种情况，但是目前还们建议提示开发者在下载源码后进行构建。

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

可以给`tsc -b`指写多个配置文件地址（例如：`tsc -b src test`）。
好比`tsc -p`，如果配置文件名为`tsconfig.json`，那么文件名可省略。

## `tsc -b`命令行

你可以指令任意数量的配置文件：

```shell
 > tsc -b                                # Build the tsconfig.json in the current directory
 > tsc -b src                            # Build src/tsconfig.json
 > tsc -b foo/release.tsconfig.json bar  # Build foo/release.tsconfig.json and bar/tsconfig.json
```

不需要担心命令上指定的文件的顺序 - `tsc`会根据需要重新进行排序，被依赖的项会优先构建。

`tsc -b`还可以指定其它一些标记：

* `--verbose`：打印详细的日志（可以与其它标记一起使用）
* `--dry`: 显示将要执行的操作但是并不真正进行这些操作
* `--clean`: 删除指定工程的输出（可以与`--dry`一起使用）
* `--force`: 把所有工程当作非最新版本对待
* `--watch`: 观察模式（可能与`--verbose`一起使用）

# 说明

Normally, `tsc` will produce outputs (`.js` and `.d.ts`) in the presence of syntax or type errors, unless `noEmitOnError` is on.
Doing this in an incremental build system would be very bad - if one of your out-of-date dependencies had a new error, you'd only see it *once* because a subsequent build would skip building the now up-to-date project.
For this reason, `tsc -b` effectively acts as if `noEmitOnError` is enabled for all all projects.

If you check in any build outputs (`.js`, `.d.ts`, `.d.ts.map`, etc.), you may need to run a `--force` build after certain source control operations depending on whether your source control tool preserves timestmaps between the local copy and the remote copy.

# MSBuild

If you have an msbuild project, you can turn enable build mode by adding

```xml
    <TypeScriptBuildMode>true</TypeScriptBuildMode>
```

to your proj file. This will enable automatic incremental build as well as cleaning.

Note that as with `tsconfig.json` / `-p`, existing TypeScript project properties will not be respected - all settings should be managed using your tsconfig file.

Some teams have set up msbuild-based workflows wherein tsconfig files have the same *implicit* graph ordering as the managed projects they are paired with.
If your solution is like this, you can continue to use `msbuild` with `tsc -p` along with project references; these are fully interoperable.

# Guidance

## Overall Structure

With more `tsconfig.json` files, you'll usually want to use [Configuration file inheritance](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) to centralize your common compiler options.
This way you can change a setting in one file rather than having to edit multiple files.

Another good practice is to have a "solution" `tsconfig.json` file that simply has `references` to all of your leaf-node projects.
This presents a simple entry point; e.g. in the TypeScript repo we simply run `tsc -b src` to build all endpoints because we list all the subprojects in `src/tsconfig.json`
Note that starting with 3.0, it is no longer an error to have an empty `files` array if you have at least one `reference` in a `tsconfig.json` file.

You can see these pattern in the TypeScript repo - see `src/tsconfig_base.json`, `src/tsconfig.json`, and `src/tsc/tsconfig.json` as key examples.

## Structuring for relative modules

In general, not much is needed to transition a repo using relative modules.
Simply place a `tsconfig.json` file in each subdirectory of a given parent folder, and add `reference`s to these config files to match the intended layering of the program.
You will need to either set the `outDir` to an explicit subfolder of the output folder, or set the `rootDir` to the common root of all project folders.

## Structuring for outFiles

Layout for compilations using `outFile` is more flexible because relative paths don't matter as much.
One thing to keep in mind is that you'll generally want to not use `prepend` until the "last" project - this will improve build times and reduce the amount of I/O needed in any given build.
The TypeScript repo itself is a good reference here - we have some "library" projects and some "endpoint" projects; "endpoint" projects are kept as small as possible and pull in only the libraries they need.

<!--
## Structuring for monorepos

TODO: Experiment more and figure this out. Rush and Lerna seem to have different models that imply different things on our end
-->