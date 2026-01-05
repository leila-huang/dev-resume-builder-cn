## 中文程序员简历模板生成器

极简、单栏、ATS 友好的中文程序员简历生成器。支持 Markdown 导入/导出、A4 分页预览、打印友好样式以及 PDF 导出（html2canvas + jsPDF）。

### 目录结构

```
.
├─ index.html
├─ src
│  ├─ App.tsx
│  ├─ components
│  │  ├─ ExportActions.tsx
│  │  ├─ MdEditor.tsx
│  │  ├─ MdEditor.css
│  │  ├─ Preview.tsx
│  │  └─ SettingsPanel.tsx
│  ├─ hooks
│  │  └─ usePagination.ts
│  ├─ markdown
│  │  └─ sample-resume.md
│  ├─ styles
│  │  ├─ base.css
│  │  └─ print.css
│  ├─ types
│  │  └─ resume.ts
│  └─ utils
│     ├─ markdown.ts
│     └─ pdf.ts
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
└─ package.json
```

### 技术方案与选型

- **React + Vite + TypeScript**：快速开发、模块化、类型安全。
- **Markdown 解析**：`unified + remark-parse + remark-stringify`。理由：AST 结构清晰、易于实现容错提取与稳定序列化；相比 markdown-it 更易做结构化数据映射。
- **PDF 导出**：`html2canvas + jsPDF` 逐页截图，保证 A4 尺寸、黑白灰打印；同时提供 `window.print` 直接打印。
- **分页预览策略**：
  - 使用 `ResizeObserver` + 块级节点高度累加，基于 A4 像素高度（96dpi 下约 1122px）计算分页断点。
  - 在渲染层按断点拆分为多页容器（`data-page`），`page-break` 样式保证打印与屏幕一致。
- **排版配置**：通过 `TypographySettings` 控制姓名、标题、正文字号与行距，以及常见中文字体回退。

### Markdown 规范

**总体规则**

- 仅使用 `#`~`####` 标题、`-` 列表、普通段落；单栏、语义化。
- 日期格式统一：`YYYY.MM–YYYY.MM` 或 `YYYY.MM–至今`。
- 学历写法推荐 “统招本科/全日制本科”，避免出现“2 年/两年”字样。

**结构**

1. `# 姓名`
2. 元数据块（前置）：直接承载姓名、联系方式、学历、地点等信息，避免额外中文列表，示例
   ```
   ---
   name: 张三
   gender: 男
   yearsExp: 7年
   title: 前端开发工程师
   phone: +86 1xx-xxxx-xxxx
   email: hi@example.com
   wechat: wechat-id
   location: 上海
   github: https://github.com/xxx
   website: https://xxx.com
   education_school: XX大学
   education_major: 软件工程
   education_degree: 统招本科
   education_gradYear: 2020
   ---
   ```
3. **核心能力/技能部分**（3-6 条句子化列表）
   - 支持标题变体：`## 核心能力` / `## 技能` / `## 专业技能` / `## 技术能力` / `## 核心竞争力`
   - 所有变体均解析为同一数据字段，保持向后兼容
4. **工作经历部分**
   - 支持标题变体：`## 工作经历` / `## 工作经验` / `## 项目经验` / `## 工作履历`
   - `### 职位 ｜ 公司 ｜ 2021.06–至今`
   - `- responsibility: ...` （职责描述，不再使用中文 key）
   - `#### 项目名称`
     - `- summary: 一句话描述`
     - `- stack: React、TypeScript...`
     - `- contributions:`
       - `  - 重构&迭代`
       - `    - 贡献条目`
       - `  - 性能优化`
       - `    - 贡献条目`
5. **教育经历部分**
   - 支持标题变体：`## 教育经历` / `## 教育背景`
   - `- 学校 ｜ 专业 ｜ 统招本科 ｜ 毕业：2018`

**完整示例**：见 `src/markdown/sample-resume.md`。

### 数据模型（`src/types/resume.ts`）

```ts
export interface Resume {
  basics: {
    name: string;
    gender?: string;
    birth?: string;
    yearsOfExperience?: string;
    title?: string;
    degree?: string;
    graduation?: string;
    school?: string;
    major?: string;
    educationSummary?: string;
    location?: string;
    github?: string;
    website?: string;
    contact?: {
      email?: string;
      phone?: string;
      wechat?: string;
      city?: string;
    };
  };
  coreAbilities: string[];
  experiences: {
    company: string;
    position: string;
    start: string;
    end: string;
    responsibilities?: string;
    projects: {
      name: string;
      description?: string;
      techStack?: string;
      contributions: { title: string; items: string[] }[];
    }[];
  }[];
  education: {
    school: string;
    major: string;
    degree: string;
    graduation?: string;
    nature?: string;
  }[];
}
```

### 核心组件设计

- `MdEditor`：受控文本域，支持一键恢复示例。
- `SettingsPanel`：字号、行距、字体选择，使用 4/8px 间距体系。
- `Preview`：将数据渲染为单栏 A4 页面，`data-block` 标记配合 `usePagination` 自动分页；语义化 `h1/h2/h3/h4 + ul/li`，黑白灰配色。
- `ExportActions`：导出 Markdown、PDF，以及打印模式入口。

### 关键实现

- **Markdown 解析/序列化**（`src/utils/markdown.ts`）：
  - 通过 `remark-parse` 读取 AST，按标题深度切换上下文，容错中英文冒号与分隔符。
  - 基本信息列表解析字段（性别、出生、学历、联系方式等）；工作经历支持“公司下多项目 + 贡献分组”嵌套。
  - `resumeToMarkdown` 保证稳定输出，避免字段丢失。
- **分页预览**（`src/hooks/usePagination.ts` + `src/components/Preview.tsx`）：
  - 按 A4 像素高度累计 `data-block` 片段，生成断点集合。
  - 渲染层按断点拆页，`break-before: page` + A4 尺寸保证屏幕与打印一致。
- **PDF 导出**（`src/utils/pdf.ts`）：
  - 遍历 `[data-page]`，逐页用 `html2canvas` 生成位图，`jsPDF` 按 A4 比例写入并保存。
  - 提供 `printWithStyles` 直接走浏览器打印，`@media print` 确保留白、边距、单栏排版。

### 开发与脚本

```bash
npm install           # 安装依赖
npm run dev           # 本地开发
npm run build         # 构建产物
npm run preview       # 预览构建结果
```

### 设计守则

- **布局与配色**：单栏、黑白灰，不使用头像、图标、进度条、时间轴。
- **间距与字号**：列表间距 8px，模块间距 16-24px，正文默认 12px，行距默认 1.4（可调 1.2-1.6）。
- **ATS 友好性**：
  - 避免装饰性样式（边框、圆角、背景色），使用文本分隔符（如 " · "）。
  - 保持语义化 HTML 结构（h1/h2/h3/h4/ul/li）。
  - 关键信息加粗（工作经历 h3、项目名 h4 字重 700）。
  - 确保文本可选中、可复制，打印样式与屏幕一致。
- **学历描述**：遵循"统招本科/全日制本科"安全写法，不暴露学制时长。
