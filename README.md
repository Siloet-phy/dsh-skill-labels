<div align="center">

<img src="icon.svg" width="104" height="104" alt="dsh-skill-labels" />

# dsh-skill-labels

**为 DeepSeek Harness 技能目录中的每项技能添加一个简短的中文标题，置于描述之前。**

`html-ppt` → `【写PPT】HTML PPT Studio — author professional static HTML presentations …`

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-0e7490?style=flat-square)](https://github.com/topics/dsh-plugin)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.2.0--rc.2-informational?style=flat-square)](https://github.com/deepseek-ai/deepseek-harness)
[![dependencies: none](https://img.shields.io/badge/dependencies-none-success?style=flat-square)](#兼容性与运行要求)
[![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/Siloet-phy/dsh-skill-labels)

[English](README.en.md) | **简体中文**

</div>

---

## 目录

- [概述](#概述)
- [效果](#效果)
- [特性](#特性)
- [与同类插件的区别](#与同类插件的区别)
- [安装](#安装)
- [配置](#配置)
- [让 AI 帮你补标签](#让-ai-帮你补标签)
- [工作原理](#工作原理)
- [兼容性与运行要求](#兼容性与运行要求)
- [安全与隐私](#安全与隐私)
- [已知限制](#已知限制)
- [常见问题](#常见问题)
- [开发](#开发)
- [卸载与升级](#卸载与升级)
- [许可证](#许可证)

## 概述

DeepSeek Harness 的技能目录有两个出口：一是模型在会话中看到的 `available_skills` 列表，二是输入框 `/` 唤出的技能菜单。两者默认只提供技能名与英文描述——技能名多为 `office-xlsx`、`vision-skills` 这类标识符，英文描述又是面向模型的完整句式，人在列表里逐条辨认成本较高。

本插件在每条技能描述之前添加一个 4–7 字的中文标题，形如 `【写Excel】Read, create, and modify Excel workbooks (.xlsx) …`，用于快速识别技能用途。**英文原描述完整保留**，不改动任何面向模型的触发信息。

## 效果

输入框 `/` 菜单里的实际效果（同一份目录数据，模型侧与菜单侧一致）：

![技能菜单中的中文标题](docs/skills-menu.png)

| | 技能名 | 描述 |
|---|---|---|
| 安装前 | `html-ppt` | HTML PPT Studio — author professional static HTML presentations in many styles, layouts, and animations … |
| 安装后 | `html-ppt` | **【写PPT】** HTML PPT Studio — author professional static HTML presentations in many styles, layouts, and animations … |

其余示例：

```text
- `office-docx`:   【写Word】Create, read, edit, and check Word documents (.docx) …
- `office-xlsx`:   【写Excel】Read, create, and modify Excel workbooks (.xlsx) …
- `vision-skills`: 【看图还原界面】把截图或设计图还原为 UI …
- `dsh-deepread`:  【精读文章】Evidence-first deep reading for books, articles, PDFs …
```

## 特性

- **中文标题前置** — 标题位于描述之前，默认排版为 `【标题】原描述`，可通过 `format` 调整。
- **两个出口同时生效** — 模型技能目录与 `/` 菜单读取同一份数据，无需分别适配。
- **标签表是活的** — 内置表、包内表、用户表、行配置四级覆盖；标签文件按修改时间懒加载，保存即生效，无需重启或重装。
- **AI 能自己补标签** — 插件注册一个 `skill_labels` 工具：让模型列出未标注的技能，并把标签直接写进你的用户标签表。**这是同类插件没有的能力**（见下节）。
- **标签不限于中文** — 标签就是一段前缀文字，emoji、英文短名、编号都可以（例如 `🎨 画图`、`excel`、`① 常用`）。
- **零依赖、零配置** — 无第三方依赖、无 `peerDependencies`、无构建步骤，安装后默认启用。
- **未登记技能不作改动** — 标签表中没有的技能保持原样，并仅在宿主日志中保留一条 debug 记录。
- **可安全卸载** — 卸载时恢复被包装的注册表方法，技能目录回到插件未安装时的状态。

## 与同类插件的区别

技能菜单方向已开源的项目主要有两个（截至 2026-10-11）：

| | [dsh-skill-source-label](https://github.com/lingyired/dsh-skill-source-label) | [dsh-skill-manager-ytxue](https://github.com/YTxue/dsh-skill-manager-ytxue) | **本插件** |
|---|---|---|---|
| 解决的问题 | 标出技能来源（项目/个人/内置） | 技能管理面板：启停、批量导入、规范自检 | 中文标签，一眼看懂技能用途 |
| 展示内容 | 括号里的来源标记 | 设置页里的管理界面 | 每条技能描述前的中文标题 |
| 标签可自定义 | 否（来源是枚举值） | 否 | **是**，四级覆盖 + 文件热更新 |
| 模型侧技能目录 | 否 | 否 | **是**，与 `/` 菜单同一份数据 |
| 让 AI 维护标签 | 否 | 否 | **是**，`skill_labels` 工具 |
| 依赖 | — | — | 零依赖、不联网 |

一句话：它们改的是「技能从哪来」和「技能怎么管」，本插件改的是「技能叫什么、一眼能不能看懂」；而且这套标签**是你自己的**，随时能改，也能交给 AI 补。

## 安装

需要先在 profile 中安装本插件，再由 profile 的 `cordis.patch.yml` 启用。以下命令任选其一。

**从 GitHub 安装（推荐）：**

```bash
dsh plugin --profile web add github:Siloet-phy/dsh-skill-labels
```

桌面版（Desktop 应用使用的 profile）将 `web` 替换为 `desktop`：

```bash
dsh plugin --profile desktop add github:Siloet-phy/dsh-skill-labels
```

**从本地目录安装（开发调试）：**

```bash
dsh plugin --profile web add file:/绝对路径/dsh-skill-labels
```

**不安装，直接挂载（改动立即生效，适用于源码调试）：** 在 profile 的 `cordis.patch.yml` 末尾追加一行 `insert`，`name` 指向本地 `index.js` 的绝对 URL（Windows 使用 `file:///C:/…` 形式）：

```yaml
- insert:
    - id: skill-labels
      name: 'file:///C:/path/to/dsh-skill-labels/index.js'
      config: {}
```

> 三种方式**只应保留一种**，同时存在会使插件被挂载两次。
> 安装完成后需重启对应 profile 的 DSH；直接挂载方式无需重启。

## 配置

默认配置即可使用。标签依次从以下四处读取，**后者覆盖前者**：

| 顺序 | 来源 | 用途 |
|---:|---|---|
| 1 | 内置 `DEFAULT_LABELS` | 12 条常用技能的默认标题 |
| 2 | 包内 `labels.json` | 随包分发的公共标签表 |
| 3 | `~/.dsh/skill-labels.json` | 用户私有标签表，**升级插件不会覆盖** |
| 4 | 行配置 `config.labels` | 直接写在 `cordis.patch.yml` 中 |

用户私有标签表格式如下（Windows 路径为 `C:\Users\<用户名>\.dsh\skill-labels.json`）：

```json
{
  "my-own-skill": "我的技能",
  "html-ppt": "做幻灯片"
}
```

标签表在文件修改时间变化后自动重新读取，保存后无需重启。

标签不限于中文——它就是一段前缀文字，emoji、英文短名、编号都可以：

```json
{
  "html-ppt": "🎨 画图",
  "office-xlsx": "excel",
  "my-own-skill": "① 常用"
}
```

行配置项：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `format` | string | `【{label}】{description}` | 排版模板，必须包含 `{description}`；`{label}` 为中文标题 |
| `labels` | object | `{}` | 名称到标题的映射，优先级最高 |
| `labelsFile` | string \| false | `~/.dsh/skill-labels.json` | 用户标签表路径；`false` 表示不读取该文件 |

```yaml
- insert:
    - id: skill-labels
      name: 'dsh-skill-labels'
      config:
        format: '【{label}】{description}'
        labels:
          html-ppt: 写PPT
        labelsFile: 'D:/my-labels.json'
```

> profile 的 patch 层中，同一 `id` 的 `config` 是**整块替换**而非深合并，覆盖时需写出完整配置。

## 让 AI 帮你补标签

手写 JSON 太麻烦，所以插件自带一个 **`skill_labels` 工具**（装完重启 DSH 后出现在模型的工具列表里）。你只要在会话里说人话：

> 看看哪些技能还没有中文标签，都加上吧，标签短一点，4–7 个字，能一眼看出用途。

模型就会：

1. 调 `skill_labels { action: "list" }` —— 拿到每个技能的现有标签、标签来源（`builtin` / `package` / `user` / `config`）以及**未标注清单**（附技能描述，方便起标题）；
2. 按描述拟好中文短标题，调 `skill_labels { action: "set", labels: { "some-skill": "某个技能" } }` 写进 `~/.dsh/skill-labels.json`；
3. 下一次读取技能目录时新标签就生效（模型侧目录也会在下一个步骤刷新）。无需重启、无需手动编辑文件。

写入行为是保守的：

- **合并**而不是覆盖 —— 你已有的标签一条不动；
- **原子写入** —— 先写临时文件再改名，不会写坏文件；
- **只写这一个文件** —— 标签表路径由 `labelsFile` 决定，不碰任何其它文件；
- **表损坏就拒绝写** —— 已有标签文件不是合法 JSON 时，工具报错而不是覆盖你的数据；
- **非法条目跳过并回报** —— 名字不是 kebab-case、标签为空或超过 32 字的条目会被列出来。

想自己看当前状态（不想让模型动手），直接问它「列一下技能标签」即可，`action: "list"` 只读不写。

## 工作原理

### 单一数据源

技能目录的所有消费者都经过同一处：`@deepseek-ai/dsh-skill` 的 `SkillRegistry.snapshot()` / `list()`。

| 出口 | 调用链 |
|---|---|
| 模型技能目录 | `dsh-tool-skill` → `ctx.skills.snapshot()` → 渲染为 `` - `名称`: 描述 `` |
| 输入框 `/` 菜单 | `dsh-client-ui-skill` → Remote `skills/list` → `sessionSkillCatalog.list()` → `skillRegistry.list()` |

### 实现方式

插件在技能注册表的**原型**上包装 `snapshot()` 与 `list()`，在结果交付前改写每条 summary 的 `description`。

- **幂等**：已处理的 summary 记录在 `WeakSet` 中，因此 `list()` 内部再次调用 `snapshot()` 时不会重复添加标题，同一文件被挂载两次也不会叠加。
- **影响面最小**：仅改写 `description`。技能名、`invocation` 策略、`path`、`source`、`provider` 均不变，技能正文的加载路径（`get()`）完全不受影响。
- **失败降级**：若目标方法不存在或改名，插件只记录一条 warning，技能目录保持原样，不会中断会话。
- **可还原**：包装函数随 `ctx.effect` 的清理函数一并撤销。

### 工具那半

`skill_labels` 工具按 `tools.register()` 的契约直接构造（`{ name, description, parameters, output: { schema, render }, execute }`），因此**不需要** `import @deepseek-ai/dsh-tools`，插件的依赖表仍然是空的。它做两件事：

| action | 作用 | 是否写盘 |
|---|---|---|
| `list` | 读 `ctx.skills.list()`，逐项比对四级标签表，回报标签、来源与未标注清单 | 否 |
| `set` | 把 `{技能名: 标签}` 合并进用户标签表（原子写入） | 只写标签表这一个文件 |

profile 没有 `tools` 服务、或注册抛错时，插件只记一条日志，标签功能照常工作。

### 设计取舍

- **保留英文原描述**：描述中的触发语句（如 `Use when the user asks for …`）是模型选择技能的依据，翻译会降低命中率，因此只做前缀标注。
- **不接入机器翻译**：自动翻译会让每次目录读取都依赖网络与一次模型调用，延迟与结果均不可控；改用人工维护的标签表。
- **不是官方扩展点**：DSH 的技能注册表未提供描述装饰钩子，因此实现依赖上述方法签名。这也是插件保持极小体量的原因。

## 兼容性与运行要求

| 项目 | 要求 |
|---|---|
| DeepSeek Harness | 在 `0.2.0-rc.2` 实测通过；仅使用 `ctx.skills`、`ctx.tools`（可选）与 `ctx.logger`，预期兼容 0.1.x 及以后版本 |
| Profile | `web` / `desktop` / `headless`——只要该 profile 挂载了 `@deepseek-ai/dsh-skill` 与 `dsh-tool-skill`（基础组合均包含） |
| 操作系统 | Windows / macOS / Linux，纯 JavaScript，无原生模块 |
| Node.js | `>= 20`（跟随 DSH 自带运行时即可） |
| 第三方依赖 | 无；`peerDependencies` 为空，不导入任何 DSH 包 |
| 工具可见性 | `skill_labels` 在**重启 DSH（或新开会话）后**出现在工具列表里；标签渲染本身不需要重启 |

## 安全与隐私

- **网络**：不发起任何网络请求，无遥测与上报。
- **文件系统**：默认只**读取**两个可选的 JSON 标签表；唯一的写入发生在你或模型调用 `skill_labels { action: "set" }` 时，且只写标签表这一个文件（先写临时文件再改名）。
- **会话与提示词**：不追加会话事件、不注入提示词；技能目录的改写发生在读取返回的那一刻。
- **工具**：只注册一个 `skill_labels`，只读写标签表；不需要任何额外权限。

## 已知限制

1. 仅对**经由技能注册表读取**的技能目录生效；绕过注册表自行渲染技能列表的插件不受影响。
2. 标签为人工维护，不提供自动翻译；未登记技能保持原样。
3. 标签按技能名匹配，同名技能只能共用一个标题。
4. 输入框 `/` 菜单的目录由客户端按会话缓存，标签变更后需**刷新页面**才可见。

## 常见问题

**安装后没有变化？**
`/` 菜单的目录由客户端缓存，刷新页面即可生效；模型侧会在下一个步骤收到替换后的技能目录。

**会影响技能加载速度或成功率吗？**
不会。插件不参与技能正文加载（`get()`），只在 `snapshot()` / `list()` 返回后改写描述，且包装是幂等的。

**可以给自己后续安装的技能添加标签吗？**
可以。两种方式：让模型用 `skill_labels { action: "set" }` 写（见[让 AI 帮你补标签](#让-ai-帮你补标签)），或自己编辑 `~/.dsh/skill-labels.json`。都不需要改插件代码。

**为什么英文描述不一起翻译？**
英文描述包含触发词与适用场景，是模型选择技能的依据；完整翻译会明显降低技能命中率。

**为什么某些技能没有中文标题？**
该技能不在任何一级标签表中。可以问模型「哪些技能还没有标签」，或直接调 `skill_labels { action: "list" }`；未登记的技能名也会出现在宿主日志里。

**`skill_labels` 工具在工具列表里找不到？**
工具是在插件激活时注册的，需要**重启 DSH**（或新开一个会话）才会出现；已经装好的标签渲染不需要重启即可生效。

**标签可以用 emoji 或英文吗？**
可以。标签就是一段前缀文字，`🎨 画图`、`excel`、`① 常用` 都行——`【】` 只是默认排版，也能用 `format` 换掉。

## 开发

**仓库结构**

| 文件 | 作用 |
|---|---|
| `index.js` | 插件本体，零依赖 ESM，导出 `apply` / `inject` / `name`，并注册 `skill_labels` 工具 |
| `cordis.patch.yml` | bundle 层，声明插件行 |
| `labels.json` | 包内公共标签表 |
| `locale/zh.json`、`locale/en.json` | 插件管理器卡片中的标题与描述 |
| `icon.svg` | 插件图标 |
| `selftest.mjs` | 自检脚本 |
| `docs/icon-prompt.md` | 图标设计说明与生成提示词 |
| `docs/icon-preview.html` | 图标各尺寸自查页 |
| `docs/skills-menu.png` | `/` 菜单实拍 |

**自检**

```bash
node selftest.mjs
```

覆盖行为：标题只添加一层、`list → snapshot` 不叠加、未登记技能原样、原 summary 对象不被就地改写、卸载后恢复原方法、行配置覆盖生效、标签文件修改即时生效、损坏的标签文件被忽略、同一文件重复挂载不叠加、`skill_labels` 工具的形状与 `list`/`set` 行为、无 `tools` 服务时降级、合并写入保留既有内容并跳过非法条目、坏表拒绝覆盖。

**贡献**

补充公共标签：直接编辑 `labels.json` 并提交 PR（键为技能名，值为 4–7 字中文标题）。

## 卸载与升级

```bash
dsh plugin --profile web remove dsh-skill-labels
```

卸载后插件行与原方法一并还原。升级方式为先卸载再安装（插件管理器暂不支持原地升级）；写在 `~/.dsh/skill-labels.json` 中的个人标签表不受影响。

## 许可证

[MIT](LICENSE) © 2026 Siloet-phy

中文标题由使用者维护：默认表在本仓库，个人表在 `~/.dsh/skill-labels.json`。
