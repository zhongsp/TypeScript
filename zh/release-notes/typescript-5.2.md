# TypeScript 5.2

## `using` 声明与显式资源管理

TypeScript 5.2 支持了 ECMAScript 即将引入的新功能 [显式资源管理](https://github.com/tc39/proposal-explicit-resource-management)。
让我们探索一下引入该功能的一些动机，并理解这个功能给我们带来了什么。

在创建对象之后需要进行某种形式的“清理”是很常见的。例如，您可能需要关闭网络连接，删除临时文件，或者只是释放一些内存。
让我们来想象一个函数，它创建一个临时文件，对它进行多种操作的读写，然后关闭并删除它。

```ts
import * as fs from "fs";

export function doSomeWork() {
    const path = ".some_temp_file";
    const file = fs.openSync(path, "w+");

    // use file...

    // Close the file and delete it.
    fs.closeSync(file);
    fs.unlinkSync(path);
}
```
