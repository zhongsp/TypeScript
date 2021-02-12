# TypeScript 3.5

## `lib.d.ts` 包含了 `Omit` 辅助类型

TypeScript 3.5 包含一个 `Omit` 辅助类型。

因此, 你项目中任何全局定义的 `Omit` 将产生以下错误信息:

```typescript
Duplicate identifier 'Omit'.
```

两个变通的方法可以在这里使用：

1. 删除重复定义的并使用 `lib.d.ts` 提供的。
2. 从模块中导出定义避免全局冲突。现有的用法可以使用 `import` 直接引用项目的旧 `Omit` 类型。

