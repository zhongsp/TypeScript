# TypeScript 1.1

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+1.1%22+label%3A%22breaking+change%22+)。

## null和undefined明显的错误使用方式现在会报错

例子：

```TypeScript
var ResultIsNumber17 = +(null + undefined);
// Operator '+' cannot be applied to types 'undefined' and 'undefined'.

var ResultIsNumber18 = +(null + null);
// Operator '+' cannot be applied to types 'null' and 'null'.

var ResultIsNumber19 = +(undefined + undefined);
// Operator '+' cannot be applied to types 'undefined' and 'undefined'.
```

相似地，把null和undefined当做具有方法的对象使用时会报错。

例子：

```TypeScript
null.toBAZ();

undefined.toBAZ();
```