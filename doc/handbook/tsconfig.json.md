## 概述

如果一个目录下存在一个`tsconfig.json`文件，那么它意味着这个目录是TypeScript项目的根目录。
`tsconfig.json`文件中指定了用来编译这个项目的根文件和编译选项。
一个项目可以通过以下方式之一来编译：

## 使用tsconfig.json

* 不带任何输入文件的情况下调用`tsc`，编译器会从当前目录开始去查找`tsconfig.json`文件，逐级向上搜索父目录。
* 不带任何输入文件的情况下调用`tsc`，且使用命令行参数`-project`（或`-p`）指定一个包含`tsconfig.json`文件的目录。

当命令行上指定了输入文件时，`tsconfig.json`文件会被忽略。

## 示例

`tsconfig.json`示例文件:

* 使用`"files"`属性

```json
{
    "compilerOptions": {
        "module": "commonjs",
        "noImplicitAny": true,
        "removeComments": true,
        "preserveConstEnums": true,
        "out": "../../built/local/tsc.js",
        "sourceMap": true
    },
    "files": [
        "core.ts",
        "sys.ts",
        "types.ts",
        "scanner.ts",
        "parser.ts",
        "utilities.ts",
        "binder.ts",
        "checker.ts",
        "emitter.ts",
        "program.ts",
        "commandLineParser.ts",
        "tsc.ts",
        "diagnosticInformationMap.generated.ts"
    ]
}
```

* 使用`"exclude"`属性

```json
{
    "compilerOptions": {
        "module": "commonjs",
        "noImplicitAny": true,
        "removeComments": true,
        "preserveConstEnums": true,
        "out": "../../built/local/tsc.js",
        "sourceMap": true
    },
    "exclude": [
        "node_modules",
        "wwwroot"
    ]
}
```

## 细节

`"compilerOptions"`可以被忽略，这时编译器会使用默认值。在这里查看完整的[编译器选项](./Compiler Options.md)列表。

如果`tsconfig.json`没有提供`"files"`属性，编译器会默认包含当前目录及子目录下的所有TypeScript文件（`*.ts` 或 `*.tsx`）。
如果提供了`"files"`属性值，只有指定的文件会被编译。

如果指定了`"exclude"`选项，编译器会包含当前目录及子目录下的所有TypeScript文件（`*.ts` 或 `*.tsx`），不包括这些指定要排除的文件。

`"files"`选项不能与`"exclude"`选项同时使用。如果同时指定了两个选项的话，只有`"files"`会生效。

所有被`"files"`属性里的文件所引用的文件同样会被包含进来。
就好比，`A.ts`引用了`B.ts`，因此`B.ts`不能被排除，除非引用它的`A.ts`在`"exclude"`列表中。

`tsconfig.json`可以是个空文件，那么编译器则使用默认编译选项，编译当前目录及其子目录下的所有文件。

命令行上提供的编译选项会覆盖`tsconfig.json`文件中的对应选项。

## `compileOnSave`

在最顶层设置`compileOnSave`标记，可以让IDE在保存文件的时候根据`tsconfig.json`重新生成文件。

```json
{
    "compileOnSave": true,
    "compilerOptions": {
        "noImplicitAny" : true
    }
}
```

要想支持这个特性需要Visual Studio 2015， TypeScript1.8.4以上并且安装[atom-typescript](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#compileonsave)插件。

## 模式

到这里查看模式: [http://json.schemastore.org/tsconfig](http://json.schemastore.org/tsconfig)
