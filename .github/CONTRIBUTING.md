# 贡献代码

**Working on your first Pull Request?** You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

如果您愿意的话，就可以参与到本项目里。
这里接受大家贡献翻译，修改或其它任何形式。
您可以审察已有的翻译，并提出保贵的修改意见或直接提交PR。

如果你想翻译新的主题，需要在issue里新增一条，说明您正在翻译哪个主题。
以防大家同时翻译一个，浪费了工作成果。


# Markdown书写规范检验

我们使用Markdownlint来对手册内容进行书写规范检察。
在新的提交前请本地测试是否符合书写规范。

```js
node lint.js
```

很少时候会出现无法满足markdownlint，这时可以考虑使用`<!-- markdownlint-disable MD029 -->`来禁用某些检查。
详细信息请参考markdownlint官网。


## 新增章节翻译

需要同时更改`SUMMARY.md`，`preface.md`和`README.md`。
Gitbook会自动解析。


# 小建议

你的提交最好满足：

* 详细的友好的提交信息，能够直观地说明改动内容。
* 考虑使用`rebase`，`reset`等工具将你**本地**的提交合并成意义更明确的提交记录。这样历史会更漂亮 :)
