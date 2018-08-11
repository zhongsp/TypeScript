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

Referenced projects must have the new `composite` setting enabled.
This setting is needed to ensure TypeScript can quickly determine where to find the outputs of the referenced project.
Enabling the `composite` flag changes a few things:

* The `rootDir` setting, if not explicitly set, defaults to the directory containing the `tsconfig` file
* All implementation files must be matched by an `include` pattern or listed in the `files` array. If this constraint is violated, `tsc` will inform you which files weren't specified
* `declaration` must be turned on

# `declarationMaps`

We've also added support for [declaration source maps](https://github.com/Microsoft/TypeScript/issues/14479).
If you enable `--declarationMap`, you'll be able to use editor features like "Go to Definition" and Rename to transparently navigate and edit code across project boundaries in supported editors.

# `prepend` with `outFile`

You can also enable prepending the output of a dependency using the `prepend` option in a reference:

```js
   "references": [
       { "path": "../utils", "prepend": true }
   ]
```

Prepending a project will include the project's output above the output of the current project.
This works for both `.js` files and `.d.ts` files, and source map files will also be emitted correctly.

`tsc` will only ever use existing files on disk to do this process, so it's possible to create a project where a correct output file can't be generated because some project's output would be present more than once in the resulting file.
For example:

```txt
   A
  ^ ^
 /   \
B     C
 ^   ^
  \ /
   D
```

It's important in this situation to not prepend at each reference, because you'll end up with two copies of `A` in the output of `D` - this can lead to unexpected results.

# Caveats for Project References

Project references have a few trade-offs you should be aware of.

Because dependent projects make use of `.d.ts` files that are built from their dependencies, you'll either have to check in certain build outputs *or* build a project after cloning it before you can navigate the project in an editor without seeing spurious errors.
We're working on a behind-the-scenes .d.ts generation process that should be able to mitigate this, but for now we recommend informing developers that they should build after cloning.

Additionally, to preserve compatability with existing build workflows, `tsc` will *not* automatically build dependencies unless invoked with the `--build` switch.
Let's learn more about `--build`.

# Build Mode for TypeScript

A long-awaited feature is smart incremental builds for TypeScript projects.
In 3.0 you can use the `--build` flag with `tsc`.
This is effectively a new entry point for `tsc` that behaves more like a build orchestrator than a simple compiler.

Running `tsc --build` (`tsc -b` for short) will do the following:

* Find all referenced projects
* Detect if they are up-to-date
* Build out-of-date projects in the correct order

You can provide `tsc -b` with multiple config file paths (e.g. `tsc -b src test`).
Just like `tsc -p`, specifying the config file name itself is unnecessary if it's named `tsconfig.json`.

## `tsc -b` Commandline

You can specify any number of config files:

```shell
 > tsc -b                                # Build the tsconfig.json in the current directory
 > tsc -b src                            # Build src/tsconfig.json
 > tsc -b foo/release.tsconfig.json bar  # Build foo/release.tsconfig.json and bar/tsconfig.json
```

Don't worry about ordering the files you pass on the commandline - `tsc` will re-order them if needed so that dependencies are always built first.

There are also some flags specific to `tsc -b`:

* `--verbose`: Prints out verbose logging to explain what's going on (may be combined with any other flag)
* `--dry`: Shows what would be done but doesn't actually build anything
* `--clean`: Deletes the outputs of the specified projects (may be combined with `--dry`)
* `--force`: Act as if all projects are out of date
* `--watch`: Watch mode (may not be combined with any flag except `--verbose`)

# Caveats

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