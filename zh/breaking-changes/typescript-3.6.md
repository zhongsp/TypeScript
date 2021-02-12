# TypeScript 3.6

## 类成员的 `constructor` 现在被叫做 `Constructors`

根据 ECMAScript 规范，使用名为 `constructor` 的方法的类声明现在是构造函数，无论它们是使用标识符名称还是字符串名称声明。

```typescript
class C {
  "constructor"() {
    console.log("现在我是构造函数了。");
  }
}
```

一个值得注意的例外，以及此改变的解决方法是使用名称计算结果为 `constructor` 的计算属性。

```typescript
class D {
  ["constructor"]() {
    console.log("我只是一个纯粹的方法，不是构造函数！")
  }
}
```

## DOM 定义更新

`lib.dom.d.ts` 中移除或者修改了大量的定义。其中包括（但不仅限于）以下这些：

* 全局的 `window` 不再定义为 `Window`，它被更明确的定义 `type Window & typeof globalThis` 替代。在某些情况下，将它作为 `typeof window` 更好。
* `GlobalFetch` 已经被移除。使用 `WindowOrWorkerGlobalScrope` 替代。
* `Navigator` 上明确的非标准的属性已经被移除了。
* `experimental-webgl` 上下文已经被移除了。使用 `webgl` 或 `webgl2` 替代。

如果你认为其中的改变已经制造了错误，[请提交一个 issue](https://github.com/Microsoft/TSJS-lib-generator/)。

## JSDoc 注释不再合并

在 JavaScript 文件中，TypeScript 只会在 JSDoc 注释之前立即查询以确定声明的类型。

```typescript
/**
 * @param {string} arg
 */
/**
 * 你的其他注释信息
 */
function whoWritesFunctionsLikeThis(arg) {
  // 'arg' 是 'any' 类型
}
```

## 关键字不能包含转义字符

之前的版本允许关键字包含转义字符。TypeScript 3.6 不允许。

```typescript
while (true) {
  \u0063ontinue;
//  ~~~~~~~~~~~~~
// 错误！关键字不能包含转义字符
}
```

## 参考

* [Announcing TypeScript 3.6](https://devblogs.microsoft.com/typescript/announcing-typescript-3-6/#breaking-changes)

