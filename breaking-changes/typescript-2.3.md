# TypeScript 2.3

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+2.3%22+label%3A%22Breaking+Change%22+is%3Aclosed).

## 空的泛型列表会被标记为错误

**示例**

```typescript
class X<> {}  // Error: Type parameter list cannot be empty.
function f<>() {}  // Error: Type parameter list cannot be empty.
const x: X<> = new X<>();  // Error: Type parameter list cannot be empty.
```

