# TypeScript 2.8

## 在`--noUnusedParameters`下检查未使用的类型参数

根据 [\#20568](https://github.com/Microsoft/TypeScript/issues/20568)，未使用的类型参数之前在`--noUnusedLocals`下报告，但现在报告在`--noUnusedParameters`下。

## 从`lib.d.ts`中删除了一些Microsoft 专用的类型

从DOM定义中删除一些Microsoft 专用的类型以更好地与标准对齐。 删除的类型包括：

* `MSApp`
* `MSAppAsyncOperation`
* `MSAppAsyncOperationEventMap`
* `MSBaseReader`
* `MSBaseReaderEventMap`
* `MSExecAtPriorityFunctionCallback`
* `MSHTMLWebViewElement`
* `MSManipulationEvent`
* `MSRangeCollection`
* `MSSiteModeEvent`
* `MSUnsafeFunctionCallback`
* `MSWebViewAsyncOperation`
* `MSWebViewAsyncOperationEventMap`
* `MSWebViewSettings`

## `HTMLObjectElement`不再具有`alt`属性

根据 [\#21386](https://github.com/Microsoft/TypeScript/issues/21386)，DOM库已更新以反映WHATWG标准。

如果需要继续使用`alt`属性，请考虑通过全局范围中的接口合并重新打开`HTMLObjectElement`：

```typescript
// Must be in a global .ts file or a 'declare global' block.
interface HTMLObjectElement {
    alt: string;
}
```

