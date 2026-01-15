# Next.js 14 实战指南：探索全栈开发新纪元

Next.js 14 带来了许多令人兴奋的新特性，极大地提升了开发体验和运行时性能。本文将通过实际案例展示这些特性的应用。

## 1. 主要特性预览

这里是 Next.js 14 的核心改进点：

- **服务器组件 (Server Components)**：默认在服务器端渲染，减少客户端 JS 体积。
- *流式渲染 (Streaming)*：利用 HTTP 流逐步发送内容，缩短首屏等待。
- ~~传统的 API 路由~~ -> **Server Actions**：更简单的表单提交和数据变动逻辑。

> [!TIP]
> 提示：结合项目主题色，你可以看到这里的引用块样式已经过深度定制。

---

## 2. 代码展示

### 行内代码
在 `page.tsx` 中，你可以使用 `export default function Page()` 来定义一个页面。

### 代码块 (TypeScript)
```typescript
async function fetchData() {
  const res = await fetch('https://api.example.com/data');
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}
```

---

## 3. 数据表格展示

| 特性名称 | 优先级 | 状态 | 负责人 |
| :--- | :---: | :---: | :--- |
| App Router | 高 | 🟢 已完成 | 张三 |
| Server Actions | 高 | 🟡 优化中 | 李四 |
| Image Optimization | 中 | 🔵 待开发 | 王五 |
| Image Optimization | 中 | 🔵 待开发 | 王五 |

---

## 4. 任务列表

- [x] 配置项目基础环境
- [x] 集成 Vditor 编辑器并定制主题色
- [ ] 对接后端保存 API
- [ ] 优化移动端适配效果

---

## 5. 多级标题测试

### H3 级标题内容
#### H4 级标题内容
##### H5 级标题内容

---

## 6. 图片与链接

你可以通过 [Next.js 官网](https://nextjs.org) 了解更多详情。

![示例图片](./test.svg)

---

*感谢阅读本篇演示文档，以上内容用于展示 Markdown 在项目中的渲染效果。*
