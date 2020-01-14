# TypeScript 1.8

完整的破坏性改动列表请到这里查看:[breaking change issues](https://github.com/Microsoft/TypeScript/issues?q=is%3Aissue+milestone%3A%22TypeScript+1.8%22+label%3A%22Breaking+Change%22+is%3Aclosed)。

## 现在生成模块代码时会带有`"use strict";`头

在ES6模式下模块总是在严格模式下解析，对于生成目标为非ES6的却不是这样。从TypeScript 1.8开始，生成的模块将总为严格模式。这应该不会对现有的大部分代码产生影响，因为TypeScript把大多数因为严格模式而产生的错误当做编译时错误，但还是有一些在运行时才发生错误的TypeScript代码，比如赋值给`NaN`，现在将会直接报错。你可以参考[MDN Article](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)学习关于严格模式与非严格模式的区别。

若想禁用这个行为，在命令行里传`--noImplicitUseStrict`选项或在tsconfig.json文件里指定。

## 从模块里导出非局部名称

依据ES6/ES2015规范，从模块里导出非局部名称将会报错。

**例子**

```typescript
export { Promise }; // Error
```

**推荐**

在导出之前，使用局部变量声明捕获那个全局名称。

```typescript
const localPromise = Promise;
export { localPromise as Promise };
```

## 默认启用代码可达性（Reachability）检查

TypeScript 1.8里，我们添加了一些[可达性检查](https://github.com/Microsoft/TypeScript/pull/4788)来阻止一些种类的错误。特别是：

1. 检查代码的可达性（默认启用，可以通过`allowUnreachableCode`编译器选项禁用）

   ```typescript
      function test1() {
          return 1;
          return 2; // error here
      }

      function test2(x) {
          if (x) {
              return 1;
          }
          else {
              throw new Error("NYI")
          }
          var y = 1; // error here
      }
   ```

2. 检查标签是否被使用（默认启用，可以通过`allowUnusedLabels`编译器选项禁用）

   ```typescript
   l: // error will be reported - label `l` is unused
   while (true) {
   }

   (x) => { x:x } // error will be reported - label `x` is unused
   ```

3. 检查是否函数里所有带有返回值类型注解的代码路径都返回了值（默认启用，可以通过`noImplicitReturns`编译器选项禁用）

   ```typescript
   // error will be reported since function does not return anything explicitly when `x` is falsy.
   function test(x): number {
      if (x) return 10;
   }
   ```

4. 检查控制流是否能进到switch语句的case里（默认禁用，可以通过`noFallthroughCasesInSwitch`编译器选项启用）。注意没有语句的case不会被检查。

   ```typescript
   switch(x) {
      // OK
      case 1:
      case 2:
          return 1;
   }
   switch(x) {
      case 1:
          if (y) return 1;
      case 2:
          return 2;
   }
   ```

如果你看到了这些错误，但是你认为这时的代码是合理的话，你可以通过编译选项来阻止报错。

## `--module`不允许与`--outFile`一起出现，除非 `--module`被指定为`amd`或`system`

之前使用模块指定这两个的时候，会生成空的`out`文件且不会报错。

## 标准库里的DOM API变动

* **ImageData.data**现在的类型为`Uint8ClampedArray`而不是`number[]`。查看[\#949](https://github.com/Microsoft/TypeScript/issues/949)。
* **HTMLSelectElement .options**现在的类型为`HTMLCollection`而不是`HTMLSelectElement`。查看[\#1558](https://github.com/Microsoft/TypeScript/issues/1558)。
* **HTMLTableElement.createCaption**，**HTMLTableElement.createTBody**，**HTMLTableElement.createTFoot**，**HTMLTableElement.createTHead**，**HTMLTableElement.insertRow**，**HTMLTableSectionElement.insertRow**和**HTMLTableElement.insertRow**现在返回`HTMLTableRowElement`而不是`HTMLElement`。查看[\#3583](https://github.com/Microsoft/TypeScript/issues/3583)。
* **HTMLTableRowElement.insertCell**现在返回`HTMLTableCellElement`而不是`HTMLElement`查看[\#3583](https://github.com/Microsoft/TypeScript/issues/3583)。
* **IDBObjectStore.createIndex**和**IDBDatabase.createIndex**第二个参数类型为`IDBObjectStoreParameters`而不是`any`。查看[\#5932](https://github.com/Microsoft/TypeScript/issues/5932)。
* **DataTransferItemList.Item**返回值类型变为`DataTransferItem`而不是`File`。查看[\#6106](https://github.com/Microsoft/TypeScript/issues/6106)。
* **Window.open**返回值类型变为`Window`而不是`any`。查看[\#6418](https://github.com/Microsoft/TypeScript/issues/6418)。
* **WeakMap.clear**被移除。查看[\#6500](https://github.com/Microsoft/TypeScript/issues/6500)。

## 在super-call之前不允许使用`this`

ES6不允许在构造函数声明里访问`this`。

比如：

```typescript
class B {
    constructor(that?: any) {}
}

class C extends B {
    constructor() {
        super(this);  // error;
    }
}

class D extends B {
    private _prop1: number;
    constructor() {
        this._prop1 = 10;  // error
        super();
    }
}
```

