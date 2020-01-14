# TypeScript 2.2

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.2%22+label%3A%22Breaking+Change%22+is%3Aclosed).

## 标准库里的DOM API变动

* 现在标准库里有`Window.fetch`的声明；仍依赖于`@types\whatwg-fetch`会产生声明冲突错误，需要被移除。
* 现在标准库里有`ServiceWorker`的声明；仍依赖于`@types\service_worker_api`会产生声明冲突错误，需要被移除。

