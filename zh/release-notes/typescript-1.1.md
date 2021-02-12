# TypeScript 1.1

## 改进性能

1.1版本的编译器速度比所有之前发布的版本快4倍。阅读[这篇博客里的有关图表](http://blogs.msdn.com/b/typescript/archive/2014/10/06/announcing-typescript-1-1-ctp.aspx)

## 更好的模块可见性规则

TypeScript现在只在使用`--declaration`标记时才严格强制模块里类型的可见性。这在Angular里很有用，例如：

```typescript
module MyControllers {
  interface ZooScope extends ng.IScope {
    animals: Animal[];
  }
  export class ZooController {
    // Used to be an error (cannot expose ZooScope), but now is only
    // an error when trying to generate .d.ts files
    constructor(public $scope: ZooScope) { }
    /* more code */
  }
}
```

