# TypeScript 3.2

## `lib.d.ts` 更新

### `wheelDelta` 和它的小伙伴们被移除了。

`wheelDeltaX`、`wheelDelta` 和 `wheelDeltaZ` 全都被移除了，因为他们在 `WheelEvent`s 上是废弃的属性。

**解决办法**：使用 `deltaX`、`deltaY` 和 `deltaZ` 代替。

### 更具体的类型

根据 DOM 规范的描述，某些参数现在接受更具体的类型，不再接受 `null`。

## 参考

* [原文](https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#typescript-32)

