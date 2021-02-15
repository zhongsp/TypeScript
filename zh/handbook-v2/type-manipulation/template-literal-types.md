模版字面量类型以[字符串字面量类型](../../handbook/literal-types.md)为基础，且可以扩展为多个字符串类型的联合类型。

其语法与 [JavaScript 中的模版字面量](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)是一致的，但是是用在类型的位置。
当与某个具体的字面量类型一起使用时，模版字面量会将内容连接从而生成一个新的字符串字面量类型。

```ts
type World = 'world';

type Greeting = `hello ${World}`;
//   'hello world'
```

如果在替换字符串的位置是联合类型，那么结果类型是由每个联合成员构成的字符串字面量的集合：

```ts
type EmailLocaleIDs = 'welcome_email' | 'email_heading';
type FooterLocaleIDs = 'footer_title' | 'footer_sendoff';

type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
// "welcome_email_id" | "email_heading_id" | "footer_title_id" | "footer_sendoff_id"
```

多个替换字符串的位置上的联合类型会进行交叉相乘：

```ts
type EmailLocaleIDs = 'welcome_email' | 'email_heading';
type FooterLocaleIDs = 'footer_title' | 'footer_sendoff';

type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
type Lang = 'en' | 'ja' | 'pt';

type LocaleMessageIDs = `${Lang}_${AllLocaleIDs}`;
//   type EmailLocaleIDs = "welcome_email" | "email_heading";
type FooterLocaleIDs = 'footer_title' | 'footer_sendoff';

type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
type Lang = 'en' | 'ja' | 'pt';

type LocaleMessageIDs = `${Lang}_${AllLocaleIDs}`;
//   "en_welcome_email_id" | "en_email_heading_id" | "en_footer_title_id" | "en_footer_sendoff_id" | "ja_welcome_email_id" | "ja_email_heading_id" | "ja_footer_title_id" | "ja_footer_sendoff_id" | "pt_welcome_email_id" | "pt_email_heading_id" | "pt_footer_title_id" | "pt_footer_sendoff_id"
```

我们还是建议开发者要提前生成数量巨大的字符串联合类型，但如果数量较少，那么上面介绍的方法会有所帮助。

### 类型中的字符串联合类型

模版字面量的强大之处在于它能够基于给定字符串来创建新的字符串。

例如，JavaScript 中的一个常见模式是基于对象现有的属性来扩展它。
下面我们定义一个函数类型`on`，它用来监听值的变化。

```ts
declare function makeWatchedObject(obj: any): any;

const person = makeWatchedObject({
    firstName: 'Saoirse',
    lastName: 'Ronan',
    age: 26,
});

person.on('firstNameChanged', (newValue) => {
    console.log(`firstName was changed to ${newValue}!`);
});
```

注意，`on`会监听`"firstNameChanged"`事件，而不是`"firstName"`。
模版字面量提供了操作字符串类型的能力：

```ts
type PropEventSource<Type> = {
    on(
        eventName: `${string & keyof Type}Changed`,
        callback: (newValue: any) => void
    ): void;
};

/// Create a "watched object" with an 'on' method
/// so that you can watch for changes to properties.
declare function makeWatchedObject<Type>(
    obj: Type
): Type & PropEventSource<Type>;
```

这样做之后，当传入了错误的属性名会产生一个错误：

```ts
type PropEventSource<Type> = {
    on(
        eventName: `${string & keyof Type}Changed`,
        callback: (newValue: any) => void
    ): void;
};

declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;

const person = makeWatchedObject({
    firstName: 'Saoirse',
    lastName: 'Ronan',
    age: 26,
});

person.on('firstNameChanged', () => {});

// 以下存在拼写错误
person.on('firstName', () => {});
person.on('frstNameChanged', () => {});
```

### 模版字面量类型推断

注意，上例中没有使用原属性值的类型，回调函数仍使用`any`类型。
模版字面量类型能够从替换字符串的位置推断出类型。

下面，我们将上例修改成更通用的类型，它会从`eventName`字符串来推断出属性名。

```ts
type PropEventSource<Type> = {
    on<Key extends string & keyof Type>(
        eventName: `${Key}Changed`,
        callback: (newValue: Type[Key]) => void
    ): void;
};

declare function makeWatchedObject<Type>(
    obj: Type
): Type & PropEventSource<Type>;

const person = makeWatchedObject({
    firstName: 'Saoirse',
    lastName: 'Ronan',
    age: 26,
});

person.on('firstNameChanged', (newName) => {
    //                        string
    console.log(`new name is ${newName.toUpperCase()}`);
});

person.on('ageChanged', (newAge) => {
    //                  number
    if (newAge < 0) {
        console.warn('warning! negative age');
    }
});
```

这里，我们将`on`改为泛型方法。

当用户使用字符串`"firstNameChanged'`来调用时，TypeScript 会尝试推断`K`的类型。
为此，TypeScript 尝试将`K`与`"Changed"`之前的部分进行匹配，并且推断出字符串`"firstName"`。
当 TypeScript 推断出了类型后，`on`方法就能够获取`firstName`属性的类型，即`string`类型。
相似的，当使用`"ageChanged"`调用时，TypeScript 能够知道`age`属性的类型是`number`。

类型推断可以以多种方式组合，例如拆解字符串然后以其它方式重新构造字符串。

## 固有字符串操作类型

为了便于字符串操作，TypeScript 提供了一系列操作字符串的类型。
这些类型内置在了编译器中，以便提高性能。
它们不存在于 TypeScript 提供的`.d.ts`文件中。

### `Uppercase<StringType>`

将字符串中的每个字符转换为大写字母。

##### Example

```ts
type Greeting = 'Hello, world';
type ShoutyGreeting = Uppercase<Greeting>;
//   "HELLO, WORLD"

type ASCIICacheKey<Str extends string> = `ID-${Uppercase<Str>}`;
type MainID = ASCIICacheKey<'my_app'>;
//   "ID-MY_APP"
```

### `Lowercase<StringType>`

将字符串中的每个字符转换为小写字母。

```ts
type Greeting = 'Hello, world';
type QuietGreeting = Lowercase<Greeting>;
//   "hello, world"

type ASCIICacheKey<Str extends string> = `id-${Lowercase<Str>}`;
type MainID = ASCIICacheKey<'MY_APP'>;
//   "id-my_app"
```

### `Capitalize<StringType>`

将字符串中的首字母转换为大写字母。

##### Example

```ts
type LowercaseGreeting = 'hello, world';
type Greeting = Capitalize<LowercaseGreeting>;
//   "Hello, world"
```

### `Uncapitalize<StringType>`

将字符串中的首字母转换为小写字母。

##### Example

```ts twoslash
type UppercaseGreeting = 'HELLO WORLD';
type UncomfortableGreeting = Uncapitalize<UppercaseGreeting>;
//   "hELLO WORLD"
```

<details>
    <summary>固有字符串操作类型的技术细节</summary>
    <p>在TypeScript 4.1中会直接使用JavaScript中的字符串操作函数来操作固有字符串，且不会考虑本地化字符。</p>
    <code><pre>
function applyStringMapping(symbol: Symbol, str: string) {
    switch (intrinsicTypeKinds.get(symbol.escapedName as string)) {
        case IntrinsicTypeKind.Uppercase: return str.toUpperCase();
        case IntrinsicTypeKind.Lowercase: return str.toLowerCase();
        case IntrinsicTypeKind.Capitalize: return str.charAt(0).toUpperCase() + str.slice(1);
        case IntrinsicTypeKind.Uncapitalize: return str.charAt(0).toLowerCase() + str.slice(1);
    }
    return str;
}</pre></code>
</details>
