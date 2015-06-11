## 概述
如果一个目录下存在一个`tsconfig.json`文件，那么它意味着这个目录是TypeScript项目的根目录。
`tsconfig.json`文件中指定了用来编译这个项目的根文件和编译选项。
`tsconfig.json`从TypeScript 1.5开始支持。
一个项目可以用以下方法进行编译：


## 使用tsconfig.json
* 不带任何输入文件的情况下调用`tsc`，编译器会去查找`tsconfig.json`文件，从当前目录开始，依次向上搜索父级目录。
* 不带任何输入文件的情况下调用`tsc`并且使用了命令行参数`-project`（或`-p`）指定一个包含`tsconfig.json`文件的目录。

当命令行上指定了输入文件时，`tsconfig.json`被忽略。

## 示例
An example `tsconfig.json` file:
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

## 细节
`"compilerOptions"`可以被忽略，编译器会使用默认值。编译选项的详细信息请参考[[Compiler Options]]文档。

如果`tsconfig.json`没有提供`"files"`属性，编译器默认包含当前目录及子目录下的所有文件。如果提供了`"files"`属性值，只有这些文件会被编译。

`tsconfig.json`可以是个空文件，如果为空则使用默认编译选项，编译当前目录及其子目录下的所有文件。

命令行上提供的编译选项会覆盖`tsconfig.json`文件中的对应选项。

## Schema
到这里查看Schema: http://json.schemastore.org/tsconfig
