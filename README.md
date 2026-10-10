<div align="center">

<img src="icon.svg" width="104" height="104" alt="dsh-skill-labels" />

# dsh-skill-labels · 技能中文标签

**给 DeepSeek Harness 技能列表的每个技能加一个中文小标题，一眼看懂它到底能干啥。**

`html-ppt` → `【写PPT】HTML PPT Studio — author professional static HTML presentations …`

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![topic](https://img.shields.io/badge/topic-dsh--plugin-0e7490?style=flat-square)](https://github.com/topics/dsh-plugin)
[![DSH](https://img.shields.io/badge/DeepSeek%20Harness-0.2.0--rc.2-informational?style=flat-square)](https://github.com/deepseek-ai/deepseek-harness)
[![deps](https://img.shields.io/badge/deps-none-success?style=flat-square)](#兼容与运行要求)
[![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/Siloet-phy/dsh-skill-labels)

</div>

---

装了它之后，技能列表不再是一串看不懂的英文名：

```text
- `html-ppt`:      【写PPT】HTML PPT Studio — author professional static HTML presentations …
- `office-docx`:   【写Word】Create, read, edit, and check Word documents (.docx) …
- `office-xlsx`:   【写Excel】Read, create, and modify Excel workbooks (.xlsx) …
- `vision-skills`: 【看图还原界面】把截图或设计图还原为 UI …
- `dsh-deepread`:  【精读文章】Evidence-first deep reading for books, articles, PDFs …
```

中文小标题在**前边**，原来的英文描述**原样保留**——那里面的触发词对模型挑技能有用，翻掉反而会让技能变难用。

## 特性

- **中文小标题在前** — 每条技能描述前面挂一个 4–7 字的中文小标题，扫一眼就知道是干啥的
- **两处同时生效** — 模型看到的技能目录、输入框 `/` 菜单里的技能列表，都带中文小标题
- **标签改完即生效** — 标签放在 `labels.json` 里，改文件下一次拉目录就更新，不用重启、不用重装
- **零依赖零配置** — 不装任何依赖、不联网、不写盘，装上就默认开启
- **没标签就不动** — 表里没有的技能保持原样，绝不瞎猜、不乱翻
- **随时可卸干净** — 卸载时把包装过的方法原样还原，技能目录回到插件没装之前的样子

## 安装

**从 GitHub 安装（推荐，无需 npm 账号、无需构建）：**

```bash
dsh plugin --profile web add github:Siloet-phy/dsh-skill-labels
```

桌面版（Desktop app 用的 profile）把 `web` 换成 `desktop`：

```bash
dsh plugin --profile desktop add github:Siloet-phy/dsh-skill-labels
```

**从本地目录安装（开发/试装）：**

```bash
dsh plugin --profile web add file:/绝对路径/dsh-skill-labels
```

**不安装、直接热挂载（改完就生效，适合自己折腾）：** 在 profile 的 `cordis.patch.yml` 末尾追加一行，路径换成你 clone 下来的位置（Windows 用 `file:///C:/…` 形式）：

```yaml
- insert:
    - id: skill-labels
      name: 'file:///C:/path/to/dsh-skill-labels/index.js'
      config: {}
```

> 装完按提示重启对应的 DSH；热挂载那条是当场生效的。
> 升级：`dsh plugin --profile web remove dsh-skill-labels` 再重新 `add`（新版会覆盖安装目录，所以你写在 `~/.dsh/skill-labels.json` 里的标签不会丢）。

## 配置

默认开箱即用，**不需要任何配置**。要改的话，三处标签表按顺序合并，**后面的覆盖前面的**：

| 顺序 | 位置 | 用途 |
|---|---|---|
| 1 | 插件内置 `DEFAULT_LABELS` | 12 条常用技能的默认标签 |
| 2 | 包内 `labels.json` | 随包走的补充表 |
| 3 | `~/.dsh/skill-labels.json` | **你的私人表**，升级插件不会丢 |
| 4 | 行配置 `config.labels` | 直接在 `cordis.patch.yml` 里写 |

你自己的表就长这样（`~/.dsh/skill-labels.json`，Windows 是 `C:\Users\<你>\.dsh\skill-labels.json`）：

```json
{
  "my-own-skill": "我的技能",
  "html-ppt": "做幻灯片"
}
```

改完**下一次拉技能目录就生效**（标签文件按修改时间懒加载），不用重启。想在 `cordis.patch.yml` 里配：

```yaml
- insert:
    - id: skill-labels
      name: 'dsh-skill-labels'
      config:
        format: '【{label}】{description}'    # 排版；必须含 {description}
        labels:
          html-ppt: 写PPT
        labelsFile: 'D:/my-labels.json'       # 换个私人表位置；false 则关闭
```

> 注意：profile 的 patch 层里同一个 `id` 的 `config` 是**整块替换**，不是深合并。

## 它改的是哪一层

技能目录的一切消费者都走同一处代际点 `SkillRegistry.snapshot()/list()`：

| 出口 | 调用链 |
|---|---|
| 模型技能目录 | `dsh-tool-skill` → `ctx.skills.snapshot()` → `- \`名字\`: 描述` |
| 输入框 `/` 菜单 | `dsh-client-ui-skill` → Remote `skills/list` → `sessionSkillCatalog.list()` → `skillRegistry.list()` |

本插件在注册表的**原型**上包装这两个方法，结果交付前改写每条 summary 的 `description`。所以：

- 只改 `description`。名字、`invocation` 策略、`path`、`source`、`provider` 一律不动，技能正文（`get()`）完全不受影响——**技能怎么加载、什么时候加载，都和装插件之前一样**。
- 包装**按对象身份幂等**（`WeakSet`），`list()` 内部再调 `snapshot()` 也只会加一层标签，不会叠加成 `【写PPT】【写PPT】`。
- 技能目录在摘要变化时才会重发，所以改完标签，模型那边会在下一个步骤看到替换后的目录；`/` 菜单是客户端按会话缓存的，**刷新一下页面**就能看到。
- 这不是官方扩展点：DSH 的技能注册表没有「装饰描述」的钩子。所以插件包得**很薄**——万一将来 DSH 把方法改名了，插件只记一条 warning，技能目录退回原样，**不会打断你的会话**。

## 兼容与运行要求

- **DeepSeek Harness**：在 `0.2.0-rc.2` 实测通过；只用 `ctx.skills` 与 `ctx.logger`，理论上 0.1.x 起的版本都能用。
- **Profile**：`web` / `desktop` / `headless` 都行——只要该 profile 挂着 `@deepseek-ai/dsh-skill` + `dsh-tool-skill`（基础组合里都有）。
- **平台**：Windows / macOS / Linux 均可，纯 JS 无原生模块。
- **Node**：`>= 20`（跟随 DSH 自带的运行时即可）。
- **第三方依赖**：无。`peerDependencies` 也是空的——插件不 import 任何 DSH 包。

## 权限与隐私

- **不联网**：没有任何网络请求、遥测或上报。
- **不写盘**：只**读**两个可选的 JSON 标签文件，不改任何文件。
- **不碰会话**：不改写会话事件、不注入提示词、不注册工具，只在技能目录读出来那一刻改字符串。

## 已知限制

- 只对「经由技能注册表读出来的目录」生效。绕过注册表自己渲染技能列表的插件，本插件管不到。
- 标签是**人工表**，不自动翻译。故意不接模型自动翻译：那会让每次拉目录都依赖网络和一次 LLM 调用，既慢又不可控。没标签的技能会保持原样，宿主日志里有一条 debug 提示。
- 名字相同的技能只能共用一个标签（标签是按 skill 名匹配的）。

## 常见问题

**装完怎么没变化？**
`/` 菜单的目录是客户端按会话缓存的，刷新页面即可；模型那边会在下一个步骤收到替换后的目录。

**会不会让技能加载变慢或失败？**
不会。插件不参与 `get()`（正文加载），只包装 `snapshot()`/`list()` 的返回值，而且包装是幂等的。

**能给我自己后装的技能加标签吗？**
能。把技能名和小标题写进 `~/.dsh/skill-labels.json` 就行，不用改插件代码。

**为什么英文描述不一起翻掉？**
英文描述里带着触发词和适用场景（`Use when the user asks for …`），模型靠它挑技能。翻掉会明显降低命中率，所以这里只加小标题。

## 自检

```bash
node selftest.mjs
```

用假注册表验证：单层标签、`list → snapshot` 不叠加、未知技能原样、原对象不被就地改写、卸载后恢复、行配置覆盖、标签文件改完即生效。

## 许可

[MIT](LICENSE) © 2026 Siloet-phy

技能目录的中文小标题是**你自己的**：标签表在 `~/.dsh/skill-labels.json`，本仓库只提供一张默认表。

